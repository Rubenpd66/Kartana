-- v0.1 · Almacenamiento de imágenes (Supabase Storage). docs/arquitectura.md §3.6.
-- Requiere *_modelo_v01.sql (privado.es_dueno_de_texto). Tests: supabase/tests/02_storage_v01.sql.
--
-- Bucket público `imagenes`: las URLs se ven sin sesión (rápido, cacheable por la CDN), pero NO hay política
-- de lectura anónima en storage.objects, así que nadie puede listar carpetas ajenas.
-- Rutas: "<local_id>/logo/<aleatorio>.png" y "<local_id>/platos/<plato_id>/<aleatorio>.webp".
-- 2 MB por archivo; solo webp, png y jpeg (nada de SVG: podría llevar scripts).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes', 'imagenes', true, 2097152, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- Subir: solo en la carpeta de un local propio, en logo/ (un nivel) o platos/<plato>/ (dos niveles), y con
-- extensión de imagen permitida.
create policy imagenes_insert_dueno on storage.objects for insert to authenticated
  with check (
    bucket_id = 'imagenes'
    and privado.es_dueno_de_texto((storage.foldername(name))[1])
    and (
      ((storage.foldername(name))[2] = 'logo' and cardinality(storage.foldername(name)) = 2)
      or ((storage.foldername(name))[2] = 'platos' and cardinality(storage.foldername(name)) = 3)
    )
    and lower(storage.extension(name)) in ('png', 'webp', 'jpg')
  );

-- Ver (listar) solo lo propio.
create policy imagenes_select_dueno on storage.objects for select to authenticated
  using (bucket_id = 'imagenes' and privado.es_dueno_de_texto((storage.foldername(name))[1]));

-- Cambiar: lo propio, y el resultado debe seguir cumpliendo las reglas de subida.
create policy imagenes_update_dueno on storage.objects for update to authenticated
  using (bucket_id = 'imagenes' and privado.es_dueno_de_texto((storage.foldername(name))[1]))
  with check (
    bucket_id = 'imagenes'
    and privado.es_dueno_de_texto((storage.foldername(name))[1])
    and (
      ((storage.foldername(name))[2] = 'logo' and cardinality(storage.foldername(name)) = 2)
      or ((storage.foldername(name))[2] = 'platos' and cardinality(storage.foldername(name)) = 3)
    )
    and lower(storage.extension(name)) in ('png', 'webp', 'jpg')
  );

-- Borrar: lo propio (las mutaciones borran el logo o la foto anteriores).
create policy imagenes_delete_dueno on storage.objects for delete to authenticated
  using (bucket_id = 'imagenes' and privado.es_dueno_de_texto((storage.foldername(name))[1]));
