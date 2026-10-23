-- Tests de las funciones de traducciones (v0.2): guardar_traducciones_auto, guardar_traduccion_manual y
-- descartar_traduccion_manual. Se ejecutan DESPUÉS de la migración *_idiomas_estadisticas_v02.sql y SIEMPRE
-- dentro de una transacción que acaba en rollback (ver supabase/tests/README.md).
-- Si algo falla, se lanza 'FALLO: …' y se para todo.
--
-- Personajes:
--   A     11111111-…  dueño de bar-a (publicado) con una sección, un plato (con variante «otro») y un menú
--   B     22222222-…  dueño de bar-b, intenta tocar las traducciones de A
--   anon  visitante sin sesión
--
-- Regla de oro que se prueba: una traducción «manual» NUNCA la pisa guardar_traducciones_auto.

-- ---------------------------------------------------------------------------
-- 0. Preparación (como postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_app_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.kartana', 'authenticated', 'authenticated', '{}'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.kartana', 'authenticated', 'authenticated', '{}');

insert into public.locales (id, dueno_id, slug, nombre, descripcion, publicado) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'bar-a', 'Bar A', 'Tapas desde 1982', true),
  ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'bar-b', 'Bar B', null, true);
insert into public.secciones (id, local_id, nombre, descripcion) values
  ('aaaaaaaa-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000001', 'Mariscos', 'Del día');
insert into public.platos (id, local_id, seccion_id, nombre, descripcion, precios) values
  ('aaaaaaaa-0000-4000-8000-0000000000b1', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1',
   'Pulpo a la gallega', 'Con cachelos',
   '[{"id":"rc01","formato":"racion","texto":null,"centimos":1400},{"id":"ot01","formato":"otro","texto":"Con orujo","centimos":250}]');
insert into public.menus (id, local_id, nombre, notas, contenido) values
  ('aaaaaaaa-0000-4000-8000-0000000000c1', 'aaaaaaaa-0000-4000-8000-000000000001', 'Menú del día', 'Incluye pan',
   '{"grupos":[{"id":"gr01","titulo":"Primeros","items":[{"id":"it01","nombre":"Lentejas","alergenos":["apio"],"alergenos_confirmados":true}]}]}');

-- ---------------------------------------------------------------------------
-- 1. Dueño A: manual, auto, campos y tablas
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  n integer;
  t jsonb;
begin
  -- 1.1 corrección manual del nombre en inglés
  if not public.guardar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'en', 'nombre',
                                          'Galician octopus', '0123456789abcdef') then
    raise exception 'FALLO: el dueño no puede guardar una traducción manual';
  end if;
  select traducciones into t from public.platos where id = 'aaaaaaaa-0000-4000-8000-0000000000b1';
  if t #>> '{en,nombre,origen}' <> 'manual' or t #>> '{en,nombre,texto}' <> 'Galician octopus'
     or t #>> '{en,nombre,huella}' <> '0123456789abcdef' or (t #>> '{en,nombre,fecha}') is null then
    raise exception 'FALLO: la traducción manual no se guarda con su forma: %', t;
  end if;

  -- 1.2 lote automático: en/nombre (manual -> NO se toca), fr/nombre y en/descripcion (nuevas -> sí)
  n := public.guardar_traducciones_auto('platos', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"en","campo":"nombre","texto":"Octopus Galician style","huella":"0123456789abcdef"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"fr","campo":"nombre","texto":"Poulpe à la galicienne","huella":"0123456789abcdef"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"en","campo":"descripcion","texto":"With potatoes","huella":"aaaaaaaaaaaaaaaa"}
  ]');
  if n <> 2 then
    raise exception 'FALLO: guardar_traducciones_auto debía guardar 2 y guardó %', n;
  end if;
  select traducciones into t from public.platos where id = 'aaaaaaaa-0000-4000-8000-0000000000b1';
  if t #>> '{en,nombre,texto}' <> 'Galician octopus' or t #>> '{en,nombre,origen}' <> 'manual' then
    raise exception 'FALLO: guardar_traducciones_auto ha pisado una traducción manual: %', t;
  end if;
  if t #>> '{fr,nombre,texto}' <> 'Poulpe à la galicienne' or t #>> '{fr,nombre,origen}' <> 'auto'
     or t #>> '{en,descripcion,texto}' <> 'With potatoes' or t #>> '{en,descripcion,origen}' <> 'auto' then
    raise exception 'FALLO: las traducciones automáticas nuevas no se guardan bien: %', t;
  end if;

  -- 1.3 una «auto» se actualiza con otra «auto»
  n := public.guardar_traducciones_auto('platos', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"en","campo":"descripcion","texto":"With boiled potatoes","huella":"bbbbbbbbbbbbbbbb"}
  ]');
  select traducciones into t from public.platos where id = 'aaaaaaaa-0000-4000-8000-0000000000b1';
  if n <> 1 or t #>> '{en,descripcion,texto}' <> 'With boiled potatoes' or t #>> '{en,descripcion,huella}' <> 'bbbbbbbbbbbbbbbb' then
    raise exception 'FALLO: una traducción auto no se actualiza: % %', n, t;
  end if;

  -- 1.4 campos válidos de cada tabla
  n := public.guardar_traducciones_auto('platos', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"de","campo":"precio.ot01.texto","texto":"Mit Tresterschnaps","huella":"cccccccccccccccc"}
  ]');
  if n <> 1 then raise exception 'FALLO: no guarda precio.<id>.texto en platos'; end if;
  n := public.guardar_traducciones_auto('menus', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000c1","idioma":"en","campo":"nombre","texto":"Set menu","huella":"cccccccccccccccc"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000c1","idioma":"en","campo":"notas","texto":"Bread included","huella":"cccccccccccccccc"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000c1","idioma":"en","campo":"grupo.gr01.titulo","texto":"Starters","huella":"cccccccccccccccc"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000c1","idioma":"en","campo":"item.it01.nombre","texto":"Lentils","huella":"cccccccccccccccc"}
  ]');
  if n <> 4 then raise exception 'FALLO: no guarda los campos del menú (guardó %)', n; end if;
  n := public.guardar_traducciones_auto('secciones', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000a1","idioma":"ca","campo":"nombre","texto":"Marisc","huella":"cccccccccccccccc"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000a1","idioma":"ca","campo":"descripcion","texto":"Del dia","huella":"cccccccccccccccc"}
  ]');
  if n <> 2 then raise exception 'FALLO: no guarda los campos de la sección'; end if;
  n := public.guardar_traducciones_auto('locales', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-000000000001","idioma":"eu","campo":"descripcion","texto":"Pintxoak 1982tik","huella":"cccccccccccccccc"}
  ]');
  if n <> 1 then raise exception 'FALLO: no guarda la descripción del local'; end if;
  if (select traducciones #>> '{en,grupo.gr01.titulo,texto}' from public.menus where id = 'aaaaaaaa-0000-4000-8000-0000000000c1') <> 'Starters' then
    raise exception 'FALLO: la clave grupo.<id>.titulo no se guarda como clave plana';
  end if;

  -- 1.5 campos, idiomas, huellas y textos inválidos: no se guarda nada (sin error)
  n := public.guardar_traducciones_auto('platos', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"en","campo":"dueno_id","texto":"x","huella":"cccccccccccccccc"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"en","campo":"notas","texto":"x","huella":"cccccccccccccccc"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"en","campo":"grupo.gr01.titulo","texto":"x","huella":"cccccccccccccccc"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"en","campo":"precio.OT-1.texto","texto":"x","huella":"cccccccccccccccc"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"es","campo":"nombre","texto":"x","huella":"cccccccccccccccc"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"xx","campo":"nombre","texto":"x","huella":"cccccccccccccccc"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"de","campo":"nombre","texto":"x","huella":"NO-ES-HEX"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"de","campo":"nombre","texto":"   ","huella":"cccccccccccccccc"},
    {"fila_id":"no-es-un-uuid","idioma":"de","campo":"nombre","texto":"x","huella":"cccccccccccccccc"},
    {"idioma":"de","campo":"nombre","texto":"x","huella":"cccccccccccccccc"},
    "basura"
  ]');
  if n <> 0 then
    raise exception 'FALLO: guardar_traducciones_auto ha guardado % campos inválidos', n;
  end if;
  n := public.guardar_traducciones_auto('locales', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-000000000001","idioma":"en","campo":"nombre","texto":"x","huella":"cccccccccccccccc"}
  ]');
  if n <> 0 then raise exception 'FALLO: guarda el nombre del local (no es traducible)'; end if;
  select traducciones into t from public.platos where id = 'aaaaaaaa-0000-4000-8000-0000000000b1';
  if t ? 'es' or t ? 'xx' or (t -> 'en') ? 'dueno_id' or (t -> 'en') ? 'notas' or (t -> 'de') ? 'nombre' then
    raise exception 'FALLO: se ha colado un campo inválido: %', t;
  end if;

  -- manual con datos inválidos -> error de parámetro
  begin
    perform public.guardar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'en', 'dueno_id', 'x', '0123456789abcdef');
    raise exception 'FALLO: guardar_traduccion_manual acepta un campo inválido';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.guardar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'es', 'nombre', 'x', '0123456789abcdef');
    raise exception 'FALLO: guardar_traduccion_manual acepta el idioma base';
  exception when invalid_parameter_value then null;
  end;

  -- 1.6 tablas fuera de la lista blanca -> error
  begin
    perform public.guardar_traducciones_auto('perfiles', '[]');
    raise exception 'FALLO: guardar_traducciones_auto acepta una tabla fuera de la lista';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.guardar_traducciones_auto('platos; drop table public.platos; --', '[]');
    raise exception 'FALLO: guardar_traducciones_auto acepta un nombre de tabla inyectado';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.guardar_traduccion_manual('accesos', 'aaaaaaaa-0000-4000-8000-000000000001', 'en', 'nombre', 'x', '0123456789abcdef');
    raise exception 'FALLO: guardar_traduccion_manual acepta una tabla fuera de la lista';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.descartar_traduccion_manual('perfiles', 'aaaaaaaa-0000-4000-8000-000000000001', 'en', 'nombre');
    raise exception 'FALLO: descartar_traduccion_manual acepta una tabla fuera de la lista';
  exception when invalid_parameter_value then null;
  end;
  -- lote que no es una lista -> error
  begin
    perform public.guardar_traducciones_auto('platos', '{"no":"es una lista"}');
    raise exception 'FALLO: guardar_traducciones_auto acepta un lote que no es lista';
  exception when invalid_parameter_value then null;
  end;
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- 2. Dueño B no puede escribir ni descartar traducciones de A
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  n integer;
begin
  n := public.guardar_traducciones_auto('platos', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"gl","campo":"nombre","texto":"Polbo de B","huella":"dddddddddddddddd"},
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"fr","campo":"nombre","texto":"Pirata","huella":"dddddddddddddddd"}
  ]');
  if n <> 0 then
    raise exception 'FALLO: B ha escrito % traducciones automáticas en un plato de A', n;
  end if;
  if public.guardar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'en', 'nombre', 'Pirata', '0123456789abcdef') then
    raise exception 'FALLO: B ha escrito una traducción manual en un plato de A';
  end if;
  if public.descartar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'en', 'nombre') then
    raise exception 'FALLO: B ha descartado una traducción manual de A';
  end if;
  n := public.guardar_traducciones_auto('locales', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-000000000001","idioma":"en","campo":"descripcion","texto":"Pirata","huella":"dddddddddddddddd"}
  ]');
  if n <> 0 then raise exception 'FALLO: B ha traducido la descripción del local de A'; end if;
end $$;
reset role;

do $$
declare
  t jsonb;
begin
  select traducciones into t from public.platos where id = 'aaaaaaaa-0000-4000-8000-0000000000b1';
  if t ? 'gl' or t #>> '{fr,nombre,texto}' <> 'Poulpe à la galicienne' or t #>> '{en,nombre,texto}' <> 'Galician octopus' then
    raise exception 'FALLO: las traducciones de A han cambiado tras los intentos de B: %', t;
  end if;
  if (select traducciones ? 'en' from public.locales where id = 'aaaaaaaa-0000-4000-8000-000000000001') then
    raise exception 'FALLO: B ha tocado las traducciones del local de A';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Anónimo: no puede llamar a ninguna de las tres funciones
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

do $$
begin
  begin
    perform public.guardar_traducciones_auto('platos', '[]');
    raise exception 'FALLO: anónimo puede llamar a guardar_traducciones_auto';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.guardar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'en', 'nombre', 'x', '0123456789abcdef');
    raise exception 'FALLO: anónimo puede llamar a guardar_traduccion_manual';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.descartar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'en', 'nombre');
    raise exception 'FALLO: anónimo puede llamar a descartar_traduccion_manual';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- 4. Dueño A descarta su corrección manual y la automática vuelve a poder escribir
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  n integer;
  t jsonb;
begin
  -- descartar una «auto» no la borra (solo se descartan las manuales)
  if not public.descartar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'fr', 'nombre') then
    raise exception 'FALLO: descartar devuelve false en una fila propia';
  end if;
  if (select traducciones #>> '{fr,nombre,texto}' from public.platos where id = 'aaaaaaaa-0000-4000-8000-0000000000b1') is null then
    raise exception 'FALLO: descartar_traduccion_manual ha borrado una traducción auto';
  end if;

  if not public.descartar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'en', 'nombre') then
    raise exception 'FALLO: A no puede descartar su traducción manual';
  end if;
  select traducciones into t from public.platos where id = 'aaaaaaaa-0000-4000-8000-0000000000b1';
  if (t -> 'en') ? 'nombre' or not ((t -> 'en') ? 'descripcion') then
    raise exception 'FALLO: descartar no quita solo esa entrada: %', t;
  end if;
  n := public.guardar_traducciones_auto('platos', '[
    {"fila_id":"aaaaaaaa-0000-4000-8000-0000000000b1","idioma":"en","campo":"nombre","texto":"Octopus Galician style","huella":"0123456789abcdef"}
  ]');
  if n <> 1 or (select traducciones #>> '{en,nombre,origen}' from public.platos where id = 'aaaaaaaa-0000-4000-8000-0000000000b1') <> 'auto' then
    raise exception 'FALLO: tras descartar, la automática no se guarda';
  end if;

  -- una manual puede sustituir a una auto (y a otra manual)
  if not public.guardar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'en', 'nombre', 'Octopus', '0123456789abcdef')
     or not public.guardar_traduccion_manual('platos', 'aaaaaaaa-0000-4000-8000-0000000000b1', 'en', 'nombre', 'Octopus!', '0123456789abcdef') then
    raise exception 'FALLO: una manual no sustituye a otra traducción';
  end if;

  -- fila inexistente -> false, sin error
  if public.guardar_traduccion_manual('platos', '99999999-0000-4000-8000-000000000000', 'en', 'nombre', 'x', '0123456789abcdef') then
    raise exception 'FALLO: guardar_traduccion_manual devuelve true para una fila que no existe';
  end if;
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- 5. Ninguna de las funciones es security definer (respetan la RLS de quien llama)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.prosecdef
               and p.proname in ('guardar_traducciones_auto', 'guardar_traduccion_manual', 'descartar_traduccion_manual')) then
    raise exception 'FALLO: una función de traducciones es security definer';
  end if;
end $$;

select 'OK: 03_traducciones_v02 sin fallos' as resultado;
