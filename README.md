# Travel Almaré

Plataforma de catálogo y reservaciones para experiencias desde Acapulco, con autenticación de clientes y panel administrativo.

## Requisitos

- Node.js 20 o superior.
- Un proyecto de Supabase.
- Variables en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_ANON
ADMIN_EMAILS=admin@almare.com
```

La clave `anon` es pública por diseño. Nunca agregue una `service_role` a una variable `NEXT_PUBLIC_*`.

`ADMIN_EMAILS` es una lista separada por comas usada como respaldo para cuentas administrativas creadas antes del trigger de perfiles. La autorización también acepta `perfiles.rol = 'admin'`.

## Configurar Supabase

Para un proyecto nuevo, ejecute [`supabase/schema.sql`](supabase/schema.sql) en SQL Editor. El archivo crea tablas, relaciones, índices, validaciones, perfiles automáticos, RLS, Storage y la función transaccional de reservas.

La base histórica de este proyecto tiene `destinos.id bigint` y una columna incompatible `reservaciones.destino_id uuid`. Ejecute [`supabase/migrations/001_normalize_reservacion_destino.sql`](supabase/migrations/001_normalize_reservacion_destino.sql) para corregir esa instalación.

Para habilitar el panel editable de WhatsApp, Facebook, TikTok, Instagram y correo en una base ya existente, ejecute [`supabase/migrations/002_social_links.sql`](supabase/migrations/002_social_links.sql). Después podrá cambiar enlaces, visibilidad y orden desde **Dashboard → Contacto**.

Para publicar el logo, el degradado, el contenido de **Quiénes somos** y recibir solicitudes de llamada en todos los dispositivos, ejecute [`supabase/migrations/003_site_branding_and_contact.sql`](supabase/migrations/003_site_branding_and_contact.sql).

Para activar perfiles completos, reglas por destino y cancelación desde **Mi cuenta**, ejecute [`supabase/migrations/004_agency_workflow.sql`](supabase/migrations/004_agency_workflow.sql).

Para activar el CRM compartido —clientes, embudo, interacciones, tareas, cotizaciones, soporte, campañas, automatizaciones, analítica y permisos— ejecute [`supabase/migrations/005_professional_crm.sql`](supabase/migrations/005_professional_crm.sql). Mientras esta migración no esté publicada, el CRM usa almacenamiento local únicamente en el navegador actual.

Para activar el catálogo profesional de **hoteles, Airbnb y restaurantes**, el mapa con marcadores filtrables, disponibilidad y reservaciones, ejecute [`supabase/migrations/006_marketplace_hospitality.sql`](supabase/migrations/006_marketplace_hospitality.sql) después de la migración 005. El módulo se administra desde **Dashboard → Hospedaje y restaurantes**. La función SQL incluida calcula el precio, valida capacidad, fechas bloqueadas, horarios y evita sobreventa antes de registrar cada solicitud.

Los colaboradores acceden en `/crm`. Ejemplo para asignar un vendedor:

```sql
update public.perfiles
set crm_rol = 'vendedor'
where id = 'UUID_DEL_COLABORADOR';
```

Roles disponibles: `administrador`, `gerente`, `vendedor`, `soporte`, `marketing`, `lector` y `cliente`. Las políticas RLS de la migración restringen lectura y escritura por área; no dependen solamente de ocultar botones en la interfaz.

Para convertir al primer administrador, después de que se registre:

```sql
update public.perfiles set rol = 'admin' where id = 'UUID_DEL_USUARIO';
```

No permita que el formulario público asigne este rol.

En Authentication → URL Configuration agregue las URL de desarrollo y producción, incluida `/restablecer-contrasena`, a las URL de redirección permitidas.

Supabase aplica un límite reducido a los correos enviados por su proveedor integrado. Para registros reales en producción, configure un SMTP propio en Authentication → SMTP Settings. Durante desarrollo también puede desactivar temporalmente Confirm email en Authentication → Providers → Email; no lo desactive en producción sin evaluar el riesgo.

## Desarrollo y validación

```bash
npm install
npm run dev
npm run lint
npm run build
```

Abra [http://localhost:3000](http://localhost:3000). El dashboard administrativo vive en `/admin`; el espacio de trabajo para colaboradores vive en `/crm`. Ambos redirigen a `/login` cuando no existe una sesión autorizada.

## Despliegue

Configure las dos variables públicas en Vercel o el proveedor elegido y ejecute `npm run build`. Use HTTPS en producción y configure la URL pública en Supabase Auth.

## Integraciones

- Supabase Auth, PostgreSQL y Storage: implementados.
- Google Maps: enlace público de exploración, sin clave privada.
- Mapas del marketplace: OpenStreetMap y Leaflet, sin clave privada; los puntos y sus filtros se alimentan de `establecimientos`.
- Pagos: el esquema distingue estados, pero no se marca ningún pago como aprobado porque no hay una pasarela ni credenciales configuradas.
- Correo: recuperación y confirmación usan los correos de Supabase Auth. No hay proveedor transaccional adicional configurado.
- CRM: las automatizaciones internas de tareas están activas. Los envíos masivos o automáticos por correo y WhatsApp requieren configurar un proveedor externo antes de habilitar esas reglas.
