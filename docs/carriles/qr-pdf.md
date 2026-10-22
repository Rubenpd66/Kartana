# Carril `qr-pdf` · v0.1 · Ola 3

> Agente recomendado: `kit-modulo` · modelo **sonnet**, esfuerzo **high**.

## Objetivo

Que el dueño descargue, listos para imprimir, los QR que llevan a su carta: **cartelito de mesa**, **pegatinas** y **póster**, con el logo y el nombre del local. También ver el QR en pantalla, copiar el enlace y descargar el QR suelto en SVG.

## Archivos propios

- `src/app/(panel)/panel/[local]/qr/page.tsx` y `src/app/(panel)/panel/[local]/qr/pdf/route.ts` (y lo que cuelgue de `…/qr/`)
- `src/lib/qr/**` — `matriz.ts`, `svg.ts`, `plantillas/Mesa.tsx`, `plantillas/Pegatinas.tsx`, `plantillas/Poster.tsx`, `plantillas/comun.tsx`, `generar.ts`, `fuentes/*.ttf` (+ tests)
- `src/componentes/qr/**`
- `src/lib/i18n/qr.es.ts`
- `e2e/qr.spec.ts`

## Contratos

**Usa**:
- `src/lib/auth/sesion.ts` → `exigirUsuario()`; `src/lib/panel/local-actual.ts` → `obtenerLocalActual()`.
- `src/lib/datos/panel.ts` → `obtenerLocalDelDueno(localId)` (nombre, slug, logo, color, publicado).
- `src/lib/dominio/imagenes.ts` → `urlPublicaImagen`; `src/lib/dominio/contraste.ts` → `colorTextoSobre`.
- `rutaCarta(slug)` de `src/lib/i18n/idiomas.ts` y `urlSitio()` de `src/lib/config/sitio.ts` → la URL del QR es `urlSitio() + rutaCarta(slug)`.
- `src/componentes/ui/*`.
- Dependencias **ya instaladas por el director**: `@react-pdf/renderer` 4.x y `qrcode` 1.5.x (+ `@types/qrcode`). Si faltan, pídelas en el informe; no edites `package.json`.

**Produce**: la pantalla y el route handler (nadie más los importa). En la v0.3 el carril `qr-resena` añadirá plantillas de reseña reutilizando `src/lib/qr/matriz.ts` y `plantillas/comun.tsx`: deja esas piezas genéricas (la URL y los textos entran por parámetro).

## Librerías (elegidas tras leer su documentación con Context7)

- **QR**: `qrcode`, función `QRCode.create(texto, { errorCorrectionLevel: "M" })` → `modules.size` y `modules.get(fila, col)`. Con eso dibujas el QR **como vectores** (rectángulos) en el PDF y en SVG: nítido a cualquier tamaño. Margen («zona tranquila») de 4 módulos. Nada de logo **dentro** del QR (reduce la lectura); el logo va encima.
- **PDF**: `@react-pdf/renderer` 4.x, `renderToBuffer(<Documento/>)` en el route handler con `export const runtime = "nodejs"`. Componentes `Document`, `Page` (`size="A4"`), `View`, `Text`, `Image`, `Svg`, `Rect`/`Path`. **`Image` solo admite PNG y JPEG** (por eso los logos se guardan en PNG). Fuentes: registra con `Font.register` archivos **TTF estáticos** de Figtree y Fraunces (licencia SIL OFL, descárgalos del repositorio oficial de Google Fonts y guárdalos en `src/lib/qr/fuentes/`; anota la licencia en el informe para `docs/fuentes-datos.md`). Si dieran problemas, usa `Helvetica` (incluida) y dilo en el informe.
- Si `@react-pdf/renderer` diera problemas con el empaquetado de Next 16.4 en el route handler, pide en el informe `serverExternalPackages: ["@react-pdf/renderer"]` para `next.config.ts` (archivo del director) y explica el error.

## Formatos (A4, para imprimir en casa o en una copistería)

| `formato` | Contenido de la hoja | Tamaño del QR |
|---|---|---|
| `mesa` | 4 cartelitos A6 (105 × 148 mm) con líneas de corte discontinuas: logo (o nombre en Fraunces si no hay logo), «Escanea para ver la carta», QR, la dirección corta escrita (`kartana…/c/slug`) y una línea pequeña «Alérgenos: consulte al personal» | 55 mm |
| `pegatinas` | 6 pegatinas cuadradas de 80 × 80 mm con esquinas redondeadas y guía de corte: QR + «Carta» + nombre | 50 mm |
| `poster` | 1 póster A4 vertical: banda superior con el color de marca y el logo, título «Nuestra carta», QR grande, «Apunta con la cámara del móvil», dirección escrita | 120 mm |

- Márgenes de seguridad de 5 mm; texto mínimo 8 pt; QR siempre negro sobre blanco (nunca con el color de marca: baja la lectura).
- Si el local **no está publicado**, la pantalla avisa «Tu carta aún no está publicada: el QR funcionará cuando la publiques», pero deja descargar.
- Nombre del archivo: `kartana-<slug>-<formato>.pdf`.

## Route handler `GET /panel/[local]/qr/pdf?formato=mesa|pegatinas|poster`

1. Valida `formato` con Zod (si no, 400).
2. Comprueba al usuario con `crearClienteServidor().auth.getClaims()` (o `obtenerUsuario()`); si no hay, 401. `obtenerLocalDelDueno(localId)`; si null, 404.
3. Si hay logo: descárgalo de `urlPublicaImagen(logoRuta)` con `fetch` (timeout 5 s, máximo 2 MB, `content-type` `image/png` o `image/jpeg`); si falla, sigue sin logo.
4. `renderToBuffer` → `new Response(buffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="…"', "Cache-Control": "private, no-store" } })`.

## Pantalla `/panel/[local]/qr` (maqueta: `docs/diseno/qr.html`)

- QR grande en pantalla (SVG generado en el servidor con `src/lib/qr/svg.ts`), la dirección de la carta con botón «Copiar enlace» (pequeño componente de cliente con `navigator.clipboard`) y «Abrir mi carta».
- Tres tarjetas (mesa, pegatinas, póster) con una miniatura ilustrativa (SVG simple, no el PDF), texto de uso («Para cada mesa: imprime en cartulina y dobla») y botón grande «Descargar PDF» (enlace normal al route handler con `download`).
- «Descargar solo el QR (SVG)» para quien lo lleve a una imprenta.
- Consejo: «Prueba el QR con tu móvil antes de imprimir muchos».

## Tareas (en orden; cada una empieza por su test)

1. `matriz.ts`: `crearMatriz(url): { tamano: number; oscuro: (fila, col) => boolean }`. Test: el tamaño coincide con `QRCode.create`; las esquinas tienen los patrones de posición.
2. `svg.ts`: `qrComoSvg(url, { tamanoPx, margenModulos })` → string SVG con un solo `path`. Test: contiene `viewBox`, solo `fill` negro y blanco, y no contiene `<script`.
3. Plantillas (`comun.tsx`, `Mesa.tsx`, `Pegatinas.tsx`, `Poster.tsx`) y `generar.ts` (`generarPdf({ formato, local, url, logo }): Promise<Buffer>`). Test: el buffer empieza por `%PDF`; con y sin logo; con un nombre de local largo («Rollito de ternera, york, calabacín…» como prueba de texto largo) no lanza.
4. Route handler. Test: formato inválido → 400; sin sesión → 401; local ajeno → 404 (con módulos simulados).
5. Pantalla y diccionario `qr.es.ts`. Test de componente del botón copiar.
6. Pruebas de navegador `e2e/qr.spec.ts` (sesión `dueno`): la pantalla muestra el QR; las tres descargas responden 200 con `application/pdf` y empiezan por `%PDF`; el SVG suelto se descarga. Imprime una página en papel (el director) para comprobar tamaños con una regla y que el QR se lee con dos móviles distintos.

## Criterios de terminado

- Los tres PDF se generan en < 2 s en local y pesan < 500 KB.
- El QR del PDF se lee con la cámara de un móvil a 30 cm (mesa) y a 1,5 m (póster).
- Lint, tipos, tests, build y e2e en verde.

## No toques

`package.json`, `next.config.ts`, `src/lib/datos/*`, `src/lib/dominio/*`, el `layout.tsx` del panel, carpetas de otros carriles, `docs/fuentes-datos.md` (pide la nota de licencia de las fuentes en el informe).

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
