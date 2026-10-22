# Carril `datos-v02` · v0.2 · Ola 1

> Agente recomendado: `kit-datos` · modelo **opus**, esfuerzo **medium**.

## Objetivo

Preparar la base de datos y la capa de datos para los **7 idiomas** (traducciones que nunca pisan una corrección manual, cuota de traducción) y para las **estadísticas anónimas** (contadores por día escritos solo a través de una función con comprobaciones, sin permitir inserciones anónimas en tablas).

## Archivos propios

- `supabase/migrations/<timestamp>_idiomas_estadisticas_v02.sql`
- `supabase/tests/03_traducciones_v02.sql`, `supabase/tests/04_estadisticas_v02.sql`
- `src/lib/datos/traducciones.ts`, `src/lib/datos/estadisticas.ts` (+ tests)
- Cambios en `src/lib/datos/filas.ts`, `mapeos.ts`, `panel.ts`, `publico.ts`, `database.types.ts` (si cambian), `src/lib/validacion/**`, `src/lib/dominio/**`
- **No** es tuyo `src/lib/datos/cache.ts` (pasa al carril `traduccion` en la v0.2).

## Contratos

**Usa**: el modelo v0.1 ya aplicado; `src/lib/tipos/dominio.ts` (`Traducciones`, `TextoTraducido`, `TablaTraducible`, campos traducibles incluido `precio.<id>.texto`), `traduccion.ts`, `estadisticas.ts`, `contratos.ts` (bloque «v0.2 · CARRIL datos-v02»).

**Produce** (firmas en `src/lib/tipos/contratos.ts`):
- `src/lib/datos/traducciones.ts`: `listarTextosTraducibles`, `guardarTraduccionesAuto`, `guardarTraduccionManual`, `descartarTraduccionManual`, `actualizarIdiomasActivos`, `consumirCuotaTraduccion`.
- `src/lib/datos/estadisticas.ts`: `registrarEvento`, `obtenerResumenEstadisticas`.
- `src/lib/validacion/idiomas.ts`: `esquemaIdiomas`, `esquemaTraduccionManual`, `esquemaEventoEstadistica` (este último lo usará el route handler `/api/e`; máximo 100 platos, ids uuid, idioma de `IDIOMAS_CARTA`).
- `listarCartasIndexables` (en `publico.ts`) devuelve ahora también los idiomas indexables de cada carta: idioma activo **y** ≥ 90 % de los nombres de plato visibles con traducción en ese idioma.

## Migración (detalle en `docs/arquitectura.md` §3.3, §3.4 y §5.4)

1. **Tablas** `estadisticas_dia`, `vistas_plato_dia`, `uso_traduccion` con RLS: SELECT dueño y admin; **sin** políticas INSERT/UPDATE/DELETE.
2. **Funciones de traducciones** (`security invoker`, lista blanca de tablas `locales|secciones|platos|menus`, el nombre de tabla nunca se concatena sin `format('%I')` y solo tras comprobarlo contra la lista):
   - `public.guardar_traducciones_auto(p_tabla text, p_lote jsonb) returns integer`: por cada elemento `{fila_id, idioma, campo, texto, huella}` hace un `jsonb_set` del objeto `{texto, origen: 'auto', huella, fecha: now()}` **solo si** no hay entrada o la que hay **no** es `manual`. Devuelve cuántas guardó. Valida idioma (los 6 de destino) y campo (`nombre|descripcion|notas` o `grupo.<id>.titulo`, `item.<id>.nombre`, `precio.<id>.texto` según la tabla).
   - `public.guardar_traduccion_manual(...)` y `public.descartar_traduccion_manual(...)`.
   - La RLS del dueño (UPDATE) protege que nadie toque filas ajenas.
3. **Estadísticas**: `public.registrar_estadisticas(p_local uuid, p_tipo text, p_idioma text, p_platos uuid[]) returns void` (`security invoker`, `grant execute to anon, authenticated`) que solo llama a `privado.registrar_estadisticas_def(...)` (`security definer`, `set search_path = ''`, `grant execute to anon, authenticated`, `usage` en `privado` ya concedido). La definer comprueba: `privado.local_visible(p_local)`; `p_tipo in ('visita','vistas','resena')`; idioma válido; `cardinality(p_platos) <= 100`; solo cuenta los platos que son de ese local; día en hora de Madrid. `visita` → `visitas + 1` y `visitas_por_idioma[idioma] + 1`; `vistas` → `vistas + 1` por plato; `resena` → `clics_resena + 1` (lo usará la v0.3). Si algo no cuadra, no hace nada (sin error que dé pistas).
4. **Cuota**: `public.consumir_cuota_traduccion(p_local uuid, p_caracteres int) returns boolean` (invoker) → `privado.consumir_cuota_traduccion_def` (definer): exige `privado.es_dueno_de(p_local)`; 60.000 caracteres/día/local; 450.000/mes en total (todos los locales); si cabe, suma y devuelve true; si no, false. Con bloqueo de fila (`for update`) para que dos peticiones simultáneas no se pasen.
5. **Limpieza**: `privado.limpiar_estadisticas()` borra filas de más de 400 días; si `pg_cron` está disponible (el director lo confirma), programa `cron.schedule('limpiar-estadisticas', '23 4 * * *', 'select privado.limpiar_estadisticas()')`; si no, déjalo anotado para el director.

## Tareas (en orden; cada una empieza por su test)

1. Tests SQL `03_traducciones_v02.sql`: una traducción `manual` sobrevive a `guardar_traducciones_auto`; una `auto` se actualiza; tabla fuera de la lista blanca → error; campo inválido → no guarda; dueño B no puede escribir traducciones de A. `04_estadisticas_v02.sql`: anónimo **no** puede `insert` en `estadisticas_dia` ni en `vistas_plato_dia`; `registrar_estadisticas` como anónimo suma 1 visita a un local visible y **0** a uno sin publicar; platos de otro local se ignoran; más de 100 platos → nada; cuota: el día 60.001 devuelve false. (Ejecútalos en `begin; … rollback;` si el director lo autorizó; si no, déjalos listos.)
2. Migración.
3. Esquemas Zod nuevos y sus tests.
4. `src/lib/datos/traducciones.ts`: `listarTextosTraducibles` reúne todos los campos traducibles de un local (descripción del local, secciones, platos incluidos los textos libres de variantes con formato `otro`, menús con grupos e ítems) con su `huellaActual` (calcúlala con `calcularHuella` en `src/lib/dominio/huella.ts`, firma `CalcularHuella` del contrato: SHA-256 de `texto.trim().normalize("NFC")`, 16 hex, con Web Crypto; la usan también `traduccion` y `contenido-v02`. **Hazla la primera** y con su test: misma huella con espacios alrededor y con NFC/NFD, distinta si cambia una letra) y sus traducciones existentes. El resto llama a las RPC. Todas invalidan la caché con `trasGuardarCarta` (importado de `src/lib/datos/cache.ts`; si tu código corre fuera de una acción, `revalidarCartaFueraDeAccion`). Tests con cliente simulado.
5. `src/lib/datos/estadisticas.ts`: `registrarEvento` (con `crearClientePublico()`; nunca lanza: los errores se tragan y se registran sin datos del visitante) y `obtenerResumenEstadisticas` (rellena días a cero, top 10 platos con nombre, totales). Tests.
6. Ajustes en `publico.ts` (`listarCartasIndexables` con idiomas) y `panel.ts`/mapeos si hace falta. Tests.

## Criterios de terminado

- Ninguna tabla nueva acepta escrituras directas de `anon` ni de `authenticated`.
- La regla «nunca pisar lo manual» está probada en SQL y en TypeScript.
- Firmas del contrato implementadas; lint, tipos, tests y build en verde.

## No toques

`src/lib/datos/cache.ts` (carril `traduccion`), `src/lib/traduccion/*`, `src/app/**`, `src/lib/tipos/*`, migraciones ya aplicadas.

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
