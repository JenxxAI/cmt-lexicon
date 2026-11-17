-- Preview images (screenshots of a component or a website's landing page) for community projects.
-- Run once as project owner, after the base community migration.
-- Images live in a PRIVATE bucket. They are readable by the public only while the project that
-- references them is approved, so moderation covers images exactly like it covers code.

alter table public.community_projects
  add column previews text[] not null default '{}' check (cardinality(previews) <= 4);
create index community_projects_previews_idx on public.community_projects using gin (previews);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('community-previews', 'community-previews', false, 614400, array['image/webp','image/png','image/jpeg'])
on conflict (id) do nothing;

-- Objects are stored as <owner uuid>/<random uuid>.<webp|png|jpg>.
-- A policy on storage.objects cannot query storage.objects itself (infinite recursion), so the
-- per-account count lives in a security-definer helper. It only ever counts the caller's own files.
create function public.community_preview_upload_count() returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer from storage.objects o
   where o.bucket_id = 'community-previews' and (storage.foldername(o.name))[1] = auth.uid()::text;
$$;
revoke all on function public.community_preview_upload_count() from public, anon;
grant execute on function public.community_preview_upload_count() to authenticated;

-- Upload: signed-in owners only, into their own folder, at most 40 objects each (unsubmitted
-- uploads included), so an account cannot use the bucket as free file hosting.
create policy community_previews_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'community-previews'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.community_preview_upload_count()) < 40
);
-- Read: the owner, moderators, or anyone once an approved project references the image.
create policy community_previews_read on storage.objects for select to anon, authenticated using (
  bucket_id = 'community-previews'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.is_community_moderator())
    or exists (select 1 from public.community_projects p where p.status = 'approved' and storage.objects.name = any (p.previews))
  )
);
-- Delete: owners may remove images that no project references (cleanup after a failed submit).
create policy community_previews_delete on storage.objects for delete to authenticated using (
  bucket_id = 'community-previews'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (select 1 from public.community_projects p where storage.objects.name = any (p.previews))
);

-- Same RPC as before plus p_previews. A new parameter changes the signature, so replace the function.
drop function public.submit_community_project(text,text,text,text[],text,text,text,boolean,uuid);
create function public.submit_community_project(p_title text, p_description text, p_kind text, p_tags text[], p_html text, p_css text, p_js text, p_license_accepted boolean, p_remix_of uuid default null, p_previews text[] default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); username text; result uuid; hourly integer; daily integer;
begin
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
  if p_remix_of is not null and not exists(select 1 from public.community_projects where id=p_remix_of and (status='approved' or owner_id=uid)) then raise exception 'Original project is unavailable.'; end if;
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
-- Supabase default privileges can grant EXECUTE to anon directly; revoke it explicitly.
revoke all on function public.submit_community_project(text,text,text,text[],text,text,text,boolean,uuid,text[]) from public, anon;
grant execute on function public.submit_community_project(text,text,text,text[],text,text,text,boolean,uuid,text[]) to authenticated;
