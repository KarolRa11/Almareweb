-- Migración para la instalación existente mostrada el 12/07/2026.
-- Los destinos usan bigint pero reservaciones.destino_id fue creada como uuid.
-- Verifique primero que no haya reservaciones con destino_id; la aplicación
-- histórica no podía insertar ninguna por esta incompatibilidad.
begin;
alter table public.reservaciones drop constraint if exists reservaciones_destino_id_fkey;
alter table public.reservaciones drop column if exists destino_id;
alter table public.reservaciones add column destino_id bigint references public.destinos(id) on delete restrict;
create index if not exists reservaciones_destino_idx on public.reservaciones(destino_id);
commit;
