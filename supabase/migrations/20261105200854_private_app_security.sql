-- Reviewable security upgrade. Apply atomically; no existing identities are changed.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.partner_access (
  singleton boolean primary key default true check(singleton),
  user_id uuid not null unique references auth.users(id),
  pin_hash text not null,
  revision uuid not null default gen_random_uuid(),
  failures integer not null default 0,
  window_failures integer not null default 0,
  blocked_until timestamptz,
  disabled boolean not null default false
);
create table private.pin_ip_limits (
  ip_hash text primary key,
  attempts integer not null default 0,
  window_start timestamptz not null default now()
);
create table private.partner_sessions (
  session_id uuid primary key references auth.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  revision uuid not null,
  expires_at timestamptz not null default (now()+interval '90 days')
);
alter table private.partner_access enable row level security;
alter table private.pin_ip_limits enable row level security;
alter table private.partner_sessions enable row level security;
revoke all on all tables in schema private from public, anon, authenticated;

-- Sole issuer is the Edge Function. Never grant these RPCs to browser roles.
create function public.partner_pin_configure(p_user_id uuid,p_pin text,p_disabled boolean default false)
returns void language plpgsql security definer set search_path='' as $$
begin
  if p_pin is null or p_pin !~ '^[0-9]{4}$' then raise exception 'Invalid PIN'; end if;
  if exists(select 1 from public.admin_users where user_id=p_user_id) then raise exception 'Admin identity forbidden'; end if;
  if not exists(select 1 from auth.users where id=p_user_id and email like 'partner-%@10von100.invalid') then raise exception 'Dedicated identity required'; end if;
  perform pg_advisory_xact_lock(100100);
  delete from private.partner_sessions;
  delete from public.couple_members where user_id in(select user_id from private.partner_access where user_id<>p_user_id);
  insert into private.partner_access(singleton,user_id,pin_hash,disabled)
    values(true,p_user_id,extensions.crypt(p_pin,extensions.gen_salt('bf',12)),p_disabled)
    on conflict(singleton) do update set user_id=excluded.user_id,pin_hash=excluded.pin_hash,
      revision=gen_random_uuid(),failures=0,window_failures=0,blocked_until=null,disabled=excluded.disabled;
  insert into public.couple_members(user_id) values(p_user_id) on conflict do nothing;
end $$;
create function public.partner_pin_status() returns jsonb language sql security definer set search_path='' as $$
  select coalesce((select jsonb_build_object('user_id',user_id,'configured',true,'disabled',disabled,'locked',failures>=20,'blocked_until',blocked_until) from private.partner_access),'{}'::jsonb)
$$;
create function public.partner_pin_check(p_pin text,p_ip_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a private.partner_access; lim private.pin_ip_limits;
begin
  perform pg_advisory_xact_lock(100100);
  -- Global account lock is authoritative even if a proxy header is spoofed.
  if length(p_ip_hash)<>64 then return null; end if;
  delete from private.pin_ip_limits where window_start<now()-interval '1 day';
  insert into private.pin_ip_limits(ip_hash) values(p_ip_hash) on conflict do nothing;
  select * into lim from private.pin_ip_limits where ip_hash=p_ip_hash for update;
  if lim.window_start<now()-interval '15 minutes' then
    update private.pin_ip_limits set attempts=0,window_start=now() where ip_hash=p_ip_hash;
    lim.attempts:=0;
  end if;
  if lim.attempts>=10 then return null; end if;
  update private.pin_ip_limits set attempts=attempts+1 where ip_hash=p_ip_hash;
  select * into a from private.partner_access where singleton for update;
  if not found or a.disabled or a.failures>=20 or a.blocked_until>now() then return null; end if;
  if p_pin ~ '^[0-9]{4}$' and extensions.crypt(p_pin,a.pin_hash)=a.pin_hash then
    -- Do not reset cumulative failures: 20 guesses require an admin reset.
    return jsonb_build_object('user_id',a.user_id,'revision',a.revision,
      'email',(select email from auth.users where id=a.user_id));
  end if;
  update private.partner_access set failures=failures+1,
    window_failures=case when window_failures>=4 then 0 else window_failures+1 end,
    blocked_until=case when window_failures>=4 then now()+interval '15 minutes' else null end
    where singleton;
  return null;
end $$;
create function public.partner_pin_register(p_user_id uuid,p_revision uuid,p_session_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(100100);
  if not exists(select 1 from private.partner_access where user_id=p_user_id and revision=p_revision and not disabled)
    or not exists(select 1 from auth.sessions where id=p_session_id and user_id=p_user_id) then return false; end if;
  insert into private.partner_sessions(session_id,user_id,revision) values(p_session_id,p_user_id,p_revision);
  return true;
end $$;
create function public.partner_pin_revoke() returns void language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(100100);
  update private.partner_access set disabled=true,revision=gen_random_uuid();
  delete from private.partner_sessions;
end $$;
revoke all on function public.partner_pin_configure(uuid,text,boolean),public.partner_pin_status(),public.partner_pin_check(text,text),public.partner_pin_register(uuid,uuid,uuid),public.partner_pin_revoke() from public,anon,authenticated;
grant execute on function public.partner_pin_configure(uuid,text,boolean),public.partner_pin_status(),public.partner_pin_check(text,text),public.partner_pin_register(uuid,uuid,uuid),public.partner_pin_revoke() to service_role;

create or replace function public.is_couple_member() returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.couple_members m where m.user_id=(select auth.uid()))
and (
 not exists(select 1 from private.partner_access a where a.user_id=(select auth.uid()))
 or exists(select 1 from private.partner_access a join private.partner_sessions s on s.user_id=a.user_id and s.revision=a.revision
   join auth.sessions live on live.id=s.session_id
   where a.user_id=(select auth.uid()) and not a.disabled and s.expires_at>now()
   and s.session_id=nullif(auth.jwt()->>'session_id','')::uuid)
)
$$;

-- Replace permissive authenticated policies, including direct REST and Storage access.
alter policy users_read_unlocked_content on public.content_items using (public.is_admin() or (public.is_couple_member() and unlock_at<=now()));
alter policy users_read_unlocked_content_media_rows on public.content_media using
 (public.is_admin() or (public.is_couple_member() and exists(select 1 from public.content_items c where c.id=content_item_id and c.unlock_at<=now())));
alter policy users_read_unlocked_content_files on storage.objects using
 (bucket_id='content' and (public.is_admin() or (public.is_couple_member() and exists(select 1 from public.content_media m join public.content_items c on c.id=m.content_item_id where m.storage_path=name and c.unlock_at<=now()))));
alter policy auth_read_teasers on storage.objects using (bucket_id='teasers' and public.is_admin());
alter policy authenticated_read_year_moments on public.year_moments using (public.is_admin() or public.is_couple_member());
alter policy authenticated_add_year_moments on public.year_moments with check ((public.is_admin() or public.is_couple_member()) and created_by=auth.uid());
-- Both can create; only the author or admin can edit/delete an existing memory.
alter policy owners_or_admins_update_year_moments on public.year_moments using (public.is_admin() or (public.is_couple_member() and created_by=auth.uid())) with check (public.is_admin() or (public.is_couple_member() and created_by=auth.uid()));
create policy owners_delete_year_moments on public.year_moments for delete to authenticated using (public.is_couple_member() and created_by=auth.uid());
alter policy authenticated_read_moment_photos on public.moment_photos using (public.is_admin() or public.is_couple_member());
alter policy authenticated_add_moment_photos on public.moment_photos with check
 ((public.is_admin() or public.is_couple_member()) and exists(select 1 from public.year_moments m where m.id=moment_id and (m.created_by=auth.uid() or public.is_admin()))
 and storage_path like (auth.uid()::text||'/'||moment_id::text||'/%'));
create policy owners_delete_moment_photos on public.moment_photos for delete to authenticated using (public.is_couple_member() and exists(select 1 from public.year_moments m where m.id=moment_id and m.created_by=auth.uid()));
alter policy auth_read_moments on storage.objects using
 (bucket_id='moments' and (public.is_admin() or (public.is_couple_member() and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.moment_photos p where p.storage_path=name)))));
alter policy auth_upload_moments on storage.objects with check
 (bucket_id='moments' and (public.is_admin() or public.is_couple_member()) and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.year_moments m where m.id::text=(storage.foldername(name))[2] and m.created_by=auth.uid()));
create policy owners_delete_moments_storage on storage.objects for delete to authenticated using
 (bucket_id='moments' and public.is_couple_member() and (storage.foldername(name))[1]=auth.uid()::text);

-- Drafts cannot appear in schedules, RPC results, direct REST, or signed media.
alter table public.content_items add column published boolean not null default true;
alter policy users_read_unlocked_content on public.content_items using (public.is_admin() or (public.is_couple_member() and published and unlock_at<=now()));
create or replace function public.public_surprise_schedule() returns table(id uuid,unlock_at timestamptz,is_unlocked boolean)
language sql stable security definer set search_path='' as $$select c.id,c.unlock_at,c.unlock_at<=now() from public.content_items c where c.published and c.calendar_visible$$;
create or replace function public.public_unlocked_surprises() returns table(id uuid,title text,body text,kind text,unlock_at timestamptz)
language sql stable security definer set search_path='' as $$select c.id,c.title,c.body,c.kind,c.unlock_at from public.content_items c where c.published and c.unlock_at<=now() and public.is_couple_member()$$;
create or replace function public.unlocked_couple_media() returns table(id uuid,content_item_id uuid,media_type text,storage_path text,caption text,sort_order integer,youtube_video_id text,deezer_kind text,deezer_id text)
language sql stable security definer set search_path='' as $$select m.id,m.content_item_id,m.media_type,m.storage_path,m.caption,m.sort_order,m.youtube_video_id,m.deezer_kind,m.deezer_id from public.content_media m join public.content_items c on c.id=m.content_item_id where public.is_couple_member() and c.published and c.unlock_at<=now()$$;
-- Cascades are needed for complete author/admin deletion.
alter table public.moment_photos drop constraint moment_photos_moment_id_fkey;
alter table public.moment_photos add constraint moment_photos_moment_id_fkey foreign key(moment_id) references public.year_moments(id) on delete cascade;
alter table public.content_media drop constraint content_media_content_item_id_fkey;
alter table public.content_media add constraint content_media_content_item_id_fkey foreign key(content_item_id) references public.content_items(id) on delete cascade;
commit;
