-- v0.1 · Modelo de datos de Kartana: perfiles, aceptaciones legales, locales, slugs anteriores, accesos,
-- secciones, platos y menús. Fuente de verdad: docs/arquitectura.md §3.
--
-- Reglas que sigue este archivo:
-- - RLS activada en cada tabla y una política por operación y perfil (anon / dueño / admin).
-- - Permisos explícitos: se revoca todo a anon y authenticated y se concede lo justo (por columna donde toca).
--   OJO: cada columna nueva en estas tablas necesita su GRANT.
-- - Funciones security definer solo en el esquema privado, con search_path vacío y nombres calificados.
-- - Errores propios: SQLSTATE 'KL001' = límite alcanzado; '23505' = slug ocupado.
-- - Tests: supabase/tests/01_rls_v01.sql.

-- ===========================================================================
-- 1. Funciones de validación (immutable, sin acceso a tablas)
-- ===========================================================================

create or replace function privado.es_slug_reservado(p text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  -- Igual que SLUGS_RESERVADOS en src/lib/dominio/slugs.ts.
  select p = any (array[
    'admin','api','app','auth','ayuda','blog','c','carta','cartas','contacto','demo','ejemplo','entrar',
    'kartana','legal','login','panel','precios','privacidad','r','registro','salir','soporte','static','www',
    'es','en','fr','de','ca','eu','gl','_next'
  ]);
$$;

create or replace function privado.precios_validos(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
-- Variantes de venta de un plato: array de 1 a 6 objetos {id, formato, texto, centimos}.
-- Mismas reglas que esquemaPrecios (src/lib/validacion/comun.ts).
declare
  v jsonb;
  n integer;
  ids text[] := '{}';
  claves text[] := '{}';
  clave text;
  centimos numeric;
begin
  if p is null or jsonb_typeof(p) <> 'array' then
    return false;
  end if;
  n := jsonb_array_length(p);
  if n < 1 or n > 6 then
    return false;
  end if;
  for v in select e from jsonb_array_elements(p) as t(e) loop
    if jsonb_typeof(v) <> 'object' then
      return false;
    end if;
    if exists (select 1 from jsonb_object_keys(v) as k(k) where k not in ('id', 'formato', 'texto', 'centimos')) then
      return false;
    end if;
    -- id corto, estable y único dentro del plato
    if jsonb_typeof(v -> 'id') is distinct from 'string' or (v ->> 'id') !~ '^[a-z0-9]{4,12}$' or (v ->> 'id') = any (ids) then
      return false;
    end if;
    ids := ids || (v ->> 'id');
    -- formato de la lista cerrada
    if jsonb_typeof(v -> 'formato') is distinct from 'string' or not ((v ->> 'formato') = any (array[
      'unico','tapa','pincho','media_racion','racion','racion_mediana','racion_grande','unidad',
      'media_docena','docena','copa','botella','jarra','pequeno','mediano','grande','otro'
    ])) then
      return false;
    end if;
    if (v ->> 'formato') = 'unico' and n > 1 then
      return false;
    end if;
    -- texto: obligatorio (1-30) solo con "otro"; null o ausente en los demás
    if (v ->> 'formato') = 'otro' then
      if jsonb_typeof(v -> 'texto') is distinct from 'string'
         or char_length(btrim(v ->> 'texto')) < 1 or char_length(v ->> 'texto') > 30 then
        return false;
      end if;
      clave := 'otro:' || lower(btrim(v ->> 'texto'));
    else
      if (v ? 'texto') and jsonb_typeof(v -> 'texto') <> 'null' then
        return false;
      end if;
      clave := v ->> 'formato';
    end if;
    -- formatos sin repetir (salvo "otro" con textos distintos)
    if clave = any (claves) then
      return false;
    end if;
    claves := claves || clave;
    -- centimos: entero 0..100000 o null («según mercado»); la clave es obligatoria
    if not (v ? 'centimos') then
      return false;
    end if;
    if jsonb_typeof(v -> 'centimos') = 'number' then
      centimos := (v ->> 'centimos')::numeric;
      if centimos <> trunc(centimos) or centimos < 0 or centimos > 100000 then
        return false;
      end if;
    elsif jsonb_typeof(v -> 'centimos') <> 'null' then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function privado.horarios_validos(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
-- Array de hasta 21 franjas {dia 1..7, abre "HH:MM", cierra "HH:MM"}, como mucho 3 por día.
declare
  v jsonb;
  por_dia integer[] := array[0, 0, 0, 0, 0, 0, 0];
  dia integer;
begin
  if p is null or jsonb_typeof(p) <> 'array' or jsonb_array_length(p) > 21 then
    return false;
  end if;
  for v in select e from jsonb_array_elements(p) as t(e) loop
    if jsonb_typeof(v) <> 'object'
       or exists (select 1 from jsonb_object_keys(v) as k(k) where k not in ('dia', 'abre', 'cierra'))
       or jsonb_typeof(v -> 'dia') is distinct from 'number'
       or (v ->> 'dia') !~ '^[1-7]$'
       or jsonb_typeof(v -> 'abre') is distinct from 'string'
       or jsonb_typeof(v -> 'cierra') is distinct from 'string'
       or (v ->> 'abre') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or (v ->> 'cierra') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
      return false;
    end if;
    dia := (v ->> 'dia')::integer;
    por_dia[dia] := por_dia[dia] + 1;
    if por_dia[dia] > 3 then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function privado.menu_valido(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
-- {"grupos": [≤ 6 × {id, titulo 1-40, items: [≤ 12 × {id, nombre 1-80, alergenos[], alergenos_confirmados}]}]}
-- Ids ^[a-z0-9]{4,12}$ sin repetir en todo el menú (son la clave de las traducciones).
declare
  g jsonb;
  i jsonb;
  ids_grupos text[] := '{}';
  ids_items text[] := '{}';
begin
  if p is null or jsonb_typeof(p) <> 'object'
     or exists (select 1 from jsonb_object_keys(p) as k(k) where k <> 'grupos')
     or jsonb_typeof(p -> 'grupos') is distinct from 'array'
     or jsonb_array_length(p -> 'grupos') > 6 then
    return false;
  end if;
  for g in select e from jsonb_array_elements(p -> 'grupos') as t(e) loop
    if jsonb_typeof(g) <> 'object'
       or exists (select 1 from jsonb_object_keys(g) as k(k) where k not in ('id', 'titulo', 'items'))
       or jsonb_typeof(g -> 'id') is distinct from 'string'
       or (g ->> 'id') !~ '^[a-z0-9]{4,12}$'
       or (g ->> 'id') = any (ids_grupos)
       or jsonb_typeof(g -> 'titulo') is distinct from 'string'
       or char_length(btrim(g ->> 'titulo')) < 1 or char_length(g ->> 'titulo') > 40
       or jsonb_typeof(g -> 'items') is distinct from 'array'
       or jsonb_array_length(g -> 'items') > 12 then
      return false;
    end if;
    ids_grupos := ids_grupos || (g ->> 'id');
    for i in select e from jsonb_array_elements(g -> 'items') as t(e) loop
      if jsonb_typeof(i) <> 'object'
         or exists (select 1 from jsonb_object_keys(i) as k(k) where k not in ('id', 'nombre', 'alergenos', 'alergenos_confirmados'))
         or jsonb_typeof(i -> 'id') is distinct from 'string'
         or (i ->> 'id') !~ '^[a-z0-9]{4,12}$'
         or (i ->> 'id') = any (ids_items)
         or jsonb_typeof(i -> 'nombre') is distinct from 'string'
         or char_length(btrim(i ->> 'nombre')) < 1 or char_length(i ->> 'nombre') > 80
         or jsonb_typeof(i -> 'alergenos_confirmados') is distinct from 'boolean'
         or jsonb_typeof(i -> 'alergenos') is distinct from 'array'
         or jsonb_array_length(i -> 'alergenos') > 14
         or exists (
           select 1 from jsonb_array_elements(i -> 'alergenos') as a(a)
           where jsonb_typeof(a) <> 'string' or not ((a #>> '{}') = any (array[
             'gluten','crustaceos','huevos','pescado','cacahuetes','soja','lacteos','frutos_cascara',
             'apio','mostaza','sesamo','sulfitos','altramuces','moluscos'
           ]))
         ) then
        return false;
      end if;
      ids_items := ids_items || (i ->> 'id');
    end loop;
  end loop;
  return true;
end;
$$;

-- ===========================================================================
-- 2. Tablas
-- ===========================================================================

-- perfiles: un dueño (1:1 con auth.users)
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  correo text not null default '' check (char_length(correo) <= 320),
  nombre text check (char_length(nombre) between 1 and 80),
  prueba_usada_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- aceptaciones_legales: historial inalterable
create table if not exists public.aceptaciones_legales (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  documento text not null check (documento in ('condiciones', 'privacidad')),
  version text not null check (version ~ '^\d{4}-\d{2}-\d{2}$'),
  aceptada_en timestamptz not null default now(),
  unique (usuario_id, documento, version)
);

-- locales: un bar o restaurante
create table if not exists public.locales (
  id uuid primary key default gen_random_uuid(),
  dueno_id uuid not null references public.perfiles (id) on delete cascade,
  slug text not null unique check (char_length(slug) between 3 and 40 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre text not null check (char_length(nombre) between 1 and 80),
  descripcion text check (char_length(descripcion) <= 300),
  direccion text check (char_length(direccion) <= 200),
  telefono text check (char_length(telefono) <= 30),
  logo_ruta text check (char_length(logo_ruta) <= 300 and starts_with(logo_ruta, id::text || '/logo/')),
  color_marca text not null default '#b9461a' check (color_marca ~ '^#[0-9a-f]{6}$'),
  horarios jsonb not null default '[]' check (privado.horarios_validos(horarios)),
  idioma_base text not null default 'es' check (idioma_base = 'es'),
  idiomas_activos text[] not null default '{es}'
    check (idiomas_activos <@ array['es','en','fr','de','ca','eu','gl'] and 'es' = any (idiomas_activos)),
  traducciones jsonb not null default '{}' check (jsonb_typeof(traducciones) = 'object'),
  publicado boolean not null default false,
  permitir_indexar boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists locales_dueno_id_idx on public.locales (dueno_id);

-- slugs_anteriores: los QR viejos siguen funcionando si el dueño cambia la dirección
create table if not exists public.slugs_anteriores (
  slug text primary key check (char_length(slug) between 3 and 40 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  local_id uuid not null references public.locales (id) on delete cascade,
  creado_en timestamptz not null default now()
);
create index if not exists slugs_anteriores_local_id_idx on public.slugs_anteriores (local_id);

-- accesos: estado de acceso de cada local (1:1)
create table if not exists public.accesos (
  local_id uuid primary key references public.locales (id) on delete cascade,
  estado text not null check (estado in ('prueba', 'piloto', 'cortesia', 'suscripcion', 'vencido')),
  plan text not null default 'carta_resenas' check (plan in ('carta', 'carta_resenas')),
  vigente_hasta timestamptz,
  notas text check (char_length(notas) <= 500),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references public.perfiles (id) on delete set null,
  check (vigente_hasta is not null or estado in ('cortesia', 'suscripcion'))
);
create index if not exists accesos_actualizado_por_idx on public.accesos (actualizado_por);

-- secciones
create table if not exists public.secciones (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 60),
  descripcion text check (char_length(descripcion) <= 200),
  orden integer not null default 0 check (orden >= 0),
  visible boolean not null default true,
  traducciones jsonb not null default '{}' check (jsonb_typeof(traducciones) = 'object'),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (id, local_id)
);
create index if not exists secciones_local_orden_idx on public.secciones (local_id, orden);

-- platos
create table if not exists public.platos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id) on delete cascade,
  seccion_id uuid not null,
  nombre text not null check (char_length(nombre) between 1 and 80),
  descripcion text check (char_length(descripcion) <= 300),
  precios jsonb not null check (privado.precios_validos(precios)),
  alergenos text[] not null default '{}' check (alergenos <@ array[
    'gluten','crustaceos','huevos','pescado','cacahuetes','soja','lacteos','frutos_cascara',
    'apio','mostaza','sesamo','sulfitos','altramuces','moluscos']),
  trazas text[] not null default '{}' check (trazas <@ array[
    'gluten','crustaceos','huevos','pescado','cacahuetes','soja','lacteos','frutos_cascara',
    'apio','mostaza','sesamo','sulfitos','altramuces','moluscos']),
  alergenos_confirmados boolean not null default false,
  etiquetas text[] not null default '{}' check (etiquetas <@ array[
    'vegano','vegetariano','sin_gluten','sin_lactosa','picante','casero','recomendado','nuevo']),
  foto_ruta text check (char_length(foto_ruta) <= 300
    and starts_with(foto_ruta, local_id::text || '/platos/' || id::text || '/')),
  orden integer not null default 0 check (orden >= 0),
  agotado boolean not null default false,
  visible boolean not null default true,
  traducciones jsonb not null default '{}' check (jsonb_typeof(traducciones) = 'object'),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  -- un plato nunca puede quedar en una sección de otro local
  foreign key (seccion_id, local_id) references public.secciones (id, local_id) on delete cascade
);
create index if not exists platos_local_id_idx on public.platos (local_id);
create index if not exists platos_seccion_local_orden_idx on public.platos (seccion_id, local_id, orden);

-- menus: menú del día (y otros menús cerrados)
create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id) on delete cascade,
  nombre text not null default 'Menú del día' check (char_length(nombre) between 1 and 60),
  precio_centimos integer check (precio_centimos between 0 and 100000),
  dias smallint[] not null default '{1,2,3,4,5}' check (dias <@ '{1,2,3,4,5,6,7}'::smallint[] and cardinality(dias) >= 1),
  hora_inicio time,
  hora_fin time,
  contenido jsonb not null default '{"grupos":[]}' check (privado.menu_valido(contenido)),
  notas text check (char_length(notas) <= 200),
  orden integer not null default 0 check (orden >= 0),
  visible boolean not null default true,
  traducciones jsonb not null default '{}' check (jsonb_typeof(traducciones) = 'object'),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check ((hora_inicio is null and hora_fin is null) or (hora_inicio is not null and hora_fin is not null and hora_inicio < hora_fin))
);
create index if not exists menus_local_orden_idx on public.menus (local_id, orden);

alter table public.perfiles enable row level security;
alter table public.aceptaciones_legales enable row level security;
alter table public.locales enable row level security;
alter table public.slugs_anteriores enable row level security;
alter table public.accesos enable row level security;
alter table public.secciones enable row level security;
alter table public.platos enable row level security;
alter table public.menus enable row level security;

-- ===========================================================================
-- 3. Funciones que usan las políticas
-- ===========================================================================

create or replace function privado.es_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin', false);
$$;

-- definer: consulta locales sin pasar por su RLS (evita la recursión entre locales y sus hijos)
create or replace function privado.es_dueno_de(p_local uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.locales l where l.id = p_local and l.dueno_id = (select auth.uid()));
$$;

-- para Storage: la primera carpeta de la ruta es el id del local
create or replace function privado.es_dueno_de_texto(p text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then privado.es_dueno_de(p::uuid)
    else false
  end;
$$;

-- acceso activo: misma regla que calcularAccesoEfectivo() en src/lib/dominio/acceso.ts
create or replace function privado.local_con_acceso(p_local uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.accesos a
    where a.local_id = p_local
      and a.estado <> 'vencido'
      and (a.vigente_hasta is null or a.vigente_hasta > now())
  );
$$;

create or replace function privado.local_visible(p_local uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.locales l where l.id = p_local and l.publicado)
     and privado.local_con_acceso(p_local);
$$;

-- v0.1: un local por persona (LIMITES.localesPorUsuario)
create or replace function privado.puede_crear_local()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select count(*) from public.locales l where l.dueno_id = (select auth.uid())) < 1;
$$;

-- ¿Está cogido este slug por OTRO local (actual o anterior)? Lo usa comprobarSlug del panel,
-- que con la RLS no vería los locales sin publicar de otros. Solo devuelve sí/no.
create or replace function privado.slug_ocupado_def(p_slug text, p_local uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.locales l where l.slug = p_slug and l.id is distinct from p_local)
      or exists (select 1 from public.slugs_anteriores s where s.slug = p_slug and s.local_id is distinct from p_local);
$$;

-- ===========================================================================
-- 4. Triggers
-- ===========================================================================

create or replace function privado.tocar_actualizado_en()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- perfil al darse de alta y al cambiar de correo
create or replace function privado.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, correo)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set correo = excluded.correo;
  return new;
end;
$$;

-- prueba de 30 días una sola vez por persona; si ya la usó, el local nace «vencido»
create or replace function privado.crear_acceso_inicial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.perfiles
     set prueba_usada_en = now()
   where id = new.dueno_id and prueba_usada_en is null;
  if found then
    insert into public.accesos (local_id, estado, vigente_hasta) values (new.id, 'prueba', now() + interval '30 days');
  else
    insert into public.accesos (local_id, estado, vigente_hasta) values (new.id, 'vencido', now());
  end if;
  return new;
end;
$$;

-- un slug que fue de OTRO local no se puede coger; si fue del mismo, se recupera
create or replace function privado.comprobar_slug_libre()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.slugs_anteriores s where s.slug = new.slug and s.local_id <> new.id) then
    raise exception using errcode = '23505', message = 'slug_ocupado', detail = 'El slug lo usó otro local.';
  end if;
  delete from public.slugs_anteriores s where s.slug = new.slug and s.local_id = new.id;
  return new;
end;
$$;

create or replace function privado.registrar_slug_anterior()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.slug is distinct from new.slug then
    insert into public.slugs_anteriores (slug, local_id) values (old.slug, new.id)
    on conflict (slug) do update set local_id = excluded.local_id, creado_en = now();
  end if;
  return new;
end;
$$;

create or replace function privado.forzar_fecha_aceptacion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.aceptada_en := now();
  return new;
end;
$$;

-- 40 secciones, 400 platos y 10 menús por local (bloquea el local para que no se cuele nada en paralelo)
create or replace function privado.limitar_filas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  limite integer;
  total integer;
begin
  perform 1 from public.locales l where l.id = new.local_id for update;
  if tg_table_name = 'secciones' then
    limite := 40;
    select count(*) into total from public.secciones t where t.local_id = new.local_id;
  elsif tg_table_name = 'platos' then
    limite := 400;
    select count(*) into total from public.platos t where t.local_id = new.local_id;
  elsif tg_table_name = 'menus' then
    limite := 10;
    select count(*) into total from public.menus t where t.local_id = new.local_id;
  else
    raise exception 'limitar_filas: tabla no prevista %', tg_table_name;
  end if;
  if total >= limite then
    raise exception using errcode = 'KL001', message = 'limite_alcanzado', detail = format('%s: máximo %s por local', tg_table_name, limite);
  end if;
  return new;
end;
$$;

-- un local por persona también ante altas simultáneas (la política lo comprueba; esto cierra la carrera).
-- Las semillas y scripts (sin auth.uid()) no tienen límite.
create or replace function privado.limitar_locales()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  perform 1 from public.perfiles p where p.id = new.dueno_id for update;
  if (select count(*) from public.locales l where l.dueno_id = new.dueno_id) >= 1 then
    raise exception using errcode = 'KL001', message = 'limite_alcanzado', detail = 'locales: máximo 1 por persona';
  end if;
  return new;
end;
$$;

create or replace trigger crear_perfil
  after insert or update of email on auth.users
  for each row execute function privado.crear_perfil();

create or replace trigger tocar_actualizado_en before update on public.perfiles
  for each row execute function privado.tocar_actualizado_en();
create or replace trigger tocar_actualizado_en before update on public.locales
  for each row execute function privado.tocar_actualizado_en();
create or replace trigger tocar_actualizado_en before update on public.accesos
  for each row execute function privado.tocar_actualizado_en();
create or replace trigger tocar_actualizado_en before update on public.secciones
  for each row execute function privado.tocar_actualizado_en();
create or replace trigger tocar_actualizado_en before update on public.platos
  for each row execute function privado.tocar_actualizado_en();
create or replace trigger tocar_actualizado_en before update on public.menus
  for each row execute function privado.tocar_actualizado_en();

create or replace trigger forzar_fecha_aceptacion before insert on public.aceptaciones_legales
  for each row execute function privado.forzar_fecha_aceptacion();

create or replace trigger limitar_locales before insert on public.locales
  for each row execute function privado.limitar_locales();
create or replace trigger comprobar_slug_libre before insert or update of slug on public.locales
  for each row execute function privado.comprobar_slug_libre();
create or replace trigger crear_acceso_inicial after insert on public.locales
  for each row execute function privado.crear_acceso_inicial();
create or replace trigger registrar_slug_anterior after update of slug on public.locales
  for each row execute function privado.registrar_slug_anterior();

create or replace trigger limitar_filas before insert on public.secciones
  for each row execute function privado.limitar_filas();
create or replace trigger limitar_filas before insert on public.platos
  for each row execute function privado.limitar_filas();
create or replace trigger limitar_filas before insert on public.menus
  for each row execute function privado.limitar_filas();

-- Perfiles de los usuarios que ya existían antes de este trigger (idempotente).
insert into public.perfiles (id, correo)
select u.id, coalesce(u.email, '') from auth.users u
on conflict (id) do nothing;

-- ===========================================================================
-- 5. Políticas RLS (una por operación y perfil)
-- ===========================================================================

-- perfiles
create policy perfiles_select_dueno on public.perfiles for select to authenticated
  using (id = (select auth.uid()));
create policy perfiles_select_admin on public.perfiles for select to authenticated
  using ((select privado.es_admin()));
create policy perfiles_update_dueno on public.perfiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- aceptaciones_legales (sin UPDATE ni DELETE: historial inalterable)
create policy aceptaciones_select_dueno on public.aceptaciones_legales for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy aceptaciones_select_admin on public.aceptaciones_legales for select to authenticated
  using ((select privado.es_admin()));
create policy aceptaciones_insert_dueno on public.aceptaciones_legales for insert to authenticated
  with check (usuario_id = (select auth.uid()));

-- locales
create policy locales_select_publico on public.locales for select to anon, authenticated
  using (publicado and privado.local_con_acceso(id));
create policy locales_select_dueno on public.locales for select to authenticated
  using (dueno_id = (select auth.uid()));
create policy locales_select_admin on public.locales for select to authenticated
  using ((select privado.es_admin()));
create policy locales_insert_dueno on public.locales for insert to authenticated
  with check (dueno_id = (select auth.uid()) and not privado.es_slug_reservado(slug) and (select privado.puede_crear_local()));
create policy locales_update_dueno on public.locales for update to authenticated
  using (dueno_id = (select auth.uid()))
  with check (dueno_id = (select auth.uid()) and not privado.es_slug_reservado(slug));
create policy locales_delete_dueno on public.locales for delete to authenticated
  using (dueno_id = (select auth.uid()));

-- slugs_anteriores (solo los escriben los triggers)
create policy slugs_anteriores_select_publico on public.slugs_anteriores for select to anon, authenticated
  using (privado.local_visible(local_id));
create policy slugs_anteriores_select_dueno on public.slugs_anteriores for select to authenticated
  using (privado.es_dueno_de(local_id));

-- accesos (sin INSERT: trigger; sin DELETE: cascada)
create policy accesos_select_dueno on public.accesos for select to authenticated
  using (privado.es_dueno_de(local_id));
create policy accesos_select_admin on public.accesos for select to authenticated
  using ((select privado.es_admin()));
create policy accesos_update_admin on public.accesos for update to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));

-- secciones (patrón «hijo de local»)
create policy secciones_select_publico on public.secciones for select to anon, authenticated
  using (visible and privado.local_visible(local_id));
create policy secciones_select_dueno on public.secciones for select to authenticated
  using (privado.es_dueno_de(local_id));
create policy secciones_select_admin on public.secciones for select to authenticated
  using ((select privado.es_admin()));
create policy secciones_insert_dueno on public.secciones for insert to authenticated
  with check (privado.es_dueno_de(local_id));
create policy secciones_update_dueno on public.secciones for update to authenticated
  using (privado.es_dueno_de(local_id)) with check (privado.es_dueno_de(local_id));
create policy secciones_delete_dueno on public.secciones for delete to authenticated
  using (privado.es_dueno_de(local_id));

-- platos (el público además exige que la sección esté visible)
create policy platos_select_publico on public.platos for select to anon, authenticated
  using (
    visible
    and privado.local_visible(local_id)
    and exists (select 1 from public.secciones s where s.id = seccion_id and s.visible)
  );
create policy platos_select_dueno on public.platos for select to authenticated
  using (privado.es_dueno_de(local_id));
create policy platos_select_admin on public.platos for select to authenticated
  using ((select privado.es_admin()));
create policy platos_insert_dueno on public.platos for insert to authenticated
  with check (privado.es_dueno_de(local_id));
create policy platos_update_dueno on public.platos for update to authenticated
  using (privado.es_dueno_de(local_id)) with check (privado.es_dueno_de(local_id));
create policy platos_delete_dueno on public.platos for delete to authenticated
  using (privado.es_dueno_de(local_id));

-- menus
create policy menus_select_publico on public.menus for select to anon, authenticated
  using (visible and privado.local_visible(local_id));
create policy menus_select_dueno on public.menus for select to authenticated
  using (privado.es_dueno_de(local_id));
create policy menus_select_admin on public.menus for select to authenticated
  using ((select privado.es_admin()));
create policy menus_insert_dueno on public.menus for insert to authenticated
  with check (privado.es_dueno_de(local_id));
create policy menus_update_dueno on public.menus for update to authenticated
  using (privado.es_dueno_de(local_id)) with check (privado.es_dueno_de(local_id));
create policy menus_delete_dueno on public.menus for delete to authenticated
  using (privado.es_dueno_de(local_id));

-- ===========================================================================
-- 6. RPC públicas (security invoker: respetan la RLS de quien llama)
-- ===========================================================================

-- piloto de 60 días; si quien llama no es admin, la RLS no deja actualizar y devuelve vacío
create or replace function public.activar_piloto(p_local uuid)
returns setof public.accesos
language sql
security invoker
set search_path = ''
as $$
  update public.accesos
     set estado = 'piloto',
         vigente_hasta = now() + interval '60 days',
         actualizado_por = (select auth.uid())
   where local_id = p_local
  returning *;
$$;

-- solo «vencido» o «cortesía» (para el admin)
create or replace function public.cambiar_estado_acceso(p_local uuid, p_estado text)
returns setof public.accesos
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_estado is null or p_estado not in ('vencido', 'cortesia') then
    raise exception using errcode = '22023', message = 'estado_no_permitido';
  end if;
  return query
    with cambiado as (
      update public.accesos
         set estado = p_estado,
             vigente_hasta = case when p_estado = 'cortesia' then null else now() end,
             actualizado_por = (select auth.uid())
       where local_id = p_local
      returning *
    )
    select * from cambiado;
end;
$$;

-- pone orden = posición (0, 1, 2…). Todo o nada: si algún id no es tuyo o no existe, no cambia nada.
create or replace function public.reordenar(p_tabla text, p_ids uuid[])
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n integer;
begin
  if p_tabla is null or p_tabla not in ('secciones', 'platos', 'menus') then
    raise exception using errcode = '22023', message = 'tabla_no_permitida';
  end if;
  if p_ids is null or cardinality(p_ids) < 1 or cardinality(p_ids) > 200
     or cardinality(p_ids) <> (select count(distinct x) from unnest(p_ids) as t(x)) then
    raise exception using errcode = '22023', message = 'ids_no_validos';
  end if;
  execute format(
    'update public.%I as t set orden = x.pos - 1 from unnest($1) with ordinality as x(id, pos) where t.id = x.id',
    p_tabla
  ) using p_ids;
  get diagnostics n = row_count;
  if n <> cardinality(p_ids) then
    raise exception using errcode = '42501', message = 'sin_permiso';
  end if;
  return n;
end;
$$;

create or replace function public.slug_ocupado(p_slug text, p_local uuid default null)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select privado.slug_ocupado_def(p_slug, p_local);
$$;

-- ===========================================================================
-- 7. Permisos
-- ===========================================================================

-- Esquema privado: uso, y ejecutar solo lo que necesitan políticas, CHECK y RPC.
grant usage on schema privado to anon, authenticated;
revoke all on all functions in schema privado from public, anon, authenticated;
grant execute on function
  privado.es_admin(),
  privado.es_dueno_de(uuid),
  privado.es_dueno_de_texto(text),
  privado.local_con_acceso(uuid),
  privado.local_visible(uuid),
  privado.es_slug_reservado(text)
to anon, authenticated;
grant execute on function
  privado.puede_crear_local(),
  privado.slug_ocupado_def(text, uuid),
  privado.precios_validos(jsonb),
  privado.horarios_validos(jsonb),
  privado.menu_valido(jsonb)
to authenticated;

revoke all on function public.activar_piloto(uuid) from public, anon;
revoke all on function public.cambiar_estado_acceso(uuid, text) from public, anon;
revoke all on function public.reordenar(text, uuid[]) from public, anon;
revoke all on function public.slug_ocupado(text, uuid) from public, anon;
grant execute on function public.activar_piloto(uuid) to authenticated;
grant execute on function public.cambiar_estado_acceso(uuid, text) to authenticated;
grant execute on function public.reordenar(text, uuid[]) to authenticated;
grant execute on function public.slug_ocupado(text, uuid) to authenticated;

-- Tablas: se parte de cero para anon y authenticated (service_role conserva lo suyo).
revoke all on public.perfiles, public.aceptaciones_legales, public.locales, public.slugs_anteriores,
  public.accesos, public.secciones, public.platos, public.menus from anon, authenticated;

-- perfiles: leer lo suyo; cambiar solo el nombre
grant select on public.perfiles to authenticated;
grant update (nombre) on public.perfiles to authenticated;

-- aceptaciones: leer e insertar (la fecha la pone el trigger)
grant select on public.aceptaciones_legales to authenticated;
grant insert (usuario_id, documento, version) on public.aceptaciones_legales to authenticated;

-- locales: anon sin dueno_id ni creado_en
grant select (id, slug, nombre, descripcion, direccion, telefono, logo_ruta, color_marca, horarios, idioma_base,
  idiomas_activos, traducciones, publicado, permitir_indexar, actualizado_en) on public.locales to anon;
grant select on public.locales to authenticated;
grant insert (id, dueno_id, slug, nombre, descripcion, direccion, telefono, color_marca, horarios, publicado,
  permitir_indexar) on public.locales to authenticated;
grant update (slug, nombre, descripcion, direccion, telefono, logo_ruta, color_marca, horarios, idiomas_activos,
  traducciones, publicado, permitir_indexar) on public.locales to authenticated;
grant delete on public.locales to authenticated;

-- slugs_anteriores: solo lectura
grant select (slug, local_id) on public.slugs_anteriores to anon;
grant select on public.slugs_anteriores to authenticated;

-- accesos: el dueño lee; el admin (RLS) actualiza
grant select on public.accesos to authenticated;
grant update (estado, plan, vigente_hasta, notas, actualizado_por) on public.accesos to authenticated;

-- secciones
grant select (id, local_id, nombre, descripcion, orden, visible, traducciones, actualizado_en) on public.secciones to anon;
grant select, delete on public.secciones to authenticated;
grant insert (id, local_id, nombre, descripcion, orden, visible, traducciones) on public.secciones to authenticated;
grant update (nombre, descripcion, orden, visible, traducciones) on public.secciones to authenticated;

-- platos: anon todas salvo creado_en
grant select (id, local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados,
  etiquetas, foto_ruta, orden, agotado, visible, traducciones, actualizado_en) on public.platos to anon;
grant select, delete on public.platos to authenticated;
grant insert (id, local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados,
  etiquetas, foto_ruta, orden, agotado, visible, traducciones) on public.platos to authenticated;
grant update (seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas,
  foto_ruta, orden, agotado, visible, traducciones) on public.platos to authenticated;

-- menus
grant select (id, local_id, nombre, precio_centimos, dias, hora_inicio, hora_fin, contenido, notas, orden, visible,
  traducciones, actualizado_en) on public.menus to anon;
grant select, delete on public.menus to authenticated;
grant insert (id, local_id, nombre, precio_centimos, dias, hora_inicio, hora_fin, contenido, notas, orden, visible,
  traducciones) on public.menus to authenticated;
grant update (nombre, precio_centimos, dias, hora_inicio, hora_fin, contenido, notas, orden, visible, traducciones)
  on public.menus to authenticated;
