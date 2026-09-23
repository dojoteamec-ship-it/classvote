# ClassVote · RoninX Academy

Votación de temas en tiempo real para las clases **Mondo** (Q&A) de RoninX Academy.
Cada semana, los alumnos de cada cinturón proponen y votan qué tema quieren ver en su
clase; el mentor llega a la clase con los temas más votados.

- Cada cinturón (Nivel 1 a 6) tiene **su propia URL y su propio ciclo de votación**. Nunca se mezclan.
- El alumno **no necesita cuenta**: vota desde el enlace de su grupo.
- El mentor tiene **cuenta propia** y un panel para gestionar su cinturón.
- La votación **se cierra sola** a la hora de inicio de cada clase.

Producción: **https://classvote-lac.vercel.app**

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres, RLS,
Realtime, Auth, pg_cron) · Vercel.

## Documentación

| # | Documento | Para quién |
|---|---|---|
| 1 | [Reglas de negocio](docs/01-reglas-de-negocio.md): cómo funciona ClassVote y por qué | Todos |
| 2 | [Manual de uso](docs/02-manual-de-uso.md): alumnos, mentores y administrador | Admin y mentores |
| 3 | [Arquitectura](docs/03-arquitectura.md): stack, carpetas, flujos, seguridad y diseño | Programadores |
| 4 | [Base de datos](docs/04-base-de-datos.md): tablas, funciones, permisos y cron | Programadores |
| 5 | [Despliegue y operación](docs/05-despliegue-y-operacion.md): Vercel, Supabase, GitHub y problemas conocidos | Programadores y admin |
| 6 | [Guía de cambios](docs/06-guia-de-cambios.md): cómo hacer los cambios más comunes | Programadores |
| 7 | [Historial](docs/07-historial.md): qué se construyó y en qué orden | Todos |

## Arranque rápido (desarrollo)

Requisitos: Node.js 20 o superior y acceso al proyecto de Supabase.

```bash
cp .env.example .env.local   # completar NEXT_PUBLIC_SUPABASE_ANON_KEY (y la service role si hace falta)
npm install
npm run dev                  # http://localhost:3000
```

Chequeos antes de subir cualquier cambio:

```bash
npm run lint
npm run typecheck
npm run build
```

> **Next.js 16 tiene cambios importantes** respecto a versiones anteriores (por ejemplo,
> `middleware` ahora se llama `proxy`, y `cookies()` y `params` son asíncronos). Antes de
> escribir código nuevo, consulta la guía incluida en `node_modules/next/dist/docs/` (ver
> [AGENTS.md](AGENTS.md)).

## URLs principales

| Uso | URL |
|---|---|
| Votación de alumnos | `https://classvote-lac.vercel.app/votar/<cinturón>` (`amarillo`, `naranja`, `verde`, `azul`, `marron`, `negro`) |
| Registro de mentores | https://classvote-lac.vercel.app/mentor/registro |
| Entrar (mentores) | https://classvote-lac.vercel.app/mentor/entrar |
| Panel de un cinturón | `https://classvote-lac.vercel.app/mentor/<cinturón>` |
| Administración | https://classvote-lac.vercel.app/admin |

La lista completa (incluidos GitHub, Vercel y Supabase) está en
[Despliegue y operación](docs/05-despliegue-y-operacion.md#urls).
