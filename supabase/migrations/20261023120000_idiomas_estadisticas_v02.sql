-- v0.2 · Idiomas (traducciones que nunca pisan una corrección manual, cuota de traducción) y estadísticas
-- anónimas (contadores por día escritos solo a través de una función con comprobaciones).
-- Fuente de verdad: docs/arquitectura.md §3.3, §3.4 y §5.4. Tests: supabase/tests/03_traducciones_v02.sql
-- y supabase/tests/04_estadisticas_v02.sql.
--
-- Reglas que sigue este archivo:
-- - RLS activada en cada tabla nueva; solo políticas SELECT (dueño y admin). Ninguna política ni permiso de
--   escritura para anon ni authenticated: se escribe solo con las funciones privado.*_def (security definer).
-- - RPC públicas siempre security invoker. Las de traducciones respetan la RLS del dueño (UPDATE).
-- - Nombres de tabla dinámicos solo tras comprobarlos contra la lista blanca y siempre con format('%I').
-- - Errores propios: 22023 (invalid_parameter_value) = tabla, idioma, campo o lote no válidos.

-- ===========================================================================
-- 1. Tablas
-- ===========================================================================

-- estadisticas_dia: contadores anónimos por local y día (hora de Madrid)
create table if not exists public.estadisticas_dia (
  local_id uuid not null references public.locales (id) on delete cascade,
  dia date not null,
  visitas integer not null default 0 check (visitas >= 0),
  visitas_por_idioma jsonb not null default '{}' check (jsonb_typeof(visitas_por_idioma) = 'object'),
  clics_resena integer not null default 0 check (clics_resena >= 0),
  primary key (local_id, dia)
);

-- vistas_plato_dia: cuántas veces se vio cada plato cada día
create table if not exists public.vistas_plato_dia (
  plato_id uuid not null references public.platos (id) on delete cascade,
  local_id uuid not null references public.locales (id) on delete cascade,
  dia date not null,
  vistas integer not null default 0 check (vistas >= 0),
  primary key (plato_id, dia)
);
create index if not exists vistas_plato_dia_local_dia_idx on public.vistas_plato_dia (local_id, dia);

-- uso_traduccion: caracteres enviados a Google Translate por local y día
create table if not exists public.uso_traduccion (
  local_id uuid not null references public.locales (id) on delete cascade,
  dia date not null,
  caracteres integer not null default 0 check (caracteres >= 0),
  primary key (local_id, dia)
);
-- la suma mensual de todos los locales filtra por día
create index if not exists uso_traduccion_dia_idx on public.uso_traduccion (dia);

alter table public.estadisticas_dia enable row level security;
alter table public.vistas_plato_dia enable row level security;
alter table public.uso_traduccion enable row level security;

-- Solo lectura: el dueño lo suyo y el admin todo. Sin INSERT/UPDATE/DELETE para nadie.
create policy estadisticas_dia_select_dueno on public.estadisticas_dia for select to authenticated
  using ((select privado.es_dueno_de(local_id)));
create policy estadisticas_dia_select_admin on public.estadisticas_dia for select to authenticated
  using ((select privado.es_admin()));
create policy vistas_plato_dia_select_dueno on public.vistas_plato_dia for select to authenticated
  using ((select privado.es_dueno_de(local_id)));
create policy vistas_plato_dia_select_admin on public.vistas_plato_dia for select to authenticated
  using ((select privado.es_admin()));
create policy uso_traduccion_select_dueno on public.uso_traduccion for select to authenticated
  using ((select privado.es_dueno_de(local_id)));
create policy uso_traduccion_select_admin on public.uso_traduccion for select to authenticated
  using ((select privado.es_admin()));

revoke all on public.estadisticas_dia, public.vistas_plato_dia, public.uso_traduccion from anon, authenticated;
grant select on public.estadisticas_dia, public.vistas_plato_dia, public.uso_traduccion to authenticated;

-- ===========================================================================
-- 2. Traducciones (§3.4)
-- ===========================================================================

-- ¿Es `p_campo` un campo traducible de `p_tabla`? (misma lista que los tipos Campo* de src/lib/tipos/dominio.ts)
create or replace function privado.campo_traducible_valido(p_tabla text, p_campo text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(case p_tabla
    when 'locales' then p_campo = 'descripcion'
    when 'secciones' then p_campo in ('nombre', 'descripcion')
    when 'platos' then p_campo in ('nombre', 'descripcion') or p_campo ~ '^precio\.[a-z0-9]{4,12}\.texto$'
    when 'menus' then p_campo in ('nombre', 'notas')
      or p_campo ~ '^grupo\.[a-z0-9]{4,12}\.titulo$' or p_campo ~ '^item\.[a-z0-9]{4,12}\.nombre$'
    else false
  end, false);
$$;

-- Idiomas de destino (todos menos el base, «es»).
create or replace function privado.idioma_destino_valido(p_idioma text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_idioma = any (array['en', 'fr', 'de', 'ca', 'eu', 'gl']), false);
$$;

-- Huella: 16 hex en minúsculas (SHA-256 truncado, ver calcularHuella en src/lib/dominio/huella.ts).
create or replace function privado.huella_valida(p_huella text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_huella ~ '^[0-9a-f]{16}$', false);
$$;

-- Texto traducido: 1..1000 caracteres sin contar espacios de los lados.
create or replace function privado.texto_traducido_valido(p_texto text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(char_length(btrim(p_texto)) between 1 and 1000, false);
$$;

create or replace function privado.exigir_tabla_traducible(p_tabla text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_tabla is null or p_tabla not in ('locales', 'secciones', 'platos', 'menus') then
    raise exception using errcode = '22023', message = 'tabla_no_permitida';
  end if;
end;
$$;

-- Guarda un lote de traducciones automáticas en una tabla. Por cada elemento {fila_id, idioma, campo, texto,
-- huella} escribe {texto, origen:'auto', huella, fecha} SOLO si no hay entrada o la que hay NO es «manual».
-- Los elementos con datos no válidos se saltan (no se guardan). Devuelve cuántos se guardaron.
-- security invoker: la RLS del dueño (UPDATE) impide tocar filas ajenas (0 filas, sin error).
create or replace function public.guardar_traducciones_auto(p_tabla text, p_lote jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  e jsonb;
  v_fila uuid;
  v_idioma text;
  v_campo text;
  v_texto text;
  v_huella text;
  n integer;
  guardadas integer := 0;
begin
  perform privado.exigir_tabla_traducible(p_tabla);
  if p_lote is null or jsonb_typeof(p_lote) <> 'array' or jsonb_array_length(p_lote) > 500 then
    raise exception using errcode = '22023', message = 'lote_no_valido';
  end if;

  for e in select x from jsonb_array_elements(p_lote) as t(x) loop
    continue when jsonb_typeof(e) <> 'object'
      or jsonb_typeof(e -> 'fila_id') is distinct from 'string'
      or (e ->> 'fila_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or jsonb_typeof(e -> 'idioma') is distinct from 'string'
      or jsonb_typeof(e -> 'campo') is distinct from 'string'
      or jsonb_typeof(e -> 'texto') is distinct from 'string'
      or jsonb_typeof(e -> 'huella') is distinct from 'string';
    v_fila := (e ->> 'fila_id')::uuid;
    v_idioma := e ->> 'idioma';
    v_campo := e ->> 'campo';
    v_texto := btrim(e ->> 'texto');
    v_huella := e ->> 'huella';
    continue when not privado.idioma_destino_valido(v_idioma)
      or not privado.campo_traducible_valido(p_tabla, v_campo)
      or not privado.texto_traducido_valido(v_texto)
      or not privado.huella_valida(v_huella);

    -- La condición «no es manual» va en el WHERE: con READ COMMITTED se vuelve a evaluar sobre la versión
    -- más reciente de la fila, así que una corrección manual guardada a la vez tampoco se pisa.
    execute format(
      'update public.%I as t
          set traducciones = jsonb_set(
                t.traducciones,
                array[$2],
                coalesce(t.traducciones -> $2, ''{}''::jsonb)
                  || jsonb_build_object($3, jsonb_build_object(''texto'', $4, ''origen'', ''auto'', ''huella'', $5, ''fecha'', now())))
        where t.id = $1
          and coalesce(t.traducciones -> $2 -> $3 ->> ''origen'', '''') <> ''manual''',
      p_tabla
    ) using v_fila, v_idioma, v_campo, v_texto, v_huella;
    get diagnostics n = row_count;
    guardadas := guardadas + n;
  end loop;
  return guardadas;
end;
$$;

-- Guarda una corrección del dueño (origen «manual»). Sustituye lo que hubiera. true si se guardó;
-- false si la fila no existe o no es tuya. Datos no válidos -> error 22023.
create or replace function public.guardar_traduccion_manual(
  p_tabla text, p_fila uuid, p_idioma text, p_campo text, p_texto text, p_huella text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n integer;
begin
  perform privado.exigir_tabla_traducible(p_tabla);
  if p_fila is null
     or not privado.idioma_destino_valido(p_idioma)
     or not privado.campo_traducible_valido(p_tabla, p_campo)
     or not privado.texto_traducido_valido(p_texto)
     or not privado.huella_valida(p_huella) then
    raise exception using errcode = '22023', message = 'traduccion_no_valida';
  end if;
  execute format(
    'update public.%I as t
        set traducciones = jsonb_set(
              t.traducciones,
              array[$2],
              coalesce(t.traducciones -> $2, ''{}''::jsonb)
                || jsonb_build_object($3, jsonb_build_object(''texto'', $4, ''origen'', ''manual'', ''huella'', $5, ''fecha'', now())))
      where t.id = $1',
    p_tabla
  ) using p_fila, p_idioma, p_campo, btrim(p_texto), p_huella;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

-- Quita la corrección manual de un campo (la próxima traducción automática lo rellenará).
-- Si la entrada es «auto» o no existe, no cambia nada. true si la fila existe y es tuya.
create or replace function public.descartar_traduccion_manual(p_tabla text, p_fila uuid, p_idioma text, p_campo text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n integer;
begin
  perform privado.exigir_tabla_traducible(p_tabla);
  if p_fila is null or not privado.idioma_destino_valido(p_idioma) or not privado.campo_traducible_valido(p_tabla, p_campo) then
    raise exception using errcode = '22023', message = 'traduccion_no_valida';
  end if;
  execute format(
    'update public.%I as t
        set traducciones = case
              when t.traducciones -> $2 -> $3 ->> ''origen'' = ''manual'' then
                case when (t.traducciones -> $2) - $3 = ''{}''::jsonb then t.traducciones - $2
                     else t.traducciones #- array[$2, $3] end
              else t.traducciones
            end
      where t.id = $1',
    p_tabla
  ) using p_fila, p_idioma, p_campo;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

-- ===========================================================================
-- 3. Estadísticas anónimas (§5.4)
-- ===========================================================================

-- Suma un evento. Comprueba: local visible, tipo e idioma válidos, como mucho 100 platos y que cada plato
-- sea de ese local. Si algo no cuadra, no hace nada (y no da pistas con un error).
create or replace function privado.registrar_estadisticas_def(p_local uuid, p_tipo text, p_idioma text, p_platos uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dia date := (now() at time zone 'Europe/Madrid')::date;
begin
  if p_local is null
     or p_tipo is null or p_tipo not in ('visita', 'vistas', 'resena')
     or p_idioma is null or p_idioma not in ('es', 'en', 'fr', 'de', 'ca', 'eu', 'gl')
     or coalesce(cardinality(p_platos), 0) > 100 then
    return;
  end if;
  if not privado.local_visible(p_local) then
    return;
  end if;

  if p_tipo = 'visita' then
    insert into public.estadisticas_dia as e (local_id, dia, visitas, visitas_por_idioma)
    values (p_local, v_dia, 1, jsonb_build_object(p_idioma, 1))
    on conflict (local_id, dia) do update
      set visitas = e.visitas + 1,
          visitas_por_idioma = e.visitas_por_idioma
            || jsonb_build_object(p_idioma, coalesce((e.visitas_por_idioma ->> p_idioma)::integer, 0) + 1);
  elsif p_tipo = 'resena' then
    insert into public.estadisticas_dia as e (local_id, dia, clics_resena)
    values (p_local, v_dia, 1)
    on conflict (local_id, dia) do update set clics_resena = e.clics_resena + 1;
  else
    if coalesce(cardinality(p_platos), 0) = 0 then
      return;
    end if;
    insert into public.vistas_plato_dia as v (plato_id, local_id, dia, vistas)
    select distinct p.id, p_local, v_dia, 1
      from public.platos p
     where p.id = any (p_platos) and p.local_id = p_local
    on conflict (plato_id, dia) do update set vistas = v.vistas + 1;
  end if;
end;
$$;

-- RPC pública (la llama /api/e con la clave publicable y, en la v0.3, /r/<slug>).
create or replace function public.registrar_estadisticas(p_local uuid, p_tipo text, p_idioma text, p_platos uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  select privado.registrar_estadisticas_def(p_local, p_tipo, p_idioma, p_platos);
$$;

-- ===========================================================================
-- 4. Cuota de traducción (§3.3): 60.000 caracteres/día/local y 450.000/mes entre todos los locales
-- ===========================================================================

create or replace function privado.consumir_cuota_traduccion_def(p_local uuid, p_caracteres integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dia date := (now() at time zone 'Europe/Madrid')::date;
  v_mes date := date_trunc('month', (now() at time zone 'Europe/Madrid'))::date;
  v_hoy integer;
  v_mes_total bigint;
begin
  if p_local is null or p_caracteres is null or p_caracteres < 0 then
    return false;
  end if;
  if not privado.es_dueno_de(p_local) then
    return false;
  end if;
  if p_caracteres = 0 then
    return true;
  end if;
  if p_caracteres > 60000 then
    return false;
  end if;

  -- El límite mensual es de TODOS los locales: un cerrojo de transacción pone en fila las reservas para que
  -- dos peticiones a la vez (de locales distintos) no se pasen. Además, la fila del día se bloquea con FOR UPDATE.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('kartana.cuota_traduccion'));
  insert into public.uso_traduccion (local_id, dia) values (p_local, v_dia) on conflict (local_id, dia) do nothing;
  select u.caracteres into v_hoy from public.uso_traduccion u where u.local_id = p_local and u.dia = v_dia for update;
  select coalesce(sum(u.caracteres), 0) into v_mes_total
    from public.uso_traduccion u where u.dia >= v_mes and u.dia < (v_mes + interval '1 month')::date;

  if v_hoy + p_caracteres > 60000 or v_mes_total + p_caracteres > 450000 then
    return false;
  end if;
  update public.uso_traduccion set caracteres = caracteres + p_caracteres where local_id = p_local and dia = v_dia;
  return true;
end;
$$;

create or replace function public.consumir_cuota_traduccion(p_local uuid, p_caracteres integer)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select privado.consumir_cuota_traduccion_def(p_local, p_caracteres);
$$;

-- ===========================================================================
-- 5. Limpieza: filas de más de 400 días
-- ===========================================================================

create or replace function privado.limpiar_estadisticas()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limite date := (now() at time zone 'Europe/Madrid')::date - 400;
begin
  delete from public.estadisticas_dia where dia < v_limite;
  delete from public.vistas_plato_dia where dia < v_limite;
  delete from public.uso_traduccion where dia < v_limite;
end;
$$;

-- Tarea diaria con pg_cron si la extensión está instalada (si no, no hace nada: ver informe del carril).
do $$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule('limpiar-estadisticas', '23 4 * * *', 'select privado.limpiar_estadisticas()');
  end if;
end $$;

-- ===========================================================================
-- 6. Permisos de las funciones
-- ===========================================================================

revoke all on function
  privado.campo_traducible_valido(text, text),
  privado.idioma_destino_valido(text),
  privado.huella_valida(text),
  privado.texto_traducido_valido(text),
  privado.exigir_tabla_traducible(text),
  privado.registrar_estadisticas_def(uuid, text, text, uuid[]),
  privado.consumir_cuota_traduccion_def(uuid, integer),
  privado.limpiar_estadisticas()
from public, anon, authenticated;

-- las usan las RPC de traducciones (invoker: se ejecutan como el dueño)
grant execute on function
  privado.campo_traducible_valido(text, text),
  privado.idioma_destino_valido(text),
  privado.huella_valida(text),
  privado.texto_traducido_valido(text),
  privado.exigir_tabla_traducible(text)
to authenticated;
grant execute on function privado.registrar_estadisticas_def(uuid, text, text, uuid[]) to anon, authenticated;
grant execute on function privado.consumir_cuota_traduccion_def(uuid, integer) to authenticated;
-- privado.limpiar_estadisticas(): solo postgres (pg_cron).

revoke all on function public.guardar_traducciones_auto(text, jsonb) from public, anon;
revoke all on function public.guardar_traduccion_manual(text, uuid, text, text, text, text) from public, anon;
revoke all on function public.descartar_traduccion_manual(text, uuid, text, text) from public, anon;
revoke all on function public.registrar_estadisticas(uuid, text, text, uuid[]) from public;
revoke all on function public.consumir_cuota_traduccion(uuid, integer) from public, anon;
grant execute on function public.guardar_traducciones_auto(text, jsonb) to authenticated;
grant execute on function public.guardar_traduccion_manual(text, uuid, text, text, text, text) to authenticated;
grant execute on function public.descartar_traduccion_manual(text, uuid, text, text) to authenticated;
grant execute on function public.registrar_estadisticas(uuid, text, text, uuid[]) to anon, authenticated;
grant execute on function public.consumir_cuota_traduccion(uuid, integer) to authenticated;
