-- Only a boolean about the caller is exposed, never rows from auth.sessions.
create function public.community_session_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.sessions s
    where s.user_id = (select auth.uid())
      and s.id = nullif((select auth.jwt()) ->> 'session_id', '')::uuid
      and (s.not_after is null or s.not_after > now())
  );
$$;
revoke all on function public.community_session_active() from public, anon, authenticated;
grant execute on function public.community_session_active() to authenticated;

alter policy community_read on public.community_projects to anon using (status = 'approved');
create policy community_authenticated_read on public.community_projects for select to authenticated using (
  status = 'approved' or ((select public.community_session_active()) and
    (owner_id = (select auth.uid()) or (select public.is_community_moderator())))
);

create or replace function public.is_community_moderator() returns boolean language sql stable security definer set search_path = '' as $$
  select public.community_session_active() and exists(select 1 from community_private.moderators where user_id = auth.uid());
$$;

create or replace function public.submit_community_project(p_title text, p_description text, p_kind text, p_tags text[], p_html text, p_css text, p_js text, p_license_accepted boolean, p_remix_of uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); username text; result uuid; hourly integer; daily integer;
begin
  if not public.community_session_active() then raise exception 'Community session expired' using errcode = '28000'; end if;
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

create or replace function public.withdraw_community_project(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.community_session_active() then raise exception 'Community session expired' using errcode = '28000'; end if;
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  update public.community_projects set status='withdrawn' where id=p_id and owner_id=auth.uid() and status in ('pending','approved','rejected');
  if not found then raise exception 'Project cannot be withdrawn.'; end if;
end;
$$;
