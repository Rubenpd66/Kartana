# Arquitectura de Kartana

> Fase 2 · 22/10/2026 (v0.3 detallada el 23/10/2026: §3.7, §5.7) · Autor: arquitecto. Fuente de verdad del modelo de datos, las rutas, los módulos y las integraciones.
> Los tipos TypeScript que reflejan este documento están en `src/lib/tipos/` (solo tipos y firmas). Si algo no coincide, manda este documento y se pide el cambio al director.

## 1. Resumen en dos minutos

- **Una tabla por cosa del negocio**: perfiles (dueños), locales, secciones, platos, menús del día, accesos (prueba, piloto, suscripción) y, desde la v0.2, contadores de estadísticas y cuota de traducción.
- **Un usuario puede tener varios locales** (el modelo lo permite); en la v0.1 se limita a uno por persona.
- **Seguridad en la base de datos (RLS)**: cada tabla tiene una política por operación. El dueño solo ve y cambia lo suyo. Un visitante anónimo solo puede **leer** las cartas publicadas con acceso activo. Nadie anónimo escribe en ninguna tabla: las estadísticas entran por una función con comprobaciones.
- **Carta pública estática**: se genera una vez, se guarda en caché (`'use cache'` + etiqueta por local) y se regenera al momento cuando el dueño guarda. Casi sin JavaScript: el filtro de alérgenos funciona solo con CSS.
- **Sin clave secreta de Supabase** hasta la v0.6 (webhooks de Stripe). El administrador se reconoce por un rol puesto a mano en `app_metadata` **y** por la lista `ADMIN_EMAILS` del servidor.
- **Reseñas (v0.3)**: el local guarda **a dónde** se escribe su reseña (el `place_id` de Google o el enlace oficial `g.page/r/…/review`) y si el botón está encendido. El botón de la carta y el QR de reseña apuntan a **`/r/<slug>`**, que cuenta un clic anónimo y redirige a Google. Igual para todos, sin preguntas previas, sin estrellas, sin incentivos (§5.7).

## 2. Convenciones

| Tema | Regla |
|---|---|
| Nombres | Tablas y columnas en español, `snake_case` en SQL; `camelCase` en TypeScript. La conversión la hace el carril de datos en `src/lib/datos/*`. |
| Claves | `uuid` con `gen_random_uuid()` salvo donde se indica. |
| Fechas | `timestamptz`. Los «días» de estadísticas se calculan en hora de Madrid: `(now() at time zone 'Europe/Madrid')::date`. |
| Textos | `text` con `CHECK (char_length(...) BETWEEN …)`. Los límites coinciden con `LIMITES` (`src/lib/dominio/limites.ts`). |
| Listas cerradas | `text` o `text[]` con `CHECK` (no tipos `enum` de Postgres, para poder añadir valores sin migraciones delicadas). |
| `actualizado_en` | Trigger `privado.tocar_actualizado_en()` en `BEFORE UPDATE`. |
| RLS | Activada en toda tabla (`alter table … enable row level security` en la migración, además del event trigger). **Una política por operación y por perfil de acceso**, siempre con `TO anon`/`TO authenticated` explícito, `auth.uid()` envuelto en `(select auth.uid())`, `UPDATE` con `USING` **y** `WITH CHECK`. |
| Funciones `security definer` | Solo en el esquema `privado` (no expuesto en la API), con `set search_path = ''` y nombres totalmente calificados. Las que se usan en políticas: `grant execute … to anon, authenticated`. Se concede `usage on schema privado` a `anon` y `authenticated` (sigue sin estar expuesto por la API de datos: no se puede llamar por REST). |
| Funciones públicas (RPC) | En `public`, siempre `security invoker` (respetan la RLS de quien llama). Si necesitan saltarse la RLS, delegan en una función `privado.*_def` que hace sus propias comprobaciones. |
| Permisos por columna | Donde se indica, se revoca el `select`/`update` de tabla y se conceden solo las columnas permitidas. **Cada columna nueva en estas tablas necesita su `grant`.** |

## 3. Modelo de datos

### 3.1 Diagrama

```
auth.users 1─1 perfiles 1─N locales 1─1 accesos
                   │           ├─N secciones 1─N platos
                   │           ├─N menus
                   │           ├─N slugs_anteriores
                   │           ├─N estadisticas_dia          (v0.2)
                   │           ├─N vistas_plato_dia ─N─1 platos (v0.2)
                   │           ├─N uso_traduccion            (v0.2)
                   │           └─N uso_lugares               (v0.3)
                   └─N aceptaciones_legales
storage.buckets: imagenes (público)  ->  <local_id>/logo/…png  ·  <local_id>/platos/<plato_id>/…webp
```

Al **borrar** una cuenta (auth.users) se borra en cascada todo: perfil, aceptaciones, locales y todo lo que cuelga de ellos. Las fotos del bucket no se borran solas: las borra la mutación que borra el plato/sección/logo (y una limpieza manual al borrar cuentas, ver §8).

### 3.2 Tablas de la v0.1

#### `perfiles` — un dueño (1:1 con `auth.users`)
| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid PK | `references auth.users(id) on delete cascade` |
| `correo` | text not null | `char_length <= 320`; copiado por trigger desde `auth.users.email` (alta y cambio de correo) |
| `nombre` | text null | 1–80 |
| `prueba_usada_en` | timestamptz null | Lo pone el trigger al crear el primer local. Una sola prueba gratis por persona. |
| `creado_en`, `actualizado_en` | timestamptz not null default now() | |

RLS:
| Operación | Quién | Política |
|---|---|---|
| SELECT | dueño | `to authenticated using (id = (select auth.uid()))` |
| SELECT | admin | `to authenticated using ((select privado.es_admin()))` |
| UPDATE | dueño | `to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()))` + **solo columna `nombre`** (`grant update (nombre)`) |
| INSERT | nadie | Lo crea el trigger `privado.crear_perfil()` (`after insert or update of email on auth.users`, security definer) |
| DELETE | nadie | Cascada desde `auth.users` |

#### `aceptaciones_legales` — historial de aceptación de condiciones y privacidad
| Columna | Tipo | Reglas |
|---|---|---|
| `id` | bigint `generated always as identity` PK | |
| `usuario_id` | uuid not null | `references perfiles(id) on delete cascade` |
| `documento` | text not null | `in ('condiciones','privacidad')` |
| `version` | text not null | `~ '^\d{4}-\d{2}-\d{2}$'` (las de `VERSIONES_LEGALES`) |
| `aceptada_en` | timestamptz not null default now() | Un trigger `BEFORE INSERT` la fuerza a `now()` (el cliente no puede inventar la fecha) |
| | | `unique (usuario_id, documento, version)` |

RLS: SELECT dueño (`usuario_id = (select auth.uid())`) · SELECT admin · INSERT dueño (`with check (usuario_id = (select auth.uid()))`) · sin UPDATE ni DELETE (historial inalterable).

#### `locales` — un bar o restaurante
| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid PK | |
| `dueno_id` | uuid not null | `references perfiles(id) on delete cascade`; índice |
| `slug` | text not null **unique** | `~ '^[a-z0-9]+(-[a-z0-9]+)*$'` y 3–40. Los reservados se bloquean en la política (ver abajo), no en el CHECK, para que la semilla pueda crear `demo`. |
| `nombre` | text not null | 1–80 |
| `descripcion` | text null | ≤ 300 (subtítulo: «Bar de tapas desde 1982») |
| `direccion` | text null | ≤ 200 |
| `telefono` | text null | ≤ 30 (el del bar, público) |
| `logo_ruta` | text null | ≤ 300 y empieza por `id::text || '/logo/'` |
| `color_marca` | text not null default `'#b9461a'` | `~ '^#[0-9a-f]{6}$'`. El contraste (≥ 4,5:1 con blanco) se valida en Zod; la carta, además, calcula el color del texto encima. |
| `horarios` | jsonb not null default `'[]'` | `privado.horarios_validos(horarios)`: array ≤ 21 de `{dia 1..7, abre "HH:MM", cierra "HH:MM"}`, ≤ 3 por día |
| `idioma_base` | text not null default `'es'` | `= 'es'` de momento (preparado para cartas escritas en catalán, euskera o gallego) |
| `idiomas_activos` | text[] not null default `'{es}'` | `<@ array['es','en','fr','de','ca','eu','gl']` y contiene `'es'` |
| `traducciones` | jsonb not null default `'{}'` | Ver §3.4 |
| `publicado` | boolean not null default false | |
| `permitir_indexar` | boolean not null default true | El dueño puede pedir que su carta no salga en Google |
| `creado_en`, `actualizado_en` | timestamptz | |

RLS:
| Operación | Quién | Política |
|---|---|---|
| SELECT | anónimo y cualquiera | `to anon, authenticated using (publicado and (select privado.local_con_acceso(id)))` |
| SELECT | dueño | `to authenticated using (dueno_id = (select auth.uid()))` |
| SELECT | admin | `to authenticated using ((select privado.es_admin()))` |
| INSERT | dueño | `to authenticated with check (dueno_id = (select auth.uid()) and not privado.es_slug_reservado(slug) and privado.puede_crear_local())` — `puede_crear_local()`: menos de `LIMITES.localesPorUsuario` (1) locales |
| UPDATE | dueño | `using (dueno_id = (select auth.uid())) with check (dueno_id = (select auth.uid()) and not privado.es_slug_reservado(slug))` + `grant update (slug, nombre, descripcion, direccion, telefono, logo_ruta, color_marca, horarios, idiomas_activos, traducciones, publicado, permitir_indexar)` |
| DELETE | dueño | `using (dueno_id = (select auth.uid()))` |

Permisos por columna para `anon`: `revoke select on public.locales from anon;` y `grant select (id, slug, nombre, descripcion, direccion, telefono, logo_ruta, color_marca, horarios, idioma_base, idiomas_activos, traducciones, publicado, permitir_indexar, actualizado_en) on public.locales to anon;` (no ve `dueno_id` ni `creado_en`).

Triggers: `privado.crear_acceso_inicial()` (after insert): crea la fila de `accesos` — `prueba` 30 días si `perfiles.prueba_usada_en` es null (y la marca), si no `vencido`. `privado.registrar_slug_anterior()` (after update of slug): guarda el slug viejo en `slugs_anteriores`. `privado.comprobar_slug_libre()` (before insert/update of slug): error si el slug está en `slugs_anteriores` de **otro** local; si es del mismo local, borra esa fila.

#### `slugs_anteriores` — para que los QR viejos sigan funcionando si el dueño cambia la dirección
| Columna | Tipo | Reglas |
|---|---|---|
| `slug` | text PK | mismo formato que `locales.slug` |
| `local_id` | uuid not null | `references locales(id) on delete cascade` |
| `creado_en` | timestamptz not null default now() | |

RLS: SELECT anónimo (`to anon, authenticated using ((select privado.local_visible(local_id)))`) · SELECT dueño (`privado.es_dueno_de(local_id)`) · sin INSERT/UPDATE/DELETE (solo triggers).

#### `accesos` — estado de acceso de cada local (1:1)
| Columna | Tipo | Reglas |
|---|---|---|
| `local_id` | uuid PK | `references locales(id) on delete cascade` |
| `estado` | text not null | `in ('prueba','piloto','cortesia','suscripcion','vencido')` |
| `plan` | text not null default `'carta_resenas'` | `in ('carta','carta_resenas')` (durante prueba y piloto, todo incluido) |
| `vigente_hasta` | timestamptz null | null solo con `cortesia` o `suscripcion` (CHECK) |
| `notas` | text null | ≤ 500 (solo admin) |
| `actualizado_en` | timestamptz not null default now() | |
| `actualizado_por` | uuid null | `references perfiles(id) on delete set null` |

**Acceso activo** (misma regla en SQL `privado.local_con_acceso()` y en TS `calcularAccesoEfectivo()`): `estado <> 'vencido' and (vigente_hasta is null or vigente_hasta > now())`.

RLS: SELECT dueño (`privado.es_dueno_de(local_id)`) · SELECT admin · UPDATE admin (`using ((select privado.es_admin())) with check ((select privado.es_admin()))`) · sin INSERT (trigger) ni DELETE (cascada). En la v0.6, el webhook de Stripe escribirá con la clave secreta (rol `service_role`, salta la RLS).

RPC: `public.activar_piloto(p_local uuid) returns public.accesos` — `security invoker`: `update accesos set estado='piloto', vigente_hasta = now() + interval '60 days', actualizado_por = auth.uid() where local_id = p_local returning *`. La RLS de admin hace el resto (si no eres admin, no actualiza nada y devuelve vacío).

Columnas previstas para la v0.6 (no se crean aún): `stripe_customer_id`, `stripe_subscription_id`, `periodo`.

#### `secciones`
| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid PK | |
| `local_id` | uuid not null | `references locales(id) on delete cascade`; `unique (id, local_id)` (para la FK compuesta de platos) |
| `nombre` | text not null | 1–60 |
| `descripcion` | text null | ≤ 200 |
| `orden` | integer not null default 0 | `>= 0` |
| `visible` | boolean not null default true | |
| `traducciones` | jsonb not null default `'{}'` | |
| `creado_en`, `actualizado_en` | timestamptz | |

Límite: trigger `privado.limitar_filas()` — máximo 40 secciones por local.

RLS (patrón «hijo de local», igual para `platos` y `menus`):
| Operación | Quién | Política |
|---|---|---|
| SELECT | anónimo y cualquiera | `to anon, authenticated using (visible and (select privado.local_visible(local_id)))` |
| SELECT | dueño | `to authenticated using ((select privado.es_dueno_de(local_id)))` |
| INSERT | dueño | `to authenticated with check ((select privado.es_dueno_de(local_id)))` |
| UPDATE | dueño | `using (privado.es_dueno_de(local_id)) with check (privado.es_dueno_de(local_id))` |
| DELETE | dueño | `using ((select privado.es_dueno_de(local_id)))` |

#### `platos`
| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid PK | |
| `local_id` | uuid not null | índice |
| `seccion_id` | uuid not null | `foreign key (seccion_id, local_id) references secciones(id, local_id) on delete cascade` (un plato nunca puede quedar en una sección de otro local) |
| `nombre` | text not null | 1–80 |
| `descripcion` | text null | ≤ 300 |
| `precios` | jsonb not null | `privado.precios_validos(precios)`: ver abajo |
| `alergenos` | text[] not null default `'{}'` | `<@` los 14 códigos |
| `trazas` | text[] not null default `'{}'` | `<@` los 14 códigos |
| `alergenos_confirmados` | boolean not null default false | |
| `etiquetas` | text[] not null default `'{}'` | `<@ array['vegano','vegetariano','sin_gluten','sin_lactosa','picante','casero','recomendado','nuevo']` |
| `foto_ruta` | text null | ≤ 300 y empieza por `local_id::text || '/platos/' || id::text || '/'` |
| `orden` | integer not null default 0 | |
| `agotado` | boolean not null default false | |
| `visible` | boolean not null default true | |
| `traducciones` | jsonb not null default `'{}'` | |
| `creado_en`, `actualizado_en` | timestamptz | índice `(seccion_id, orden)` |

**Variantes de precio** (`precios`, requisito del director): lista **ordenada de 1 a 6** objetos `{"id": "p1a2", "formato": "racion", "texto": null, "centimos": 1200}`.
- `id`: texto corto estable (4–12 caracteres `[a-z0-9]`), lo asigna el servidor; sirve para guardar la traducción del texto libre.
- `formato`: `unico` (sin etiqueta), `tapa`, `pincho`, `media_racion`, `racion`, `racion_mediana`, `racion_grande`, `unidad`, `media_docena`, `docena`, `copa`, `botella`, `jarra`, `pequeno`, `mediano`, `grande`, `otro`. Las etiquetas habituales se traducen con el diccionario de la carta (gratis); `otro` usa `texto`.
- `texto`: obligatorio (1–30) si `formato = 'otro'`; null en los demás.
- `centimos`: entero 0–100000, o null = «Según mercado».
- `unico` solo si es la única variante; no se repite un formato salvo `otro` con textos distintos.
- Ejemplos: un precio simple → `[{"formato":"unico","centimos":850}]`; pulpo a la gallega → `[{"formato":"racion_mediana","centimos":1400},{"formato":"racion_grande","centimos":2200}]`; gamba roja → `[{"formato":"docena","centimos":1800}]`.

Límite: 400 platos por local. RLS: patrón «hijo de local», pero el SELECT anónimo añade que la sección esté visible: `using (visible and (select privado.local_visible(local_id)) and exists (select 1 from public.secciones s where s.id = seccion_id and s.visible))`. Permisos por columna para `anon`: todas salvo `creado_en`.

Los platos **agotados se siguen mostrando** en la carta, atenuados y con la marca «Agotado» (decisión a confirmar por el director, ver plan).

#### `menus` — menú del día (y otros menús cerrados)
| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid PK | |
| `local_id` | uuid not null | `references locales(id) on delete cascade` |
| `nombre` | text not null default `'Menú del día'` | 1–60 |
| `precio_centimos` | integer null | 0–100000 |
| `dias` | smallint[] not null default `'{1,2,3,4,5}'` | `<@ '{1,2,3,4,5,6,7}'` y al menos uno |
| `hora_inicio`, `hora_fin` | time null | las dos null o las dos con valor y `hora_inicio < hora_fin` |
| `contenido` | jsonb not null default `'{"grupos":[]}'` | `privado.menu_valido(contenido)`: ≤ 6 grupos `{id, titulo 1–40, items: ≤ 12 × {id, nombre 1–80, alergenos[], alergenos_confirmados}}` |
| `notas` | text null | ≤ 200 («Incluye pan, bebida y postre o café») |
| `orden` | integer not null default 0 | |
| `visible` | boolean not null default true | |
| `traducciones` | jsonb not null default `'{}'` | |
| `creado_en`, `actualizado_en` | timestamptz | |

Límite: 10 menús por local. RLS: patrón «hijo de local». La carta muestra el menú con sus días y horas (no calcula «hoy», para que la página siga siendo estática).

### 3.3 Tablas de la v0.2

#### `estadisticas_dia` — contadores anónimos por local y día
| Columna | Tipo | Reglas |
|---|---|---|
| `local_id` | uuid not null | `references locales(id) on delete cascade` |
| `dia` | date not null | hora de Madrid |
| `visitas` | integer not null default 0 | `>= 0` |
| `visitas_por_idioma` | jsonb not null default `'{}'` | `{"es": 10, "en": 3}` |
| `clics_resena` | integer not null default 0 | se usa desde la v0.3 |
| | | PK `(local_id, dia)` |

#### `vistas_plato_dia`
| Columna | Tipo | Reglas |
|---|---|---|
| `plato_id` | uuid not null | `references platos(id) on delete cascade` |
| `local_id` | uuid not null | `references locales(id) on delete cascade` |
| `dia` | date not null | |
| `vistas` | integer not null default 0 | |
| | | PK `(plato_id, dia)`, índice `(local_id, dia)` |

RLS de las dos: SELECT dueño (`privado.es_dueno_de(local_id)`) · SELECT admin · **sin INSERT/UPDATE/DELETE para nadie**. Se escriben solo con la función de §5.4. Se borran filas de más de 400 días (tarea `pg_cron` diaria si la extensión está disponible; si no, desde el cron de `/api/health` con una función `privado.limpiar_estadisticas()` sin argumentos).

#### `uso_traduccion` — cuota de traducción
| Columna | Tipo | Reglas |
|---|---|---|
| `local_id` | uuid not null | `references locales(id) on delete cascade` |
| `dia` | date not null | |
| `caracteres` | integer not null default 0 | |
| | | PK `(local_id, dia)` |

RLS: SELECT dueño · SELECT admin · sin escritura directa. Se escribe con `public.consumir_cuota_traduccion(p_local uuid, p_caracteres int) returns boolean` (invoker) → `privado.consumir_cuota_traduccion_def` (definer): comprueba que quien llama es el dueño, que el local no pasa de **60.000 caracteres/día** y que la suma del mes de todos los locales no pasa de **450.000** (margen bajo los 500.000 gratis de Google). Devuelve false si no queda cuota.

### 3.4 Traducciones (columna `traducciones`, v0.2)

Formato jsonb en `locales`, `secciones`, `platos` y `menus`:
```json
{ "en": { "nombre": { "texto": "Galician-style octopus", "origen": "auto", "huella": "9f2c1a0b7d3e4f51", "fecha": "2026-11-02T10:00:00Z" } } }
```
- Campos: local `descripcion`; sección `nombre`, `descripcion`; plato `nombre`, `descripcion`, `precio.<id>.texto`; menú `nombre`, `notas`, `grupo.<id>.titulo`, `item.<id>.nombre`.
- `huella` = 16 primeros hex del SHA-256 del original normalizado (`trim` + NFC). Si no coincide con la del original actual, la traducción está **desactualizada**.
- **Regla de oro**: una traducción `manual` nunca se sobrescribe automáticamente. Si su original cambia, el panel avisa («el texto en español cambió, revisa la traducción»), y solo el dueño decide.
- Escritura atómica con funciones `security invoker` (respetan la RLS del dueño):
  - `public.guardar_traducciones_auto(p_tabla text, p_lote jsonb)`: lista blanca de tablas; por cada `{fila_id, idioma, campo, texto, huella}` hace `jsonb_set` solo si no existe o si el existente **no** es `manual`.
  - `public.guardar_traduccion_manual(p_tabla text, p_fila uuid, p_idioma text, p_campo text, p_texto text, p_huella text)`: pone `origen = 'manual'`.
  - `public.descartar_traduccion_manual(p_tabla, p_fila, p_idioma, p_campo)`: borra esa entrada (se retraducirá en automático).
- Al **borrar** una fila se borran sus traducciones con ella (están en la misma fila). Al borrar un grupo, ítem o variante de precio, la mutación limpia sus claves.

### 3.5 Funciones del esquema `privado` (v0.1)

| Función | Tipo | Para qué |
|---|---|---|
| `es_admin()` | sql stable, invoker | `coalesce((auth.jwt() -> 'app_metadata' ->> 'rol') = 'admin', false)` |
| `es_dueno_de(p_local uuid)` | sql stable, **definer** | `exists (select 1 from public.locales where id = p_local and dueno_id = auth.uid())` (definer para no recursar en la RLS) |
| `es_dueno_de_texto(p text)` | sql stable, definer | para Storage: false si `p` no es un uuid; si lo es, `es_dueno_de(p::uuid)` |
| `local_con_acceso(p_local uuid)` | sql stable, definer | regla de acceso activo (§3.2 `accesos`) |
| `local_visible(p_local uuid)` | sql stable, definer | `publicado and local_con_acceso` |
| `es_slug_reservado(p text)` | sql immutable | lista de `SLUGS_RESERVADOS` (§4.4) |
| `puede_crear_local()` | sql stable, definer | `count(*) < 1` locales del usuario |
| `precios_validos(jsonb)`, `menu_valido(jsonb)`, `horarios_validos(jsonb)` | immutable | validan la forma de los jsonb (CHECK) |
| Triggers | definer | `crear_perfil`, `crear_acceso_inicial`, `registrar_slug_anterior`, `comprobar_slug_libre`, `forzar_fecha_aceptacion`, `tocar_actualizado_en`, `limitar_filas` |

RPC públicas (invoker) de la v0.1: `activar_piloto(p_local)`, `reordenar(p_tabla text, p_ids uuid[])` (lista blanca `secciones|platos|menus`, máximo 200 ids, pone `orden` = posición; la RLS impide tocar filas ajenas), `cambiar_estado_acceso(p_local, p_estado)` (solo `vencido|cortesia`, para el admin).

### 3.6 Almacenamiento de imágenes (Supabase Storage)

- Bucket **`imagenes`**, **público** (las URLs se pueden ver sin sesión; así carga rápido y la CDN lo cachea). Límite **2 MB** por archivo; tipos permitidos `image/webp`, `image/png`, `image/jpeg`. **Nada de SVG** (podría llevar scripts).
- Rutas: logo `"<local_id>/logo/<aleatorio>.png"`; foto `"<local_id>/platos/<plato_id>/<aleatorio>.webp"`. Nombre aleatorio en cada subida para que la CDN no sirva la imagen vieja.
- El navegador reduce la imagen **antes** de subirla: fotos WebP de lado máximo 1200 px; logos **PNG** de lado máximo 512 px (los PDF no admiten WebP).
- Políticas en `storage.objects` (sin política de lectura anónima: el bucket público sirve las URLs, pero nadie puede **listar** carpetas ajenas):

| Operación | Política |
|---|---|
| INSERT | `to authenticated with check (bucket_id = 'imagenes' and privado.es_dueno_de_texto((storage.foldername(name))[1]) and (storage.foldername(name))[2] in ('logo','platos') and storage.extension(name) in ('png','webp','jpg'))` |
| SELECT | `to authenticated using (bucket_id = 'imagenes' and privado.es_dueno_de_texto((storage.foldername(name))[1]))` |
| UPDATE | igual en `using` y `with check` |
| DELETE | `to authenticated using (bucket_id = 'imagenes' and privado.es_dueno_de_texto((storage.foldername(name))[1]))` |

- La ruta que se guarda en la base de datos se valida en servidor (Zod): debe empezar por `<local_id>/logo/` o `<local_id>/platos/<plato_id>/`.

### 3.7 Reseñas (v0.3)

Migración `<timestamp>_resenas_v03.sql` (carril `datos-v03`). Tipos en `src/lib/tipos/resenas.ts`.

#### Columnas nuevas en `locales`
| Columna | Tipo | Reglas |
|---|---|---|
| `google_place_id` | text null | `~ '^[A-Za-z0-9_-]{10,300}$'`. El identificador de la ficha en Google. Google permite **guardarlo sin límite de tiempo** (es la única excepción a su política de caché). |
| `google_place_nombre` | text null | 1–120. **Etiqueta para el panel**: el nombre que el dueño confirmó al elegir su ficha («Cafetería La Guagua · Las Palmas»). Solo lo ve el dueño (no se concede a `anon`). Solo puede tener valor si `google_place_id` lo tiene (CHECK). Ver la duda D2 del plan sobre la política de caché de Google. |
| `google_enlace_resena` | text null | `~ '^https://g\.page/r/[A-Za-z0-9_-]{6,100}/review$'`. Alternativa sin la API de Google: el enlace oficial «Pedir reseñas» que Google da al dueño en su Perfil de Empresa. |
| `resenas_activas` | boolean not null default false | Enciende el botón de la carta. |

CHECKs de tabla:
- `num_nonnulls(google_place_id, google_enlace_resena) <= 1` — un solo destino a la vez (al guardar uno se borra el otro).
- `google_place_nombre is null or google_place_id is not null`.
- `not resenas_activas or num_nonnulls(google_place_id, google_enlace_resena) = 1` — no se puede encender el botón sin destino.

**Destino de la reseña** (`DestinoResena`, el mismo cálculo en SQL y en `urlEscribirResena()` de `src/lib/dominio/resenas.ts`):
- con `google_place_id` → `https://search.google.com/local/writereview?placeid=<place_id>` (formato de Google decidido en la Fase 0);
- con `google_enlace_resena` → ese enlace tal cual.

Permisos por columna (añadir a los `grant` existentes; **sin ellos la carta y `/r/` dejan de ver el dato**):
- `anon`: `grant select (google_place_id, google_enlace_resena, resenas_activas) on public.locales to anon;` — son datos públicos de Google; `google_place_nombre` **no**.
- `authenticated` (dueño, RLS de UPDATE ya existente): `grant update (google_place_id, google_place_nombre, google_enlace_resena, resenas_activas) on public.locales to authenticated;`. `select` ya está concedido para toda la tabla.
- Las políticas RLS de `locales` no cambian: el anónimo solo lee filas de cartas visibles; el dueño solo actualiza las suyas.

#### `uso_lugares` — freno de gasto del buscador de Google (como `uso_traduccion`)
| Columna | Tipo | Reglas |
|---|---|---|
| `local_id` | uuid not null | `references locales(id) on delete cascade` |
| `dia` | date not null | hora de Madrid |
| `peticiones` | integer not null default 0 | `>= 0` |
| | | PK `(local_id, dia)` |

RLS: SELECT dueño (`privado.es_dueno_de(local_id)`) · SELECT admin · **sin INSERT/UPDATE/DELETE** para nadie. Se escribe solo con:

`public.consumir_cuota_lugares(p_local uuid) returns boolean` (invoker, `grant execute … to authenticated`, revocado a `anon` y `public`) → `privado.consumir_cuota_lugares_def(p_local)` (definer, `set search_path = ''`): exige `privado.es_dueno_de(p_local)`; como mucho **50 peticiones por local y día** y **4.000 al mes entre todos los locales** (bajo los cupos gratis mensuales de Places API: 10.000 de Autocomplete y 5.000 de Place Details Pro); bloqueo de fila (`for update`) para que dos peticiones a la vez no se pasen; si cabe, suma 1 y devuelve true; si no, false. Cada llamada a Google (una búsqueda o un detalle) gasta 1.

`privado.limpiar_estadisticas()` (v0.2) se amplía con `create or replace` para borrar también filas de `uso_lugares` de más de 400 días.

#### Clics en «dejar reseña»
Sin tablas nuevas: `public.registrar_estadisticas(p_local, 'resena', 'es', '{}')` ya existe desde la v0.2 y suma `clics_resena + 1` en `estadisticas_dia` (solo si el local es visible). Lo llama `registrarClicResena()` desde `GET /r/[slug]` (§5.7). El canal `POST /api/e` **no** acepta `resena` (su esquema Zod solo admite `visita|vistas`).

#### Lectura pública del destino
No hay función nueva: `obtenerDestinoResena(slug)` (`src/lib/datos/resenas.ts`, `'use cache'`, cliente público) lee `id, slug, resenas_activas, google_place_id, google_enlace_resena` de `locales` por `slug` (la RLS solo deja ver cartas publicadas con acceso) y, si no la encuentra, busca el slug en `slugs_anteriores` (los QR impresos con una dirección vieja siguen funcionando). Etiquetas: `carta:<slug>` y `local:<id>`; `cacheLife("hours")`. Como `trasGuardarCarta` invalida esas etiquetas, encender o cambiar la ficha se nota al momento.

## 4. Rutas

### 4.1 Mapa

| Ruta | Tipo | Indexa | Versión | Módulo / carril |
|---|---|---|---|---|
| `/` | pública | sí | v0.0 → v0.4 venta | director → `portada` |
| `/legal/*` | pública | sí | v0.0 | director |
| `/c/[slug]` | pública, estática con caché | **sí, si** publicada + `permitir_indexar` + ≥ 5 platos visibles; si no, `noindex` | v0.1 | `carta-publica` |
| `/c/[slug]/[idioma]` | pública, estática | sí si el idioma está activo y ≥ 90 % de los nombres de plato están traducidos; si no, `noindex` | v0.2 | `carta-publica` |
| `/r/[slug]` | route handler `GET` (y `HEAD`): cuenta un clic anónimo y redirige **307** a Google; si el botón está apagado o el local no se ve, 307 a `/c/<slug>` sin contar | no (`X-Robots-Tag: noindex, nofollow`, `Disallow: /r/`, enlaces con `rel="nofollow"`) | v0.3 | `resenas` |
| `/entrar` | pública | no | v0.1 | `acceso` |
| `/auth/callback` | route handler (Google) | no | v0.1 | `acceso` |
| `/auth/salir` | route handler POST | no | v0.1 | `acceso` |
| `/auth/e2e` | route handler POST, **solo pruebas** | no | v0.1 | `acceso` |
| `/auth/error` | pública | no | v0.1 | `acceso` |
| `/panel` | privada: elige local o lleva a bienvenida | no | v0.1 | `panel-local` |
| `/panel/bienvenida` | privada: aceptar condiciones y crear el local | no | v0.1 | `panel-local` |
| `/panel/cuenta` | privada: correo, salir, condiciones aceptadas | no | v0.1 | `acceso` |
| `/panel/[local]` | privada: inicio (estado, lista de pasos, publicar) | no | v0.1 | `panel-local` |
| `/panel/[local]/carta` | privada: secciones y platos | no | v0.1 | `panel-carta` |
| `/panel/[local]/carta/plato/nuevo`, `/panel/[local]/carta/plato/[plato]` | privada: editor de plato | no | v0.1 | `panel-carta` |
| `/panel/[local]/menu`, `/panel/[local]/menu/[menu]` | privada: menús del día | no | v0.1 | `panel-carta` |
| `/panel/[local]/local` | privada: datos, horarios, logo, color | no | v0.1 | `panel-local` |
| `/panel/[local]/vista-previa` | privada: la carta tal como se verá | no | v0.1 | `carta-publica` |
| `/panel/[local]/qr` + `/panel/[local]/qr/pdf` (GET) | privada: QR y PDF | no | v0.1 | `qr-pdf` |
| `/panel/[local]/idiomas`, `/panel/[local]/idiomas/[idioma]` | privada | no | v0.2 | `panel-idiomas` |
| `/panel/[local]/estadisticas` | privada | no | v0.2 | `estadisticas` |
| `/panel/[local]/resenas` | privada: conectar la ficha de Google (buscar o pegar enlace), encender el botón, reglas, clics | no | v0.3 | `resenas` |
| `/panel/[local]/qr?…` + `/panel/[local]/qr/pdf?tipo=resena&formato=tarjetas\|tiras\|cartel` + `/panel/[local]/qr/svg?tipo=resena` | privada: QR de reseña en PDF y SVG | no | v0.3 | `qr-resena` |
| `/panel/[local]/suscripcion` | privada | no | v0.6 | `pagos` |
| `/admin` | privada, solo admin (si no, 404) | no | v0.1 | `admin` |
| `/api/health` | GET | no | v0.0 | director |
| `/api/e` | POST estadísticas | no | v0.2 | `estadisticas` |
| `/api/lugares` | `GET ?local=<uuid>&q=<texto>&sesion=<uuid>`: buscador de fichas de Google (con sesión, dueño del local, `RESENAS_API_ACTIVA`, cuota) | no | v0.3 | `resenas` |
| `/api/stripe/webhook` | POST | no | v0.6 | `pagos` |

`[local]` es el **uuid** del local (estable aunque cambie el slug). Todas las páginas privadas llevan `robots: { index: false, follow: false }` y están en `Disallow` de `robots.txt` (`/panel`, `/admin`, `/entrar`, `/auth`, `/api` y, desde la v0.3, `/r/`; lo añade el director en `src/app/robots.ts`). El proxy **no** corre en `/r/` ni en `/api/lugares` (su `matcher` no cambia): `/r/` no toca cookies y `/api/lugares` lee la sesión con `crearClienteServidor()` + `getClaims()` sin refrescarla.

### 4.2 Grupos de rutas y layouts

```
src/app/
  layout.tsx                 (director) <html lang="es">, fuentes, enlace «saltar al contenido»
  (web)/                     (director) cabecera y pie de Kartana: portada, legal, entrar
  (carta)/c/[slug]/…         (carta-publica) sin cabecera de Kartana; usa el color del local
  (panel)/layout.tsx         (acceso) barra superior mínima del panel
  (panel)/panel/[local]/layout.tsx  (acceso) navegación inferior del panel (Inicio, Carta, Menú, Local, QR…)
  (admin)/layout.tsx         (admin)
  auth/…                     (acceso)
  api/…
```

### 4.3 Patrones de datos con Cache Components (Next 16.4)

- **Carta pública** (`/c/[slug]`):
  - `obtenerCartaPublica(slug)` con `'use cache'`, `cacheTag("carta:<slug>")` (+ `"local:<id>"` si existe), `cacheLife("hours")`, y `crearClientePublico()` (sin cookies). La página no lee cookies, ni cabeceras, ni `searchParams`.
  - `generateStaticParams` devuelve `[{ slug: "demo" }]` (al menos uno es obligatorio).
  - `export const ensureStatic = "navigation"`: la primera visita a un slug no listado espera a la página completa, así `notFound()` devuelve un **404 real** (no un 200 con `noindex`). El carril lo comprueba con un test; si fallara, se documenta y se cae a `<Suspense>` + `noindex`.
  - Si `obtenerCartaPublica` da null: `buscarSlugActual(slug)` → si hay slug nuevo, `permanentRedirect` (308); si no, `notFound()`.
  - Al guardar en el panel: `trasGuardarCarta(localId)` → `updateTag("carta:<slug>")` y `updateTag("local:<id>")` (solo en acciones de servidor). En route handlers o `after()`: `revalidateTag(tag, { expire: 0 })`.
  - Caducidad por tiempo: con `cacheLife("hours")`, cuando vence una prueba la carta deja de verse como mucho en ~1 hora. Cuando el admin activa un piloto se invalida la etiqueta al momento.
- **Panel y admin**: páginas dinámicas. Toda lectura de sesión (`crearClienteServidor()`, `getClaims()`) va **dentro de `<Suspense>`**, nunca en el nivel superior de un layout. `obtenerUsuario()` usa `React.cache` para leer la sesión una vez por petición.
- **Reseñas (v0.3)**: la carta llama además a `obtenerDestinoResena(slug)` (cacheada con las mismas etiquetas) para saber si pinta el botón; `GET /r/[slug]` es dinámico (lee cabeceras de la petición), usa esa misma función cacheada para no consultar la base de datos en cada clic, y cuenta el clic con `after()` para no hacer esperar la redirección.
- **Acciones de servidor**: cada una valida con Zod, vuelve a comprobar al usuario (`getClaims()`), escribe con la sesión del usuario (RLS) y llama a `trasGuardarCarta` si cambia algo público. Nunca confía en un `localId` del formulario sin que la RLS lo respalde.

### 4.4 Slugs

- Formato: minúsculas, números y guiones; 3–40 caracteres; sin guion al principio, al final ni doble.
- **Reservados** (`SLUGS_RESERVADOS`, igual en TS y en `privado.es_slug_reservado`): `admin, api, app, auth, ayuda, blog, c, carta, cartas, contacto, demo, ejemplo, entrar, kartana, legal, login, panel, precios, privacidad, r, registro, salir, soporte, static, www, es, en, fr, de, ca, eu, gl, _next`.
- Cambiar el slug está permitido con un aviso fuerte en el panel («los QR impresos seguirán funcionando: redirigimos la dirección antigua»), gracias a `slugs_anteriores`.

## 5. Seguridad (decidida aquí)

### 5.1 Autenticación
- **Código de 6 cifras por correo** (OTP de Supabase): `signInWithOtp({ email, options: { shouldCreateUser: true } })` y `verifyOtp({ email, token, type: "email" })`, ambos en acciones de servidor con `crearClienteServidor()`. La plantilla de correo «Magic Link» de Supabase debe incluir `{{ .Token }}` (tarea del director). Supabase limita los envíos (un código por correo cada 60 s por defecto).
- **Entrar con Google**: acción de servidor con `signInWithOAuth({ provider: "google", options: { redirectTo: <sitio>/auth/callback?siguiente=… } })` y `redirect(data.url)`. Sin script de Google en la página. `/auth/callback` hace `exchangeCodeForSession(code)`.
- `siguiente` solo se acepta si empieza por `/` y no por `//` (evita redirecciones abiertas).
- Comprobación de usuario: siempre `supabase.auth.getClaims()` en servidor; **nunca** `getSession()`.
- **Aceptación de condiciones**: tras el primer acceso, `/panel/bienvenida` exige marcar «acepto las condiciones y la política de privacidad» y guarda dos filas en `aceptaciones_legales` con la versión vigente de `VERSIONES_LEGALES` y la fecha del servidor. Si sube la versión, el panel vuelve a pedirla.

### 5.2 Administrador (sin clave secreta)
- Doble llave: `app_metadata.rol = "admin"` (lo pone el director por SQL; el usuario **no** puede cambiar `app_metadata`, a diferencia de `user_metadata`) **y** correo incluido en `ADMIN_EMAILS` (servidor).
  ```sql
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"rol":"admin"}'
  where email = '<correo del admin>';
  ```
  El admin tiene que salir y volver a entrar para que su token lleve el rol.
- Las políticas de admin usan `privado.es_admin()`; la página `/admin` usa `exigirAdmin()` (si falla: `notFound()`, no revela que existe).
- **No hace falta la clave secreta** para la v0.1–v0.5. Sí en la v0.6 (webhook de Stripe) y para borrar cuentas desde la web (de momento, la baja se pide por correo y la hace el director).

### 5.3 Validación y datos
- Zod 4 en **todas** las acciones de servidor y route handlers (`src/lib/validacion/*`), además de los CHECK de SQL (doble barrera).
- Errores al usuario con códigos (`CodigoError`) traducidos por el diccionario; nunca el mensaje técnico.
- Textos del dueño: React escapa siempre; prohibido `dangerouslySetInnerHTML` salvo el JSON-LD (con `<` escapado).

> Añadido en la v0.2: función `public.platos_mas_vistos(p_local, p_desde, p_hasta, p_limite)` (invoker, solo `authenticated`) para el top de platos; las traducciones automáticas van en lotes de 500 elementos como máximo y cada texto traducido mide de 1 a 1.000 caracteres.

### 5.4 Estadísticas anónimas: vía de escritura segura (v0.2)
1. La carta (isla de cliente muy pequeña) envía con `navigator.sendBeacon("/api/e", json)` un evento `EventoEstadistica`: una «visita» al cargar y un lote de «vistas» de platos al ocultar la página. **Sin cookies, sin localStorage, sin identificadores.**
2. `POST /api/e` (route handler): rechaza cuerpos > 4 KB, valida con Zod, ignora agentes de bots conocidos, **no registra IP ni cabeceras**, y llama a `rpc("registrar_estadisticas", …)` con `crearClientePublico()`. Responde 204 siempre (no da pistas).
3. `public.registrar_estadisticas(p_local uuid, p_tipo text, p_idioma text, p_platos uuid[])` es `security invoker` y solo llama a `privado.registrar_estadisticas_def(...)` (`security definer`), que comprueba: local visible, `p_tipo in ('visita','vistas')`, idioma válido, `cardinality(p_platos) <= 100` y que cada plato es de ese local; después hace `insert … on conflict do update set visitas = visitas + 1` (o `vistas + 1`).
4. **No hay ninguna política INSERT/UPDATE** en las tablas de estadísticas: no se puede escribir en ellas directamente. La función RPC se puede llamar con la clave publicable igual que el route handler: el riesgo es que alguien infle contadores de un local, nunca leer ni tocar otros datos. Se acepta (son cifras orientativas).
5. Los clics en reseña (v0.3) se cuentan en `GET /r/[slug]`, que llama a la misma función con `p_tipo = 'resena'` (vía `registrarClicResena`, nunca vía `/api/e`) y redirige a Google. Detalle en §5.7.

### 5.5 Qué páginas nunca cargan terceros
- **Ninguna página** carga scripts de terceros en la v0.1–v0.5: ni analítica, ni fuentes externas, ni Google. «Entrar con Google» es una redirección, no un script.
- Las **cartas públicas** no ponen cookies (el proxy no corre en `/c/`), no usan `localStorage`/`sessionStorage` y solo hacen peticiones a la propia web (`/api/e`) y al bucket de imágenes de Supabase.
- Stripe (v0.6) solo con redirección a Stripe Checkout y al portal; nada de Stripe.js en el panel.
- **Google Places (v0.3)**: solo el **servidor** habla con `places.googleapis.com`. El panel nunca carga el script de Google Maps ni sus widgets: el buscador es un componente propio que llama a `/api/lugares` (misma web). La carta y `/r/` no llaman a Google: `/r/` solo responde con una redirección y es el móvil del cliente quien abre Google. La CSP no cambia.

### 5.7 Reseñas (v0.3)

**Reglas de producto** (`docs/brief.md` → «Reglas de reseñas»; se comprueban en tests y en QA):
1. **Igual para todos.** El botón de la carta y el QR de reseña llevan **directo** a Google. Nada de preguntas previas, estrellas, caras, «¿te ha gustado?», ni mostrarlo solo a algunos clientes (por idioma, por visitas, por hora…). El dueño **no** puede cambiar el texto del botón ni condicionarlo: solo encenderlo o apagarlo.
2. **Sin incentivos.** Ningún texto del producto, la carta o los carteles ofrece o sugiere descuentos, regalos, sorteos, invitaciones ni nada a cambio de una reseña. Lista de patrones prohibidos en `contieneTextoProhibidoResena()` (`src/lib/dominio/resenas.ts`), aplicada en tests a todos los textos que ve el cliente del bar (`botonResena` de los 7 diccionarios de la carta y textos de los PDF de reseña). Los textos del panel que **explican** las reglas al dueño quedan fuera de esa comprobación (dicen «no ofrezcas descuentos…»).
3. **Sin guiones.** No se pide mencionar a empleados ni contenido concreto.
4. **Kartana nunca escribe ni publica reseñas.** No hay ningún campo para escribir una reseña en la web.
5. Sin iconos de estrellas en el botón ni en los carteles (podrían leerse como «solo si es de 5»). Icono neutro (bocadillo de conversación) o ninguno.

**`GET /r/[slug]`** (`src/app/r/[slug]/route.ts`, carril `resenas`):
1. Valida `slug` con Zod (formato de slug). Si no encaja → 404 sin cuerpo útil.
2. `obtenerDestinoResena(slug)`. Si es null (no existe o no se ve) o `destino` es null (botón apagado) → **307 a `/c/<slug actual o pedido>`**, sin contar. Así un QR de reseña impreso nunca deja al cliente en una página rota.
3. Si hay destino: respuesta **307** con `Location: urlEscribirResena(destino)` y, **después** de responder (`after()`), `registrarClicResena(localId)` — salvo que la petición sea `HEAD`, una precarga (`Sec-Purpose`/`Purpose: prefetch`, `Next-Router-Prefetch`) o de un bot (`esBot()` de `src/lib/estadisticas/bots.ts`, que ya ignora los previsualizadores de enlaces como `facebookexternalhit`/WhatsApp si están en la lista).
4. Cabeceras siempre: `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer` (Google no sabe desde qué carta llega el cliente). **Nunca** `Set-Cookie`.
5. No lee, guarda ni registra IP, `user-agent` (más allá de decidir si es bot), `referer`, idioma ni parámetros: **solo suma 1** al contador del día. Ignora cualquier `?query`.
6. Los enlaces hacia `/r/` son `<a href>` normales con `rel="nofollow"` — **nunca** `next/link` (su precarga contaría clics falsos).

**`GET /api/lugares?local=&q=&sesion=`** (`src/app/api/lugares/route.ts`, carril `resenas`):
1. Si `RESENAS_API_ACTIVA` no es `"true"` → **404** `{ "error": "servicio_apagado" }` (el panel usa entonces solo «pegar enlace»).
2. Zod: `local` uuid, `q` 3–100 caracteres tras `trim`, `sesion` uuid v4 (token de sesión de Autocomplete que genera el navegador del dueño con `crypto.randomUUID()`). Si falla → 400 `datos_invalidos`.
3. Sesión con `crearClienteServidor()` + `getClaims()` → sin usuario: **401** (el panel dice «vuelve a cargar la página»: el proxy no corre en `/api`).
4. `consumirCuotaLugares(local)` (también prueba que es el dueño: si no, la RPC devuelve false) → false: **429** `cuota_agotada`.
5. `buscarLugares(q, sesion)` (`src/lib/resenas/places.ts`, `server-only`): `POST https://places.googleapis.com/v1/places:autocomplete` con cabeceras `X-Goog-Api-Key: GOOGLE_CLOUD_API_KEY` y `X-Goog-FieldMask: suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat`; cuerpo `{ input, sessionToken, includedRegionCodes: ["es"], languageCode: "es" }`; tiempo máximo 5 s; `cache: "no-store"`. Devuelve como mucho 5 `{ placeId, nombre, direccion }`.
6. Respuesta 200 `{ sugerencias }` con `Cache-Control: no-store, private`. Nunca registra `q` en los logs; errores de Google → 502 `error_servidor` sin el mensaje técnico.

**Elegir la ficha** (acción de servidor de la página `/panel/[local]/resenas`): Zod (`localId`, `placeId`, `sesion`) → `getClaims()` → interruptor → cuota → `detallesLugar(placeId, sesion)`: `GET https://places.googleapis.com/v1/places/<placeId>?sessionToken=<sesion>&languageCode=es` con `X-Goog-FieldMask: id,displayName` (cierra la sesión de Autocomplete y confirma que la ficha existe) → `guardarFichaGoogle({ destino: { tipo: "place_id", placeId: <id devuelto por Google> }, nombreFicha: displayName.text, activar: true })`.

**Pegar enlace (sin la API de Google)**: siempre disponible, también con `RESENAS_API_ACTIVA=false`. `interpretarEnlaceGoogle(texto)` acepta: (a) el enlace oficial `https://g.page/r/<código>/review` (se normaliza sin parámetros ni barra final), (b) un enlace `https://search.google.com/local/writereview?placeid=<id>`, (c) un enlace con `place_id:<id>` (`https://www.google.com/maps/place/?q=place_id:<id>`), (d) un place ID suelto (el que da el «Buscador de ID de sitio» de Google). Rechaza todo lo demás, incluidos `maps.app.goo.gl/…` y `goo.gl/maps/…` (no llevan el identificador; el panel explica dónde encontrar el enlace bueno). No se hace ninguna petición a Google para comprobarlo: el panel ofrece «Probar el enlace», que abre el destino directamente (sin pasar por `/r/`, para no contar clics del dueño).

**Clave de Google**: la misma `GOOGLE_CLOUD_API_KEY` de la traducción, restringida en Google Cloud a **Cloud Translation API** y **Places API (New)**. Solo se lee en el servidor (`src/lib/resenas/places.ts` y `src/lib/traduccion/*`), nunca con prefijo `NEXT_PUBLIC_`. Sin la clave o con el interruptor apagado, todo lo de reseñas funciona con «pegar enlace».

**Atribución de Google**: las sugerencias de Places mostradas sin mapa deben llevar la atribución de Google según su política vigente (el carril la comprueba en `https://developers.google.com/maps/documentation/places/web-service/policies`). Si hace falta el logotipo, se sirve desde la propia web (`public/resenas/`), nunca desde Google.

### 5.6 Pruebas de navegador con sesión (sin clave secreta)
- El director crea en Supabase un **usuario de prueba con contraseña** (Authentication → Users → Add user, con «Auto Confirm») y otro **admin de prueba** (con el rol por SQL). Contraseñas largas aleatorias en `.env.local` y en los secretos de GitHub: `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.
- `POST /auth/e2e` (carril acceso) inicia sesión con `signInWithPassword` **en el servidor** y deja las cookies de sesión. Solo responde si `E2E_ACCESO === "true"` **y** la app **no** corre en Vercel (`!process.env.VERCEL`); en cualquier otro caso, 404. Recibe `{ quien: "dueno" | "admin" }` y usa las credenciales del entorno (nunca del cuerpo).
- Playwright: un proyecto `setup` (`e2e/sesion.setup.ts`) llama a esa ruta **una vez por ejecución** y guarda `e2e/.auth/dueno.json` y `e2e/.auth/admin.json` (`storageState`); los demás proyectos lo reutilizan. `e2e/.auth/` va en `.gitignore`.
- El local del usuario de prueba lleva acceso `cortesia` (no caduca) y slug `e2e-prueba`; lo prepara el director por SQL.

## 6. Módulos

| Módulo | Qué hace | Carpeta principal | Carril |
|---|---|---|---|
| Datos y dominio | Migraciones, RLS, Storage, consultas y mutaciones tipadas, validación Zod, utilidades puras (precios, slugs, contraste, horarios) | `supabase/`, `src/lib/datos/`, `src/lib/dominio/`, `src/lib/validacion/` | `datos` |
| Contenido | Iconos de alérgenos, diccionarios de la carta en 7 idiomas, carta de demostración | `src/componentes/alergenos/`, `src/lib/i18n/carta.*.ts`, `supabase/semillas/` | `contenido` |
| Acceso y base del panel | Entrar (código y Google), sesión, aceptación, armazón del panel, componentes de interfaz, subida de imágenes | `src/lib/auth/`, `src/app/(panel)/layout.tsx`, `src/componentes/ui/` | `acceso` |
| Panel: local | Bienvenida, inicio, datos del local, horarios, logo, color, publicar | `src/app/(panel)/panel/…` | `panel-local` |
| Panel: carta | Secciones, platos, editor con alérgenos y variantes, agotado, orden, menús del día | `src/app/(panel)/panel/[local]/carta|menu` | `panel-carta` |
| Carta pública | `/c/…`, vista previa, filtro de alérgenos, JSON-LD | `src/app/(carta)/`, `src/componentes/carta/` | `carta-publica` |
| QR y PDF | Pantalla de QR, PDF de mesa, pegatina y póster | `src/lib/qr/`, `…/qr/` | `qr-pdf` |
| Admin | Lista de locales, piloto de 60 días | `src/app/(admin)/` | `admin` |
| Traducción (v0.2) | Google Translate, huellas, planificación, cuota | `src/lib/traduccion/` | `traduccion` |
| Estadísticas (v0.2) | `/api/e`, página del panel | `src/app/api/e/`, `…/estadisticas/` | `estadisticas` |
| Reseñas: datos (v0.3) | Columnas de reseñas, cuota del buscador, destino público, reglas puras (enlaces de Google, textos prohibidos) | `supabase/`, `src/lib/datos/resenas.ts`, `src/lib/dominio/resenas.ts`, `src/lib/validacion/resenas.ts` | `datos-v03` |
| Reseñas (v0.3) | Cliente de Places, `/api/lugares`, `/r/[slug]`, página `/panel/[local]/resenas` | `src/lib/resenas/`, `src/app/api/lugares/`, `src/app/r/`, `…/resenas/` | `resenas` |
| Botón de reseña en la carta (v0.3) | `BotonResena` al final de la carta, igual para todos | `src/componentes/carta/` | `carta-publica-v03` |
| QR de reseña (v0.3) | PDF de tarjetas para la cuenta, tiras para el ticket y cartel de barra; SVG | `src/lib/qr/`, `…/qr/` | `qr-resena` |
| Pagos (v0.6) | Stripe | `src/lib/pagos/` | `pagos` |

Textos: un diccionario por módulo en `src/lib/i18n/<modulo>.<idioma>.ts` (el panel solo en español por ahora). La carta pública usa `carta.<xx>.ts` en los 7 idiomas.

## 7. Integraciones externas y límites

| Servicio | Uso | Límite / coste | Cómo se protege |
|---|---|---|---|
| Supabase (plan gratis) | Base de datos, Auth, Storage | 500 MB BD, 1 GB Storage, 5 GB salida/mes, 50.000 usuarios activos/mes; se pausa tras 7 días sin actividad | Cron diario `/api/health`; fotos reducidas en el navegador; carta cacheada |
| Supabase Auth + SMTP de Gmail | Códigos por correo | Gmail ~500 correos/día; Supabase limita reenvíos | Un código cada 60 s por correo |
| Google OAuth | Entrar con Google | Gratis | Solo redirección |
| Vercel Hobby | Web | Uso no comercial: pasar a Pro antes de cobrar (v0.4 en producción) | — |
| Google Cloud Translation v2 (NMT básico) | Traducir cartas (v0.2) | 500.000 caracteres/mes gratis; luego 20 $/millón | `TRADUCCION_ACTIVA`; solo lo que cambia (huellas); cuota 60.000/día/local y 450.000/mes global; clave solo en servidor (`GOOGLE_CLOUD_API_KEY`), restringida a la API de Translation |
| Google Places API (New) | Buscar la ficha y su `place_id` (v0.3) | Cupos gratis mensuales (Autocomplete 10.000; Place Details Pro 5.000). Autocomplete con token de sesión; Place Details con `id,displayName` cierra la sesión | `RESENAS_API_ACTIVA`; solo servidor; route handler con sesión y dueño; **cuota en base de datos** (`uso_lugares`: 50/local/día, 4.000/mes en total); mínimo 3 letras y espera de 350 ms al teclear; presupuesto de 5 € con alertas. Alternativa sin Google: pegar el enlace |
| Google Business Profile API | Reseñas en el panel (v0.5) | Requiere aprobación de Google | Interruptor; OAuth por dueño |
| Stripe | Suscripciones (v0.6) | 1,5 % + 0,25 € por cobro | `PAGOS_ACTIVOS`; clave secreta solo en servidor; webhook firmado |
| `@react-pdf/renderer` 4.x + `qrcode` 1.5.x | PDF de QR (v0.1) | Librerías locales, sin red | Solo servidor (route handler `runtime = "nodejs"`) |

## 8. Riesgos técnicos conocidos

1. **`ensureStatic = "navigation"` y 404**: comprobar en el build que un slug inexistente da 404 y que un slug nuevo se ve tras publicar (test e2e obligatorio en `carta-publica`).
2. **Caché en Vercel**: `updateTag` debe invalidar en todas las regiones; el test «marco agotado → la carta lo muestra» se ejecuta también contra el despliegue.
3. **Dominio**: los QR llevan la dirección de Vercel hasta tener kartana.app. Si se imprimen QR del piloto antes del dominio propio, la redirección desde Vercel debe mantenerse para siempre.
4. **Fotos huérfanas**: si falla el borrado en el bucket tras borrar un plato, queda el archivo. Aceptable; limpieza manual ocasional.
5. **Contadores inflables**: aceptado (§5.4).
6. **Columnas nuevas y permisos por columna**: olvidar el `grant` hace que la carta deje de mostrar ese dato. Los tests SQL del carril de datos lo comprueban.
7. **Enlace `writereview?placeid=`**: es el formato que usa Google, pero no está documentado como API estable; hay informes de errores puntuales. Mitigación: el dueño puede usar en su lugar el enlace oficial `g.page/r/…/review` de su Perfil de Empresa, y como todos los QR apuntan a `/r/<slug>`, cambiar el destino no obliga a reimprimir nada.
8. **`place_id` caducado**: Google recomienda refrescar los `place_id` de más de 12 meses (pueden cambiar). En la v0.3 no se refrescan solos; si un dueño avisa de que el enlace falla, vuelve a elegir su ficha. Refresco automático (Place Details con solo `id`, gratis) anotado para más adelante.
9. **Clics inflables** en `/r/`: igual que las visitas (§5.4), aceptado: son cifras orientativas y no dan acceso a nada.
10. **Política de caché de Google** sobre `google_place_nombre`: ver duda D2 del plan.
