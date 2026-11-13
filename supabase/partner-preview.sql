-- Reviewed additive setup: neutral previews for authenticated current couple members only.
create or replace function public.partner_surprise_previews()
returns table(id uuid,unlock_at timestamptz,is_unlocked boolean)
language sql stable security definer set search_path='' as $$
select c.id,c.unlock_at,c.unlock_at<=now()
from public.content_items c
where c.published and public.is_couple_member()
$$;
revoke all on function public.partner_surprise_previews() from public,anon;
grant execute on function public.partner_surprise_previews() to authenticated;
