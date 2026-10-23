-- Tests de estadísticas anónimas y cuota de traducción (v0.2). Se ejecutan DESPUÉS de la migración
-- *_idiomas_estadisticas_v02.sql y SIEMPRE dentro de una transacción que acaba en rollback
-- (ver supabase/tests/README.md). Si algo falla, se lanza 'FALLO: …' y se para todo.
--
-- Personajes:
--   A     11111111-…  dueño de bar-a, SIN publicar (no cuenta visitas)
--   B     22222222-…  dueño de bar-b, publicado con prueba activa
--   anon  visitante sin sesión
--
-- Regla que se prueba: nadie escribe directamente en estadisticas_dia, vistas_plato_dia ni uso_traduccion;
-- solo a través de registrar_estadisticas y consumir_cuota_traduccion, que hacen sus comprobaciones.

-- ---------------------------------------------------------------------------
-- 0. Preparación (como postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_app_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.kartana', 'authenticated', 'authenticated', '{}'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.kartana', 'authenticated', 'authenticated', '{}'),
  ('33333333-3333-4333-8333-333333333333', 'admin@test.kartana', 'authenticated', 'authenticated', '{"rol":"admin"}');

insert into public.locales (id, dueno_id, slug, nombre, publicado) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'bar-a', 'Bar A', false),
  ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'bar-b', 'Bar B', true);
insert into public.secciones (id, local_id, nombre) values
  ('aaaaaaaa-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000001', 'Tapas'),
  ('bbbbbbbb-0000-4000-8000-0000000000a1', 'bbbbbbbb-0000-4000-8000-000000000001', 'Mariscos');
insert into public.platos (id, local_id, seccion_id, nombre, precios) values
  ('aaaaaaaa-0000-4000-8000-0000000000b1', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-0000000000a1',
   'Bravas', '[{"id":"u001","formato":"unico","texto":null,"centimos":500}]'),
  ('bbbbbbbb-0000-4000-8000-0000000000b1', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-0000000000a1',
   'Pulpo', '[{"id":"u001","formato":"unico","texto":null,"centimos":1400}]'),
  ('bbbbbbbb-0000-4000-8000-0000000000b2', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-0000000000a1',
   'Navajas', '[{"id":"u001","formato":"unico","texto":null,"centimos":1600}]');

-- ---------------------------------------------------------------------------
-- 1. Anónimo: ni insertar, ni leer, ni tocar las tablas; sí sumar con la función
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

do $$
declare
  cien uuid[];
begin
  begin
    insert into public.estadisticas_dia (local_id, dia, visitas) values ('bbbbbbbb-0000-4000-8000-000000000001', current_date, 1000);
    raise exception 'FALLO: anónimo puede insertar en estadisticas_dia';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.vistas_plato_dia (plato_id, local_id, dia, vistas)
    values ('bbbbbbbb-0000-4000-8000-0000000000b1', 'bbbbbbbb-0000-4000-8000-000000000001', current_date, 1000);
    raise exception 'FALLO: anónimo puede insertar en vistas_plato_dia';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.uso_traduccion (local_id, dia, caracteres) values ('bbbbbbbb-0000-4000-8000-000000000001', current_date, 0);
    raise exception 'FALLO: anónimo puede insertar en uso_traduccion';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.estadisticas_dia;
    raise exception 'FALLO: anónimo puede leer estadisticas_dia';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.vistas_plato_dia;
    raise exception 'FALLO: anónimo puede leer vistas_plato_dia';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.uso_traduccion;
    raise exception 'FALLO: anónimo puede leer uso_traduccion';
  exception when insufficient_privilege then null;
  end;

  -- visitas: suman en el publicado, no en el sin publicar
  perform public.registrar_estadisticas('bbbbbbbb-0000-4000-8000-000000000001', 'visita', 'en', '{}');
  perform public.registrar_estadisticas('bbbbbbbb-0000-4000-8000-000000000001', 'visita', 'es', null);
  perform public.registrar_estadisticas('aaaaaaaa-0000-4000-8000-000000000001', 'visita', 'es', '{}');
  -- local que no existe, tipo e idioma inválidos: no hacen nada y no dan error
  perform public.registrar_estadisticas('99999999-0000-4000-8000-000000000000', 'visita', 'es', '{}');
  perform public.registrar_estadisticas('bbbbbbbb-0000-4000-8000-000000000001', 'hackeo', 'es', '{}');
  perform public.registrar_estadisticas('bbbbbbbb-0000-4000-8000-000000000001', 'visita', 'xx', '{}');
  perform public.registrar_estadisticas('bbbbbbbb-0000-4000-8000-000000000001', null, 'es', '{}');

  -- vistas: solo cuentan los platos de ese local (el de A se ignora); repetidos cuentan una vez
  perform public.registrar_estadisticas('bbbbbbbb-0000-4000-8000-000000000001', 'vistas', 'es',
    array['bbbbbbbb-0000-4000-8000-0000000000b1', 'bbbbbbbb-0000-4000-8000-0000000000b1',
          'aaaaaaaa-0000-4000-8000-0000000000b1']::uuid[]);
  -- más de 100 platos: nada
  select array_agg(x) into cien from (
    select 'bbbbbbbb-0000-4000-8000-0000000000b2'::uuid as x
    union all select gen_random_uuid() from generate_series(1, 100)
  ) s;
  perform public.registrar_estadisticas('bbbbbbbb-0000-4000-8000-000000000001', 'vistas', 'es', cien);
  -- clic en reseña (v0.3)
  perform public.registrar_estadisticas('bbbbbbbb-0000-4000-8000-000000000001', 'resena', 'es', '{}');

  -- la cuota no la puede gastar un anónimo
  begin
    perform public.consumir_cuota_traduccion('bbbbbbbb-0000-4000-8000-000000000001', 10);
    raise exception 'FALLO: anónimo puede llamar a consumir_cuota_traduccion';
  exception when insufficient_privilege then null;
  end;
  -- ni la limpieza
  begin
    perform privado.limpiar_estadisticas();
    raise exception 'FALLO: anónimo puede llamar a limpiar_estadisticas';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.platos_mas_vistos('bbbbbbbb-0000-4000-8000-000000000001', current_date - 30, current_date + 1);
    raise exception 'FALLO: anónimo puede llamar a platos_mas_vistos';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

do $$
declare
  hoy date := (now() at time zone 'Europe/Madrid')::date;
  e record;
begin
  select * into e from public.estadisticas_dia where local_id = 'bbbbbbbb-0000-4000-8000-000000000001' and dia = hoy;
  if e is null or e.visitas <> 2 or (e.visitas_por_idioma ->> 'en')::int <> 1 or (e.visitas_por_idioma ->> 'es')::int <> 1
     or e.clics_resena <> 1 then
    raise exception 'FALLO: los contadores del local publicado no cuadran: %', row_to_json(e);
  end if;
  if (select count(*) from public.estadisticas_dia) <> 1 then
    raise exception 'FALLO: se han contado visitas en locales sin publicar o inexistentes';
  end if;
  if (select vistas from public.vistas_plato_dia where plato_id = 'bbbbbbbb-0000-4000-8000-0000000000b1' and dia = hoy) <> 1 then
    raise exception 'FALLO: las vistas del plato no suman 1';
  end if;
  if exists (select 1 from public.vistas_plato_dia where plato_id = 'aaaaaaaa-0000-4000-8000-0000000000b1') then
    raise exception 'FALLO: se ha contado la vista de un plato de otro local';
  end if;
  if exists (select 1 from public.vistas_plato_dia where plato_id = 'bbbbbbbb-0000-4000-8000-0000000000b2') then
    raise exception 'FALLO: un lote de más de 100 platos ha contado';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Dueños: leen solo lo suyo, no escriben directamente
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.estadisticas_dia) <> 1 or (select count(*) from public.vistas_plato_dia) <> 1 then
    raise exception 'FALLO: B no ve sus estadísticas';
  end if;
  if not exists (select 1 from public.platos_mas_vistos('bbbbbbbb-0000-4000-8000-000000000001', current_date - 30, current_date + 1)
                 where nombre = 'Pulpo' and vistas = 1) then
    raise exception 'FALLO: platos_mas_vistos no devuelve el plato de B';
  end if;
  begin
    insert into public.estadisticas_dia (local_id, dia, visitas) values ('bbbbbbbb-0000-4000-8000-000000000001', current_date - 1, 1000);
    raise exception 'FALLO: el dueño puede insertar estadísticas a mano';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.estadisticas_dia set visitas = 1000;
    raise exception 'FALLO: el dueño puede inflar sus estadísticas';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.vistas_plato_dia;
    raise exception 'FALLO: el dueño puede borrar vistas';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.uso_traduccion set caracteres = 0;
    raise exception 'FALLO: el dueño puede reiniciar su cuota';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.estadisticas_dia) or exists (select 1 from public.vistas_plato_dia) then
    raise exception 'FALLO: A ve las estadísticas de B';
  end if;
  if exists (select 1 from public.platos_mas_vistos('bbbbbbbb-0000-4000-8000-000000000001', current_date - 30, current_date + 1)) then
    raise exception 'FALLO: A ve los platos más vistos de B';
  end if;
end $$;
reset role;

select set_config('request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"rol":"admin"}}', true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.estadisticas_dia) <> 1 then
    raise exception 'FALLO: el admin no ve las estadísticas';
  end if;
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- 3. Cuota de traducción: 60.000 caracteres/día/local y 450.000/mes en total
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if not public.consumir_cuota_traduccion('bbbbbbbb-0000-4000-8000-000000000001', 59000) then
    raise exception 'FALLO: B no puede gastar 59.000 caracteres';
  end if;
  if not public.consumir_cuota_traduccion('bbbbbbbb-0000-4000-8000-000000000001', 1000) then
    raise exception 'FALLO: B no puede llegar justo a 60.000 caracteres';
  end if;
  if public.consumir_cuota_traduccion('bbbbbbbb-0000-4000-8000-000000000001', 1) then
    raise exception 'FALLO: el carácter 60.001 del día se ha aceptado';
  end if;
  -- la cuota de un local ajeno no se puede gastar
  if public.consumir_cuota_traduccion('aaaaaaaa-0000-4000-8000-000000000001', 1) then
    raise exception 'FALLO: B ha gastado cuota del local de A';
  end if;
  -- valores absurdos
  if public.consumir_cuota_traduccion('bbbbbbbb-0000-4000-8000-000000000001', -5) then
    raise exception 'FALLO: se acepta una cantidad negativa';
  end if;
  if (select caracteres from public.uso_traduccion where local_id = 'bbbbbbbb-0000-4000-8000-000000000001') <> 60000 then
    raise exception 'FALLO: el uso guardado no es 60.000';
  end if;
end $$;
reset role;

-- mensual global: A ya ha gastado 449.999 este mes (escrito como postgres) y B empieza el día a cero
do $$
declare
  hoy date := (now() at time zone 'Europe/Madrid')::date;
begin
  update public.uso_traduccion set caracteres = 0 where local_id = 'bbbbbbbb-0000-4000-8000-000000000001';
  insert into public.uso_traduccion (local_id, dia, caracteres) values ('aaaaaaaa-0000-4000-8000-000000000001', hoy, 449999);
  -- uso del mes anterior: no cuenta para este mes
  insert into public.uso_traduccion (local_id, dia, caracteres)
  values ('aaaaaaaa-0000-4000-8000-000000000001', (date_trunc('month', hoy) - interval '1 day')::date, 400000);
end $$;

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if public.consumir_cuota_traduccion('bbbbbbbb-0000-4000-8000-000000000001', 2) then
    raise exception 'FALLO: se ha pasado de 450.000 caracteres al mes';
  end if;
  if not public.consumir_cuota_traduccion('bbbbbbbb-0000-4000-8000-000000000001', 1) then
    raise exception 'FALLO: no deja llegar justo a 450.000 caracteres al mes';
  end if;
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- 4. Limpieza (> 400 días), borrado en cascada y estructura
-- ---------------------------------------------------------------------------
do $$
declare
  hoy date := (now() at time zone 'Europe/Madrid')::date;
  n integer;
begin
  insert into public.estadisticas_dia (local_id, dia, visitas) values ('bbbbbbbb-0000-4000-8000-000000000001', hoy - 401, 5);
  insert into public.estadisticas_dia (local_id, dia, visitas) values ('bbbbbbbb-0000-4000-8000-000000000001', hoy - 399, 5);
  insert into public.vistas_plato_dia (plato_id, local_id, dia, vistas)
  values ('bbbbbbbb-0000-4000-8000-0000000000b2', 'bbbbbbbb-0000-4000-8000-000000000001', hoy - 401, 5);
  perform privado.limpiar_estadisticas();
  if exists (select 1 from public.estadisticas_dia where dia = hoy - 401)
     or exists (select 1 from public.vistas_plato_dia where dia = hoy - 401) then
    raise exception 'FALLO: limpiar_estadisticas no borra lo de más de 400 días';
  end if;
  if not exists (select 1 from public.estadisticas_dia where dia = hoy - 399) then
    raise exception 'FALLO: limpiar_estadisticas borra lo reciente';
  end if;

  -- los CHECK impiden contadores negativos
  begin
    insert into public.estadisticas_dia (local_id, dia, visitas) values ('bbbbbbbb-0000-4000-8000-000000000001', hoy - 10, -1);
    raise exception 'FALLO: se aceptan visitas negativas';
  exception when check_violation then null;
  end;

  -- borrar un plato borra sus vistas; borrar el local borra todo
  delete from public.platos where id = 'bbbbbbbb-0000-4000-8000-0000000000b1';
  if exists (select 1 from public.vistas_plato_dia where plato_id = 'bbbbbbbb-0000-4000-8000-0000000000b1') then
    raise exception 'FALLO: borrar el plato no borra sus vistas';
  end if;
  delete from public.locales where id = 'bbbbbbbb-0000-4000-8000-000000000001';
  if exists (select 1 from public.estadisticas_dia where local_id = 'bbbbbbbb-0000-4000-8000-000000000001')
     or exists (select 1 from public.uso_traduccion where local_id = 'bbbbbbbb-0000-4000-8000-000000000001') then
    raise exception 'FALLO: borrar el local no borra sus estadísticas ni su uso';
  end if;

  -- RLS activa y sin políticas de escritura en las tablas nuevas
  if exists (select 1 from pg_class c join pg_namespace s on s.oid = c.relnamespace
             where s.nspname = 'public' and c.relname in ('estadisticas_dia', 'vistas_plato_dia', 'uso_traduccion')
               and not c.relrowsecurity) then
    raise exception 'FALLO: una tabla de estadísticas no tiene RLS';
  end if;
  select count(*) into n from pg_policies
   where schemaname = 'public' and tablename in ('estadisticas_dia', 'vistas_plato_dia', 'uso_traduccion') and cmd <> 'SELECT';
  if n <> 0 then
    raise exception 'FALLO: hay % políticas de escritura en las tablas de estadísticas', n;
  end if;
  -- ningún permiso de escritura directo para anon ni authenticated
  if has_table_privilege('anon', 'public.estadisticas_dia', 'insert,update,delete')
     or has_table_privilege('authenticated', 'public.estadisticas_dia', 'insert,update,delete')
     or has_table_privilege('anon', 'public.vistas_plato_dia', 'insert,update,delete')
     or has_table_privilege('authenticated', 'public.vistas_plato_dia', 'insert,update,delete')
     or has_table_privilege('anon', 'public.uso_traduccion', 'insert,update,delete')
     or has_table_privilege('authenticated', 'public.uso_traduccion', 'insert,update,delete') then
    raise exception 'FALLO: anon o authenticated tienen permiso de escritura en las tablas de estadísticas';
  end if;
  -- las RPC públicas son invoker; las _def, definer con search_path fijo
  if exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
             where s.nspname = 'public' and p.prosecdef) then
    raise exception 'FALLO: hay funciones security definer en public';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
             where s.nspname = 'privado' and p.proname in ('registrar_estadisticas_def', 'consumir_cuota_traduccion_def', 'limpiar_estadisticas')
               and (not p.prosecdef or p.proconfig is null)) then
    raise exception 'FALLO: una función _def no es security definer o no fija search_path';
  end if;
end $$;

select 'OK: 04_estadisticas_v02 sin fallos' as resultado;
