# Carril `carta-publica` · v0.1 · Ola 2

> Agente recomendado: `kit-modulo` · modelo **opus**, esfuerzo **high** (patrones de Cache Components).

## Objetivo

La carta que ve el cliente del bar al escanear el QR: `/c/<slug>`. **Carga casi instantánea, funciona con mala cobertura, casi sin JavaScript**, con el logo y el color del bar, filtro de alérgenos, aviso fijo «Consulte al personal sobre alérgenos», menú del día, horario y datos estructurados para Google. Además, la **vista previa** dentro del panel.

## Archivos propios

- `src/app/(carta)/layout.tsx`, `src/app/(carta)/carta.css`
- `src/app/(carta)/c/[slug]/page.tsx`, `not-found.tsx` (y lo que cuelgue de `src/app/(carta)/`)
- `src/app/(panel)/panel/[local]/vista-previa/page.tsx`
- `src/componentes/carta/**` — `CartaVista.tsx`, `CabeceraCarta.tsx`, `NavSecciones.tsx`, `SeccionCarta.tsx`, `TarjetaPlato.tsx`, `Precios.tsx`, `MenuDelDia.tsx`, `FiltroAlergenos.tsx`, `AvisoAlergenos.tsx`, `HorarioLocal.tsx`, `PieCarta.tsx`, `BandaDemo.tsx`
- `src/lib/carta/**` — `metadatos.ts` (título, descripción, robots, canónica), `json-ld.ts`, `indexable.ts` (+ tests)
- `e2e/carta-publica.spec.ts`

## Contratos

**Usa**:
- `src/lib/datos/publico.ts` → `obtenerCartaPublica(slug)` (ya con `'use cache'`, `cacheTag` y `cacheLife("hours")`), `buscarSlugActual(slug)`.
- `src/lib/datos/panel.ts` → `obtenerCartaDelDueno(localId)` (vista previa) y `src/lib/dominio/carta.ts` → `convertirACartaPublica`.
- `src/lib/auth/sesion.ts` → `exigirUsuario()` (vista previa).
- `src/lib/dominio/*` → `formatearPrecio`, `colorTextoSobre`, `resumirHorarios`, `elegirTexto`, `ALERGENOS`, `SLUG_DEMO`, `urlPublicaImagen`.
- `src/lib/i18n/carta.ts` → `diccionarioCarta(idioma)` (en la v0.1 solo `"es"`).
- `src/componentes/alergenos/IconoAlergeno.tsx`.
- Tipos: `CartaPublica`, `PlatoPublico`, `PropsCartaVista`, `DiccionarioCarta`.

**Produce**: `src/componentes/carta/CartaVista.tsx` con `PropsCartaVista` (contrato) — componente de **servidor**, sin datos propios; lo reutilizará la v0.2 por idioma.

## Requisitos de la página `/c/[slug]`

- **Estática y cacheada**: `generateStaticParams` devuelve `[{ slug: "demo" }]`; `export const ensureStatic = "navigation"`. No lee cookies, cabeceras ni `searchParams`. Lee `params`, llama a `obtenerCartaPublica(slug)`:
  - null → `buscarSlugActual(slug)`: si hay slug nuevo → `permanentRedirect(rutaCarta(nuevo))`; si no → `notFound()`.
  - Lee la documentación instalada: `02-guides/incremental-static-regeneration-cache-components.md`, `03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md`, `03-api-reference/04-functions/not-found.md` (sección «Calling notFound() after streaming has started»). **Comprueba con un e2e que un slug inexistente devuelve HTTP 404** (no 200). Si con `ensureStatic` no fuera posible, documenta por qué y usa la alternativa con `<Suspense>` (aceptando 200 + `noindex`), y avísalo en el informe.
- **Sin cabecera de Kartana**: grupo `(carta)` con su layout. El color del bar se aplica con `style={{ "--marca": colorMarca, "--sobre-marca": colorTextoSobre(colorMarca) }}` en el contenedor de la carta (la CSP permite atributos `style`).
- **Peso**: objetivo < 100 KB transferidos sin fotos, Lighthouse móvil ≥ 95 en rendimiento, accesibilidad, buenas prácticas y SEO. Fotos con `<img loading="lazy" decoding="async" width height alt>` (no `next/image`: no hay optimización remota configurada y las fotos ya llegan reducidas; desactiva la regla de ESLint solo en esa línea con un comentario que lo explique).
- **Cero JavaScript propio en la v0.1**: ningún `"use client"` en `src/componentes/carta/` (en la v0.2 llegará una isla mínima de estadísticas).
- **Filtro de alérgenos sin JS** (`FiltroAlergenos`): un `<details>` «Filtrar alérgenos» con 14 casillas (icono + nombre) y una casilla «Incluir trazas». Reglas CSS en `carta.css` con `:has()` generadas para los 14 códigos:
  `.carta:has(#f-gluten:checked) .plato[data-alergenos~="gluten"] { display: none; }` y, con trazas, `.carta:has(#f-trazas:checked):has(#f-gluten:checked) .plato[data-trazas~="gluten"] { display: none; }`.
  Platos con alérgenos **sin confirmar**: no se ocultan; con cualquier filtro activo muestran la etiqueta «Sin información de alérgenos: pregunta al personal» (`.carta:has(.filtro input:checked) .plato[data-confirmado="no"] .sin-info { display: block; }`). Un botón `<button type="reset">` dentro del formulario quita el filtro. Una línea fija dentro del panel del filtro recuerda «Consulte al personal sobre alérgenos».
- **Aviso fijo** (`AvisoAlergenos`): banda abajo, siempre visible (`position: sticky; bottom: 0`), con el texto `avisoAlergenos` del diccionario y respetando `env(safe-area-inset-bottom)`.
- **Plato** (`TarjetaPlato`): nombre, variantes de precio (`Precios`: una línea por variante, «½ ración 2,25 €» / «Ración 3,75 €»; `unico` sin etiqueta; `otro` con su texto; `null` → «Según mercado»), descripción, iconos de alérgenos **con su nombre** (texto pequeño o `titulo` accesible; no solo icono), trazas («Puede contener trazas de…»), etiquetas, foto opcional a la derecha. Agotado: atenuado, con insignia «Agotado» en texto. Atributos `data-alergenos`, `data-trazas`, `data-confirmado`.
- **Cabecera**: logo (si hay), nombre, descripción, horario plegable (`HorarioLocal` con `resumirHorarios`), teléfono (`tel:`) y dirección (enlace «Cómo llegar» a `https://www.google.com/maps/search/?api=1&query=…`; es un enlace, no un script).
- **Navegación de secciones**: fila de chips con desplazamiento horizontal y anclas `#seccion-<id>`; `scroll-margin-top` para no tapar títulos.
- **Menú del día** (`MenuDelDia`) arriba si hay menús visibles: nombre, precio, días y horario (texto, sin calcular «hoy»), grupos, notas y alérgenos de cada ítem.
- **Carta de ejemplo**: si `slug === SLUG_DEMO`, `BandaDemo` arriba con `avisoDemo` («Carta de ejemplo: precios reales, alérgenos orientativos»).
- **Pie**: `responsabilidadAlergenos` y «Carta digital con Kartana» (enlace a `/`).
- **Metadatos** (`src/lib/carta/metadatos.ts`, `generateMetadata`): título «Carta de {nombre}», descripción con la descripción del local o los nombres de las secciones, canónica `/c/<slug>`, `robots` según `esIndexable(carta)` (`indexable.ts`: `permitirIndexar` y ≥ 5 platos visibles; si no, `noindex, follow`). Open Graph con el nombre del local. `generateMetadata` también debe ser estática: usa la misma consulta cacheada.
- **JSON-LD** (`json-ld.ts`): `Restaurant` con `name`, `address`, `telephone`, `openingHoursSpecification`, y `hasMenu` → `Menu` con `hasMenuSection` → `MenuItem` (`name`, `description`, `offers` con cada variante como `Offer` con `price` y `priceCurrency: "EUR"` y `name` la etiqueta; `suitableForDiet` para vegano/vegetariano/sin gluten). `<script type="application/ld+json">` con `JSON.stringify(...).replace(/</g, "\\u003c")`.
- **Accesibilidad**: un solo `h1` (nombre del local), `h2` por sección, `h3` por plato; contraste del color de marca ya validado; el filtro se maneja con teclado; `lang="es"`.
- **Sin cookies ni almacenamiento**: el proxy no corre en `/c/`; no uses `localStorage`/`sessionStorage`.

## Vista previa `/panel/[local]/vista-previa`

Dentro de `<Suspense>`: `exigirUsuario()`, `obtenerCartaDelDueno(localId)`, `convertirACartaPublica(carta, urlPublicaImagen)`, y `<CartaVista modo="vista_previa" …/>` con una banda «Así verán tu carta (aún no está publicada)» si no está publicada. `noindex`.

## Tareas (en orden; cada una empieza por su test)

1. `src/lib/carta/indexable.ts` y `metadatos.ts`. Test: 4 platos → noindex; 5 y `permitirIndexar` → index; `permitirIndexar` false → noindex; canónica correcta.
2. `src/lib/carta/json-ld.ts`. Test: estructura con dos variantes de precio, escape de `<`, `suitableForDiet`.
3. Generador de reglas CSS del filtro (`src/lib/carta/reglas-filtro.ts`, función pura que devuelve el CSS para los 14 códigos; el `carta.css` se escribe a partir de ella y un test comprueba que coinciden).
4. Componentes `Precios`, `TarjetaPlato`, `MenuDelDia`, `HorarioLocal`, `FiltroAlergenos`, `AvisoAlergenos`, `CabeceraCarta`, `NavSecciones`, `PieCarta`, `BandaDemo`, `CartaVista`. Tests de componente con Testing Library y una `CartaPublica` de ejemplo (usa nombres de la carta de demostración: «Patatas bravas» con «½ 2,25 € / Ración 3,75 €», «Pulpo a la gallega» con mediana/grande, «Gamba roja a la plancha» por docena): precios bien formateados, agotado, alérgenos con nombre, sin información cuando no está confirmado, `data-*` correctos.
5. Página `/c/[slug]` + `not-found.tsx` + layout `(carta)`. Test unitario de la lógica de decisión (carta / redirección / 404) separada en una función pura.
6. Vista previa.
7. Pruebas de navegador `e2e/carta-publica.spec.ts`:
   - `/c/demo` carga sin errores de consola, con `h1`, el aviso fijo visible y la banda de ejemplo (`@movil`).
   - Filtro: marcar «Crustáceos» oculta «Gamba roja a la plancha» y deja «Patatas bravas»; «Quitar filtro» la devuelve (`@movil`).
   - La respuesta de `/c/demo` **no** trae `Set-Cookie`; tras cargar, `document.cookie === ""` y `localStorage.length === 0`.
   - `/c/no-existe-xyz` devuelve **404**.
   - `/c/demo` lleva `noindex` (la demo tiene `permitir_indexar = false`); la canónica es `/c/demo`; hay un JSON-LD válido (se puede parsear).
   - Peso: la suma de recursos JS de la página es pequeña (anota el número en el informe).

## Criterios de terminado

- `/c/demo` en producción local: Lighthouse móvil ≥ 95 en las cuatro categorías (anota los valores).
- Ningún `"use client"` en `src/componentes/carta/`.
- Slug inexistente → 404; slug antiguo → 308 al nuevo.
- Lint, tipos, tests, build y e2e en verde.

## No toques

`src/app/layout.tsx` (si el `lang` o el «saltar al contenido» del layout raíz te estorban, pídelo en el informe), `src/proxy.ts`, `next.config.ts`, `globals.css`, `sitemap.ts` (el director lo conectará con `listarCartasIndexables`), `src/lib/datos/*`, `src/lib/dominio/*`, `src/componentes/alergenos/*`, `src/lib/i18n/carta.*`, el `layout.tsx` del panel.

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
