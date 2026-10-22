# Carril `traduccion` · v0.2 · Ola 1

> Agente recomendado: `kit-modulo` · modelo **opus**, esfuerzo **high**.

## Objetivo

Traducir automáticamente la carta de cada local a los idiomas que el dueño active (en, fr, de, ca, eu, gl) con **Google Cloud Translation (v2, NMT básico)**, **solo lo que ha cambiado** y **sin pisar nunca una corrección manual**, dentro de una cuota que no genere facturas sorpresa. Todo detrás del interruptor `TRADUCCION_ACTIVA` y con la clave **solo en el servidor**.

## Archivos propios

- `src/lib/traduccion/**` — `google.ts`, `planificar.ts`, `estado.ts`, `lotes.ts`, `traducir-local.ts` (+ tests)
- `src/lib/datos/cache.ts` (pasa a este carril en la v0.2)

## Contratos

**Usa**:
- `src/lib/datos/traducciones.ts` (carril `datos-v02`, misma ola: programa contra la firma y prueba con simulaciones) → `listarTextosTraducibles`, `guardarTraduccionesAuto`, `consumirCuotaTraduccion`.
- `src/lib/datos/panel.ts` → `obtenerLocalDelDueno` (idiomas activos).
- `leerInterruptores()` (`traduccion`), `process.env.GOOGLE_CLOUD_API_KEY` (solo servidor; `import "server-only"` en `google.ts` y `traducir-local.ts`).
- Tipos de `src/lib/tipos/traduccion.ts` y `dominio.ts`.

**Usa también** `calcularHuella` de `src/lib/dominio/huella.ts` (carril `datos-v02`, misma ola; simúlalo en tus tests).

**Produce** (firmas en `src/lib/tipos/contratos.ts`): `planificarTraducciones`, `resumirTraducciones`, `traducirLocal`; y en `cache.ts`, además de lo que ya había (`etiquetaCarta`, `etiquetaLocal`, `ETIQUETA_LISTA_CARTAS`, `trasGuardarCarta`, `revalidarCartaFueraDeAccion`, con las mismas firmas), la traducción en segundo plano.

## Diseño

- **Cliente de Google** (`google.ts`): `POST https://translation.googleapis.com/language/translate/v2` con la clave en la cabecera `X-Goog-Api-Key` (no en la URL, para que no salga en registros), cuerpo `{ q: string[], source: "es", target, format: "text" }`. Lotes de máx. 100 textos y ~25.000 caracteres por petición (`lotes.ts`). Reintento único con espera si responde 429/5xx. Desescapa entidades HTML si las devuelve. Comprueba la documentación vigente de la API con Context7 antes de escribirlo (límites, códigos de idioma: `ca`, `eu`, `gl`, `en`, `fr`, `de`).
- **Huella**: la calcula `calcularHuella` (`src/lib/dominio/huella.ts`): SHA-256 de `texto.trim().normalize("NFC")`, 16 hex.
- **Planificar** (puro): por cada texto y cada idioma activo de destino, es **pendiente** si no hay traducción, o si es `auto` y su huella no coincide con la actual. **Nunca** si es `manual` (aunque esté desactualizada: eso lo resuelve el dueño en el panel). Los textos vacíos no se traducen.
- **Estado** (puro): `resumirTraducciones` cuenta total, faltan y manuales desactualizadas por idioma (para el panel de idiomas).
- **`traducirLocal(localId)`**:
  1. Si `!leerInterruptores().traduccion` → `{ ok: false, error: "servicio_apagado" }`.
  2. Lee textos y planifica; si no hay nada, `{ ok: true, datos: { traducidos: 0, … } }`.
  3. Por lotes: reserva cuota con `consumirCuotaTraduccion(localId, caracteres)`; si devuelve false, para y marca `cortadoPorCuota`.
  4. Traduce, guarda con `guardarTraduccionesAuto` (la función SQL vuelve a proteger lo manual por si el dueño corrigió mientras tanto) y al final invalida la carta.
  5. Nunca registra en consola el texto de la carta ni la clave.
- **En segundo plano al guardar** (`cache.ts`): `trasGuardarCarta(localId, …)` sigue invalidando con `updateTag` y, si la traducción está activa y el local tiene idiomas de destino activos, programa `after(async () => { await traducirLocal(localId); await revalidarCartaFueraDeAccion(localId); })`. Lee `02-guides/…` y `03-api-reference/04-functions/after.md` (en `after()` dentro de una acción de servidor se puede usar `cookies()`; la invalidación ahí es `revalidateTag(tag, { expire: 0 })`). Antirrebote: si el dueño guarda 10 platos seguidos, cada `after` encuentra menos pendientes (las huellas ya coinciden); no hace falta cola.

## Tareas (en orden; cada una empieza por su test)

1. `planificar.ts` y `estado.ts`. Test: falta → pendiente; auto con huella vieja → pendiente; auto al día → no; manual al día o vieja → **no**; idioma no activo → no; texto vacío → no; conteos del resumen.
2. `lotes.ts`. Test: corta por número y por caracteres; un texto más largo que el límite va solo.
3. `google.ts`. Test con `fetch` simulado: cabecera de la clave, cuerpo correcto, reintento en 429, error claro si falta la clave, entidades desescapadas.
4. `traducir-local.ts`. Test con todo simulado: interruptor apagado; nada pendiente; corte por cuota; guarda con origen `auto`; no intenta guardar campos `manual`.
5. `cache.ts` con `after`. Test con `next/server` (`after`) y `next/cache` simulados: con traducción apagada no programa nada; encendida y con idiomas, programa una vez.
6. Prueba manual documentada en el informe (la hace el director): con `TRADUCCION_ACTIVA=true` en local, guardar un plato y ver la traducción en la base de datos.

## Criterios de terminado

- Imposible sobrescribir una traducción manual por cualquier camino automático (probado en TS; en SQL lo prueba `datos-v02`).
- Coste acotado por la cuota; la clave nunca llega al navegador ni a los registros.
- Lint, tipos, tests y build en verde.

## No toques

`src/lib/datos/*` salvo `cache.ts`, `src/app/**`, `src/lib/config/*` (si necesitas otra variable de entorno, pídela), `package.json` (no hace falta ninguna dependencia: usa `fetch`).

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
