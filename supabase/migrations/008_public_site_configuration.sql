-- La configuración visual, las redes y las colecciones publicadas deben poder
-- leerse en el sitio sin iniciar sesión. La escritura continúa restringida a
-- administradores mediante las políticas existentes.

drop policy if exists "apariencia pública" on public.configuracion;
drop policy if exists "configuración pública del sitio" on public.configuracion;

create policy "configuración pública del sitio"
on public.configuracion
for select
to anon, authenticated
using (clave in ('apariencia_sitio', 'redes_sociales', 'mensaje_pago'));

grant select on public.configuracion to anon, authenticated;
