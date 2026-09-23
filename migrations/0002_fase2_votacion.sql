-- migrations/0002_fase2_votacion.sql
-- Fase 2: vista del alumno.
--   1. Conteo de votos en temas.votos_count, mantenido por trigger. Así el
--      navegador nunca lee la tabla votos (los fingerprints no se exponen) y
--      Realtime solo necesita escuchar temas.
--   2. El alumno solo puede escribir texto y alias al proponer un tema
--      (no puede inflar votos_count ni cambiar la fecha).
--   3. ciclo_actual(slug): devuelve el ciclo de la próxima clase del cinturón
--      y lo abre si todavía no existe (horario fijo, America/Guayaquil).
--   4. Realtime para temas y ciclos_semanales.
-- Idempotente: se puede correr más de una vez sin romper nada.

-- 1. Conteo de votos --------------------------------------------------------
alter table temas add column if not exists votos_count integer not null default 0;

create or replace function sync_votos_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update temas set votos_count = votos_count + 1 where id = new.tema_id;
  elsif tg_op = 'DELETE' then
    update temas set votos_count = greatest(votos_count - 1, 0) where id = old.tema_id;
  end if;
  return null;
end $$;

drop trigger if exists votos_sync_count on votos;
create trigger votos_sync_count after insert or delete on votos
  for each row execute function sync_votos_count();

update temas t set votos_count = (select count(*) from votos v where v.tema_id = t.id);

create index if not exists temas_ciclo_votos_idx on temas (ciclo_id, votos_count desc, creado_en);

-- 2. Qué puede escribir el alumno ------------------------------------------
alter table temas drop constraint if exists temas_alias_largo;
alter table temas add constraint temas_alias_largo
  check (alumno_alias is null or char_length(alumno_alias) between 1 and 40);

alter table votos drop constraint if exists votos_fingerprint_largo;
alter table votos add constraint votos_fingerprint_largo
  check (char_length(alumno_fingerprint) between 16 and 64);

revoke insert, update, delete on temas from anon, authenticated;
grant insert (ciclo_id, texto, alumno_alias) on temas to anon, authenticated;

revoke insert, update, delete on votos from anon, authenticated;
grant insert (tema_id, alumno_fingerprint) on votos to anon, authenticated;

-- 3. Ciclo de la próxima clase ----------------------------------------------
-- La próxima clase es la siguiente ocurrencia de dia_semana/hora_local en
-- America/Guayaquil. Si hoy es día de clase y ya pasó la hora, es la de la
-- semana siguiente. Solo inserta el ciclo; nunca lo cierra (eso es la Fase 4).
create or replace function ciclo_actual(p_slug text) returns setof ciclos_semanales
language plpgsql security definer set search_path = public as $$
declare
  c cinturones;
  ahora timestamp := now() at time zone 'America/Guayaquil';
  dias int;
  fecha date;
begin
  select * into c from cinturones
  where slug = p_slug and activo and dia_semana is not null and hora_local is not null;
  if not found then
    return;
  end if;

  dias := (c.dia_semana - extract(dow from ahora)::int + 7) % 7;
  fecha := ahora::date + dias;
  if dias = 0 and ahora::time >= c.hora_local then
    fecha := fecha + 7;
  end if;

  insert into ciclos_semanales (cinturon_id, fecha_clase)
  values (c.id, fecha)
  on conflict (cinturon_id, fecha_clase) do nothing;

  return query
    select * from ciclos_semanales where cinturon_id = c.id and fecha_clase = fecha;
end $$;

revoke all on function ciclo_actual(text) from public;
grant execute on function ciclo_actual(text) to anon, authenticated;

-- 4. Realtime ----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'temas') then
    alter publication supabase_realtime add table temas;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'ciclos_semanales') then
    alter publication supabase_realtime add table ciclos_semanales;
  end if;
end $$;
