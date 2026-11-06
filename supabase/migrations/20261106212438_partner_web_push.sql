-- No secrets in source: VAPID material and the cron credential are generated at runtime.
create table private.push_settings(singleton boolean primary key default true check(singleton),public_key text,private_key_id uuid,cron_key_id uuid not null,created_at timestamptz not null default now());
insert into private.push_settings(cron_key_id) select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'));
create table private.push_subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,session_id uuid not null references auth.sessions(id) on delete cascade,revision uuid,endpoint text not null unique,keys jsonb not null,subscribed_at timestamptz not null default now(),last_test_at timestamptz);
create index push_subscriptions_user_idx on private.push_subscriptions(user_id);
create index push_subscriptions_session_idx on private.push_subscriptions(session_id);
create table private.push_deliveries(subscription_id uuid not null references private.push_subscriptions(id) on delete cascade,content_id uuid not null references public.content_items(id) on delete cascade,status text not null default 'pending' check(status in ('pending','sent','failed')),attempts int not null default 0,lease uuid,lease_until timestamptz,next_attempt timestamptz not null default now(),sent_at timestamptz,primary key(subscription_id,content_id));
alter table private.push_settings enable row level security;
alter table private.push_subscriptions enable row level security;
alter table private.push_deliveries enable row level security;
revoke all on private.push_settings,private.push_subscriptions,private.push_deliveries from public,anon,authenticated;

create function private.push_session_valid(s private.push_subscriptions) returns boolean language sql stable set search_path='' as $$
select exists(select 1 from public.couple_members m join auth.sessions a on a.user_id=m.user_id where m.user_id=s.user_id and a.id=s.session_id)
and (not exists(select 1 from private.partner_access a where a.user_id=s.user_id) or exists(
select 1 from private.partner_access a join private.partner_sessions p on p.user_id=a.user_id and p.revision=a.revision
where a.user_id=s.user_id and not a.disabled and p.session_id=s.session_id and p.expires_at>now() and a.revision=s.revision));
$$;
revoke all on function private.push_session_valid(private.push_subscriptions) from public,anon,authenticated;

-- Authenticated bridge into non-exposed tables; every operation verifies current membership/session.
create function public.push_manage(p_action text,p_subscription jsonb default null,p_endpoint text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid:=nullif(auth.jwt()->>'session_id','')::uuid; rev uuid; sub private.push_subscriptions; key text;
begin
if uid is null or not public.is_couple_member() or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'Not authorized' using errcode='42501'; end if;
if p_action='config' then select public_key into key from private.push_settings; return jsonb_build_object('publicKey',key); end if;
if p_action='remove' then delete from private.push_subscriptions where user_id=uid and endpoint=p_endpoint; return '{}'::jsonb; end if;
if p_action='subscribe' then
perform pg_advisory_xact_lock(hashtextextended(uid::text,100));
if length(p_subscription::text)>4096 or (p_subscription->>'endpoint') !~ '^https://([a-z0-9-]+\.)*push\.apple\.com/|^https://fcm\.googleapis\.com/|^https://updates\.push\.services\.mozilla\.com/'
or coalesce(p_subscription->'keys'->>'p256dh','') !~ '^[A-Za-z0-9_-]{87}$' or coalesce(p_subscription->'keys'->>'auth','') !~ '^[A-Za-z0-9_-]{22}$' then raise exception 'Invalid subscription'; end if;
if exists(select 1 from private.push_subscriptions where endpoint=p_subscription->>'endpoint' and user_id<>uid) then raise exception 'Subscription unavailable'; end if;
if (select count(*) from private.push_subscriptions where user_id=uid)>=5 and not exists(select 1 from private.push_subscriptions where endpoint=p_subscription->>'endpoint' and user_id=uid) then raise exception 'Too many devices'; end if;
select revision into rev from private.partner_access where user_id=uid;
insert into private.push_subscriptions(user_id,session_id,revision,endpoint,keys) values(uid,sid,rev,p_subscription->>'endpoint',p_subscription->'keys')
on conflict(endpoint) do update set session_id=excluded.session_id,revision=excluded.revision,keys=excluded.keys,
subscribed_at=case when private.push_subscriptions.session_id=excluded.session_id then private.push_subscriptions.subscribed_at else now() end
where private.push_subscriptions.user_id=uid returning * into sub;
return jsonb_build_object('id',sub.id);
end if;
select * into sub from private.push_subscriptions where user_id=uid and session_id=sid and endpoint=p_endpoint for update;
if not found or not private.push_session_valid(sub) then raise exception 'Subscription unavailable'; end if;
if p_action='test' then
if sub.last_test_at>now()-interval '1 minute' then raise exception 'Please wait one minute'; end if;
update private.push_subscriptions set last_test_at=now() where id=sub.id;
return jsonb_build_object('endpoint',sub.endpoint,'keys',sub.keys);
end if;
raise exception 'Unknown action';
end $$;
revoke all on function public.push_manage(text,jsonb,text) from public,anon;
grant execute on function public.push_manage(text,jsonb,text) to authenticated;

-- Only the Edge Function's service role can call this bridge. Never return it to browsers.
create function public.push_worker(p_action text,p_data jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg private.push_settings; secret text; result jsonb;
begin
if p_action='init' then
select * into cfg from private.push_settings where singleton for update;
if cfg.public_key is null then
select vault.create_secret(p_data->>'privateKey') into cfg.private_key_id;
update private.push_settings set private_key_id=cfg.private_key_id,public_key=p_data->>'publicKey' where singleton;
end if;
return '{}'::jsonb;
end if;
if p_action='keys' then
select * into cfg from private.push_settings;
return jsonb_build_object('publicKey',cfg.public_key,'privateKey',(select decrypted_secret from vault.decrypted_secrets where id=cfg.private_key_id),'cronKey',(select decrypted_secret from vault.decrypted_secrets where id=cfg.cron_key_id));
end if;
if p_action='claim' then
perform pg_advisory_xact_lock(10010027);
insert into private.push_deliveries(subscription_id,content_id)
select s.id,c.id from private.push_subscriptions s cross join public.content_items c
where private.push_session_valid(s) and c.published and c.push_enabled and c.unlock_at<=now() and c.unlock_at>=s.subscribed_at and c.unlock_at>now()-interval '1 day'
on conflict do nothing;
with candidates as (
select d.subscription_id,d.content_id from private.push_deliveries d join private.push_subscriptions s on s.id=d.subscription_id join public.content_items c on c.id=d.content_id
where d.status='pending' and d.attempts<5 and d.next_attempt<=now() and (d.lease_until is null or d.lease_until<now()) and private.push_session_valid(s)
and c.published and c.push_enabled and c.unlock_at<=now() and c.unlock_at>=s.subscribed_at and c.unlock_at>now()-interval '1 day'
order by c.unlock_at limit 10 for update of d skip locked), claimed as (
update private.push_deliveries d set lease=gen_random_uuid(),lease_until=now()+interval '5 minutes',attempts=d.attempts+1 from candidates c where d.subscription_id=c.subscription_id and d.content_id=c.content_id returning d.*)
select coalesce(jsonb_agg(jsonb_build_object('subscriptionId',d.subscription_id,'itemId',d.content_id,'lease',d.lease,'endpoint',s.endpoint,'keys',s.keys)),'[]'::jsonb) into result from claimed d join private.push_subscriptions s on s.id=d.subscription_id;
return result;
end if;
if p_action='finish' then
if p_data->>'result'='expired' then delete from private.push_subscriptions where id=(p_data->>'subscriptionId')::uuid and exists(select 1 from private.push_deliveries where subscription_id=(p_data->>'subscriptionId')::uuid and content_id=(p_data->>'itemId')::uuid and lease=(p_data->>'lease')::uuid); else
update private.push_deliveries set status=case when p_data->>'result'='sent' then 'sent' when attempts>=5 then 'failed' else 'pending' end,
sent_at=case when p_data->>'result'='sent' then now() else null end,lease_until=null,next_attempt=now()+interval '5 minutes'
where subscription_id=(p_data->>'subscriptionId')::uuid and content_id=(p_data->>'itemId')::uuid and lease=(p_data->>'lease')::uuid;
end if;
return '{}'::jsonb;
end if;
raise exception 'Unknown action';
end $$;
revoke all on function public.push_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.push_worker(text,jsonb) to service_role;
create index push_deliveries_content_idx on private.push_deliveries(content_id);
create function private.push_tick() returns void language plpgsql set search_path='' as $$
declare token text;
begin
if not exists(select 1 from private.push_subscriptions s where private.push_session_valid(s)) then return; end if;
select v.decrypted_secret into token from private.push_settings c join vault.decrypted_secrets v on v.id=c.cron_key_id where c.public_key is not null;
if token is null then return; end if;
perform net.http_post(url:='https://estgcmkrlcrwwcrphvsy.supabase.co/functions/v1/partner-push',headers:=jsonb_build_object('Content-Type','application/json','x-push-cron',token),body:='{"action":"dispatch"}'::jsonb,timeout_milliseconds:=60000);
end $$;
revoke all on function private.push_tick() from public,anon,authenticated;
-- Hosted Supabase has these extensions; the local WASM security harness does not.
do $$begin
if exists(select 1 from pg_available_extensions where name='pg_cron') then
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
perform cron.schedule('10von100-push','* * * * *','select private.push_tick()');
end if;
end $$;
