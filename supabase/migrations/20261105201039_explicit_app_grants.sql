begin;
-- RLS is already enabled and tested. Table privileges and RLS are separate gates.
-- Remove inherited TRUNCATE/TRIGGER/REFERENCES grants: TRUNCATE bypasses RLS.
revoke all on public.admin_users,public.couple_members,public.pending_couple_invites,
 public.content_items,public.content_media,public.year_moments,public.moment_photos,public.calendar_ranges from anon,authenticated;
grant select on public.admin_users to authenticated;
grant select,insert,update,delete on public.content_items,public.content_media,
 public.year_moments,public.moment_photos,public.calendar_ranges,public.pending_couple_invites to authenticated;
grant select,insert,update,delete on public.admin_users,public.couple_members,public.pending_couple_invites,
 public.content_items,public.content_media,public.year_moments,public.moment_photos,public.calendar_ranges to service_role;
commit;
