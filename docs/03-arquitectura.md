# 3 · Arquitectura

## Visión general

```
Navegador (alumno / mentor)
   │  HTML renderizado en servidor + componentes de cliente
   ▼
Vercel · Next.js 16 (App Router)
   │  Server Components y Server Actions con la sesión del usuario (cookies)
   │  proxy.ts refresca la sesión en /mentor y /admin
   ▼
Supabase
   ├─ Postgres + RLS  ← toda la autorización real vive aquí
   ├─ Auth            ← cuentas de mentores (correo + contraseña)
   ├─ Realtime        ← cambios de temas y ciclos en vivo al navegador
   └─ pg_cron         ← cierra ciclos vencidos cada 5 minutos
```

**Principio central:** la base de datos es la que decide quién puede hacer qué (Row Level
Security + permisos por columna). La app nunca usa la llave de servicio para operaciones
normales: alumnos y mentores escriben con su propio rol (`anon` o `authenticated`), así que
aunque alguien manipule el navegador, Postgres rechaza lo que no corresponde. La llave de
servicio solo se usa para restablecer contraseñas (API de administración de Auth), siempre
después de comprobar que el usuario es admin.

## Stack

| Pieza | Versión | Notas |
|---|---|---|
| Next.js | 16.3.6 | App Router, Turbopack. `middleware` → `proxy.ts`; `cookies()`, `params` y `searchParams` son `Promise` |
| React | 19.2 | `useActionState`, `useSyncExternalStore`; reglas estrictas de lint (no `setState` síncrono en efectos) |
| TypeScript | 5 | `npm run typecheck` = `next typegen && tsc --noEmit` (genera `PageProps`/`LayoutProps`) |
| Tailwind CSS | 4 | Configuración en CSS (`@theme`, `@utility`) dentro de `app/globals.css`; no hay `tailwind.config` |
| @supabase/ssr | 0.12 | Clientes de navegador y servidor con cookies |
| @supabase/supabase-js | 2.117 | Cliente de administración (service role) |
| Supabase | — | Postgres 15+, RLS, Realtime, Auth, pg_cron |
| Vercel | Hobby | Despliegue automático desde `main` (producción) y ramas (preview) |

## Estructura de carpetas

```
app/
  layout.tsx              Layout raíz: fuentes (Inter), fondo decorativo, metadatos
  globals.css             Sistema de diseño: tokens de color, utilidades (tarjeta, botones, campo…), animaciones
  page.tsx                Portada
  icon.png, apple-icon.png, favicon.ico   Íconos (convención de archivos de Next)
  votar/[slug]/
    page.tsx              Servidor: carga cinturón, abre/lee ciclo (rpc ciclo_actual) y temas
    votacion.tsx          Cliente: proponer, votar, tiempo real, cuenta regresiva
  mentor/
    acciones.ts           Server Actions: entrar, registrarse, salir, cambiar contraseña, acciones del panel
    registro/, entrar/    Pantallas de acceso (usan pantalla-acceso.tsx + formulario-cuenta.tsx)
    page.tsx              Inicio del mentor: sus cinturones (admin: todos)
    cuenta/page.tsx       Mi cuenta (cambiar contraseña)
    [slug]/page.tsx       Servidor: panel del cinturón, selección de clase
    [slug]/panel-ciclo.tsx  Cliente: cifras, tipo de sesión, cerrar/reabrir, ocultar temas, tiempo real
    [slug]/copiar-enlace.tsx
    encabezado.tsx, contenedor.tsx   Barra superior y marco de páginas con sesión
  admin/
    page.tsx              Gestión de mentores
    acciones.ts           Server Actions de admin (estado, rol, cinturones, restablecer contraseña)
    boton-restablecer.tsx Cliente: muestra la contraseña temporal
components/               UI compartida: marca (logo/emblema), fondo, obi (cinturón), rótulos,
                          piezas de la lista de temas, cuenta regresiva
lib/
  auth.ts                 obtenerSesion / requerirMentor / requerirMentorActivo / requerirAdmin
  supabase/client.ts      Cliente de navegador (anon key)
  supabase/server.ts      Cliente de servidor con cookies (server-only)
  supabase/proxy.ts       Refresco de sesión para proxy.ts
  supabase/admin.ts       Cliente con service role (server-only; solo Production tiene la llave)
  supabase/env.ts         Lectura validada de variables públicas
  use-ciclo-en-vivo.ts    Hook de Realtime compartido por alumno y mentor
  fecha.ts                Fechas en hora de Ecuador (formatearClase, hoyEnEcuador, instanteClase)
  cinturones.ts           Color y kanji de cada cinturón (obi)
  temas.ts                Columnas a pedir y etiquetas de tipo de sesión
  fingerprint.ts          Identificador anónimo del navegador
types/database.ts         Tipos de las tablas (escritos a mano)
migrations/               SQL versionado (0001 → 0004); se aplica a mano en Supabase
seed.sql                  Los 7 cinturones con su horario
public/marca/             Logotipo RONIN y emblema del ronin (PNG transparentes)
proxy.ts                  Refresca la sesión en /mentor/* y /admin/*
```

## Rutas

| Ruta | Tipo | Acceso | Qué hace |
|---|---|---|---|
| `/` | Estática | Público | Portada |
| `/votar/[slug]` | Dinámica | Público | Votación del cinturón. `blanco` o un slug inexistente dan 404 |
| `/mentor/registro` | Dinámica | Sin sesión | Crear cuenta (queda pendiente) |
| `/mentor/entrar` | Dinámica | Sin sesión | Iniciar sesión |
| `/mentor` | Dinámica | Con sesión | Cinturones del mentor, o aviso de pendiente/desactivado |
| `/mentor/cuenta` | Dinámica | Con sesión | Cambiar contraseña |
| `/mentor/[slug]` | Dinámica | Mentor activo del cinturón o admin | Panel del cinturón (`?ciclo=<id>` para otra clase) |
| `/admin` | Dinámica | Admin activo | Gestión de mentores |

Las páginas protegidas llaman a `requerirMentor()`, `requerirMentorActivo()` o
`requerirAdmin()` (en `lib/auth.ts`), que redirigen si no corresponde. Aun así, **la
autorización definitiva la hace RLS**: si una página olvidara el chequeo, la base igual no
devolvería ni modificaría datos ajenos.

## Flujos principales

### Alumno vota

1. `app/votar/[slug]/page.tsx` (servidor) lee el cinturón (RLS solo muestra los activos),
   llama a `rpc('ciclo_actual', { p_slug })`, que crea el ciclo de la próxima clase si no
   existe y lo devuelve, y carga los temas visibles.
2. `votacion.tsx` (cliente) obtiene el identificador anónimo (`lib/fingerprint.ts`,
   guardado en `localStorage`) y los temas ya votados en este navegador.
3. **Votar** inserta en `votos` con la clave pública. Un trigger suma 1 a
   `temas.votos_count`. El voto duplicado lo rechaza la restricción
   `unique (tema_id, alumno_fingerprint)` (código `23505`).
4. **Proponer** inserta en `temas` (solo puede escribir `ciclo_id`, `texto`, `alumno_alias`).
5. **Tiempo real:** `useCicloEnVivo` se suscribe a `temas` (filtrado por ciclo) y a
   `ciclos_semanales` (ese ciclo). Los votos llegan como `UPDATE` de `temas.votos_count`,
   así que el navegador **nunca lee la tabla `votos`** y los identificadores no se exponen.
6. Las acciones son **optimistas**: se reflejan al instante y se revierten si la base las
   rechaza.

### Mentor se registra y entra

1. `registrarse` (Server Action) llama a `supabase.auth.signUp` con `nombre` en los metadatos.
2. Un trigger en `auth.users` crea la fila en `mentores` con `estado = 'pendiente'`,
   `rol = 'mentor'`.
3. El admin aprueba (`estado = 'activo'`) y asigna cinturones (`mentor_cinturones`).
4. `entrar` llama a `signInWithPassword`; la sesión queda en cookies y `proxy.ts` la
   refresca en cada navegación de `/mentor` y `/admin`.

### Mentor gestiona su cinturón

`panel-ciclo.tsx` llama a Server Actions (`cambiarTipoSesion`, `cambiarEstadoCiclo`,
`cambiarOculto`) que hacen `update … select('id')` con la sesión del mentor. Si RLS no lo
permite, no se actualiza ninguna fila y se devuelve error; el cambio optimista se revierte.

### Cierre automático

`pg_cron` ejecuta `cerrar_ciclos_vencidos()` cada 5 minutos: cierra los ciclos `votando`
cuya hora de clase ya pasó (salvo los `reabierto`) y crea el ciclo de la próxima clase de
cada cinturón. Ver [Base de datos](04-base-de-datos.md#cierre-automático-pg_cron).

## Seguridad

| Capa | Qué protege |
|---|---|
| **RLS** en todas las tablas | Lectura pública solo de lo necesario; escritura según rol y estado del ciclo |
| **Permisos por columna** | `anon` solo escribe `texto`/`alumno_alias` (temas) y `tema_id`/`alumno_fingerprint` (votos); no puede inflar `votos_count`, editar ni borrar. Mentores solo actualizan `estado`, `tipo_sesion`, `cerrado_en`, `reabierto` (ciclos) y `oculto` (temas) |
| **Funciones `security definer`** | `es_admin()`, `puede_gestionar()`, `ciclo_actual()`, triggers y cron, con `search_path` fijo |
| **Mentor pendiente** | No puede hacer nada hasta ser aprobado; tampoco puede aprobarse a sí mismo |
| **Service role** | Solo en el servidor (`server-only`), solo en Production, solo para restablecer contraseñas tras `requerirAdmin()` |
| **Anon key** | Pública por diseño (va al navegador); la seguridad la da RLS |

Todo esto está probado en un Postgres local con los roles de Supabase simulados (ver
historial de los PR).

## Sistema de diseño

Todo el diseño está en `app/globals.css` y `components/`.

- **Identidad:** RONIN "ronin cibernético". Fondo negro azulado, **un solo acento cian
  eléctrico**, rojo solo para errores. Estructura inspirada en Apple: tipografía grande con
  tracking cerrado, mucho aire, vidrio sobrio y botones tipo píldora.
- **Tokens** (`@theme`): `noche-*` (fondos), `cian-*` (acento), `washi` (texto), `matcha`
  (en vivo), `shu-*` (errores), `ai-400` (barras).
- **Utilidades** (`@utility`): `tarjeta`, `tarjeta-interactiva`, `boton-primario`,
  `boton-secundario`, `campo`, `rotulo`, `titular`, `texto-acento`.
- **Animaciones:** `aparecer`, `latido` (contador), `sello` y `onda` (al votar), `pulso`
  (en vivo), `niebla`, `flotar`. Todo se desactiva con `prefers-reduced-motion`.
- **Componentes:** `Marca`/`Emblema` (logo real en `public/marca/`), `FondoDojo` (ronin
  frente a la luna, halo cian, circuito, niebla, grano), `Obi` (cinturón con su color),
  `Rotulo`, `EstadoVotacion`, `Puesto`/`BarraVotos`/`Contador`, `CuentaRegresiva`.
- **Fuentes:** Inter desde Google Fonts vía `<link>` en el layout. No se usa `next/font`
  porque falla al compilar en entornos sin red.
- **Íconos:** generados desde el emblema del logo (`app/icon.png`, `app/apple-icon.png`,
  `app/favicon.ico`).

## Convenciones de código

- Nombres de dominio y comentarios **en español** (`cinturon`, `ciclo`, `tema`, `votar`…).
- Comentarios solo donde el *por qué* no es obvio.
- Componentes de servidor por defecto; `"use client"` solo donde hay interacción o tiempo real.
- Funciones que usan servidor y cliente van en `lib/` **sin** `"use client"` (una función
  exportada desde un archivo de cliente no puede llamarse desde el servidor).
- Estado del navegador (`localStorage`) se lee con `useSyncExternalStore` para no descuadrar
  la hidratación.
