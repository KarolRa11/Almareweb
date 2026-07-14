-- Contacto y redes sociales editables desde el dashboard.
-- Ejecutar una vez en Supabase SQL Editor si la base ya estaba creada.

create table if not exists public.configuracion (
  clave text primary key,
  valor jsonb not null,
  actualizado_en timestamptz not null default now()
);

alter table public.configuracion enable row level security;

create or replace function public.puede_administrar_contacto()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.perfiles
      where id = auth.uid()
        and rol::text = 'admin'
    )
    or lower(coalesce(auth.jwt()->>'email', '')) = 'admin@almare.com';
$$;

drop policy if exists "contacto público" on public.configuracion;
drop policy if exists "administrar contacto" on public.configuracion;

create policy "contacto público"
on public.configuracion
for select
using (clave = 'redes_sociales' or public.puede_administrar_contacto());

create policy "administrar contacto"
on public.configuracion
for all
to authenticated
using (public.puede_administrar_contacto())
with check (public.puede_administrar_contacto());

insert into public.configuracion(clave, valor)
values (
  'redes_sociales',
  '[{"id":"whatsapp","label":"WhatsApp","url":"","active":true,"order":1},{"id":"facebook","label":"Facebook","url":"","active":true,"order":2},{"id":"tiktok","label":"TikTok","url":"","active":true,"order":3},{"id":"instagram","label":"Instagram","url":"","active":true,"order":4},{"id":"email","label":"Correo electrónico","url":"mailto:admin@almare.com","active":true,"order":5}]'::jsonb
)
on conflict (clave) do nothing;

grant select on public.configuracion to anon, authenticated;
grant insert, update, delete on public.configuracion to authenticated;
grant execute on function public.puede_administrar_contacto() to anon, authenticated;
