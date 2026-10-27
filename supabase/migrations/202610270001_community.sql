-- Community is independent of the curated JSON glossary. Run once as project owner.
create schema if not exists community_private;
revoke all on schema community_private from public, anon, authenticated;
create table community_private.moderators (user_id uuid primary key references auth.users(id) on delete cascade);
create table community_private.submission_events (user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table community_private.moderators enable row level security;
alter table community_private.submission_events enable row level security;
create index on community_private.submission_events(user_id, created_at);
revoke all on all tables in schema community_private from public, anon, authenticated;

create function public.is_community_moderator() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from community_private.moderators where user_id = auth.uid());
$$;
revoke all on function public.is_community_moderator() from public;
grant execute on function public.is_community_moderator() to anon, authenticated;

create table public.community_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  author text not null check (author ~ '^[a-zA-Z0-9-]{1,39}$'),
  title text not null check (char_length(btrim(title)) between 3 and 80),
  description text not null check (char_length(btrim(description)) between 20 and 600),
  kind text not null check (kind in ('component','website')),
  tags text[] not null default '{}' check (cardinality(tags) <= 5),
  html text not null check (octet_length(html) <= 100000),
  css text not null check (octet_length(css) <= 100000),
  js text not null check (octet_length(js) <= 100000),
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  license text not null default 'MIT' check (license = 'MIT'),
  remix_of uuid references public.community_projects(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_note text not null default '' check (char_length(review_note) <= 500),
  constraint total_source_size check (octet_length(html)+octet_length(css)+octet_length(js) <= 300000)
);
create index on public.community_projects(status, created_at desc);
create index on public.community_projects(owner_id, created_at desc);
alter table public.community_projects enable row level security;
revoke all on public.community_projects from public, anon, authenticated;
grant select on public.community_projects to anon, authenticated;
create policy community_read on public.community_projects for select to anon, authenticated using (
  status = 'approved' or owner_id = (select auth.uid()) or (select public.is_community_moderator())
);

create function public.submit_community_project(p_title text, p_description text, p_kind text, p_tags text[], p_html text, p_css text, p_js text, p_license_accepted boolean, p_remix_of uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); username text; result uuid; hourly integer; daily integer;
begin
  if uid is null then raise exception 'Sign in with GitHub before submitting.'; end if;
  select coalesce(identity_data->>'user_name', identity_data->>'preferred_username') into username
    from auth.identities where user_id = uid and provider = 'github' limit 1;
  if username is null or username !~ '^[a-zA-Z0-9-]{1,39}$' then raise exception 'A verified GitHub identity is required.'; end if;
  if p_license_accepted is distinct from true then raise exception 'Accept the MIT sharing license first.'; end if;
  if p_tags is null or cardinality(p_tags) > 5 or exists(select 1 from unnest(p_tags) t where t is null or t !~ '^[a-z0-9][a-z0-9-]{0,31}$') then raise exception 'Use up to five valid tags.'; end if;
  if p_remix_of is not null and not exists(select 1 from public.community_projects where id=p_remix_of and (status='approved' or owner_id=uid)) then raise exception 'Original project is unavailable.'; end if;
  -- Serialize submissions for each account. Simultaneous requests cannot bypass quotas.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select count(*) filter(where created_at > now()-interval '1 hour'), count(*) into hourly,daily
    from community_private.submission_events where user_id=uid and created_at > now()-interval '24 hours';
  if hourly >= 5 or daily >= 20 then raise exception 'Submission limit reached: 5 per hour and 20 per day. Try again later.'; end if;
  insert into public.community_projects(owner_id,author,title,description,kind,tags,html,css,js,remix_of)
    values(uid,username,btrim(p_title),btrim(p_description),p_kind,p_tags,p_html,p_css,p_js,p_remix_of) returning id into result;
  insert into community_private.submission_events(user_id) values(uid);
  return result;
end;
$$;
revoke all on function public.submit_community_project(text,text,text,text[],text,text,text,boolean,uuid) from public;
grant execute on function public.submit_community_project(text,text,text,text[],text,text,text,boolean,uuid) to authenticated;

create function public.review_community_project(p_id uuid, p_decision text, p_note text default '') returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_community_moderator() then raise exception 'Moderator access required.'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Choose approve or reject.'; end if;
  update public.community_projects set status=p_decision, reviewed_at=now(), review_note=case when p_decision='approved' then '' else left(coalesce(p_note,''),500) end
    where id=p_id and status in ('pending','approved');
  if not found then raise exception 'This submission has already changed. Refresh the queue.'; end if;
end;
$$;
revoke all on function public.review_community_project(uuid,text,text) from public;
grant execute on function public.review_community_project(uuid,text,text) to authenticated;

create function public.withdraw_community_project(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  update public.community_projects set status='withdrawn' where id=p_id and owner_id=auth.uid() and status in ('pending','approved','rejected');
  if not found then raise exception 'Project cannot be withdrawn.'; end if;
end;
$$;
revoke all on function public.withdraw_community_project(uuid) from public;
grant execute on function public.withdraw_community_project(uuid) to authenticated;
