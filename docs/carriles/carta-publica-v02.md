# Carril `carta-publica-v02` · v0.2 · Ola 2

> Agente recomendado: `kit-modulo` · modelo **opus**, esfuerzo **medium**.

## Objetivo

La carta pública en los **7 idiomas**: una dirección por idioma (`/c/<slug>` en español y `/c/<slug>/<idioma>` en el resto), selector de idioma **sin JavaScript**, `hreflang` y canónica, textos sin traducir marcados con `lang="es"`, y la **isla mínima de estadísticas** (la única pieza de JavaScript de la carta).

## Archivos propios

Los mismos que el carril `carta-publica` de la v0.1:
- `src/app/(carta)/**` — añade `src/app/(carta)/c/[slug]/[idioma]/page.tsx`
- `src/app/(panel)/panel/[local]/vista-previa/**` (añade selector de idioma en la vista previa)
- `src/componentes/carta/**` — añade `SelectorIdioma.tsx` y `Medidor.tsx` (`"use client"`, la isla de estadísticas)
- `src/lib/carta/**`
- `e2e/carta-publica.spec.ts`

## Contratos

**Usa**:
- `obtenerCartaPublica(slug)` (sin cambios: ya trae `traducciones` e `idiomasActivos`).
- `elegirTexto(original, traducciones, campo, idioma)` de `src/lib/dominio/traducir.ts`.
- `diccionarioCarta(idioma)` (índice del director) con los 7 idiomas.
- `rutaCarta(slug, idioma)`, `esIdiomaCarta`, `NOMBRE_IDIOMA`, `IDIOMAS_CARTA` de `src/lib/i18n/idiomas.ts`.
- Tipo `EventoEstadistica` (`src/lib/tipos/estadisticas.ts`): el cuerpo que el `Medidor` envía a `POST /api/e` (route handler del carril `estadisticas`, misma ola; no lo importas: solo envías JSON con esa forma).

**Produce**: `CartaVista` sigue con `PropsCartaVista`; ahora usa `idioma` y `diccionario` de verdad.

## Requisitos

- **Ruta por idioma** `/c/[slug]/[idioma]`: `generateStaticParams` devuelve `[{ slug: "demo", idioma: "en" }]` (al menos uno completo); `ensureStatic = "navigation"`. `idioma` debe ser uno de los 6 de destino **y** estar en `idiomasActivos` del local; `es` → `notFound()` (la española es `/c/<slug>`, sin duplicados); idioma no activo → `notFound()`.
- **Textos**: cada campo con `elegirTexto`; si devuelve `esOriginal`, el elemento lleva `lang="es"`. El contenedor de la carta lleva `lang={idioma}` (el `<html lang="es">` del layout raíz es del director: pide en el informe si conviene cambiarlo por grupos con varios layouts raíz). Nombres de alérgenos, etiquetas, formatos de venta y días salen del diccionario del idioma. Las variantes con formato `otro` usan la traducción de `precio.<id>.texto`.
- **Aviso** discreto en idiomas distintos del español: «Traducción automática» (texto del diccionario) junto al selector, salvo que todos los textos sean `manual` (calcúlalo en `src/lib/carta/`).
- **Selector de idioma** (`SelectorIdioma`): `<details>` con enlaces normales a cada idioma activo (nombre en su lengua con `NOMBRE_IDIOMA`, `hreflang` y `lang` en cada enlace); el actual marcado con `aria-current`. Solo aparece si hay más de un idioma activo.
- **SEO**: en cada página, `alternates.languages` con todos los idiomas activos **indexables** + `x-default` → `/c/<slug>`; canónica a sí misma. Una página de idioma es indexable si la carta lo es **y** al menos el 90 % de los nombres de plato visibles tienen traducción en ese idioma (función pura en `src/lib/carta/indexable.ts`); si no, `noindex, follow` y no aparece en `hreflang`.
- **JSON-LD** con `inLanguage` del idioma y textos traducidos.
- **Isla de estadísticas** (`Medidor.tsx`, `"use client"`, < 2 KB): recibe `localId`, `idioma`, `modo`. En `modo="vista_previa"` no hace nada. Al montarse envía `{ tipo: "visita", localId, idioma, platos: [] }` con `navigator.sendBeacon("/api/e", new Blob([json], { type: "application/json" }))`. Observa los platos (`IntersectionObserver`, umbral 0,5) y apunta los que estén visibles ≥ 1 s (un `Set`, sin repetidos, máximo 100); al ocultar la página (`visibilitychange` → `hidden`, o `pagehide`) envía `{ tipo: "vistas", … platos }` una sola vez. **Nada de cookies, `localStorage`, `sessionStorage`, IndexedDB ni identificadores.** Si `sendBeacon` no existe, no hace nada. Los platos llevan `data-plato-id`.
- Sigue sin haber ningún otro `"use client"` en `src/componentes/carta/`.

## Tareas (en orden; cada una empieza por su test)

1. `src/lib/carta/indexable.ts` (idiomas indexables) y `alternates` en `metadatos.ts`. Test: 89 % → noindex; 90 % → index; `x-default`; solo idiomas activos.
2. Aplicar `elegirTexto` y diccionarios en `TarjetaPlato`, `MenuDelDia`, `Precios`, `CabeceraCarta`, `SeccionCarta`. Test de componente: en inglés muestra la traducción; sin traducción, original con `lang="es"`; formato `media_racion` sale como en el diccionario inglés; `otro` usa su traducción.
3. `SelectorIdioma`. Test: enlaces correctos, `aria-current`, oculto con un solo idioma.
4. Página `[idioma]` y lógica de decisión (función pura: carta / 404). Test.
5. `Medidor`. Test con `IntersectionObserver` y `sendBeacon` simulados: una visita al montar; vistas solo de platos ≥ 1 s; sin repetidos; tope 100; se envía una vez al ocultar; nada en vista previa; no toca `document.cookie` ni `localStorage` (espía que no se llamen).
6. Vista previa con selector de idioma (vía `searchParams` dentro de `<Suspense>`, es una página privada).
7. Pruebas de navegador (amplía `e2e/carta-publica.spec.ts`): `/c/demo/en` en inglés con `lang="en"` y `hreflang` de los 7; `/c/demo/es` → 404; idioma no activo → 404; al cargar `/c/demo` sale una petición `POST /api/e` y sigue sin cookies ni almacenamiento (`@movil`); el selector lleva de `es` a `fr`.

## Criterios de terminado

- Las 7 versiones de `/c/demo` funcionan y se enlazan entre sí con `hreflang` correcto.
- Lighthouse móvil ≥ 95 en `/c/demo` y `/c/demo/de`; JS total de la carta mínimo (anota el peso).
- Lint, tipos, tests, build y e2e en verde.

## No toques

`src/app/api/e/**` (carril `estadisticas`), `src/lib/datos/*`, `src/lib/dominio/*`, `src/lib/i18n/carta.*`, `src/app/layout.tsx`, `sitemap.ts`, `src/proxy.ts`.

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
