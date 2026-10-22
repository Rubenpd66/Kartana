-- Tests de seguridad (RLS, permisos por columna, triggers y CHECK) del modelo v0.1.
-- Se ejecutan DESPUÉS de la migración *_modelo_v01.sql y SIEMPRE dentro de una transacción que acaba
-- en rollback (ver supabase/tests/README.md). Si algo falla, se lanza 'FALLO: …' y se para todo.
--
-- Personajes (usuarios falsos creados aquí mismo):
--   A     11111111-…  dueño con un local sin publicar (bar-a)
--   B     22222222-…  dueño con un local publicado (bar-b)
--   ADMIN 33333333-…  claim app_metadata.rol = admin
--   C     44444444-…  dueño con prueba caducada (bar-c, publicado)
--   anon  visitante sin sesión

-- ---------------------------------------------------------------------------
-- 0. Preparación (como postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_app_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.kartana', 'authenticated', 'authenticated', '{}'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.kartana', 'authenticated', 'authenticated', '{}'),
  ('33333333-3333-4333-8333-333333333333', 'admin@test.kartana', 'authenticated', 'authenticated', '{"rol":"admin"}'),
  ('44444444-4444-4444-8444-444444444444', 'c@test.kartana', 'authenticated', 'authenticated', '{}');

do $$
begin
  -- crear_perfil + backfill: todo usuario de auth.users tiene su perfil (también los que ya existían).
  if exists (select 1 from auth.users u where not exists (select 1 from public.perfiles p where p.id = u.id)) then
    raise exception 'FALLO: hay usuarios sin perfil';
  end if;
  if (select correo from public.perfiles where id = '11111111-1111-4111-8111-111111111111') <> 'a@test.kartana' then
    raise exception 'FALLO: crear_perfil no copia el correo';
  end if;
  -- el cambio de correo se copia al perfil
  update auth.users set email = 'a2@test.kartana' where id = '11111111-1111-4111-8111-111111111111';
  if (select correo from public.perfiles where id = '11111111-1111-4111-8111-111111111111') <> 'a2@test.kartana' then
    raise exception 'FALLO: crear_perfil no sigue el cambio de correo';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Dueño B crea su local: slug reservado rechazado; luego crea bar-b y lo publica
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  begin
    insert into public.locales (dueno_id, slug, nombre) values ('22222222-2222-4222-8222-222222222222', 'panel', 'Reservado');
    raise exception 'FALLO: un usuario ha creado un local con slug reservado';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.locales (dueno_id, slug, nombre) values ('11111111-1111-4111-8111-111111111111', 'bar-de-otro', 'Suplantado');
    raise exception 'FALLO: un usuario ha creado un local a nombre de otro';
  exception when insufficient_privilege then null;
  end;

  insert into public.locales (id, dueno_id, slug, nombre, horarios)
  values ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'bar-b', 'Bar B',
          '[{"dia":1,"abre":"13:00","cierra":"16:00"},{"dia":5,"abre":"20:00","cierra":"02:00"}]');
  update public.locales set publicado = true where id = 'bbbbbbbb-0000-4000-8000-000000000001';

  insert into public.secciones (id, local_id, nombre, orden) values
    ('bbbbbbbb-0000-4000-8000-0000000000a1', 'bbbbbbbb-0000-4000-8000-000000000001', 'Mariscos', 0),
    ('bbbbbbbb-0000-4000-8000-0000000000a2', 'bbbbbbbb-0000-4000-8000-000000000001', 'Oculta', 1);
  update public.secciones set visible = false where id = 'bbbbbbbb-0000-4000-8000-0000000000a2';

  insert into public.platos (id, local_id, seccion_id, nombre, precios, alergenos, alergenos_confirmados, orden) values
    ('bbbbbbbb-0000-4000-8000-0000000000b1', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-0000000000a1',
     'Pulpo a la gallega',
     '[{"id":"pm01","formato":"racion_mediana","texto":null,"centimos":1000},{"id":"pg01","formato":"racion_grande","texto":null,"centimos":1200}]',
     '{moluscos}', true, 0),
    ('bbbbbbbb-0000-4000-8000-0000000000b2', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-0000000000a1',
     'Plato oculto', '[{"id":"u001","formato":"unico","texto":null,"centimos":500}]', '{}', false, 1),
    ('bbbbbbbb-0000-4000-8000-0000000000b3', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-0000000000a2',
     'En sección oculta', '[{"id":"u001","formato":"unico","texto":null,"centimos":null}]', '{}', false, 0);
  update public.platos set visible = false where id = 'bbbbbbbb-0000-4000-8000-0000000000b2';

  insert into public.menus (id, local_id, nombre, precio_centimos, hora_inicio, hora_fin, contenido) values
    ('bbbbbbbb-0000-4000-8000-0000000000c1', 'bbbbbbbb-0000-4000-8000-000000000001', 'Menú del día', 1200, '13:00', '16:00',
     '{"grupos":[{"id":"gr01","titulo":"Primeros","items":[{"id":"it01","nombre":"Lentejas","alergenos":["apio"],"alergenos_confirmados":true}]}]}');

  -- la prueba de 30 días se concede al crear el primer local
  if not exists (select 1 from public.accesos where local_id = 'bbbbbbbb-0000-4000-8000-000000000001'
                 and estado = 'prueba' and vigente_hasta between now() + interval '29 days' and now() + interval '31 days') then
    raise exception 'FALLO: no se ha creado la prueba de 30 días';
  end if;
  if (select prueba_usada_en from public.perfiles where id = '22222222-2222-4222-8222-222222222222') is null then
    raise exception 'FALLO: no se marca prueba_usada_en';
  end if;

  -- el dueño no puede cambiarse el acceso (sin política UPDATE): 0 filas
  update public.accesos set estado = 'cortesia', vigente_hasta = null where local_id = 'bbbbbbbb-0000-4000-8000-000000000001';
  if (select estado from public.accesos where local_id = 'bbbbbbbb-0000-4000-8000-000000000001') <> 'prueba' then
    raise exception 'FALLO: el dueño ha cambiado su acceso';
  end if;
  -- ni insertar ni borrar accesos
  begin
    delete from public.accesos where local_id = 'bbbbbbbb-0000-4000-8000-000000000001';
    raise exception 'FALLO: el dueño ha podido borrar su acceso';
  exception when insufficient_privilege then null;
  end;
  -- ni cambiar el dueño del local (sin permiso de columna)
  begin
    update public.locales set dueno_id = '11111111-1111-4111-8111-111111111111' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
    raise exception 'FALLO: el dueño ha cambiado dueno_id';
  exception when insufficient_privilege then null;
  end;
  -- perfil: solo puede cambiar su nombre
  update public.perfiles set nombre = 'Bea' where id = '22222222-2222-4222-8222-222222222222';
  begin
    update public.perfiles set prueba_usada_en = null where id = '22222222-2222-4222-8222-222222222222';
    raise exception 'FALLO: el dueño ha reiniciado su prueba gratis';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.perfiles set correo = 'x@x.es' where id = '22222222-2222-4222-8222-222222222222';
    raise exception 'FALLO: el dueño ha cambiado su correo a mano';
  exception when insufficient_privilege then null;
  end;
end $$;

-- precios mal formados: los rechaza el CHECK privado.precios_validos
do $$
declare
  malos text[] := array[
    '[]',                                                                                    -- vacío
    '{"id":"u001","formato":"unico","texto":null,"centimos":1}',                               -- no es array
    '[{"formato":"unico","texto":null,"centimos":100}]',                                      -- sin id
    '[{"id":"AB","formato":"unico","texto":null,"centimos":100}]',                            -- id mal formado
    '[{"id":"u001","formato":"kilo","texto":null,"centimos":100}]',                           -- formato desconocido
    '[{"id":"u001","formato":"otro","texto":null,"centimos":100}]',                           -- otro sin texto
    '[{"id":"u001","formato":"otro","texto":"   ","centimos":100}]',                          -- otro con texto en blanco
    '[{"id":"u001","formato":"racion","texto":"grande","centimos":100}]',                     -- texto sin otro
    '[{"id":"u001","formato":"unico","texto":null,"centimos":100},{"id":"r001","formato":"racion","texto":null,"centimos":200}]', -- unico con otra
    '[{"id":"r001","formato":"racion","texto":null,"centimos":100},{"id":"r002","formato":"racion","texto":null,"centimos":200}]', -- formato repetido
    '[{"id":"r001","formato":"otro","texto":"Copa","centimos":100},{"id":"r002","formato":"otro","texto":"copa","centimos":200}]', -- otro repetido
    '[{"id":"r001","formato":"racion","texto":null,"centimos":100},{"id":"r001","formato":"tapa","texto":null,"centimos":200}]',   -- id repetido
    '[{"id":"r001","formato":"racion","texto":null,"centimos":-1}]',                          -- negativo
    '[{"id":"r001","formato":"racion","texto":null,"centimos":12.5}]',                        -- decimales
    '[{"id":"r001","formato":"racion","texto":null,"centimos":100001}]',                      -- más de 1000 €
    '[{"id":"r001","formato":"racion","texto":null,"centimos":"100"}]',                       -- texto en vez de número
    '[{"id":"r001","formato":"racion","texto":null}]',                                        -- sin centimos
    '[{"id":"r001","formato":"racion","texto":null,"centimos":1,"extra":true}]',              -- clave de más
    '[{"id":"a001","formato":"tapa","texto":null,"centimos":1},{"id":"a002","formato":"pincho","texto":null,"centimos":1},{"id":"a003","formato":"media_racion","texto":null,"centimos":1},{"id":"a004","formato":"racion","texto":null,"centimos":1},{"id":"a005","formato":"racion_mediana","texto":null,"centimos":1},{"id":"a006","formato":"racion_grande","texto":null,"centimos":1},{"id":"a007","formato":"unidad","texto":null,"centimos":1}]' -- 7 variantes
  ];
  buenos text[] := array[
    '[{"id":"u001","formato":"unico","texto":null,"centimos":850}]',
    '[{"id":"u001","formato":"unico","texto":null,"centimos":null}]',
    '[{"id":"mr01","formato":"media_racion","texto":null,"centimos":700},{"id":"rc01","formato":"racion","texto":null,"centimos":950}]',
    '[{"id":"md01","formato":"media_docena","texto":null,"centimos":700},{"id":"dc01","formato":"docena","texto":null,"centimos":1400}]',
    '[{"id":"o001","formato":"otro","texto":"Con orujo","centimos":250},{"id":"o002","formato":"otro","texto":"Con ron","centimos":250}]',
    '[{"id":"un01","formato":"unidad","centimos":400}]'
  ];
  p text;
begin
  foreach p in array malos loop
    begin
      insert into public.platos (local_id, seccion_id, nombre, precios)
      values ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-0000000000a1', 'Malo', p::jsonb);
      raise exception 'FALLO: precios mal formados aceptados: %', p;
    exception when check_violation then null;
    end;
  end loop;
  foreach p in array buenos loop
    if not privado.precios_validos(p::jsonb) then
      raise exception 'FALLO: precios válidos rechazados: %', p;
    end if;
  end loop;

  -- horarios y contenido de menú mal formados
  begin
    update public.locales set horarios = '[{"dia":8,"abre":"13:00","cierra":"16:00"}]' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
    raise exception 'FALLO: horario con día 8 aceptado';
  exception when check_violation then null;
  end;
  begin
    update public.locales set horarios = '[{"dia":1,"abre":"8:00","cierra":"16:00"}]' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
    raise exception 'FALLO: horario con hora mal escrita aceptado';
  exception when check_violation then null;
  end;
  begin
    update public.locales set horarios = '[{"dia":1,"abre":"08:00","cierra":"09:00"},{"dia":1,"abre":"10:00","cierra":"11:00"},{"dia":1,"abre":"12:00","cierra":"13:00"},{"dia":1,"abre":"14:00","cierra":"15:00"}]'
    where id = 'bbbbbbbb-0000-4000-8000-000000000001';
    raise exception 'FALLO: 4 franjas en un día aceptadas';
  exception when check_violation then null;
  end;
  begin
    update public.menus set contenido = '{"grupos":[{"id":"gr01","titulo":"","items":[]}]}' where id = 'bbbbbbbb-0000-4000-8000-0000000000c1';
    raise exception 'FALLO: grupo de menú sin título aceptado';
  exception when check_violation then null;
  end;
  begin
    update public.menus set contenido = '{"grupos":[{"id":"gr01","titulo":"A","items":[{"id":"it01","nombre":"X","alergenos":["tomate"],"alergenos_confirmados":true}]}]}'
    where id = 'bbbbbbbb-0000-4000-8000-0000000000c1';
    raise exception 'FALLO: alérgeno desconocido en menú aceptado';
  exception when check_violation then null;
  end;
  begin
    update public.menus set hora_inicio = '17:00' where id = 'bbbbbbbb-0000-4000-8000-0000000000c1';
    raise exception 'FALLO: menú con inicio después del fin aceptado';
  exception when check_violation then null;
  end;
  begin
    update public.platos set alergenos = '{tomate}' where id = 'bbbbbbbb-0000-4000-8000-0000000000b1';
    raise exception 'FALLO: alérgeno desconocido aceptado';
  exception when check_violation then null;
  end;
  begin
    update public.platos set foto_ruta = 'otro/platos/x.webp' where id = 'bbbbbbbb-0000-4000-8000-0000000000b1';
    raise exception 'FALLO: foto fuera de la carpeta del plato aceptada';
  exception when check_violation then null;
  end;
  begin
    update public.locales set color_marca = '#B9461A' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
    raise exception 'FALLO: color en mayúsculas aceptado';
  exception when check_violation then null;
  end;
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- 2. Dueño A: un local sin publicar; segundo local rechazado; no toca nada de B
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  n int;
begin
  insert into public.locales (id, dueno_id, slug, nombre)
  values ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'bar-a', 'Bar A');
  insert into public.secciones (id, local_id, nombre) values ('aaaaaaaa-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000001', 'Tapas');

  -- segundo local del mismo usuario
  begin
    insert into public.locales (dueno_id, slug, nombre) values ('11111111-1111-4111-8111-111111111111', 'bar-a-dos', 'Bar A2');
    raise exception 'FALLO: segundo local del mismo usuario aceptado';
  exception when insufficient_privilege or sqlstate 'KL001' then null;
  end;

  -- slug reservado al cambiarlo
  begin
    update public.locales set slug = 'demo' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
    raise exception 'FALLO: cambio a slug reservado aceptado';
  exception when insufficient_privilege then null;
  end;

  -- slug ocupado por otro local
  begin
    update public.locales set slug = 'bar-b' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
    raise exception 'FALLO: slug de otro local aceptado';
  exception when unique_violation then null;
  end;

  -- A ve el local publicado de B (es público), pero no su sección ni sus platos ocultos, ni su acceso, ni su perfil
  if not exists (select 1 from public.locales where id = 'bbbbbbbb-0000-4000-8000-000000000001') then
    raise exception 'FALLO: A no ve la carta pública de B';
  end if;
  if exists (select 1 from public.secciones where id = 'bbbbbbbb-0000-4000-8000-0000000000a2')
     or exists (select 1 from public.platos where id in ('bbbbbbbb-0000-4000-8000-0000000000b2', 'bbbbbbbb-0000-4000-8000-0000000000b3')) then
    raise exception 'FALLO: A ve lo oculto de B';
  end if;
  if exists (select 1 from public.accesos where local_id = 'bbbbbbbb-0000-4000-8000-000000000001') then
    raise exception 'FALLO: A ve el acceso de B';
  end if;
  if exists (select 1 from public.perfiles where id = '22222222-2222-4222-8222-222222222222') then
    raise exception 'FALLO: A ve el perfil de B';
  end if;

  -- A no cambia ni borra nada de B (0 filas)
  update public.locales set nombre = 'Hackeado' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: A ha cambiado el local de B'; end if;
  delete from public.locales where id = 'bbbbbbbb-0000-4000-8000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: A ha borrado el local de B'; end if;
  update public.platos set agotado = true where local_id = 'bbbbbbbb-0000-4000-8000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: A ha cambiado platos de B'; end if;
  delete from public.platos where local_id = 'bbbbbbbb-0000-4000-8000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: A ha borrado platos de B'; end if;
  update public.secciones set nombre = 'X' where local_id = 'bbbbbbbb-0000-4000-8000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: A ha cambiado secciones de B'; end if;
  delete from public.menus where local_id = 'bbbbbbbb-0000-4000-8000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: A ha borrado menús de B'; end if;

  -- A no inserta en el local de B
  begin
    insert into public.secciones (local_id, nombre) values ('bbbbbbbb-0000-4000-8000-000000000001', 'Intrusa');
    raise exception 'FALLO: A ha creado una sección en el local de B';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.menus (local_id) values ('bbbbbbbb-0000-4000-8000-000000000001');
    raise exception 'FALLO: A ha creado un menú en el local de B';
  exception when insufficient_privilege then null;
  end;

  -- plato con sección de otro local: lo impide la FK compuesta
  begin
    insert into public.platos (local_id, seccion_id, nombre, precios)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-0000000000a1', 'Cruzado',
            '[{"id":"u001","formato":"unico","texto":null,"centimos":100}]');
    raise exception 'FALLO: plato en una sección de otro local aceptado';
  exception when foreign_key_violation then null;
  end;

  -- mover un plato propio a una sección de otro local tampoco
  insert into public.platos (id, local_id, seccion_id, nombre, precios)
  values ('aaaaaaaa-0000-4000-8000-0000000000b1', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1', 'Bravas',
          '[{"id":"u001","formato":"unico","texto":null,"centimos":375}]');
  begin
    update public.platos set seccion_id = 'bbbbbbbb-0000-4000-8000-0000000000a1' where id = 'aaaaaaaa-0000-4000-8000-0000000000b1';
    raise exception 'FALLO: plato movido a una sección de otro local';
  exception when foreign_key_violation then null;
  end;

  -- reordenar: lo propio sí, lo ajeno no (y no cambia nada a medias)
  insert into public.secciones (id, local_id, nombre, orden) values ('aaaaaaaa-0000-4000-8000-0000000000a2', 'aaaaaaaa-0000-4000-8000-000000000001', 'Postres', 5);
  if public.reordenar('secciones', array['aaaaaaaa-0000-4000-8000-0000000000a2', 'aaaaaaaa-0000-4000-8000-0000000000a1']::uuid[]) <> 2 then
    raise exception 'FALLO: reordenar no devuelve las filas cambiadas';
  end if;
  if (select orden from public.secciones where id = 'aaaaaaaa-0000-4000-8000-0000000000a2') <> 0
     or (select orden from public.secciones where id = 'aaaaaaaa-0000-4000-8000-0000000000a1') <> 1 then
    raise exception 'FALLO: reordenar no pone el orden nuevo';
  end if;
  begin
    perform public.reordenar('secciones', array['aaaaaaaa-0000-4000-8000-0000000000a1', 'bbbbbbbb-0000-4000-8000-0000000000a1']::uuid[]);
    raise exception 'FALLO: reordenar ha aceptado ids de otro local';
  exception when insufficient_privilege then null;
  end;
  if (select orden from public.secciones where id = 'aaaaaaaa-0000-4000-8000-0000000000a1') <> 1 then
    raise exception 'FALLO: reordenar fallido dejó cambios a medias';
  end if;
  begin
    perform public.reordenar('locales', array['aaaaaaaa-0000-4000-8000-000000000001']::uuid[]);
    raise exception 'FALLO: reordenar ha aceptado una tabla fuera de la lista';
  exception when invalid_parameter_value then null;
  end;

  -- activar_piloto como no admin: no cambia nada y devuelve vacío
  if exists (select 1 from public.activar_piloto('aaaaaaaa-0000-4000-8000-000000000001')) then
    raise exception 'FALLO: un no admin ha activado un piloto';
  end if;
  if (select estado from public.accesos where local_id = 'aaaaaaaa-0000-4000-8000-000000000001') <> 'prueba' then
    raise exception 'FALLO: activar_piloto de un no admin cambió el acceso';
  end if;
  if exists (select 1 from public.cambiar_estado_acceso('aaaaaaaa-0000-4000-8000-000000000001', 'cortesia')) then
    raise exception 'FALLO: un no admin ha cambiado el estado de acceso';
  end if;

  -- comprobar slug (función que mira también locales sin publicar y slugs anteriores)
  if not public.slug_ocupado('bar-b', null) or public.slug_ocupado('bar-a', 'aaaaaaaa-0000-4000-8000-000000000001')
     or public.slug_ocupado('libre-del-todo', null) then
    raise exception 'FALLO: slug_ocupado no responde bien';
  end if;

  -- aceptaciones legales: la fecha la pone el servidor; no se puede aceptar por otro; no se puede cambiar ni borrar
  begin
    insert into public.aceptaciones_legales (usuario_id, documento, version, aceptada_en)
    values ('11111111-1111-4111-8111-111111111111', 'condiciones', '2026-10-22', '2000-01-01');
    raise exception 'FALLO: el cliente ha fijado aceptada_en';
  exception when insufficient_privilege then null;
  end;
  insert into public.aceptaciones_legales (usuario_id, documento, version) values ('11111111-1111-4111-8111-111111111111', 'condiciones', '2026-10-22');
  if (select aceptada_en from public.aceptaciones_legales where usuario_id = '11111111-1111-4111-8111-111111111111' and documento = 'condiciones') < now() - interval '1 minute' then
    raise exception 'FALLO: aceptada_en no es la del servidor';
  end if;
  begin
    insert into public.aceptaciones_legales (usuario_id, documento, version) values ('22222222-2222-4222-8222-222222222222', 'privacidad', '2026-10-22');
    raise exception 'FALLO: A ha aceptado las condiciones por B';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.aceptaciones_legales set version = '2020-01-01' where usuario_id = '11111111-1111-4111-8111-111111111111';
    raise exception 'FALLO: aceptación modificada';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.aceptaciones_legales where usuario_id = '11111111-1111-4111-8111-111111111111';
    raise exception 'FALLO: aceptación borrada';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.aceptaciones_legales (usuario_id, documento, version) values ('11111111-1111-4111-8111-111111111111', 'cookies', '2026-10-22');
    raise exception 'FALLO: documento desconocido aceptado';
  exception when check_violation then null;
  end;
end $$;

reset role;

-- aceptada_en se fuerza aunque escriba alguien con todos los permisos
do $$
begin
  insert into public.aceptaciones_legales (usuario_id, documento, version, aceptada_en)
  values ('22222222-2222-4222-8222-222222222222', 'privacidad', '2026-10-22', '2000-01-01');
  if (select aceptada_en from public.aceptaciones_legales where usuario_id = '22222222-2222-4222-8222-222222222222') < now() - interval '1 minute' then
    raise exception 'FALLO: forzar_fecha_aceptacion no funciona';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. La prueba gratis no se concede dos veces; C tiene la prueba caducada
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  insert into public.locales (id, dueno_id, slug, nombre)
  values ('cccccccc-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 'bar-c', 'Bar C');
  delete from public.locales where id = 'cccccccc-0000-4000-8000-000000000001';
  insert into public.locales (id, dueno_id, slug, nombre, publicado)
  values ('cccccccc-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'bar-c', 'Bar C', true);
  if (select estado from public.accesos where local_id = 'cccccccc-0000-4000-8000-000000000002') <> 'vencido' then
    raise exception 'FALLO: la prueba gratis se ha concedido dos veces';
  end if;
end $$;
reset role;

-- (como postgres) bar-c pasa a prueba caducada
update public.accesos set estado = 'prueba', vigente_hasta = now() - interval '1 day' where local_id = 'cccccccc-0000-4000-8000-000000000002';

-- ---------------------------------------------------------------------------
-- 4. Anónimo
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

do $$
declare
  n int;
begin
  -- ve el local publicado con acceso, no el sin publicar ni el de prueba caducada
  if not exists (select 1 from public.locales where slug = 'bar-b') then
    raise exception 'FALLO: anónimo no ve un local publicado con acceso';
  end if;
  if exists (select 1 from public.locales where slug = 'bar-a') then
    raise exception 'FALLO: anónimo ve un local sin publicar';
  end if;
  if exists (select 1 from public.locales where slug = 'bar-c') then
    raise exception 'FALLO: anónimo ve un local con la prueba caducada';
  end if;
  -- solo lo visible del local visible
  if (select count(*) from public.secciones where local_id = 'bbbbbbbb-0000-4000-8000-000000000001') <> 1 then
    raise exception 'FALLO: anónimo ve secciones ocultas';
  end if;
  if (select count(*) from public.platos where local_id = 'bbbbbbbb-0000-4000-8000-000000000001') <> 1 then
    raise exception 'FALLO: anónimo ve platos ocultos o de secciones ocultas';
  end if;
  if (select count(*) from public.menus) <> 1 then
    raise exception 'FALLO: anónimo no ve el menú o ve menús de más';
  end if;
  if exists (select 1 from public.secciones where local_id = 'aaaaaaaa-0000-4000-8000-000000000001') then
    raise exception 'FALLO: anónimo ve secciones de un local sin publicar';
  end if;
exception when insufficient_privilege then
  raise exception 'FALLO: anónimo sin permiso para leer columnas públicas: %', sqlerrm;
end $$;

do $$
declare
  sentencia text;
begin
  -- nada privado: ni perfiles, ni accesos, ni aceptaciones (ni siquiera tiene permiso de lectura)
  foreach sentencia in array array['select 1 from public.perfiles', 'select 1 from public.accesos', 'select 1 from public.aceptaciones_legales'] loop
    begin
      execute sentencia;
      raise exception 'FALLO: anónimo puede leer: %', sentencia;
    exception when insufficient_privilege then null;
    end;
  end loop;
  -- no ve dueno_id ni creado_en
  begin
    perform dueno_id from public.locales;
    raise exception 'FALLO: anónimo ve dueno_id';
  exception when insufficient_privilege then null;
  end;
  begin
    perform creado_en from public.platos;
    raise exception 'FALLO: anónimo ve creado_en de platos';
  exception when insufficient_privilege then null;
  end;
  -- no escribe en ninguna tabla
  foreach sentencia in array array[
    $q$insert into public.locales (dueno_id, slug, nombre) values ('22222222-2222-4222-8222-222222222222', 'anonimo', 'X')$q$,
    $q$update public.locales set nombre = 'X' where slug = 'bar-b'$q$,
    $q$delete from public.locales where slug = 'bar-b'$q$,
    $q$insert into public.secciones (local_id, nombre) values ('bbbbbbbb-0000-4000-8000-000000000001', 'X')$q$,
    $q$update public.secciones set nombre = 'X'$q$,
    $q$delete from public.secciones$q$,
    $q$insert into public.platos (local_id, seccion_id, nombre, precios) values ('bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-0000000000a1', 'X', '[{"id":"u001","formato":"unico","texto":null,"centimos":1}]')$q$,
    $q$update public.platos set agotado = true$q$,
    $q$delete from public.platos$q$,
    $q$insert into public.menus (local_id) values ('bbbbbbbb-0000-4000-8000-000000000001')$q$,
    $q$update public.menus set nombre = 'X'$q$,
    $q$delete from public.menus$q$,
    $q$insert into public.accesos (local_id, estado, vigente_hasta) values ('bbbbbbbb-0000-4000-8000-000000000001', 'cortesia', null)$q$,
    $q$update public.accesos set estado = 'cortesia'$q$,
    $q$insert into public.perfiles (id, correo) values (gen_random_uuid(), 'x@x.es')$q$,
    $q$update public.perfiles set nombre = 'X'$q$,
    $q$insert into public.aceptaciones_legales (usuario_id, documento, version) values ('22222222-2222-4222-8222-222222222222', 'condiciones', '2026-10-22')$q$,
    $q$insert into public.slugs_anteriores (slug, local_id) values ('viejo', 'bbbbbbbb-0000-4000-8000-000000000001')$q$,
    $q$delete from public.slugs_anteriores$q$
  ] loop
    begin
      execute sentencia;
      raise exception 'FALLO: anónimo ha podido ejecutar: %', sentencia;
    exception when insufficient_privilege then null;
    end;
  end loop;
  -- ni llamar a las funciones de escritura
  begin
    perform public.activar_piloto('bbbbbbbb-0000-4000-8000-000000000001');
    raise exception 'FALLO: anónimo puede llamar a activar_piloto';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.reordenar('platos', array['bbbbbbbb-0000-4000-8000-0000000000b1']::uuid[]);
    raise exception 'FALLO: anónimo puede llamar a reordenar';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- 5. Cambio de slug: el anterior se guarda y redirige; nadie más lo puede coger
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  update public.locales set slug = 'bar-b-nuevo' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
  if not exists (select 1 from public.slugs_anteriores where slug = 'bar-b' and local_id = 'bbbbbbbb-0000-4000-8000-000000000001') then
    raise exception 'FALLO: no se guarda el slug anterior';
  end if;
end $$;
reset role;

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
begin
  if (select l.slug from public.slugs_anteriores s join public.locales l on l.id = s.local_id where s.slug = 'bar-b') is distinct from 'bar-b-nuevo' then
    raise exception 'FALLO: anónimo no puede resolver el slug anterior';
  end if;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  begin
    update public.locales set slug = 'bar-b' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
    raise exception 'FALLO: A ha cogido el slug anterior de B';
  exception when unique_violation then null;
  end;
  if not public.slug_ocupado('bar-b', 'aaaaaaaa-0000-4000-8000-000000000001') then
    raise exception 'FALLO: slug_ocupado no mira los slugs anteriores';
  end if;
end $$;
reset role;

-- B puede volver a su slug antiguo (se borra de slugs_anteriores)
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  update public.locales set slug = 'bar-b' where id = 'bbbbbbbb-0000-4000-8000-000000000001';
  if exists (select 1 from public.slugs_anteriores where slug = 'bar-b') then
    raise exception 'FALLO: volver al slug antiguo no limpia slugs_anteriores';
  end if;
  if not exists (select 1 from public.slugs_anteriores where slug = 'bar-b-nuevo') then
    raise exception 'FALLO: no se guarda el slug intermedio';
  end if;
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- 6. Admin
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"rol":"admin"}}', true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.locales where id in ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000002')) <> 3 then
    raise exception 'FALLO: el admin no ve todos los locales';
  end if;
  if (select count(*) from public.perfiles where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')) <> 2 then
    raise exception 'FALLO: el admin no ve los correos de los dueños';
  end if;
  if (select count(*) from public.platos where local_id = 'aaaaaaaa-0000-4000-8000-000000000001') <> 1 then
    raise exception 'FALLO: el admin no puede contar los platos';
  end if;
  if not exists (select 1 from public.activar_piloto('cccccccc-0000-4000-8000-000000000002') a
                 where a.estado = 'piloto' and a.vigente_hasta > now() + interval '59 days'
                   and a.actualizado_por = '33333333-3333-4333-8333-333333333333') then
    raise exception 'FALLO: el admin no puede activar el piloto';
  end if;
  if not exists (select 1 from public.cambiar_estado_acceso('aaaaaaaa-0000-4000-8000-000000000001', 'cortesia') a
                 where a.estado = 'cortesia' and a.vigente_hasta is null) then
    raise exception 'FALLO: el admin no puede dar cortesía';
  end if;
  if not exists (select 1 from public.cambiar_estado_acceso('aaaaaaaa-0000-4000-8000-000000000001', 'vencido') a where a.estado = 'vencido') then
    raise exception 'FALLO: el admin no puede vencer un acceso';
  end if;
  begin
    perform public.cambiar_estado_acceso('aaaaaaaa-0000-4000-8000-000000000001', 'suscripcion');
    raise exception 'FALLO: cambiar_estado_acceso acepta estados fuera de la lista';
  exception when invalid_parameter_value then null;
  end;
  -- el admin no edita cartas ajenas
  update public.platos set nombre = 'X' where local_id = 'aaaaaaaa-0000-4000-8000-000000000001';
  if (select nombre from public.platos where id = 'aaaaaaaa-0000-4000-8000-0000000000b1') <> 'Bravas' then
    raise exception 'FALLO: el admin ha editado un plato ajeno';
  end if;
end $$;
reset role;

-- con el piloto, bar-c vuelve a verse
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
begin
  if not exists (select 1 from public.locales where slug = 'bar-c') then
    raise exception 'FALLO: tras activar el piloto la carta no se ve';
  end if;
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- 7. Límites por local (40 secciones) y permisos por columna esperados
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  insert into public.secciones (local_id, nombre)
  select 'aaaaaaaa-0000-4000-8000-000000000001', 'S' || g from generate_series(1, 38) g; -- ya tenía 2: total 40
  begin
    insert into public.secciones (local_id, nombre) values ('aaaaaaaa-0000-4000-8000-000000000001', 'La 41');
    raise exception 'FALLO: se ha pasado del límite de 40 secciones';
  exception when sqlstate 'KL001' then null;
  end;
end $$;
reset role;

do $$
declare
  c text;
begin
  foreach c in array array['id','slug','nombre','descripcion','direccion','telefono','logo_ruta','color_marca','horarios',
                           'idioma_base','idiomas_activos','traducciones','publicado','permitir_indexar','actualizado_en'] loop
    if not has_column_privilege('anon', 'public.locales', c, 'select') then
      raise exception 'FALLO: anónimo no puede leer locales.%', c;
    end if;
  end loop;
  if has_column_privilege('anon', 'public.locales', 'dueno_id', 'select') or has_column_privilege('anon', 'public.locales', 'creado_en', 'select') then
    raise exception 'FALLO: anónimo puede leer columnas privadas de locales';
  end if;
  foreach c in array array['id','local_id','seccion_id','nombre','descripcion','precios','alergenos','trazas','alergenos_confirmados',
                           'etiquetas','foto_ruta','orden','agotado','visible','traducciones','actualizado_en'] loop
    if not has_column_privilege('anon', 'public.platos', c, 'select') then
      raise exception 'FALLO: anónimo no puede leer platos.%', c;
    end if;
  end loop;
  foreach c in array array['slug','nombre','descripcion','direccion','telefono','logo_ruta','color_marca','horarios',
                           'idiomas_activos','traducciones','publicado','permitir_indexar'] loop
    if not has_column_privilege('authenticated', 'public.locales', c, 'update') then
      raise exception 'FALLO: el dueño no puede actualizar locales.%', c;
    end if;
  end loop;
  foreach c in array array['dueno_id','id','idioma_base','creado_en','actualizado_en'] loop
    if has_column_privilege('authenticated', 'public.locales', c, 'update') then
      raise exception 'FALLO: el dueño puede actualizar locales.%', c;
    end if;
  end loop;
  -- RLS activada en todas las tablas de public
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity) then
    raise exception 'FALLO: hay tablas sin RLS';
  end if;
  -- ninguna función security definer fuera de privado (las nuestras)
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.prosecdef) then
    raise exception 'FALLO: hay funciones security definer en public';
  end if;
end $$;

-- borrar la cuenta borra todo en cascada
do $$
begin
  delete from auth.users where id = '22222222-2222-4222-8222-222222222222';
  if exists (select 1 from public.locales where id = 'bbbbbbbb-0000-4000-8000-000000000001')
     or exists (select 1 from public.platos where local_id = 'bbbbbbbb-0000-4000-8000-000000000001')
     or exists (select 1 from public.aceptaciones_legales where usuario_id = '22222222-2222-4222-8222-222222222222') then
    raise exception 'FALLO: borrar la cuenta no borra sus datos';
  end if;
end $$;

select 'OK: 01_rls_v01 sin fallos' as resultado;
