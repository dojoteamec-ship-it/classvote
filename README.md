# ClassVote

Votación de temas en tiempo real para las clases Mondo (Q&A) de RoninX Academy.
Cada cinturón tiene su propia URL y su propio ciclo de votación.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase, desplegado en Vercel.

Repo: `dojoteamec-ship-it/classvote` · Deploy: Vercel (team `dojoteamec-ship-its-projects`, proyecto `classvote`).

## Desarrollo

```bash
cp .env.example .env.local   # completar las llaves
npm install
npm run dev
```

Chequeos: `npm run lint`, `npm run typecheck`, `npm run build`.

## Base de datos

- `migrations/0001_init.sql` — esquema + RLS (ya aplicado en Supabase).
- `seed.sql` — los 7 cinturones con su horario fijo (ya aplicado).
- `migrations/0002_fase2_votacion.sql` — conteo de votos, permisos del alumno,
  `ciclo_actual(slug)` y Realtime. Correr en el SQL Editor de Supabase.
- `migrations/0003_fase3_mentores.sql` — cuentas de mentor (registro propio +
  aprobación del admin), roles `mentor`/`admin`, temas ocultos y permisos del
  panel. Los permisos se concentran en `es_admin()` y `puede_gestionar()`.

## Rutas

- `/votar/[slug]` — vista del alumno por cinturón (`amarillo`, `naranja`, `verde`,
  `azul`, `marron`, `negro`). Abre el ciclo de la próxima clase si no existe.
- `/mentor/registro`, `/mentor/entrar` — cuenta del mentor (queda pendiente
  hasta que un admin la apruebe).
- `/mentor` — cinturones del mentor. `/mentor/[slug]` — panel: temas por votos
  en vivo, tipo de sesión, cerrar/reabrir votación, ocultar temas.
- `/admin` — aprobar/desactivar mentores, asignar cinturones, dar rol admin.

## Primer admin

Regístrate en `/mentor/registro` y luego corre una sola vez en el SQL Editor:

```sql
update mentores set estado = 'activo', rol = 'admin' where email = 'tu-correo@ejemplo.com';
```

## Fases

1. ✅ Esqueleto Next.js + esquema Supabase + Vercel
2. ✅ Vista del alumno: proponer/votar temas, conteo en tiempo real
3. ✅ Panel del mentor (Supabase Auth)
4. ⬜ Cron de apertura/cierre automático del ciclo
5. ⬜ Enlazar `/votar/[slug]` en GHL
