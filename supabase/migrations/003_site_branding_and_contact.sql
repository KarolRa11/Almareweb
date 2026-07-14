-- Apariencia editable, Quiénes somos y solicitudes de devolución de llamada.
-- Puede ejecutarse aunque la migración 002 todavía no se haya instalado.

create table if not exists public.configuracion (
  clave text primary key,
  valor jsonb not null,
  actualizado_en timestamptz not null default now()
);

create table if not exists public.solicitudes_contacto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 2 and 100),
  telefono text not null check (char_length(trim(telefono)) between 8 and 30),
  estado text not null default 'nueva' check (estado in ('nueva','contactada')),
  creado_en timestamptz not null default now()
);

alter table public.configuracion enable row level security;
alter table public.solicitudes_contacto enable row level security;

create or replace function public.puede_administrar_sitio()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.perfiles where id = auth.uid() and rol::text = 'admin')
    or lower(coalesce(auth.jwt()->>'email', '')) = 'admin@almare.com';
$$;

drop policy if exists "apariencia pública" on public.configuracion;
drop policy if exists "administrar apariencia" on public.configuracion;
drop policy if exists "crear solicitud de contacto" on public.solicitudes_contacto;
drop policy if exists "administrar solicitudes de contacto" on public.solicitudes_contacto;

create policy "apariencia pública"
on public.configuracion for select
using (clave in ('apariencia_sitio','redes_sociales') or public.puede_administrar_sitio());

create policy "administrar apariencia"
on public.configuracion for all to authenticated
using (public.puede_administrar_sitio())
with check (public.puede_administrar_sitio());

create policy "crear solicitud de contacto"
on public.solicitudes_contacto for insert to anon, authenticated
with check (char_length(trim(nombre)) between 2 and 100 and char_length(trim(telefono)) between 8 and 30);

create policy "administrar solicitudes de contacto"
on public.solicitudes_contacto for all to authenticated
using (public.puede_administrar_sitio())
with check (public.puede_administrar_sitio());

insert into public.configuracion(clave, valor)
values (
  'apariencia_sitio',
  '{"logoUrl":"","aboutTitle":"Quiénes somos","aboutText":"Somos una empresa acapulqueña creada para ayudarte a descubrir Acapulco, su cultura, sus paisajes y las experiencias que hacen único a nuestro puerto.","gradientStart":"#174f67","gradientEnd":"#4da693","gradientOpacity":82,"contactPrompt":"Nosotros te contactamos"}'::jsonb
)
on conflict (clave) do nothing;

grant select on public.configuracion to anon, authenticated;
grant insert, update, delete on public.configuracion to authenticated;
grant insert on public.solicitudes_contacto to anon, authenticated;
grant select, update, delete on public.solicitudes_contacto to authenticated;
grant execute on function public.puede_administrar_sitio() to anon, authenticated;
