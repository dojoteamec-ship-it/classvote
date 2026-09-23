-- migrations/0003_fase3_mentores.sql
-- Fase 3: cuentas de mentor y panel.
--   1. Cada mentor se registra solo (Supabase Auth). Un trigger crea su fila en
--      mentores como 'pendiente'; el admin la aprueba y le asigna cinturones.
--   2. Roles: 'mentor' y 'admin' (super admin: gestiona mentores y ve todo).
--      Para sumar roles o estados más adelante: agregar el valor al enum y
--      ajustar es_admin() / puede_gestionar(), que concentran los permisos.
--   3. El mentor de un cinturón puede: marcar tipo de sesión, cerrar/reabrir
--      el ciclo y ocultar temas. Los temas ocultos dejan de verse y votarse.
-- Idempotente: se puede correr más de una vez sin romper nada.

-- 1. Estado y rol del mentor -----------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'mentor_estado') then
    create type mentor_estado as enum ('pendiente', 'activo', 'inactivo');
  end if;
  if not exists (select 1 from pg_type where typname = 'mentor_rol') then
    create type mentor_rol as enum ('mentor', 'admin');
  end if;
end $$;

alter table mentores add column if not exists estado mentor_estado not null default 'pendiente';
alter table mentores add column if not exists rol mentor_rol not null default 'mentor';
alter table mentores add column if not exists creado_en timestamptz not null default now();

alter table temas add column if not exists oculto boolean not null default false;

-- 2. Permisos centralizados --------------------------------------------------
-- security definer: leen mentores sin pasar por su RLS (evita recursión).
create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from mentores
    where auth_user_id = auth.uid() and estado = 'activo' and rol = 'admin'
  );
$$;

create or replace function puede_gestionar(p_cinturon_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select es_admin() or exists (
    select 1 from mentores m
    join mentor_cinturones mc on mc.mentor_id = m.id
    where m.auth_user_id = auth.uid()
      and m.estado = 'activo'
      and mc.cinturon_id = p_cinturon_id
  );
$$;

revoke all on function es_admin() from public;
revoke all on function puede_gestionar(text) from public;
grant execute on function es_admin() to anon, authenticated;
grant execute on function puede_gestionar(text) to anon, authenticated;

-- 3. Registro: auth.users -> mentores ('pendiente') ------------------------
create or replace function crear_mentor_desde_auth() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into mentores (nombre, email, auth_user_id)
  values (
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''),
                  split_part(new.email, '@', 1)), 80),
    lower(new.email),
    new.id
  )
  on conflict (email) do update
    set auth_user_id = excluded.auth_user_id
    where mentores.auth_user_id is null;
  return new;
end $$;

drop trigger if exists crear_mentor_desde_auth on auth.users;
create trigger crear_mentor_desde_auth after insert on auth.users
  for each row execute function crear_mentor_desde_auth();

-- 4. RLS: mentores y asignaciones -------------------------------------------
drop policy if exists "mentores: ver propio o admin" on mentores;
create policy "mentores: ver propio o admin" on mentores for select
  using (auth_user_id = auth.uid() or es_admin());

drop policy if exists "mentores: admin actualiza" on mentores;
create policy "mentores: admin actualiza" on mentores for update
  using (es_admin()) with check (es_admin());

revoke insert, update, delete on mentores from anon, authenticated;
grant update (nombre, estado, rol) on mentores to authenticated;

drop policy if exists "mentor_cinturones: ver propias o admin" on mentor_cinturones;
create policy "mentor_cinturones: ver propias o admin" on mentor_cinturones for select
  using (
    es_admin()
    or mentor_id in (select id from mentores where auth_user_id = auth.uid())
  );

drop policy if exists "mentor_cinturones: admin asigna" on mentor_cinturones;
create policy "mentor_cinturones: admin asigna" on mentor_cinturones for insert
  with check (es_admin());

drop policy if exists "mentor_cinturones: admin quita" on mentor_cinturones;
create policy "mentor_cinturones: admin quita" on mentor_cinturones for delete
  using (es_admin());

revoke all on mentor_cinturones from anon;
revoke update on mentor_cinturones from authenticated;

-- 5. RLS: ciclos (tipo de sesión, cerrar/reabrir) ---------------------------
drop policy if exists "ciclos: mentor actualiza su cinturon" on ciclos_semanales;
drop policy if exists "ciclos: gestion del cinturon" on ciclos_semanales;
create policy "ciclos: gestion del cinturon" on ciclos_semanales for update
  using (puede_gestionar(cinturon_id)) with check (puede_gestionar(cinturon_id));

revoke insert, update, delete on ciclos_semanales from anon, authenticated;
grant update (estado, tipo_sesion, cerrado_en) on ciclos_semanales to authenticated;

-- 6. RLS: temas ocultos -------------------------------------------------------
drop policy if exists "temas: lectura publica" on temas;
drop policy if exists "temas: visibles o gestion" on temas;
create policy "temas: visibles o gestion" on temas for select
  using (
    not oculto
    or puede_gestionar((select c.cinturon_id from ciclos_semanales c where c.id = ciclo_id))
  );

drop policy if exists "temas: gestion oculta" on temas;
create policy "temas: gestion oculta" on temas for update
  using (puede_gestionar((select c.cinturon_id from ciclos_semanales c where c.id = ciclo_id)))
  with check (puede_gestionar((select c.cinturon_id from ciclos_semanales c where c.id = ciclo_id)));

grant update (oculto) on temas to authenticated;

drop policy if exists "votos: insertar mientras vota" on votos;
create policy "votos: insertar mientras vota" on votos for insert
  with check (exists (
    select 1 from temas t join ciclos_semanales c on c.id = t.ciclo_id
    where t.id = tema_id and c.estado = 'votando' and not t.oculto
  ));
