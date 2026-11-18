-- Only the Edge Function's service role can write or read this private inbox.
create table public.feedback_inbox (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('bug', 'feedback', 'idea')),
  message text not null check (char_length(btrim(message)) between 10 and 4000),
  email text not null default '' check (char_length(email) <= 254),
  page text not null check (char_length(page) <= 500 and page ~ '^/[^?#]*$'),
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  screenshot_path text,
  notification_status text not null default 'not_sent' check (notification_status in ('not_sent', 'sent', 'failed'))
);
alter table public.feedback_inbox enable row level security;
revoke all on public.feedback_inbox from public, anon, authenticated;
grant select, insert, update, delete on public.feedback_inbox to service_role;
create index feedback_inbox_created_at_idx on public.feedback_inbox(created_at);

create function public.receive_feedback(p_kind text, p_message text, p_email text, p_page text, p_fingerprint text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare new_id uuid;
begin
  -- Serialize quota checks and insertion across function instances.
  perform pg_advisory_xact_lock(824517603);
  if (select count(*) from public.feedback_inbox where created_at > now() - interval '24 hours') >= 50
    or (select count(*) from public.feedback_inbox where fingerprint = p_fingerprint and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limit';
  end if;
  insert into public.feedback_inbox(kind, message, email, page, fingerprint)
    values(p_kind, p_message, p_email, p_page, p_fingerprint) returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.receive_feedback(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.receive_feedback(text,text,text,text,text) to service_role;

-- No client policies: attachments can only be viewed through the owner's dashboard.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('feedback-screenshots', 'feedback-screenshots', false, 3145728, array['image/png','image/jpeg','image/webp']);
