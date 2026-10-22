-- Tests de las políticas de Storage (bucket `imagenes`).
-- Se ejecutan DESPUÉS de *_modelo_v01.sql y *_imagenes_v01.sql, dentro de una transacción con rollback
-- (ver supabase/tests/README.md). Simulan subidas insertando filas en storage.objects con la sesión de cada usuario.

insert into auth.users (id, email, aud, role, raw_app_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.kartana', 'authenticated', 'authenticated', '{}'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.kartana', 'authenticated', 'authenticated', '{}');

-- (como postgres) un local para cada uno
insert into public.locales (id, dueno_id, slug, nombre) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'bar-a', 'Bar A'),
  ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'bar-b', 'Bar B');

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'imagenes' and public and file_size_limit = 2097152
                 and allowed_mime_types @> array['image/webp', 'image/png', 'image/jpeg'] and cardinality(allowed_mime_types) = 3) then
    raise exception 'FALLO: el bucket imagenes no está bien configurado';
  end if;
end $$;

-- B sube su logo (para comprobar luego que A no lo ve ni lo toca)
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;
insert into storage.objects (bucket_id, name) values ('imagenes', 'bbbbbbbb-0000-4000-8000-000000000001/logo/b0b0b0b0b0b0b0b0.png');
reset role;

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  ruta text;
  n int;
begin
  -- en su carpeta: permitido (logo y foto de plato)
  insert into storage.objects (bucket_id, name) values ('imagenes', 'aaaaaaaa-0000-4000-8000-000000000001/logo/a1a1a1a1a1a1a1a1.png');
  insert into storage.objects (bucket_id, name)
  values ('imagenes', 'aaaaaaaa-0000-4000-8000-000000000001/platos/cccccccc-0000-4000-8000-000000000001/a2a2a2a2a2a2a2a2.webp');
  insert into storage.objects (bucket_id, name)
  values ('imagenes', 'aaaaaaaa-0000-4000-8000-000000000001/platos/cccccccc-0000-4000-8000-000000000001/a3a3a3a3a3a3a3a3.jpg');

  -- denegado: carpeta de otro local, svg, carpeta desconocida, estructura rara, carpeta que no es uuid, otro bucket
  foreach ruta in array array[
    'bbbbbbbb-0000-4000-8000-000000000001/logo/intruso.png',
    'aaaaaaaa-0000-4000-8000-000000000001/logo/script.svg',
    'aaaaaaaa-0000-4000-8000-000000000001/logo/sin-extension',
    'aaaaaaaa-0000-4000-8000-000000000001/otra/a.png',
    'aaaaaaaa-0000-4000-8000-000000000001/a.png',
    'aaaaaaaa-0000-4000-8000-000000000001/logo/sub/a.png',
    'aaaaaaaa-0000-4000-8000-000000000001/platos/a.webp',
    'no-es-uuid/logo/a.png'
  ] loop
    begin
      insert into storage.objects (bucket_id, name) values ('imagenes', ruta);
      raise exception 'FALLO: subida permitida en %', ruta;
    exception when insufficient_privilege then null;
    end;
  end loop;
  begin
    insert into storage.objects (bucket_id, name) values ('otro-bucket', 'aaaaaaaa-0000-4000-8000-000000000001/logo/a.png');
    raise exception 'FALLO: subida permitida en otro bucket';
  exception when insufficient_privilege or foreign_key_violation then null;
  end;

  -- ve lo suyo, no lo de B (no puede listar carpetas ajenas)
  if (select count(*) from storage.objects where bucket_id = 'imagenes') <> 3 then
    raise exception 'FALLO: A no ve exactamente sus 3 archivos';
  end if;
  if exists (select 1 from storage.objects where name like 'bbbbbbbb-%') then
    raise exception 'FALLO: A ve archivos de B';
  end if;

  -- no puede mover un archivo suyo a la carpeta de B ni renombrar el de B
  begin
    update storage.objects set name = 'bbbbbbbb-0000-4000-8000-000000000001/logo/movido.png'
    where name = 'aaaaaaaa-0000-4000-8000-000000000001/logo/a1a1a1a1a1a1a1a1.png';
    raise exception 'FALLO: A ha movido un archivo a la carpeta de B';
  exception when insufficient_privilege then null;
  end;
  update storage.objects set name = 'bbbbbbbb-0000-4000-8000-000000000001/logo/otro.png'
  where name = 'bbbbbbbb-0000-4000-8000-000000000001/logo/b0b0b0b0b0b0b0b0.png';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: A ha cambiado un archivo de B'; end if;
end $$;
reset role;

-- anónimo: no lista nada ni sube nada (las imágenes se sirven por la URL pública del bucket)
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'imagenes') then
    raise exception 'FALLO: anónimo puede listar imágenes';
  end if;
  begin
    insert into storage.objects (bucket_id, name) values ('imagenes', 'aaaaaaaa-0000-4000-8000-000000000001/logo/anon.png');
    raise exception 'FALLO: anónimo ha subido una imagen';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Borrado (lo hacen las mutaciones al cambiar o quitar fotos): A borra lo suyo, no lo de B.
-- Va al final y aparte porque algunos entornos piden confirmación para sentencias de borrado.
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  n int;
begin
  delete from storage.objects where name = 'bbbbbbbb-0000-4000-8000-000000000001/logo/b0b0b0b0b0b0b0b0.png';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: A ha borrado un archivo de B'; end if;
  delete from storage.objects where name = 'aaaaaaaa-0000-4000-8000-000000000001/logo/a1a1a1a1a1a1a1a1.png';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FALLO: A no puede borrar su propio logo'; end if;
end $$;
reset role;

select 'OK: 02_storage_v01 sin fallos' as resultado;
