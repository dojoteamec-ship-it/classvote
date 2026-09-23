-- seed.sql — cinturones con horario fijo (America/Guayaquil). Ya aplicado en Supabase.
insert into cinturones (id, nombre, orden, slug, dia_semana, hora_local, activo) values
  ('nivel_0', 'Blanco — Nivel 0',   0, 'blanco',   null, null,     false),
  ('nivel_1', 'Amarillo — Nivel 1', 1, 'amarillo', 4,    '19:00',  true),
  ('nivel_2', 'Naranja — Nivel 2',  2, 'naranja',  3,    '18:00',  true),
  ('nivel_3', 'Verde — Nivel 3',    3, 'verde',    1,    '18:00',  true),
  ('nivel_4', 'Azul — Nivel 4',     4, 'azul',     3,    '19:00',  true),
  ('nivel_5', 'Marrón — Nivel 5',   5, 'marron',   2,    '19:00',  true),
  ('nivel_6', 'Negro — Nivel 6',    6, 'negro',    0,    '19:00',  true)
on conflict (id) do update set
  nombre = excluded.nombre, orden = excluded.orden, slug = excluded.slug,
  dia_semana = excluded.dia_semana, hora_local = excluded.hora_local, activo = excluded.activo;
