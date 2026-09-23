# 6 · Guía de cambios

Recetas para los cambios más probables. Antes de cualquier cambio:

1. Leer [Arquitectura](03-arquitectura.md) y, si toca datos, [Base de datos](04-base-de-datos.md).
2. Next.js 16 difiere de versiones anteriores: consultar `node_modules/next/dist/docs/`.
3. Al terminar: `npm run lint && npm run typecheck && npm run build`, y publicar por Pull
   Request ([Despliegue](05-despliegue-y-operacion.md#cómo-se-publica-un-cambio)).

## Datos y horarios (sin tocar código)

### Cambiar el día u hora de clase de un cinturón

```sql
update cinturones set dia_semana = 4, hora_local = '20:00' where slug = 'amarillo';
```

`dia_semana`: 0 = domingo, 1 = lunes … 6 = sábado. Aplica desde el **próximo** ciclo que se
cree; si ya existe el de esta semana con la fecha anterior, se puede borrar (si no tiene
temas) o cerrar a mano.

### Activar o desactivar un cinturón

```sql
update cinturones set activo = false where slug = 'verde';
```

Un cinturón inactivo da 404 en `/votar/<slug>` y el cron no le abre ciclos. Para activar el
Nivel 0 (Blanco) hay que darle también `dia_semana` y `hora_local`.

## Reglas de votación

### Limitar a N votos por alumno por ciclo

Hoy un alumno puede votar todos los temas (una vez cada uno). Para limitar:

1. **Base de datos (obligatorio):** agregar a la política `"votos: insertar mientras vota"`
   una condición que cuente los votos del mismo `alumno_fingerprint` en el ciclo, por
   ejemplo con una función `security definer` `votos_en_ciclo(fingerprint, ciclo_id)`.
2. **Interfaz:** en `app/votar/[slug]/votacion.tsx`, deshabilitar **Votar** al llegar al
   límite y mostrar cuántos votos quedan. Manejar el error de RLS (`42501`).

### Permitir quitar un voto

Requiere una política `delete` en `votos` para el mismo fingerprint (el trigger
`sync_votos_count` ya resta en `DELETE`) y un botón en `votacion.tsx`. Nota: el fingerprint
lo envía el navegador, así que cualquiera que conozca un fingerprint podría borrar ese voto;
evaluar el riesgo.

### Cambiar la hora de cierre (por ejemplo, 1 hora antes de la clase)

En `migrations/`, crear `0005_…sql` que redefina `cerrar_ciclos_vencidos()` restando un
intervalo:

```sql
and (cs.fecha_clase + ci.hora_local) at time zone 'America/Guayaquil' - interval '1 hour' <= now()
```

Ajustar también `ciclo_actual()` (cuándo pasa a la semana siguiente) y la cuenta regresiva
(`instanteClase` en `lib/fecha.ts`) para que muestren la misma hora.

## Roles y permisos

### Agregar un rol (por ejemplo, "coordinador" que ve todos los cinturones sin gestionar mentores)

1. Migración: `alter type mentor_rol add value 'coordinador';`
2. Ajustar `puede_gestionar()` para que el coordinador activo devuelva `true`.
3. `types/database.ts`: agregar el valor a `MentorRol`.
4. `app/mentor/page.tsx`: que el coordinador vea todos los cinturones (hoy solo `admin`).
5. `app/admin/page.tsx`: botón para asignar el rol.

La autorización real queda en la base; la interfaz solo decide qué mostrar.

## Interfaz y diseño

### Cambiar colores

Todos los colores están en `@theme` dentro de `app/globals.css`. El acento es la familia
`cian-*`; cambiar esos valores actualiza toda la app. Los colores de cada cinturón (obi)
están en `lib/cinturones.ts`.

### Cambiar el logo o el emblema

Reemplazar `public/marca/ronin-logo.png` (logotipo, PNG blanco transparente) y
`public/marca/ronin-emblema.png` (emblema circular, PNG transparente, 512×512). Los íconos
(`app/icon.png` 512×512, `app/apple-icon.png` 180×180 sin transparencia, `app/favicon.ico`
16/32/48) se regeneran desde el emblema.

### Ajustar el fondo

`components/fondo-dojo.tsx`: opacidad y posición del ronin (`opacity-[0.08]`), halo cian,
patrón de circuito, niebla y grano. Mantenerlo tenue para no competir con el contenido.

### Cambiar textos

Los textos están en español dentro de cada página/componente:

- Alumno: `app/votar/[slug]/page.tsx` y `votacion.tsx` (incluye los 3 pasos de "Cómo funciona").
- Mentor: `app/mentor/**`.
- Etiquetas de tipo de sesión: `lib/temas.ts`.

## Integración con GHL (fase 5)

- **Como enlace o botón:** usar `https://classvote-lac.vercel.app/votar/<cinturón>`
  (también se copia desde el panel con **Copiar enlace**).
- **Incrustado (iframe):** probar en Safari/iPhone. Si el navegador bloquea `localStorage`
  dentro del iframe, `lib/fingerprint.ts` genera un identificador nuevo en cada carga y el
  alumno podría votar de nuevo al recargar. Alternativas: abrir en pestaña nueva, o
  identificar al alumno con un parámetro firmado desde GHL.

## Pruebas locales de la base de datos

Las migraciones se probaron en un Postgres local simulando Supabase:

```sql
-- "shim" mínimo antes de correr las migraciones
create role anon nologin; create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
create publication supabase_realtime;
```

Luego: `0001` → `seed` → `0002` → `0003` → `0004` (sin la sección de pg_cron). Para actuar
como un usuario: `set role authenticated; set request.jwt.claim.sub = '<uuid>';`.

## Revisar el diseño sin datos reales

Crear temporalmente una página (por ejemplo `app/zz-preview/page.tsx`) que renderice los
componentes con datos de ejemplo, correr con variables falsas
(`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=x`), tomar
capturas y **borrarla antes de subir**. Así se detectó, por ejemplo, que llamar desde el
servidor a una función de un archivo `"use client"` rompía el prerender.
