-- migrations/0004_fase4_cierre_automatico.sql
-- Fase 4: cierre automático del ciclo a la hora de inicio de la clase.
--   1. ciclos_semanales.reabierto: si un mentor reabre una votación, el cierre
--      automático ya no la toca (la cierra el mentor).
--   2. cerrar_ciclos_vencidos(): cierra los ciclos 'votando' cuya clase ya
--      empezó (fecha_clase + hora_local, America/Guayaquil) y deja abierto el
--      ciclo de la próxima clase de cada cinturón activo.
--   3. pg_cron la ejecuta cada 5 minutos dentro de Supabase.
-- Idempotente: se puede correr más de una vez sin romper nada.

-- 1. Reapertura manual -------------------------------------------------------
alter table ciclos_semanales add column if not exists reabierto boolean not null default false;
grant update (reabierto) on ciclos_semanales to authenticated;

-- 2. Cierre ------------------------------------------------------------------
create or replace function cerrar_ciclos_vencidos() returns integer
language plpgsql security definer set search_path = public as $$
declare
  cerrados integer;
  c record;
begin
  update ciclos_semanales cs
  set estado = 'cerrado', cerrado_en = now()
  from cinturones ci
  where ci.id = cs.cinturon_id
    and cs.estado = 'votando'
    and not cs.reabierto
    and ci.hora_local is not null
    and (cs.fecha_clase + ci.hora_local) at time zone 'America/Guayaquil' <= now();
  get diagnostics cerrados = row_count;

  -- Deja listo el ciclo de la próxima clase (el mismo que abre la vista).
  for c in select slug from cinturones where activo and dia_semana is not null loop
    perform ciclo_actual(c.slug);
  end loop;

  return cerrados;
end $$;

-- Solo la ejecuta el cron (rol postgres), nunca el navegador.
revoke all on function cerrar_ciclos_vencidos() from public, anon, authenticated;

-- 3. Programación --------------------------------------------------------------
create extension if not exists pg_cron;

select cron.schedule(
  'classvote-cerrar-ciclos',
  '*/5 * * * *',
  $$select public.cerrar_ciclos_vencidos()$$
);

-- Cierra ya lo que haya vencido antes de instalar el cron.
select public.cerrar_ciclos_vencidos();
