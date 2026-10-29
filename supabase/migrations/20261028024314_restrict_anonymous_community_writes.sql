-- Supabase may grant EXECUTE directly to anon through default privileges.
-- Revoking PUBLIC alone does not remove those grants.
revoke execute on function public.submit_community_project(text,text,text,text[],text,text,text,boolean,uuid) from anon;
revoke execute on function public.review_community_project(uuid,text,text) from anon;
revoke execute on function public.withdraw_community_project(uuid) from anon;
