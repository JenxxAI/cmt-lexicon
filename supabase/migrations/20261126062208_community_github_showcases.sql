-- Add link-only showcases without granting direct writes or changing existing RLS.
alter table public.community_projects add column repository_url text;
alter table public.community_projects drop constraint community_projects_license_check;
alter table public.community_projects add constraint community_project_source_check check (
  (repository_url is null and license = 'MIT') or
  (repository_url is not null and license = 'Repository'
    and repository_url ~ '^https://github[.]com/[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?/[a-zA-Z0-9_.-]{1,100}$'
    and split_part(repository_url, '/', 5) not in ('.', '..')
    and html = '' and css = '' and js = '' and remix_of is null
    and cardinality(previews) between 1 and 4)
);

-- Repository showcases cannot be remixed as if they were MIT-licensed code.
create or replace function public.submit_community_project(p_title text, p_description text, p_kind text, p_tags text[], p_html text, p_css text, p_js text, p_license_accepted boolean, p_remix_of uuid default null, p_previews text[] default '{}')
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
  -- Previews must be the caller's own uploaded images: <uid>/<uuid>.<ext>, unique, at most four.
  if p_previews is null or cardinality(p_previews) > 4
    or exists(select 1 from unnest(p_previews) t where t is null or t !~ ('^' || uid::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|png|jpg)$'))
    or (select count(distinct t) from unnest(p_previews) t) <> cardinality(p_previews)
  then raise exception 'Use up to four of your own preview images.'; end if;
  if (select count(*) from storage.objects o where o.bucket_id = 'community-previews' and o.name = any (p_previews)) <> cardinality(p_previews)
  then raise exception 'A preview image has not finished uploading. Try again.'; end if;
  if p_remix_of is not null and not exists(select 1 from public.community_projects where id=p_remix_of and repository_url is null and (status='approved' or owner_id=uid)) then raise exception 'Original project is unavailable.'; end if;
  -- Serialize submissions for each account. Simultaneous requests cannot bypass quotas.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select count(*) filter(where created_at > now()-interval '1 hour'), count(*) into hourly,daily
    from community_private.submission_events where user_id=uid and created_at > now()-interval '24 hours';
  if hourly >= 5 or daily >= 20 then raise exception 'Submission limit reached: 5 per hour and 20 per day. Try again later.'; end if;
  insert into public.community_projects(owner_id,author,title,description,kind,tags,html,css,js,remix_of,previews)
    values(uid,username,btrim(p_title),btrim(p_description),p_kind,p_tags,p_html,p_css,p_js,p_remix_of,p_previews) returning id into result;
  insert into community_private.submission_events(user_id) values(uid);
  return result;
end;
$$;

-- The existing submission function enforces active GitHub identity, ownership of
-- uploaded images, moderation defaults and shared quotas. Both writes are atomic.
create function public.submit_community_showcase(
  p_title text, p_description text, p_kind text, p_tags text[],
  p_repository_url text, p_permission_accepted boolean, p_previews text[]
) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if not public.community_session_active() then
    raise exception 'Community session expired' using errcode = '28000';
  end if;
  if p_permission_accepted is distinct from true then
    raise exception 'Confirm permission to showcase this project.';
  end if;
  if p_repository_url is null or p_repository_url !~ '^https://github[.]com/[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?/[a-zA-Z0-9_.-]{1,100}$'
    or split_part(p_repository_url, '/', 5) in ('.', '..') then
    raise exception 'Enter a GitHub repository URL.';
  end if;
  if p_previews is null or cardinality(p_previews) < 1 then
    raise exception 'Add at least one screenshot for your showcase.';
  end if;
  result := public.submit_community_project(p_title, p_description, p_kind, p_tags, '', '', '', true, null, p_previews);
  update public.community_projects set repository_url = p_repository_url, license = 'Repository' where id = result;
  return result;
end;
$$;
revoke all on function public.submit_community_showcase(text,text,text,text[],text,boolean,text[]) from public, anon, authenticated;
grant execute on function public.submit_community_showcase(text,text,text,text[],text,boolean,text[]) to authenticated;
