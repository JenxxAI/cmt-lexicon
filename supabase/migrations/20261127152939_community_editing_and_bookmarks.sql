-- Apply before deploying the editing/saved-project UI.
alter table public.community_projects add column revision integer not null default 0;
create function community_private.bump_project_revision() returns trigger
language plpgsql set search_path = '' as $$
begin new.revision := old.revision + 1; return new; end;
$$;
revoke all on function community_private.bump_project_revision() from public, anon, authenticated;
create trigger community_project_revision before update on public.community_projects
for each row execute function community_private.bump_project_revision();

-- Reuse the established submission validators and quota accounting atomically.
-- The temporary pending row is never visible outside this transaction.
create function public.edit_community_project(
  p_id uuid, p_revision integer, p_title text, p_description text, p_kind text,
  p_tags text[], p_html text, p_css text, p_js text, p_repository_url text,
  p_permission_accepted boolean, p_previews text[]
) returns uuid language plpgsql security definer set search_path = '' as $$
declare original public.community_projects; candidate uuid;
begin
  if not public.community_session_active() then raise exception 'Community session expired' using errcode = '28000'; end if;
  select * into original from public.community_projects where id = p_id and owner_id = auth.uid() for update;
  if not found then raise exception 'Project unavailable' using errcode = '42501'; end if;
  if p_revision is distinct from original.revision then raise exception 'Project already changed'; end if;
  if (original.repository_url is null) <> (p_repository_url is null) then raise exception 'Project format cannot change'; end if;
  if original.repository_url is not null then
    candidate := public.submit_community_showcase(p_title,p_description,p_kind,p_tags,p_repository_url,p_permission_accepted,p_previews);
  else
    candidate := public.submit_community_project(p_title,p_description,p_kind,p_tags,p_html,p_css,p_js,p_permission_accepted,original.remix_of,p_previews);
  end if;
  update public.community_projects p set title = c.title, description = c.description,
    kind = c.kind, tags = c.tags, html = c.html, css = c.css, js = c.js,
    repository_url = c.repository_url, previews = c.previews,
    status = 'pending', reviewed_at = null, review_note = ''
    from public.community_projects c where p.id = p_id and c.id = candidate;
  delete from public.community_projects where id = candidate;
  return p_id;
end;
$$;
revoke all on function public.edit_community_project(uuid,integer,text,text,text,text[],text,text,text,text,boolean,text[]) from public, anon, authenticated;
grant execute on function public.edit_community_project(uuid,integer,text,text,text,text[],text,text,text,text,boolean,text[]) to authenticated;

create table public.community_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.community_projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);
create index community_bookmarks_project_idx on public.community_bookmarks(project_id);
alter table public.community_bookmarks enable row level security;
revoke all on public.community_bookmarks from public, anon, authenticated;
grant select, insert, delete on public.community_bookmarks to authenticated;
create policy bookmarks_read on public.community_bookmarks for select to authenticated
using (user_id = (select auth.uid()) and (select public.community_session_active()));
create policy bookmarks_insert on public.community_bookmarks for insert to authenticated
with check (user_id = (select auth.uid()) and (select public.community_session_active())
  and exists (select 1 from public.community_projects p where p.id = project_id and p.status = 'approved'));
create policy bookmarks_delete on public.community_bookmarks for delete to authenticated
using (user_id = (select auth.uid()) and (select public.community_session_active()));

-- Explicit desired state makes retries safe; RLS authorizes every operation.
create function public.save_community_project(p_id uuid, p_saved boolean) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.community_session_active() then raise exception 'Community session expired' using errcode = '28000'; end if;
  if p_saved is null then raise exception 'Choose a saved state'; end if;
  if p_saved then
    insert into public.community_bookmarks(user_id,project_id) values(auth.uid(),p_id) on conflict do nothing;
  else
    delete from public.community_bookmarks where user_id = auth.uid() and project_id = p_id;
  end if;
  return p_saved;
end;
$$;
revoke all on function public.save_community_project(uuid,boolean) from public, anon, authenticated;
grant execute on function public.save_community_project(uuid,boolean) to authenticated;

-- A stale moderation tab must never publish content it has not reviewed.
create function public.review_community_project(p_id uuid, p_decision text, p_note text, p_revision integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_community_moderator() then raise exception 'Moderator access required.'; end if;
  if p_decision is null or p_decision not in ('approved','rejected') then raise exception 'Choose approve or reject.'; end if;
  update public.community_projects set status=p_decision, reviewed_at=now(),
    review_note=case when p_decision='approved' then '' else left(coalesce(p_note,''),500) end
    where id=p_id and status in ('pending','approved') and revision=p_revision;
  if not found then raise exception 'Project already changed'; end if;
end;
$$;
revoke all on function public.review_community_project(uuid,text,text,integer) from public, anon, authenticated;
grant execute on function public.review_community_project(uuid,text,text,integer) to authenticated;
-- Old clients can review untouched rows during rollout, but cannot bypass revision checks.
create or replace function public.review_community_project(p_id uuid, p_decision text, p_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin perform public.review_community_project(p_id,p_decision,p_note,0); end;
$$;
