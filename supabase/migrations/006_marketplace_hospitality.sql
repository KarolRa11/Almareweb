-- Travel Almaré: catálogo y reservaciones de hoteles, Airbnb y restaurantes.
-- Es autónoma y también funciona en instalaciones históricas.

begin;

create extension if not exists pgcrypto;

-- Compatibilidad con bases históricas que no ejecutaron schema.sql completo.
alter table public.perfiles
  add column if not exists activo boolean not null default true;

create or replace function public.actualizar_marca_tiempo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

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

create table if not exists public.establecimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('hotel','airbnb','restaurante')),
  nombre text not null check (char_length(trim(nombre)) between 2 and 140),
  descripcion text not null default '',
  direccion text not null default '',
  latitud numeric(9,6) not null check (latitud between -90 and 90),
  longitud numeric(9,6) not null check (longitud between -180 and 180),
  precio numeric(12,2) not null default 0 check (precio >= 0),
  descuento numeric(5,2) not null default 0 check (descuento between 0 and 100),
  unidad_precio text not null default 'noche' check (unidad_precio in ('noche','persona','reservacion')),
  imagen_principal text,
  imagenes text[] not null default '{}',
  amenidades text[] not null default '{}',
  caracteristicas text[] not null default '{}',
  capacidad_adultos integer not null default 2 check (capacidad_adultos between 1 and 1000),
  capacidad_ninos integer not null default 0 check (capacidad_ninos between 0 and 1000),
  capacidad_unidades integer not null default 1 check (capacidad_unidades between 1 and 1000),
  minimo_noches integer not null default 1 check (minimo_noches between 1 and 365),
  hora_apertura time,
  hora_cierre time,
  dias_no_disponibles date[] not null default '{}',
  activo boolean not null default true,
  destacado boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.reservas_establecimientos (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique default ('HSP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  usuario_id uuid not null references auth.users(id) on delete restrict,
  establecimiento_id uuid not null references public.establecimientos(id) on delete restrict,
  nombre_establecimiento text not null,
  tipo_establecimiento text not null check (tipo_establecimiento in ('hotel','airbnb','restaurante')),
  nombre_cliente text not null,
  email_cliente text not null,
  telefono text not null,
  fecha_inicio date not null,
  fecha_fin date,
  hora time,
  adultos integer not null check (adultos between 1 and 1000),
  ninos integer not null default 0 check (ninos between 0 and 1000),
  unidades integer not null default 1 check (unidades between 1 and 1000),
  notas text,
  precio_unitario numeric(12,2) not null check (precio_unitario >= 0),
  total_pagar numeric(12,2) not null check (total_pagar >= 0),
  estado text not null default 'pendiente' check (estado in ('pendiente','confirmada','cancelada','completada')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (fecha_inicio >= creado_en::date),
  check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

create index if not exists establecimientos_tipo_activo_idx
  on public.establecimientos(tipo, activo, destacado);
create index if not exists establecimientos_ubicacion_idx
  on public.establecimientos(latitud, longitud);
create index if not exists reservas_establecimiento_fechas_idx
  on public.reservas_establecimientos(establecimiento_id, fecha_inicio, fecha_fin, estado);
create index if not exists reservas_establecimiento_usuario_idx
  on public.reservas_establecimientos(usuario_id, creado_en desc);

drop trigger if exists establecimientos_actualizados on public.establecimientos;
create trigger establecimientos_actualizados
before update on public.establecimientos
for each row execute function public.actualizar_marca_tiempo();

drop trigger if exists reservas_establecimientos_actualizadas on public.reservas_establecimientos;
create trigger reservas_establecimientos_actualizadas
before update on public.reservas_establecimientos
for each row execute function public.actualizar_marca_tiempo();

alter table public.establecimientos enable row level security;
alter table public.reservas_establecimientos enable row level security;

drop policy if exists "establecimientos públicos activos" on public.establecimientos;
create policy "establecimientos públicos activos"
on public.establecimientos for select
using (activo or public.es_admin());

drop policy if exists "administrar establecimientos" on public.establecimientos;
create policy "administrar establecimientos"
on public.establecimientos for all to authenticated
using (public.es_admin())
with check (public.es_admin());

drop policy if exists "reservas de establecimientos propias" on public.reservas_establecimientos;
create policy "reservas de establecimientos propias"
on public.reservas_establecimientos for select to authenticated
using (usuario_id = auth.uid() or public.es_admin());

drop policy if exists "cliente cancela reserva de establecimiento" on public.reservas_establecimientos;
create policy "cliente cancela reserva de establecimiento"
on public.reservas_establecimientos for update to authenticated
using (
  usuario_id = auth.uid()
  and estado in ('pendiente','confirmada')
)
with check (
  usuario_id = auth.uid()
  and estado = 'cancelada'
);

drop policy if exists "administrar reservas de establecimientos" on public.reservas_establecimientos;
create policy "administrar reservas de establecimientos"
on public.reservas_establecimientos for all to authenticated
using (public.es_admin())
with check (public.es_admin());

create or replace function public.crear_reserva_establecimiento(
  p_establecimiento uuid,
  p_fecha_inicio date,
  p_fecha_fin date default null,
  p_hora time default null,
  p_adultos integer default 1,
  p_ninos integer default 0,
  p_unidades integer default 1,
  p_nombre text default '',
  p_telefono text default '',
  p_notas text default null
)
returns public.reservas_establecimientos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.establecimientos;
  v_reserva public.reservas_establecimientos;
  v_ocupado integer := 0;
  v_noches integer := 1;
  v_precio numeric(12,2);
  v_total numeric(12,2);
  v_email text;
  v_nombre text;
  v_telefono text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_fecha_inicio is null or p_fecha_inicio < current_date then raise exception 'FECHA_INVALIDA'; end if;
  if p_adultos < 1 or p_ninos < 0 or p_unidades < 1 then raise exception 'OCUPACION_INVALIDA'; end if;

  select * into v_item
  from public.establecimientos
  where id = p_establecimiento and activo
  for update;
  if not found then raise exception 'ESTABLECIMIENTO_NO_DISPONIBLE'; end if;

  if p_adultos > v_item.capacidad_adultos or p_ninos > v_item.capacidad_ninos then
    raise exception 'CAPACIDAD_EXCEDIDA';
  end if;

  if v_item.tipo in ('hotel','airbnb') then
    if p_fecha_fin is null or p_fecha_fin <= p_fecha_inicio then raise exception 'RANGO_FECHAS_INVALIDO'; end if;
    v_noches := p_fecha_fin - p_fecha_inicio;
    if v_noches < v_item.minimo_noches then raise exception 'MINIMO_NOCHES'; end if;
    if exists (
      select 1 from unnest(v_item.dias_no_disponibles) d
      where d >= p_fecha_inicio and d < p_fecha_fin
    ) then raise exception 'FECHA_BLOQUEADA'; end if;
    select coalesce(sum(r.unidades),0) into v_ocupado
    from public.reservas_establecimientos r
    where r.establecimiento_id = v_item.id
      and r.estado in ('pendiente','confirmada')
      and r.fecha_inicio < p_fecha_fin
      and coalesce(r.fecha_fin, r.fecha_inicio + 1) > p_fecha_inicio;
    if v_ocupado + p_unidades > v_item.capacidad_unidades then raise exception 'SIN_DISPONIBILIDAD'; end if;
  else
    if p_hora is null then raise exception 'HORA_REQUERIDA'; end if;
    if v_item.hora_apertura is not null and p_hora < v_item.hora_apertura then raise exception 'FUERA_DE_HORARIO'; end if;
    if v_item.hora_cierre is not null and p_hora > v_item.hora_cierre then raise exception 'FUERA_DE_HORARIO'; end if;
    if p_fecha_inicio = any(v_item.dias_no_disponibles) then raise exception 'FECHA_BLOQUEADA'; end if;
    select coalesce(sum(r.adultos + r.ninos),0) into v_ocupado
    from public.reservas_establecimientos r
    where r.establecimiento_id = v_item.id
      and r.estado in ('pendiente','confirmada')
      and r.fecha_inicio = p_fecha_inicio
      and r.hora = p_hora;
    if v_ocupado + p_adultos + p_ninos > v_item.capacidad_adultos + v_item.capacidad_ninos then
      raise exception 'SIN_DISPONIBILIDAD';
    end if;
  end if;

  select email into v_email from auth.users where id = auth.uid();
  select
    nullif(trim(concat_ws(' ', nombre, apellidos)), ''),
    nullif(trim(telefono), '')
  into v_nombre, v_telefono
  from public.perfiles where id = auth.uid();
  v_nombre := coalesce(nullif(trim(p_nombre),''), v_nombre, split_part(v_email,'@',1));
  v_telefono := coalesce(nullif(trim(p_telefono),''), v_telefono, '');
  if char_length(v_telefono) < 8 then raise exception 'TELEFONO_REQUERIDO'; end if;

  v_precio := round(v_item.precio * (1 - v_item.descuento / 100), 2);
  if v_item.unidad_precio = 'persona' then
    v_total := v_precio * (p_adultos + p_ninos) * case when v_item.tipo = 'restaurante' then 1 else v_noches end;
  elsif v_item.unidad_precio = 'reservacion' then
    v_total := v_precio;
  else
    v_total := v_precio * v_noches * p_unidades;
  end if;

  insert into public.reservas_establecimientos(
    usuario_id, establecimiento_id, nombre_establecimiento, tipo_establecimiento,
    nombre_cliente, email_cliente, telefono, fecha_inicio, fecha_fin, hora,
    adultos, ninos, unidades, notas, precio_unitario, total_pagar
  ) values (
    auth.uid(), v_item.id, v_item.nombre, v_item.tipo,
    v_nombre, v_email, v_telefono, p_fecha_inicio,
    case when v_item.tipo = 'restaurante' then null else p_fecha_fin end,
    case when v_item.tipo = 'restaurante' then p_hora else null end,
    p_adultos, p_ninos, p_unidades, nullif(trim(p_notas),''),
    v_precio, v_total
  ) returning * into v_reserva;

  return v_reserva;
end;
$$;

grant select on public.establecimientos to anon, authenticated;
grant select on public.reservas_establecimientos to authenticated;
grant insert, update, delete on public.establecimientos, public.reservas_establecimientos to authenticated;
grant execute on function public.crear_reserva_establecimiento(uuid,date,date,time,integer,integer,integer,text,text,text) to authenticated;

commit;
