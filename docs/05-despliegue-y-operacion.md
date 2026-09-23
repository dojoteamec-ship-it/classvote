# 5 · Despliegue y operación

## Servicios

| Servicio | Cuenta / proyecto | Para qué |
|---|---|---|
| **GitHub** | `dojoteamec-ship-it/classvote` (público) | Código |
| **Vercel** | Team `dojoteamec-ship-its-projects` (plan Hobby), proyecto `classvote` | Hosting y despliegues |
| **Supabase** | Proyecto `cvpvkactwtymvckbpxhm` | Base de datos, Auth, Realtime, cron |

## URLs

### App

| Uso | URL |
|---|---|
| Producción | https://classvote-lac.vercel.app |
| Votación Amarillo · Nivel 1 | https://classvote-lac.vercel.app/votar/amarillo |
| Votación Naranja · Nivel 2 | https://classvote-lac.vercel.app/votar/naranja |
| Votación Verde · Nivel 3 | https://classvote-lac.vercel.app/votar/verde |
| Votación Azul · Nivel 4 | https://classvote-lac.vercel.app/votar/azul |
| Votación Marrón · Nivel 5 | https://classvote-lac.vercel.app/votar/marron |
| Votación Negro · Nivel 6 | https://classvote-lac.vercel.app/votar/negro |
| Registro de mentores | https://classvote-lac.vercel.app/mentor/registro |
| Entrar | https://classvote-lac.vercel.app/mentor/entrar |
| Panel de un cinturón | `https://classvote-lac.vercel.app/mentor/<cinturón>` |
| Mi cuenta | https://classvote-lac.vercel.app/mentor/cuenta |
| Administración | https://classvote-lac.vercel.app/admin |

### Gestión

| Uso | URL |
|---|---|
| Repositorio | https://github.com/dojoteamec-ship-it/classvote |
| Pull Requests | https://github.com/dojoteamec-ship-it/classvote/pulls |
| Proyecto en Vercel | https://vercel.com/dojoteamec-ship-its-projects/classvote |
| Variables de entorno (Vercel) | https://vercel.com/dojoteamec-ship-its-projects/classvote/settings/environment-variables |
| Proyecto en Supabase | https://supabase.com/dashboard/project/cvpvkactwtymvckbpxhm |
| SQL Editor | https://supabase.com/dashboard/project/cvpvkactwtymvckbpxhm/sql/new |
| Usuarios (Auth) | https://supabase.com/dashboard/project/cvpvkactwtymvckbpxhm/auth/users |
| Proveedores de acceso | https://supabase.com/dashboard/project/cvpvkactwtymvckbpxhm/auth/providers |

## Variables de entorno

Configuradas en Vercel. **Nunca** se suben al repositorio (`.env*` está en `.gitignore`;
`.env.example` es la plantilla sin valores).

| Variable | Tipo en Vercel | Entornos | Uso |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Config | Production, Preview, Development | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Config | Production, Preview, Development | Llave pública (va al navegador; la seguridad la da RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | **Solo Production** | Solo para restablecer contraseñas desde /admin. **Salta RLS: nunca exponerla** |

Las variables con prefijo `NEXT_PUBLIC_` deben ser tipo **Config** (Vercel no permite que
sean "Secret" porque llegan al navegador). Al cambiar una variable hay que hacer
**Redeploy** para que el build la tome.

Si una llave se expone (por ejemplo, pegada en un chat), regenerarla en Supabase → Project
Settings → API Keys y actualizarla en Vercel.

## Configuración de Supabase Auth

En **Authentication → Sign In / Providers**:

- **Allow new users to sign up:** encendido (los mentores se registran solos).
- **Confirm email:** **apagado**. La aprobación del admin reemplaza la confirmación, y el
  servidor de correo gratuito de Supabase no envía a correos externos.
- **Email provider → Enable email provider:** **encendido** (si se apaga, nadie puede
  registrarse ni entrar).
- **Minimum password length:** 8 (coincide con la app).

En **Authentication → URL Configuration**, **Site URL** debe ser
`https://classvote-lac.vercel.app`.

## Cómo se publica un cambio

```
rama de trabajo ──push──▶ Preview en Vercel (URL propia, misma base de datos)
        │
        └── Pull Request a main ──Merge──▶ Producción (classvote-lac.vercel.app)
```

1. Trabajar en una rama; cada push genera un **Preview** en Vercel (sirve para revisar
   diseño y funcionalidad antes de publicar).
2. Correr `npm run lint`, `npm run typecheck` y `npm run build` antes de subir.
3. Abrir un Pull Request hacia `main`. Si el cambio incluye una migración SQL, **correrla en
   Supabase antes del merge** (el PR debe decirlo en "Antes de hacer Merge").
4. Hacer **Merge con la cuenta `dojoteamec-ship-it`** (ver problemas conocidos).
5. Vercel despliega `main` a producción en 1–2 minutos.

**Importante:** los Preview usan **la misma base de datos** que producción. Lo que se vote
o proponga en un Preview aparece en producción; usar datos de prueba con cuidado y
ocultarlos después.

### Aplicar una migración

1. Abrir el archivo en GitHub → **Copy raw file**.
2. Supabase → **SQL Editor** → New query → pegar → **Run**.
3. Verificar con las consultas del final de la migración o de
   [Base de datos](04-base-de-datos.md#consultas-útiles).

## Problemas conocidos (y cómo se resolvieron)

| Síntoma | Causa | Solución |
|---|---|---|
| **Deployment "Blocked"** en Vercel ("the commit author did not have contributing access") | Plan Hobby: con repo **privado**, Vercel solo despliega commits cuyo autor es el dueño de la cuenta | El repo es **público**. Hacer los merges con `dojoteamec-ship-it`. Si aun así se bloquea, **Promote** un Preview ya listo del mismo código |
| El repo no aparece para conectar en Vercel | El repo estaba en otra cuenta de GitHub (`SantiJimenezIA`) | Se transfirió a `dojoteamec-ship-it` |
| "No se pudo crear la cuenta" al registrarse | Proveedor Email apagado en Supabase | Encender **Enable email provider** |
| "Revisa tu correo para confirmar la cuenta" y luego no puede entrar | **Confirm email** encendido | Apagarlo. Para cuentas ya creadas: `update auth.users set email_confirmed_at = now() where email = '…';` o **Restablecer contraseña** desde /admin (también confirma el correo) |
| "Restablecer contraseña" dice "No disponible en este entorno" | Falta `SUPABASE_SERVICE_ROLE_KEY` (solo existe en Production) | Usarlo en producción, o agregar la variable al entorno |
| La página del alumno dice "La votación no está disponible" | Falta una migración o Supabase no responde | Verificar migraciones 0002–0004 y el estado de Supabase |
| Una votación reabierta no se cierra sola | Comportamiento esperado (`reabierto = true`) | La cierra el mentor desde el panel |
| El favicon viejo sigue apareciendo | Caché del navegador | Recarga forzada (Cmd/Ctrl + Shift + R) |
| El build falla con `next/font/google` en entornos sin red | `next/font` descarga fuentes al compilar | No usar `next/font`; las fuentes se cargan con `<link>` en `app/layout.tsx` |

## Monitoreo básico

- **Vercel → Deployments / Logs:** errores de servidor (las Server Actions registran el
  código de error de Supabase con `console.error`).
- **Supabase → Logs → Auth:** errores de registro y login.
- **Cron:** `select … from cron.job_run_details …` (ver [Base de datos](04-base-de-datos.md#cierre-automático-pg_cron)).

## Respaldo

Supabase hace respaldos diarios en su plan. El esquema completo se puede reconstruir desde
cero con `migrations/0001` → `0004` + `seed.sql`, en ese orden.
