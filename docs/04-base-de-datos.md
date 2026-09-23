# 4 · Base de datos

Supabase (Postgres). Proyecto `cvpvkactwtymvckbpxhm`. El esquema vive en `migrations/` y se
aplica **a mano** en el SQL Editor de Supabase, en orden. Todas las migraciones desde la
0002 son **idempotentes** (se pueden correr más de una vez).

| Migración | Qué agrega |
|---|---|
| `0001_init.sql` | Tablas base, enums, RLS inicial |
| `seed.sql` | Los 7 cinturones con su horario |
| `0002_fase2_votacion.sql` | `votos_count` + trigger, permisos por columna del alumno, `ciclo_actual()`, Realtime |
| `0003_fase3_mentores.sql` | Estado y rol del mentor, registro automático, `es_admin()`, `puede_gestionar()`, temas ocultos, RLS del panel |
| `0004_fase4_cierre_automatico.sql` | `reabierto`, `cerrar_ciclos_vencidos()`, pg_cron cada 5 min |

## Modelo

```
cinturones 1──* ciclos_semanales 1──* temas 1──* votos
     │
     *── mentor_cinturones ──* mentores ──1 auth.users
```

### `cinturones`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | text PK | `nivel_0` … `nivel_6` |
| `nombre` | text | "Amarillo — Nivel 1" |
| `orden` | smallint | Orden de presentación |
| `slug` | text único | Se usa en las URL: `amarillo`, `naranja`, `verde`, `azul`, `marron`, `negro`, `blanco` |
| `dia_semana` | smallint 0–6 | 0 = domingo … 6 = sábado |
| `hora_local` | time | Hora de la clase en America/Guayaquil |
| `activo` | boolean | `false` = fuera de ClassVote (Nivel 0) |

### `ciclos_semanales`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `cinturon_id` | text FK | |
| `fecha_clase` | date | Única junto con `cinturon_id` |
| `estado` | enum `ciclo_estado` | `votando` · `cerrado` |
| `tipo_sesion` | enum `sesion_tipo` | `qa` · `practica` · null (sin definir) |
| `cerrado_en` | timestamptz | Momento del cierre |
| `reabierto` | boolean | `true` si un mentor lo reabrió; el cron ya no lo cierra |

### `temas`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `ciclo_id` | uuid FK (cascade) | |
| `texto` | text | 3–200 caracteres |
| `alumno_alias` | text | Opcional, 1–40 caracteres |
| `votos_count` | integer | Mantenido por trigger; nadie lo escribe directamente |
| `oculto` | boolean | Oculto por un mentor |
| `creado_en` | timestamptz | Desempate del ranking |

### `votos`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tema_id` | uuid FK (cascade) | |
| `alumno_fingerprint` | text | Identificador anónimo del navegador (16–64 caracteres) |
| `creado_en` | timestamptz | |

Restricción `unique (tema_id, alumno_fingerprint)`: un voto por tema por navegador.

### `mentores`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `nombre` | text | Del registro |
| `email` | text único | En minúsculas |
| `auth_user_id` | uuid FK → `auth.users` | |
| `estado` | enum `mentor_estado` | `pendiente` · `activo` · `inactivo` |
| `rol` | enum `mentor_rol` | `mentor` · `admin` |
| `creado_en` | timestamptz | |

### `mentor_cinturones`

Asignación mentor ↔ cinturón (PK compuesta `mentor_id, cinturon_id`).

## Funciones

| Función | Tipo | Quién la ejecuta | Qué hace |
|---|---|---|---|
| `ciclo_actual(p_slug)` | security definer, `setof ciclos_semanales` | `anon`, `authenticated` | Calcula la próxima clase del cinturón (hora de Ecuador), crea el ciclo si no existe y lo devuelve. Nunca lo cierra |
| `es_admin()` | security definer, boolean | todos | ¿El usuario actual es admin activo? |
| `puede_gestionar(p_cinturon_id)` | security definer, boolean | todos | ¿Es admin, o mentor activo asignado a ese cinturón? |
| `sync_votos_count()` | trigger en `votos` | — | Suma o resta en `temas.votos_count` |
| `crear_mentor_desde_auth()` | trigger en `auth.users` | — | Crea la fila en `mentores` como `pendiente` al registrarse |
| `cerrar_ciclos_vencidos()` | security definer, integer | solo `postgres` (cron) | Cierra ciclos vencidos y abre la próxima clase de cada cinturón |

**`es_admin()` y `puede_gestionar()` concentran toda la lógica de permisos.** Para agregar un
rol nuevo (por ejemplo "coordinador"), se agrega el valor al enum `mentor_rol` y se ajustan
esas dos funciones; las políticas no cambian.

## Permisos (RLS y columnas)

| Tabla | Leer | Insertar | Actualizar | Borrar |
|---|---|---|---|---|
| `cinturones` | Todos, solo `activo` | — | — | — |
| `ciclos_semanales` | Todos | Solo vía `ciclo_actual()` y cron | `puede_gestionar(cinturon)`; columnas `estado`, `tipo_sesion`, `cerrado_en`, `reabierto` | — |
| `temas` | Visibles para todos; ocultos solo si `puede_gestionar` | Todos, si el ciclo está `votando`; columnas `ciclo_id`, `texto`, `alumno_alias` | `puede_gestionar`; solo `oculto` | — |
| `votos` | Nadie (el conteo está en `temas`) | Todos, si el ciclo está `votando` y el tema no está oculto; columnas `tema_id`, `alumno_fingerprint` | — | — |
| `mentores` | La fila propia, o todo si `es_admin()` | Solo el trigger de registro | `es_admin()`; columnas `nombre`, `estado`, `rol` | — |
| `mentor_cinturones` | Las propias, o todo si `es_admin()` | `es_admin()` | — | `es_admin()` |

## Tiempo real

Publicación `supabase_realtime` con las tablas `temas` y `ciclos_semanales`. Realtime
respeta RLS: un alumno no recibe eventos de temas ocultos, y un mentor sí.

## Cierre automático (pg_cron)

```sql
-- Programado por la migración 0004
select cron.schedule('classvote-cerrar-ciclos', '*/5 * * * *',
  $$select public.cerrar_ciclos_vencidos()$$);
```

Revisar que esté activo y sus últimas ejecuciones:

```sql
select jobname, schedule, active from cron.job;
select status, return_message, start_time
from cron.job_run_details order by start_time desc limit 10;
```

`return_message` indica cuántas filas se cerraron (`1 row` = la función corrió). Para
pausarlo: `select cron.unschedule('classvote-cerrar-ciclos');` y para reactivarlo, volver
a correr la sección 3 de la migración 0004.

## Consultas útiles

```sql
-- Temas de la próxima clase de un cinturón, por votos
select t.texto, t.alumno_alias, t.votos_count, t.oculto
from temas t join ciclos_semanales c on c.id = t.ciclo_id
where c.id = (select id from ciclo_actual('amarillo'))
order by t.votos_count desc, t.creado_en;

-- Mentores y sus cinturones
select m.nombre, m.email, m.estado, m.rol, string_agg(mc.cinturon_id, ', ') as cinturones
from mentores m left join mentor_cinturones mc on mc.mentor_id = m.id
group by m.id order by m.estado, m.nombre;

-- Hacer admin a alguien (primer admin, o si se pierde el acceso)
update mentores set estado = 'activo', rol = 'admin' where email = 'correo@ejemplo.com';

-- Confirmar a mano el correo de un usuario
update auth.users set email_confirmed_at = now() where email = 'correo@ejemplo.com';

-- Cambiar el horario de un cinturón
update cinturones set dia_semana = 4, hora_local = '20:00' where slug = 'amarillo';
```

## Tipos en el código

`types/database.ts` tiene los tipos escritos a mano. Si cambias el esquema, actualízalos. A
futuro se pueden generar con `supabase gen types typescript --linked > types/database.ts`
una vez que el CLI de Supabase esté enlazado al proyecto.
