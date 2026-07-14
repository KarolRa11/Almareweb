-- Travel Almaré CRM profesional.
-- Ejecutar después de 004_agency_workflow.sql.

begin;

-- Compatibilidad con instalaciones históricas que no ejecutaron la migración
-- de marca y solicitudes de llamada.
create table if not exists public.solicitudes_contacto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 2 and 100),
  telefono text not null check (char_length(trim(telefono)) between 8 and 30),
  estado text not null default 'nueva' check (estado in ('nueva','contactada')),
  creado_en timestamptz not null default now()
);

alter table public.solicitudes_contacto enable row level security;

drop policy if exists "crear solicitud de contacto" on public.solicitudes_contacto;
create policy "crear solicitud de contacto"
on public.solicitudes_contacto for insert
to anon, authenticated
with check (true);

grant insert on public.solicitudes_contacto to anon, authenticated;

create table if not exists public.crm_contactos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users(id) on delete set null,
  nombre text not null,
  telefono text,
  correo text,
  empresa text,
  ubicacion text,
  notas text,
  tipo text not null default 'prospecto' check (tipo in ('prospecto','cliente','empresa')),
  segmento text not null default 'general',
  origen text not null default 'manual',
  responsable uuid references public.perfiles(id) on delete set null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.crm_interacciones (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references public.crm_contactos(id) on delete cascade,
  tipo text not null check (tipo in ('llamada','whatsapp','correo','reunion','compra','nota')),
  asunto text not null,
  detalle text,
  responsable uuid references public.perfiles(id) on delete set null,
  realizada_en timestamptz not null default now(),
  creado_en timestamptz not null default now()
);

create table if not exists public.crm_oportunidades (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid references public.crm_contactos(id) on delete set null,
  titulo text not null,
  valor numeric(12,2) not null default 0 check (valor >= 0),
  etapa text not null default 'nuevo' check (etapa in ('nuevo','contactado','cotizacion','negociacion','ganada','perdida')),
  probabilidad integer not null default 10 check (probabilidad between 0 and 100),
  cierre_estimado date,
  responsable uuid references public.perfiles(id) on delete set null,
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.crm_tareas (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid references public.crm_contactos(id) on delete cascade,
  oportunidad_id uuid references public.crm_oportunidades(id) on delete cascade,
  titulo text not null,
  descripcion text,
  vencimiento timestamptz not null,
  prioridad text not null default 'media' check (prioridad in ('baja','media','alta','urgente')),
  estado text not null default 'pendiente' check (estado in ('pendiente','en_progreso','completada','cancelada')),
  responsable uuid references public.perfiles(id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.crm_cotizaciones (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique default ('COT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  contacto_id uuid references public.crm_contactos(id) on delete set null,
  oportunidad_id uuid references public.crm_oportunidades(id) on delete set null,
  concepto text not null,
  monto numeric(12,2) not null check (monto >= 0),
  estado text not null default 'borrador' check (estado in ('borrador','enviada','aceptada','rechazada','vencida')),
  valida_hasta date,
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.crm_tickets (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique default ('TKT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  contacto_id uuid references public.crm_contactos(id) on delete set null,
  asunto text not null,
  descripcion text,
  categoria text not null default 'consulta',
  prioridad text not null default 'media' check (prioridad in ('baja','media','alta','urgente')),
  estado text not null default 'abierto' check (estado in ('abierto','en_proceso','esperando_cliente','resuelto','cerrado')),
  responsable uuid references public.perfiles(id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.crm_campanas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  canal text not null check (canal in ('correo','whatsapp','facebook','instagram','tiktok')),
  segmento text not null default 'todos',
  asunto text,
  mensaje text not null,
  estado text not null default 'borrador' check (estado in ('borrador','programada','enviada','cancelada')),
  programada_para timestamptz,
  enviados integer not null default 0,
  abiertos integer not null default 0,
  conversiones integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.crm_automatizaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  disparador text not null,
  accion text not null,
  canal text,
  plantilla text,
  activa boolean not null default false,
  requiere_integracion boolean not null default false,
  ultima_ejecucion timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.crm_eventos_pagina (
  id bigint generated by default as identity primary key,
  evento text not null default 'vista',
  ruta text not null default '/',
  sesion text,
  referencia text,
  dispositivo text,
  creado_en timestamptz not null default now()
);

alter table public.perfiles add column if not exists rol text not null default 'cliente';
alter table public.perfiles add column if not exists activo boolean not null default true;
alter table public.perfiles add column if not exists crm_rol text not null default 'cliente';
alter table public.perfiles add column if not exists crm_permisos jsonb not null default '{}'::jsonb;

-- Algunas instalaciones históricas no ejecutaron schema.sql y por ello no
-- tienen esta función. La definimos aquí para que la migración sea autónoma.
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

grant execute on function public.es_admin() to authenticated;

create index if not exists crm_contactos_correo_idx on public.crm_contactos(lower(correo));
create index if not exists crm_interacciones_contacto_idx on public.crm_interacciones(contacto_id, realizada_en desc);
create index if not exists crm_oportunidades_etapa_idx on public.crm_oportunidades(etapa, actualizado_en desc);
create index if not exists crm_tareas_vencimiento_idx on public.crm_tareas(estado, vencimiento);
create index if not exists crm_eventos_fecha_idx on public.crm_eventos_pagina(creado_en desc, evento);

alter table public.crm_contactos enable row level security;
alter table public.crm_interacciones enable row level security;
alter table public.crm_oportunidades enable row level security;
alter table public.crm_tareas enable row level security;
alter table public.crm_cotizaciones enable row level security;
alter table public.crm_tickets enable row level security;
alter table public.crm_campanas enable row level security;
alter table public.crm_automatizaciones enable row level security;
alter table public.crm_eventos_pagina enable row level security;

do $$
declare tabla text;
begin
  foreach tabla in array array['crm_contactos','crm_interacciones','crm_oportunidades','crm_tareas','crm_cotizaciones','crm_tickets','crm_campanas','crm_automatizaciones']
  loop
    execute format('drop policy if exists "administrar %s" on public.%I', tabla, tabla);
    execute format('create policy "administrar %s" on public.%I for all using (public.es_admin()) with check (public.es_admin())', tabla, tabla);
  end loop;
end $$;

drop policy if exists "registrar analítica anónima" on public.crm_eventos_pagina;
create policy "registrar analítica anónima" on public.crm_eventos_pagina for insert to anon, authenticated with check (evento in ('vista','busqueda','contacto','reserva_iniciada'));
drop policy if exists "admin consulta analítica" on public.crm_eventos_pagina;
create policy "admin consulta analítica" on public.crm_eventos_pagina for select using (public.es_admin());

create or replace function public.crm_tiene_acceso(p_area text, p_escritura boolean default false)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from perfiles p where p.id = auth.uid() and p.activo and (
      p.rol = 'admin'
      or p.crm_rol in ('administrador','gerente')
      or (not p_escritura and p.crm_rol = 'lector')
      or (p.crm_rol = 'vendedor' and p_area in ('contactos','interacciones','oportunidades','tareas','cotizaciones','analitica','reservaciones'))
      or (p.crm_rol = 'soporte' and p_area in ('contactos','interacciones','tareas','tickets','reservaciones'))
      or (p.crm_rol = 'marketing' and p_area in ('contactos','campanas','automatizaciones','analitica'))
    )
  );
$$;

do $$
declare item record;
begin
  for item in select * from (values
    ('crm_contactos','contactos'), ('crm_interacciones','interacciones'),
    ('crm_oportunidades','oportunidades'), ('crm_tareas','tareas'),
    ('crm_cotizaciones','cotizaciones'), ('crm_tickets','tickets'),
    ('crm_campanas','campanas'), ('crm_automatizaciones','automatizaciones')
  ) as areas(tabla, area)
  loop
    execute format('drop policy if exists "crm lectura %s" on public.%I', item.tabla, item.tabla);
    execute format('drop policy if exists "crm escritura %s" on public.%I', item.tabla, item.tabla);
    execute format('create policy "crm lectura %s" on public.%I for select using (public.crm_tiene_acceso(%L,false))', item.tabla, item.tabla, item.area);
    execute format('create policy "crm escritura %s" on public.%I for all using (public.crm_tiene_acceso(%L,true)) with check (public.crm_tiene_acceso(%L,true))', item.tabla, item.tabla, item.area, item.area);
  end loop;
end $$;

drop policy if exists "crm consulta analítica" on public.crm_eventos_pagina;
create policy "crm consulta analítica" on public.crm_eventos_pagina for select using (public.crm_tiene_acceso('analitica',false));
drop policy if exists "crm consulta reservaciones" on public.reservaciones;
create policy "crm consulta reservaciones" on public.reservaciones for select using (public.crm_tiene_acceso('reservaciones',false));
drop policy if exists "crm consulta solicitudes" on public.solicitudes_contacto;
create policy "crm consulta solicitudes" on public.solicitudes_contacto for select using (public.crm_tiene_acceso('contactos',false));
drop policy if exists "crm consulta equipo" on public.perfiles;
create policy "crm consulta equipo" on public.perfiles for select using (public.crm_tiene_acceso('equipo',false));
drop policy if exists "crm administra equipo" on public.perfiles;
create policy "crm administra equipo" on public.perfiles for update using (public.crm_tiene_acceso('equipo',true)) with check (public.crm_tiene_acceso('equipo',true));

grant select, insert, update, delete on public.crm_contactos, public.crm_interacciones, public.crm_oportunidades, public.crm_tareas, public.crm_cotizaciones, public.crm_tickets, public.crm_campanas, public.crm_automatizaciones to authenticated;
grant select on public.crm_eventos_pagina to authenticated;
grant insert on public.crm_eventos_pagina to anon, authenticated;
grant select on public.reservaciones, public.solicitudes_contacto, public.perfiles to authenticated;
grant usage, select on sequence public.crm_eventos_pagina_id_seq to anon, authenticated;
grant execute on function public.crm_tiene_acceso(text,boolean) to authenticated;

insert into public.crm_automatizaciones(nombre, disparador, accion, canal, activa, requiere_integracion)
select * from (values
  ('Seguimiento de nuevo prospecto','prospecto_creado','crear_tarea_24h',null,true,false),
  ('Confirmación de cotización','cotizacion_enviada','enviar_confirmacion','correo',false,true),
  ('Ticket urgente','ticket_urgente','asignar_responsable',null,true,false),
  ('Recordatorio de viaje','viaje_48h','enviar_recordatorio','whatsapp',false,true)
) as defaults(nombre,disparador,accion,canal,activa,requiere_integracion)
where not exists (select 1 from public.crm_automatizaciones);

commit;
