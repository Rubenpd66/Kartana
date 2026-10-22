# Carril `datos` · v0.1 · Ola 1

> Agente recomendado: `kit-datos` · modelo **opus**, esfuerzo **high**. Es el camino crítico: las olas 2 y 3 usan todo lo que entregas.

## Objetivo

Crear la base de datos de la v0.1 con seguridad RLS completa, el almacenamiento de imágenes, y la capa TypeScript que el resto de carriles usa para leer y escribir: utilidades puras del dominio, esquemas Zod, consultas, mutaciones e invalidación de caché. Nadie más escribe SQL ni habla con las tablas directamente (salvo `acceso`, que lee y escribe `perfiles`/`aceptaciones_legales` con su propio código).

## Archivos propios

- `supabase/migrations/<timestamp>_modelo_v01.sql` y `supabase/migrations/<timestamp>_imagenes_v01.sql` (créalos con `npx supabase migration new <nombre>`)
- `supabase/tests/**` (tests SQL y su `README.md`)
- `src/lib/dominio/**` — `alergenos.ts`, `etiquetas.ts`, `precios.ts`, `limites.ts`, `slugs.ts`, `contraste.ts`, `horarios.ts`, `traducir.ts`, `acceso.ts`, `carta.ts`, `imagenes.ts` (+ tests)
- `src/lib/validacion/**` — `local.ts`, `carta.ts`, `menu.ts`, `comun.ts` (+ tests)
- `src/lib/datos/**` — `filas.ts`, `mapeos.ts`, `publico.ts`, `panel.ts`, `mutaciones.ts`, `admin.ts`, `cache.ts` (+ tests). `database.types.ts` lo genera el director tras aplicar la migración; desde entonces es tuyo.

## Contratos

**Usa**: `src/lib/tipos/dominio.ts`, `carta.ts`, `cuentas.ts`, `resultado.ts`, `contratos.ts` (bloques «CARRIL datos»). Clientes de `src/lib/supabase/`.

**Produce** (exactamente estos nombres y firmas, ver `src/lib/tipos/contratos.ts`):
- `src/lib/dominio/*`: `ALERGENOS`, `ETIQUETAS`, `FORMATOS_PRECIO`, `LIMITES`, `SLUGS_RESERVADOS`, `SLUG_DEMO`, `normalizarSlug`, `validarSlug`, `formatearPrecio`, `ratioContraste`, `colorMarcaValido`, `colorTextoSobre`, `resumirHorarios`, `elegirTexto`, `calcularAccesoEfectivo`, `convertirACartaPublica`, `urlPublicaImagen`, `rutaNuevoLogo`, `rutaNuevaFotoPlato`. **Sin `server-only`** (se usan también en el navegador).
- `src/lib/validacion/*`: esquemas Zod `esquemaCrearLocal`, `esquemaLocal`, `esquemaHorarios`, `esquemaLogo`, `esquemaPublicar`, `esquemaSeccion`, `esquemaPlato`, `esquemaAgotado`, `esquemaOrden`, `esquemaMenu`, cada uno `satisfies z.ZodType<EntradaX>`. Exporta también `erroresPorCampo(error: z.ZodError): Record<string, string>` (códigos cortos: `requerido`, `demasiado_largo`, `formato`, `fuera_de_rango`, `duplicado`).
- `src/lib/datos/publico.ts`: `obtenerCartaPublica`, `buscarSlugActual`, `listarCartasIndexables`.
- `src/lib/datos/panel.ts`: `listarMisLocales`, `obtenerLocalDelDueno`, `obtenerCartaDelDueno`, `obtenerPlatoDelDueno`, `obtenerMenuDelDueno`, `obtenerAccesoDelLocal`, `comprobarSlug`.
- `src/lib/datos/mutaciones.ts`: `crearLocal`, `actualizarLocal`, `guardarHorarios`, `guardarLogo`, `publicarLocal`, `guardarSeccion`, `borrarSeccion`, `guardarPlato`, `borrarPlato`, `cambiarAgotado`, `reordenar`, `guardarMenu`, `borrarMenu`.
- `src/lib/datos/admin.ts`: `listarLocalesAdmin`, `activarPiloto`, `cambiarEstadoAcceso`.
- `src/lib/datos/cache.ts`: `etiquetaCarta`, `etiquetaLocal`, `ETIQUETA_LISTA_CARTAS`, `trasGuardarCarta`, `revalidarCartaFueraDeAccion`.

## El modelo (resumen; detalle completo en `docs/arquitectura.md` §3)

Tablas v0.1: `perfiles`, `aceptaciones_legales`, `locales`, `slugs_anteriores`, `accesos`, `secciones`, `platos`, `menus`. Bucket `imagenes`. Esquema `privado` (ya existe; hoy tiene `revoke all` para `anon`/`authenticated`: concede `usage` y `execute` solo en las funciones que usan las políticas).

Puntos que suelen fallar, revísalos uno a uno:
- **Una política por operación** y por perfil (anónimo, dueño, admin), con `TO anon`/`TO authenticated`, `(select auth.uid())`, y `UPDATE` con `USING` y `WITH CHECK`.
- Funciones `security definer` solo en `privado`, con `set search_path = ''` y nombres calificados (`public.locales`, `auth.uid()`).
- `es_dueno_de` como definer para evitar recursión de RLS entre `locales` y sus hijos.
- Permisos por columna: `anon` no ve `locales.dueno_id`; `authenticated` solo actualiza las columnas permitidas de `locales` y `perfiles`. **Cada columna nueva necesita su `grant`.**
- Slugs reservados en las políticas INSERT/UPDATE (no en un CHECK), para que la semilla pueda crear `demo`.
- `platos.precios` (variantes de venta): array **ordenado de 1 a 6** `{id, formato, texto, centimos}` validado por `privado.precios_validos(jsonb)`: `id` `^[a-z0-9]{4,12}$` único dentro del plato; `formato` en la lista de `FormatoPrecio`; `texto` obligatorio (1–30) solo con `otro`; `centimos` entero 0–100000 o null («según mercado»); `unico` solo si es la única variante; formatos no repetidos salvo `otro` con textos distintos. El caso más común en los bares es **media ración + ración** (`media_racion`, `racion`), después `racion_mediana`/`racion_grande`, `unidad` y `media_docena`/`docena`.
- FK compuesta `platos (seccion_id, local_id) → secciones (id, local_id)`.
- Triggers: `crear_perfil` (en `auth.users`), `crear_acceso_inicial` (prueba de 30 días una sola vez por persona, si no `vencido`), `registrar_slug_anterior`, `comprobar_slug_libre`, `forzar_fecha_aceptacion`, `tocar_actualizado_en`, `limitar_filas` (40 secciones, 400 platos, 10 menús por local).
- Storage: bucket público `imagenes` (2 MB, `image/webp|png|jpeg`), cuatro políticas en `storage.objects` con `privado.es_dueno_de_texto((storage.foldername(name))[1])`, sin política de lectura anónima. Inserta el bucket con `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (...) on conflict (id) do nothing` (comprueba las columnas en la documentación vigente de Supabase Storage).
- RPC `security invoker`: `activar_piloto(p_local uuid)`, `cambiar_estado_acceso(p_local uuid, p_estado text)`, `reordenar(p_tabla text, p_ids uuid[])`.
- No uses `drop … if exists` innecesarios (el servidor pide una confirmación aparte que aquí se rechaza).

## Cómo probar el SQL sin base de datos local

No hay Docker ni base de datos local. Los tests SQL son scripts en `supabase/tests/` que crean usuarios falsos en `auth.users`, cambian de rol (`set local role authenticated; set local request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}'`; para anónimo `set local role anon`) y comprueban con `do $$ … if … then raise exception 'FALLO: …'; end if; $$`.
- **Si el director lo ha autorizado** (decisión 4 del plan), puedes ejecutarlos tú con la herramienta `execute_sql` del MCP de Supabase **siempre envueltos** en `begin; <migración>; <tests>; rollback;` en una sola llamada, para no dejar nada. **Nunca** uses `apply_migration`.
- Si no está autorizado, déjalos listos y documenta en `supabase/tests/README.md` cómo ejecutarlos; el director los pasa en la integración.

## Tareas (en orden; cada una empieza por su test)

1. **Utilidades del dominio** (`src/lib/dominio/*`).
   Test primero: `alergenos.test.ts` (14 códigos, sin repetidos, coinciden con `CodigoAlergeno`), `slugs.test.ts` (`normalizarSlug("Bar Pepe's & Co.") === "bar-pepes-co"`, acentos y ñ → `n`, recorta a 40, `validarSlug` rechaza reservados y formatos malos), `precios.test.ts` (`formatearPrecio(1250, "es-ES") === "12,50 €"`; en `en` usa el formato inglés con €), `contraste.test.ts` (`#b9461a` válido contra blanco; `#f5d000` no), `horarios.test.ts` (agrupa L–V con la misma franja; franja que cruza medianoche), `traducir.test.ts` (devuelve traducción si existe; original y `esOriginal: true` si no), `acceso.test.ts` (prueba vigente, prueba caducada, cortesía sin fecha, vencido), `carta.test.ts` (convertir quita lo no visible, ordena, quita secciones vacías), `imagenes.test.ts` (rutas con el formato exacto de la arquitectura).
2. **Esquemas Zod** (`src/lib/validacion/*`).
   Test primero: casos válidos e inválidos por esquema; en especial `esquemaPlato` con precios: un solo `unico`; `media_racion` + `racion`; `otro` sin texto (error); `unico` junto a otra variante (error); 7 variantes (error); céntimos negativos o decimales (error); `null` («según mercado») válido. `esquemaLocal` rechaza colores sin contraste. Rutas de imagen: solo dentro de la carpeta del local (y del plato).
3. **Migración del modelo** (`<ts>_modelo_v01.sql`).
   Test primero: `supabase/tests/01_rls_v01.sql` con, como mínimo: anónimo ve un local publicado con acceso y **no** ve uno sin publicar ni uno con prueba caducada; anónimo no ve `dueno_id`; anónimo no puede insertar ni actualizar en ninguna tabla; dueño A no ve ni cambia nada del dueño B; dueño no puede cambiar `accesos` ni `dueno_id`; admin (claim `app_metadata.rol = admin`) ve todos los locales y puede `activar_piloto`; un no admin que llama a `activar_piloto` no cambia nada; slug reservado rechazado para un usuario; segundo local del mismo usuario rechazado; plato con `seccion_id` de otro local rechazado; `precios` mal formados rechazados por el CHECK; la prueba gratis no se concede dos veces; `aceptada_en` la fija el servidor.
4. **Migración de Storage** (`<ts>_imagenes_v01.sql`).
   Test primero: `supabase/tests/02_storage_v01.sql` (inserción simulada en `storage.objects` como dueño en su carpeta → permitida; en carpeta de otro local → denegada; extensión `svg` → denegada).
5. **Filas y mapeos** (`filas.ts` con tipos `snake_case` de cada tabla mientras no exista `database.types.ts`; `mapeos.ts` con `filaALocal`, `filaAPlato`…).
   Test primero: `mapeos.test.ts` con filas de ejemplo → objetos de `src/lib/tipos/carta.ts`.
6. **Consultas públicas** (`publico.ts`, `import "server-only"`): `'use cache'`, `cacheTag(etiquetaCarta(slug))` y, si existe, `cacheTag(etiquetaLocal(id))`, `cacheLife("hours")`, `crearClientePublico()`, una sola consulta anidada (`locales` + `secciones` + `platos` + `menus`) pidiendo **solo columnas públicas**; ordena y quita secciones vacías; URLs absolutas de logo y fotos con `urlPublicaImagen`. `listarCartasIndexables`: locales visibles con `permitir_indexar` y ≥ 5 platos visibles (en la v0.1 solo `["es"]`), etiqueta `ETIQUETA_LISTA_CARTAS`.
   Test primero: con un cliente de Supabase simulado (`vi.mock("@/lib/supabase/servidor")` y `vi.mock("next/cache")`), comprueba el mapeo, el orden, que se llama a `cacheTag` con las etiquetas correctas y que devuelve null si la consulta no trae nada.
7. **Consultas del panel** (`panel.ts`): con `crearClienteServidor()`; `obtenerCartaDelDueno` trae también lo oculto; `comprobarSlug` mira formato, reservados, `locales` y `slugs_anteriores` (de otro local).
   Test primero, con cliente simulado.
8. **Caché** (`cache.ts`): `trasGuardarCarta(localId, { slugAnterior?, listaCartas? })` lee el slug y llama a `updateTag` de `etiquetaCarta(slug)`, `etiquetaLocal(localId)`, la del slug anterior si se pasa y `ETIQUETA_LISTA_CARTAS` si `listaCartas`. `revalidarCartaFueraDeAccion` hace lo mismo con `revalidateTag(tag, { expire: 0 })`.
   Test primero: con `next/cache` simulado.
9. **Mutaciones** (`mutaciones.ts`): cada función valida con su esquema Zod, comprueba la sesión con `getClaims()` (`no_autenticado` si no hay), escribe con `crearClienteServidor()`, traduce errores de Postgres a `CodigoError` (`23505` en slug → `slug_ocupado`; violación de RLS o 0 filas → `sin_permiso`/`no_encontrado`; trigger de límite → `limite_alcanzado`), y llama a `trasGuardarCarta`. Reglas: `guardarPlato` con `esNuevo: true` inserta (con el `platoId` recibido si viene, que debe ser un uuid; si ya existe → `conflicto`) y con `esNuevo: false` actualiza; asigna `id` a las variantes nuevas (`crypto.randomUUID()` recortado a 8 `[a-z0-9]`) y conserva las existentes; si cambia la foto, borra la anterior del bucket; `borrarPlato`/`borrarSeccion` borran también las fotos; `guardarLogo` borra el logo anterior; `actualizarLocal` pasa `slugAnterior` y `listaCartas: true` si cambia el slug o `permitirIndexar`; `publicarLocal` pasa `listaCartas: true`; `guardarMenu` asigna ids a grupos e ítems nuevos.
   Test primero: por función, caso feliz, datos inválidos (`datos_invalidos` con `campos`), sin sesión, y error de Postgres traducido.
10. **Admin** (`admin.ts`): `listarLocalesAdmin` (locales + correo del dueño + acceso + número de platos), `activarPiloto` (RPC `activar_piloto`; si devuelve vacío → `sin_permiso`; luego `revalidarCartaFueraDeAccion` o `trasGuardarCarta`), `cambiarEstadoAcceso`.
    Test primero, con cliente simulado.
11. **README de tests SQL** y repaso final: `get_advisors` no se puede pasar sin aplicar; deja en el informe la lista de comprobaciones que debe hacer el director tras aplicar (advisors de seguridad y rendimiento, índices de las FK).

## Criterios de terminado

- Las dos migraciones son idempotentes donde se pueda (`create … if not exists` en tipos/índices, `on conflict do nothing` en el bucket) y siguen todas las reglas de RLS de arriba.
- `supabase/tests/*.sql` cubre los casos listados y pasa (o está listo para que lo pase el director).
- Todas las firmas de `src/lib/tipos/contratos.ts` del bloque «CARRIL datos» están implementadas con esos nombres.
- Cobertura de tests en `src/lib/dominio` y `src/lib/validacion` de casi todo el código; mutaciones con al menos los cuatro casos por función.
- Lint, tipos, tests y build en verde.

## No toques

`src/lib/supabase/*`, `src/lib/config/*`, `src/lib/tipos/*`, `src/lib/auth/*` (es de `acceso`), páginas de `src/app/`, `package.json`, la migración existente `20261022153213_base_seguridad_y_salud.sql`, la configuración de Supabase.

## Contexto del proyecto (para quien no ha leído nada más)

**Kartana** es un SaaS para bares y restaurantes pequeños de España: carta digital con QR siempre al día (14 alérgenos UE, 7 idiomas) y, más adelante, un botón limpio para pedir reseñas en Google. El dueño usa el panel **desde el móvil, con prisa**; el cliente del bar abre la carta escaneando un QR, a veces con mala cobertura y a veces siendo turista.

- Repositorio: `C:\Users\RUBEN\carta-qr` (git, rama `main`). Web de pruebas: https://kartana-six.vercel.app
- Stack: **Next.js 16.4** (App Router, **Cache Components** y Partial Prefetching activados, `src/proxy.ts`), React 19.3, TypeScript estricto, Tailwind 4, **Zod 4**, Supabase (Postgres + Auth + Storage, proyecto `iewlsyvdkxzcncrbhpyx`, eu-central-1), Vercel. Versiones exactas en `package.json`.
- Documentos de referencia (léelos si necesitas más detalle, pero este encargo basta): `docs/arquitectura.md` (modelo de datos, RLS, rutas), `docs/propiedad.md` (de quién es cada archivo), `src/lib/tipos/*.ts` (contratos).
- Ya existen y **no los modifiques**: clientes de Supabase en `src/lib/supabase/` — `crearClienteServidor()` (con la sesión por cookies; quien lo use debe estar dentro de `<Suspense>`), `crearClientePublico()` (anónimo, sin cookies, para `'use cache'`), `crearClienteNavegador()` (componentes de cliente), `crearClienteAdmin()` (**no usar**: no hay clave secreta). `leerInterruptores()` en `src/lib/config/interruptores.ts`. Idiomas en `src/lib/i18n/idiomas.ts` (`IDIOMAS_CARTA`, `rutaCarta(slug, idioma)`). `urlSitio()` en `src/lib/config/sitio.ts`. `VERSIONES_LEGALES` en `src/lib/legal/documentos.ts`. `<Contenedor ancho="estrecho|ancho">` en `src/componentes/Contenedor.tsx`.

## Reglas técnicas obligatorias

1. **Lee la documentación instalada** de Next en `node_modules/next/dist/docs/` antes de usar una API de Next (esta versión cambia cosas). Para Supabase y librerías, documentación oficial (Context7). No inventes APIs.
2. **Cache Components**: leer `cookies()`, `headers()` o la sesión fuera de `<Suspense>` es error de build. No pongas lecturas de sesión en el nivel superior de un layout. Los datos públicos van con `'use cache'` + `cacheTag`; nunca leas cookies dentro de `'use cache'`.
3. **Sesión**: en servidor, siempre `supabase.auth.getClaims()`; **nunca** `getSession()`. El proxy no protege nada: cada página y cada acción comprueba al usuario cerca de los datos.
4. **Validación con Zod en el servidor** en cada acción de servidor y route handler, aunque el formulario ya valide en el navegador. Errores al usuario como `CodigoError` (`src/lib/tipos/resultado.ts`) traducidos por tu diccionario; nunca el mensaje técnico.
5. **Seguridad**: nada de scripts de terceros; nada de `dangerouslySetInnerHTML` (salvo JSON-LD con `<` escapado); ningún secreto en el navegador; nada de cookies ni `localStorage` en la carta pública.
6. **Textos**: todos en el diccionario de tu módulo (`src/lib/i18n/<modulo>.es.ts`, un objeto `as const`). Español sencillo y cercano, de tú al dueño. Nada de textos sueltos en componentes.
7. **Estilo**: tokens de Tailwind (`bg-fondo`, `bg-superficie`, `bg-superficie-suave`, `text-texto`, `text-texto-suave`, `border-borde`, `bg-primario`, `hover:bg-primario-hover`, `text-sobre-primario`, `text-exito`, `text-aviso`, `text-peligro`, `font-titulo`). Ningún color suelto. Ancho de página solo con `<Contenedor>`; no escribas `max-w-*` de página. Móvil primero: botones y zonas táctiles de **al menos 48 px** de alto (`min-h-12`), letra base 17 px, foco visible, respeta «reducir movimiento». Toma como referencia las maquetas de `docs/diseno/`.
8. **TDD**: escribe primero el test (Vitest, `*.test.ts(x)` junto al código; para módulos con `import "server-only"` usa `vi.mock("server-only", () => ({}))`), míralo fallar, implementa, míralo pasar. Un test de navegador (Playwright, `e2e/`) por flujo cuando tu encargo lo pida; las pruebas de navegador usan el build de producción (`npm run build` antes) y el puerto 3100; el proyecto móvil solo corre tests con `@movil` en el título.
9. **Accesibilidad**: etiquetas en todos los campos, `aria-live` para mensajes de estado, contraste AA, orden de tabulación lógico, nada que dependa solo del color.

## Forma de trabajar

- Trabaja en tu rama o worktree (`carril/<nombre-del-carril>`). **Un commit por tarea**, mensaje en español claro. **No fusiones ni hagas `push` a `main`.**
- Toca **solo tus archivos** (lista de arriba). Si te hace falta cambiar un archivo que no es tuyo (compartido o de otro carril, incluido `package.json`, `src/lib/tipos/*`, `next.config.ts`, `globals.css`, `playwright.config.ts`), **no lo cambies**: escríbelo en tu informe final.
- Si un contrato de `src/lib/tipos/` no te encaja, no lo cambies: adapta tu código si puedes y pide el cambio en el informe.
- No apliques migraciones al proyecto remoto, no cambies la configuración de Supabase ni de Vercel: lo hace el director.

## Comandos de verificación (todos en verde antes de terminar)

```
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e        # si tu carril tiene pruebas de navegador (necesita el build)
```

## Informe final (tu última respuesta)

1. Qué has hecho, tarea por tarea, con sus commits.
2. Archivos creados o cambiados (todos deben ser tuyos).
3. Resultado de cada comando de verificación (pega el resumen).
4. **Cambios compartidos pedidos**: para cada uno, archivo, cambio exacto (fragmento o diff) y motivo. Incluye dependencias npm que necesites, variables de entorno nuevas y configuración de Supabase/Vercel.
5. Riesgos, dudas y lo que queda pendiente.
