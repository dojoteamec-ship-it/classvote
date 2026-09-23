# 7 · Historial

Registro de lo que se construyó, en orden. Los detalles técnicos de cada paso están en los
Pull Requests de GitHub.

## Plan de fases

| Fase | Alcance | Estado |
|---|---|---|
| 1 | Esqueleto Next.js + esquema Supabase + Vercel conectado | ✅ |
| 2 | Vista del alumno: proponer, votar, conteo en tiempo real | ✅ |
| 3 | Panel del mentor: cuentas, aprobación, gestión del cinturón, administración | ✅ |
| 4 | Cierre automático del ciclo a la hora de la clase | ✅ |
| — | Rediseño visual con la identidad RONIN | ✅ |
| 5 | Publicar cada `/votar/<cinturón>` en su grupo de GHL | ⏳ Tras la revisión y aprobación del equipo |

## Fase 1 · Esqueleto (23 sep 2026)

- Proyecto Next.js 16 + TypeScript + Tailwind v4 con clientes de Supabase para navegador y
  servidor.
- Esquema inicial (`0001_init.sql`) y los 7 cinturones (`seed.sql`), aplicados en Supabase.
- El repositorio se creó en `SantiJimenezIA/classvote` y luego se **transfirió a
  `dojoteamec-ship-it/classvote`**, porque Vercel (plan Hobby) solo conecta repos de la
  cuenta de GitHub con la que se inició sesión.
- Proyecto `classvote` en Vercel conectado al repo, con las 3 variables de entorno
  (la service role key se regeneró tras haberse expuesto en un chat).
- Rama de producción: `main`.

## Fase 2 · Vista del alumno — PR #1

- `/votar/[slug]` con la próxima clase, proponer tema (nombre opcional) y votar varios
  temas, una vez cada uno.
- `0002`: conteo `votos_count` por trigger (el navegador nunca lee `votos`), permisos por
  columna para `anon`, `ciclo_actual()` (el ciclo se abre al entrar) y Realtime.
- Decisiones: varios temas con un voto cada uno, nombre opcional, ciclo que se abre al
  entrar.

## Fase 3 · Mentores y administración — PR #1

- Registro propio del mentor; queda **pendiente** hasta que un admin lo aprueba.
- Panel por cinturón: temas en vivo (incluidos los ocultos), tipo de sesión,
  cerrar/reabrir, ocultar/mostrar.
- `/admin`: aprobar, rechazar, desactivar, asignar cinturones y rol admin.
- `0003`: estado y rol del mentor, trigger de registro, `es_admin()` y
  `puede_gestionar()`, RLS del panel, temas ocultos.
- Decisiones: aprobación del admin (en vez de código de invitación) y confirmación de
  correo desactivada.
- Configuración de Supabase corregida en el camino: proveedor Email encendido, Confirm
  email apagado, Site URL de producción.

## Ajustes + Fase 4 · Cierre automático — PR #2

- Error real de Supabase visible al registrarse; el formulario conserva los datos si falla.
- `/admin` → **Restablecer contraseña** (temporal) y `/mentor/cuenta` para cambiarla.
- Mensaje claro cuando el correo no está confirmado.
- `0004`: `cerrar_ciclos_vencidos()` + pg_cron cada 5 minutos; `reabierto` para que una
  votación reabierta por el mentor no se vuelva a cerrar sola.
- Decisión: cierre a la hora de inicio de la clase.

## Rediseño visual — PR #3 y PR #4

- **v1 (PR #3):** estética "dojo nocturno" (índigo, dorado, samurái dibujado en SVG).
  Se consideró demasiado básica y ajena a la marca.
- **v2 (PR #4):** estructura tipo Apple con la identidad real RONIN (ronin cibernético):
  - Logotipo RONIN y emblema del ronin tomados del logo oficial; favicon e íconos de app
    generados desde el emblema.
  - Negro azulado con **cian eléctrico** como único acento; tipografía Inter grande.
  - Alumno en dos columnas: título, **cuenta regresiva** al cierre y "Cómo funciona" /
    proponer y ranking; sello 印 cian al votar.
  - Cuenta regresiva también en el panel del mentor.
- Durante el rediseño el repo pasó a privado y Vercel bloqueó el despliegue (plan Hobby
  con merge hecho por otra cuenta). Se volvió a **público** y se publicó con **Promote**
  de un Preview.

## Documentación — PR #5

- `README.md` y `docs/01` a `docs/07` (este paquete).

## Pendientes y próximos pasos sugeridos

- **Fase 5:** publicar los enlaces en GHL tras la aprobación del equipo. Si se incrustan en
  iframe, probar en Safari/iPhone.
- **Recuperación de contraseña por correo:** conectar un SMTP propio (por ejemplo,
  Postmark) en Supabase → Authentication → SMTP.
- **Tipos generados:** reemplazar `types/database.ts` por los generados con el CLI de
  Supabase.
- **Posibles mejoras:** límite de votos por alumno, reordenamiento animado del ranking,
  historial de clases pasadas para el admin, exportar temas de una clase.
