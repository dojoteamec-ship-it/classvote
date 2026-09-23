-- migrations/0001_init.sql
-- Ya aplicado en Supabase (proyecto cvpvkactwtymvckbpxhm) desde el SQL Editor.
create extension if not exists "pgcrypto";

create type sesion_tipo as enum ('qa', 'practica');
create type ciclo_estado as enum ('votando', 'cerrado');

create table cinturones (
  id text primary key,
  nombre text not null,
  orden smallint not null,
  slug text not null unique,
  dia_semana smallint check (dia_semana between 0 and 6),
  hora_local time,
  activo boolean not null default true
);

create table mentores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null unique,
  auth_user_id uuid unique references auth.users(id)
);

create table mentor_cinturones (
  mentor_id uuid not null references mentores(id) on delete cascade,
  cinturon_id text not null references cinturones(id) on delete cascade,
  primary key (mentor_id, cinturon_id)
);

create table ciclos_semanales (
  id uuid primary key default gen_random_uuid(),
  cinturon_id text not null references cinturones(id),
  fecha_clase date not null,
  estado ciclo_estado not null default 'votando',
  tipo_sesion sesion_tipo,
  cerrado_en timestamptz,
  unique (cinturon_id, fecha_clase)
);

create table temas (
  id uuid primary key default gen_random_uuid(),
  ciclo_id uuid not null references ciclos_semanales(id) on delete cascade,
  texto text not null check (char_length(texto) between 3 and 200),
  alumno_alias text,
  creado_en timestamptz not null default now()
);

create table votos (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null references temas(id) on delete cascade,
  alumno_fingerprint text not null,
  creado_en timestamptz not null default now(),
  unique (tema_id, alumno_fingerprint)
);

create index on ciclos_semanales (cinturon_id, estado);
create index on temas (ciclo_id);
create index on votos (tema_id);

alter table cinturones enable row level security;
alter table ciclos_semanales enable row level security;
alter table temas enable row level security;
alter table votos enable row level security;
alter table mentores enable row level security;
alter table mentor_cinturones enable row level security;

create policy "cinturones: lectura publica" on cinturones for select using (activo);
create policy "ciclos: lectura publica" on ciclos_semanales for select using (true);
create policy "temas: lectura publica" on temas for select using (true);

create policy "temas: insertar mientras vota" on temas for insert
  with check (exists (
    select 1 from ciclos_semanales c
    where c.id = ciclo_id and c.estado = 'votando'
  ));

create policy "votos: insertar mientras vota" on votos for insert
  with check (exists (
    select 1 from temas t join ciclos_semanales c on c.id = t.ciclo_id
    where t.id = tema_id and c.estado = 'votando'
  ));

create policy "ciclos: mentor actualiza su cinturon" on ciclos_semanales for update
  using (exists (
    select 1 from mentor_cinturones mc
    join mentores m on m.id = mc.mentor_id
    where mc.cinturon_id = ciclos_semanales.cinturon_id
      and m.auth_user_id = auth.uid()
  ));
