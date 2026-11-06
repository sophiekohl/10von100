-- Schema-only snapshot 2026-11-05. Auth/Storage are minimal local test models; no user data.
set check_function_bodies=off;
create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create schema extensions;create extension pgcrypto with schema extensions;
create table auth.users(id uuid primary key,email text);create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id));create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;create function auth.uid() returns uuid language sql stable as $$select nullif(auth.jwt()->>'sub','')::uuid$$;
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(name text) returns text[] language sql as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
create table public.content_items(id uuid NOT NULL DEFAULT gen_random_uuid(),title text NOT NULL DEFAULT 'Da wartet etwas auf dich.'::text,kind text NOT NULL DEFAULT 'ueberraschung'::text,body text,unlock_at timestamp with time zone NOT NULL,teaser_mode text NOT NULL DEFAULT 'none'::text,teaser_image_path text,calendar_visible boolean NOT NULL DEFAULT true,push_enabled boolean NOT NULL DEFAULT false,push_text text,created_at timestamp with time zone NOT NULL DEFAULT now(),updated_at timestamp with time zone NOT NULL DEFAULT now());alter table public.content_items enable row level security;
create table public.year_moments(id uuid NOT NULL DEFAULT gen_random_uuid(),caption text,moment_date date NOT NULL DEFAULT CURRENT_DATE,include_in_recap boolean NOT NULL DEFAULT true,created_by uuid,created_at timestamp with time zone NOT NULL DEFAULT now());alter table public.year_moments enable row level security;
create table public.admin_users(user_id uuid NOT NULL,created_at timestamp with time zone NOT NULL DEFAULT now());alter table public.admin_users enable row level security;
create table public.content_media(id uuid NOT NULL DEFAULT gen_random_uuid(),content_item_id uuid NOT NULL,media_type text NOT NULL,storage_path text,caption text,sort_order integer NOT NULL DEFAULT 0,created_at timestamp with time zone NOT NULL DEFAULT now(),youtube_video_id text,deezer_kind text,deezer_id text);alter table public.content_media enable row level security;
create table public.moment_photos(id uuid NOT NULL DEFAULT gen_random_uuid(),moment_id uuid NOT NULL,storage_path text NOT NULL,sort_order integer NOT NULL DEFAULT 0,created_at timestamp with time zone NOT NULL DEFAULT now(),caption text);alter table public.moment_photos enable row level security;
create table public.calendar_ranges(id uuid NOT NULL DEFAULT gen_random_uuid(),start_date date NOT NULL,end_date date NOT NULL,created_at timestamp with time zone NOT NULL DEFAULT now());alter table public.calendar_ranges enable row level security;
create table public.couple_members(user_id uuid NOT NULL,created_at timestamp with time zone NOT NULL DEFAULT now());alter table public.couple_members enable row level security;
create table public.pending_couple_invites(email text NOT NULL,created_at timestamp with time zone NOT NULL DEFAULT now(),activated_at timestamp with time zone);alter table public.pending_couple_invites enable row level security;
alter table public.content_items add constraint content_items_kind_check CHECK ((kind = ANY (ARRAY['erinnerung'::text, 'liebesnachricht'::text, 'hinweis'::text, 'mission'::text, 'ueberraschung'::text])));
alter table public.content_items add constraint content_items_pkey PRIMARY KEY (id);
alter table public.content_items add constraint content_items_teaser_mode_check CHECK ((teaser_mode = ANY (ARRAY['none'::text, 'image'::text])));
alter table public.year_moments add constraint year_moments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.year_moments add constraint year_moments_pkey PRIMARY KEY (id);
alter table public.admin_users add constraint admin_users_pkey PRIMARY KEY (user_id);
alter table public.admin_users add constraint admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.content_media add constraint content_media_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON DELETE CASCADE;
alter table public.content_media add constraint content_media_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text, 'audio'::text, 'youtube'::text, 'deezer'::text])));
alter table public.content_media add constraint content_media_pkey PRIMARY KEY (id);
alter table public.content_media add constraint content_media_source_check CHECK ((((media_type = 'youtube'::text) AND (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'::text) AND (storage_path IS NULL) AND (deezer_id IS NULL) AND (deezer_kind IS NULL)) OR ((media_type = 'deezer'::text) AND (deezer_kind = ANY (ARRAY['track'::text, 'album'::text, 'playlist'::text])) AND (deezer_id ~ '^[0-9]+$'::text) AND (storage_path IS NULL) AND (youtube_video_id IS NULL)) OR ((media_type = ANY (ARRAY['image'::text, 'video'::text, 'audio'::text])) AND (storage_path IS NOT NULL) AND (youtube_video_id IS NULL) AND (deezer_id IS NULL) AND (deezer_kind IS NULL))));
alter table public.moment_photos add constraint moment_photos_moment_id_fkey FOREIGN KEY (moment_id) REFERENCES year_moments(id) ON DELETE CASCADE;
alter table public.moment_photos add constraint moment_photos_pkey PRIMARY KEY (id);
alter table public.calendar_ranges add constraint calendar_ranges_pkey PRIMARY KEY (id);
alter table public.calendar_ranges add constraint calendar_ranges_valid CHECK (((end_date >= start_date) AND (end_date <= (start_date + '366 days'::interval))));
alter table public.couple_members add constraint couple_members_pkey PRIMARY KEY (user_id);
alter table public.couple_members add constraint couple_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.pending_couple_invites add constraint pending_couple_invites_pkey PRIMARY KEY (email);
alter table public.pending_couple_invites add constraint valid_email CHECK ((email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text));
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists(select 1 from public.admin_users where user_id=(select auth.uid())) $function$;

CREATE OR REPLACE FUNCTION public.public_unlocked_surprises()
 RETURNS TABLE(id uuid, title text, body text, kind text, unlock_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select c.id,c.title,c.body,c.kind,c.unlock_at from public.content_items c where c.unlock_at<=now() and public.is_couple_member() $function$;

CREATE OR REPLACE FUNCTION public.public_surprise_schedule()
 RETURNS TABLE(id uuid, unlock_at timestamp with time zone, is_unlocked boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select c.id,c.unlock_at,(c.unlock_at<=now()) from public.content_items c where c.calendar_visible = true $function$;

CREATE OR REPLACE FUNCTION public.unlocked_couple_media()
 RETURNS TABLE(id uuid, content_item_id uuid, media_type text, storage_path text, caption text, sort_order integer, youtube_video_id text, deezer_kind text, deezer_id text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select m.id,m.content_item_id,m.media_type,m.storage_path,m.caption,m.sort_order,m.youtube_video_id,m.deezer_kind,m.deezer_id from public.content_media m join public.content_items c on c.id=m.content_item_id where public.is_couple_member() and c.unlock_at<=now() $function$;

CREATE OR REPLACE FUNCTION public.public_calendar_ranges()
 RETURNS TABLE(start_date date, end_date date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$select c.start_date,c.end_date from public.calendar_ranges c$function$;

CREATE OR REPLACE FUNCTION public.is_couple_member()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$select exists(select 1 from public.couple_members where user_id=auth.uid())$function$;
create policy "users_read_unlocked_content_files" on storage.objects for SELECT to authenticated using (((bucket_id = 'content'::text) AND (EXISTS ( SELECT 1
   FROM (content_media cm
     JOIN content_items ci ON ((ci.id = cm.content_item_id)))
  WHERE ((cm.storage_path = objects.name) AND ((ci.unlock_at <= now()) OR is_admin())))))) ;
create policy "admin_manage_content_media" on storage.objects for ALL to authenticated using (((bucket_id = 'content'::text) AND is_admin())) with check (((bucket_id = 'content'::text) AND is_admin()));
create policy "auth_read_teasers" on storage.objects for SELECT to authenticated using ((bucket_id = 'teasers'::text)) ;
create policy "admin_manage_moments_storage" on storage.objects for ALL to authenticated using (((bucket_id = 'moments'::text) AND is_admin())) with check (((bucket_id = 'moments'::text) AND is_admin()));
create policy "auth_upload_moments" on storage.objects for INSERT to authenticated  with check ((bucket_id = 'moments'::text));
create policy "auth_read_moments" on storage.objects for SELECT to authenticated using ((bucket_id = 'moments'::text)) ;
create policy "admin_manage_teasers" on storage.objects for ALL to authenticated using (((bucket_id = 'teasers'::text) AND is_admin())) with check (((bucket_id = 'teasers'::text) AND is_admin()));
create policy "users_read_unlocked_content" on public.content_items for SELECT to authenticated using (((unlock_at <= now()) OR is_admin())) ;
create policy "admins_manage_content" on public.content_items for ALL to authenticated using (is_admin()) with check (is_admin());
create policy "admins_delete_year_moments" on public.year_moments for DELETE to authenticated using (is_admin()) ;
create policy "owners_or_admins_update_year_moments" on public.year_moments for UPDATE to authenticated using (((created_by = auth.uid()) OR is_admin())) with check (((created_by = auth.uid()) OR is_admin()));
create policy "authenticated_add_year_moments" on public.year_moments for INSERT to authenticated  with check ((created_by = auth.uid()));
create policy "authenticated_read_year_moments" on public.year_moments for SELECT to authenticated using (true) ;
create policy "self_read_admin" on public.admin_users for SELECT to authenticated using ((user_id = auth.uid())) ;
create policy "users_read_unlocked_content_media_rows" on public.content_media for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM content_items c
  WHERE ((c.id = content_media.content_item_id) AND ((c.unlock_at <= now()) OR is_admin()))))) ;
create policy "admins_manage_content_media_rows" on public.content_media for ALL to authenticated using (is_admin()) with check (is_admin());
create policy "admins_manage_moment_photos" on public.moment_photos for ALL to authenticated using (is_admin()) with check (is_admin());
create policy "authenticated_add_moment_photos" on public.moment_photos for INSERT to authenticated  with check ((EXISTS ( SELECT 1
   FROM year_moments m
  WHERE ((m.id = moment_photos.moment_id) AND ((m.created_by = auth.uid()) OR is_admin())))));
create policy "authenticated_read_moment_photos" on public.moment_photos for SELECT to authenticated using (true) ;
create policy "calendar_ranges_admin_all" on public.calendar_ranges for ALL to authenticated using (is_admin()) with check (is_admin());
create policy "pending_couple_invites_admin" on public.pending_couple_invites for ALL to authenticated using (is_admin()) with check (is_admin());
grant usage on schema public,auth,storage to anon,authenticated,service_role;grant all on all tables in schema public,storage to authenticated,service_role;


-- Test-only Vault model; production uses the encrypted Supabase Vault extension.
create schema vault;create table vault.decrypted_secrets(id uuid primary key default gen_random_uuid(),decrypted_secret text);create function vault.create_secret(v text) returns uuid language plpgsql as $$declare k uuid;begin insert into vault.decrypted_secrets(decrypted_secret)values(v)returning id into k;return k;end$$;
