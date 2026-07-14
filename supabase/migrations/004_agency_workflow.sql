-- Travel Almaré: perfiles completos, reglas de viaje y cancelación del cliente.
-- Ejecutar una vez en Supabase SQL Editor si el proyecto ya existía.

alter table public.perfiles add column if not exists fecha_nacimiento date;
alter table public.perfiles add column if not exists sexo text;

alter table public.destinos add column if not exists etiquetas text[] not null default array['Familiar']::text[];
alter table public.destinos add column if not exists edad_minima integer not null default 0;
alter table public.destinos add column if not exists permite_ninos boolean not null default true;

alter table public.reservaciones add column if not exists usuario_id uuid references auth.users(id) on delete set null;
alter table public.reservaciones add column if not exists precio_unitario numeric(12,2);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'perfiles_sexo_valido') then
    alter table public.perfiles add constraint perfiles_sexo_valido
      check (sexo is null or sexo in ('femenino','masculino','no_binario','prefiero_no_decir'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'destinos_edad_minima_valida') then
    alter table public.destinos add constraint destinos_edad_minima_valida check (edad_minima between 0 and 99);
  end if;
end $$;

create or replace function public.crear_perfil_usuario()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into perfiles(id, nombre, apellidos, telefono, fecha_nacimiento, sexo, rol)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre',''),
    coalesce(new.raw_user_meta_data->>'apellidos',''),
    new.raw_user_meta_data->>'telefono',
    nullif(new.raw_user_meta_data->>'fecha_nacimiento','')::date,
    nullif(new.raw_user_meta_data->>'sexo',''),
    'cliente'
  )
  on conflict (id) do update set
    nombre = excluded.nombre,
    apellidos = excluded.apellidos,
    telefono = excluded.telefono,
    fecha_nacimiento = excluded.fecha_nacimiento,
    sexo = excluded.sexo;
  return new;
end $$;

drop policy if exists "cliente cancela reserva propia" on public.reservaciones;
create policy "cliente cancela reserva propia" on public.reservaciones
for update to authenticated
using (
  not public.es_admin()
  and (usuario_id = auth.uid() or lower(email_cliente) = lower(coalesce(auth.jwt()->>'email','')))
  and estado::text in ('pendiente','confirmada')
)
with check (
  not public.es_admin()
  and (usuario_id = auth.uid() or lower(email_cliente) = lower(coalesce(auth.jwt()->>'email','')))
  and estado::text = 'cancelada'
);

grant update(estado) on public.reservaciones to authenticated;
grant update(nombre, apellidos, telefono, fecha_nacimiento, sexo) on public.perfiles to authenticated;

