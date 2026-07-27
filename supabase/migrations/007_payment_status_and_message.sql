-- Travel Almaré: estados de pago visibles para clientes y configurables por administración.
-- Ejecutar una vez en Supabase SQL Editor después de 006_marketplace_hospitality.sql.

begin;

-- Esta migración debe poder ejecutarse aunque una instalación histórica no
-- haya aplicado todavía 002_social_links.sql o 003_site_branding_and_contact.sql.
create table if not exists public.configuracion (
  clave text primary key,
  valor jsonb not null,
  actualizado_en timestamptz not null default now()
);

alter table public.configuracion enable row level security;

alter table public.perfiles
  add column if not exists activo boolean not null default true;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and p.rol::text = 'admin'
      and coalesce(p.activo, true)
  );
$$;

grant execute on function public.es_admin() to anon, authenticated;

alter table public.reservaciones
  add column if not exists estado_pago text not null default 'pagar';

alter table public.reservas_establecimientos
  add column if not exists estado_pago text not null default 'pagar';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reservaciones_estado_pago_valido'
      and conrelid = 'public.reservaciones'::regclass
  ) then
    alter table public.reservaciones
      add constraint reservaciones_estado_pago_valido
      check (estado_pago in ('pagar','pendiente','pagado'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'reservas_establecimientos_estado_pago_valido'
      and conrelid = 'public.reservas_establecimientos'::regclass
  ) then
    alter table public.reservas_establecimientos
      add constraint reservas_establecimientos_estado_pago_valido
      check (estado_pago in ('pagar','pendiente','pagado'));
  end if;
end
$$;

insert into public.configuracion(clave, valor)
values (
  'mensaje_pago',
  '{"message":"Nosotros nos pondremos en contacto contigo para efectuar el pago.\n\nAtentamente, Travel Almaré."}'::jsonb
)
on conflict (clave) do nothing;

drop policy if exists "mensaje de pago público" on public.configuracion;
drop policy if exists "administrar mensaje de pago" on public.configuracion;

create policy "mensaje de pago público"
on public.configuracion for select
using (clave = 'mensaje_pago');

create policy "administrar mensaje de pago"
on public.configuracion for all to authenticated
using (public.es_admin())
with check (public.es_admin());

grant select on public.configuracion to anon, authenticated;
grant insert, update, delete on public.configuracion to authenticated;
grant update(estado_pago) on public.reservaciones to authenticated;
grant update(estado_pago) on public.reservas_establecimientos to authenticated;

commit;
