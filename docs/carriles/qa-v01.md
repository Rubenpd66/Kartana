# Carril `qa-v01` · v0.1 · Ola 3

> Agente recomendado: `kit-qa` · modelo **sonnet**, esfuerzo **medium**. Trabaja sobre lo ya integrado (olas 1 y 2) en paralelo a `qr-pdf` y `admin`.

## Objetivo

Comprobar de punta a punta que la v0.1 funciona como un dueño y un cliente la usarían, en escritorio y móvil, con el **build de producción**: entrar, crear la carta, publicarla, verla desde el QR, filtrar alérgenos, cambios al instante, sin cookies en la carta, accesibilidad y rendimiento. Encontrar fallos y **reportarlos** con pasos para reproducirlos (no arreglar código de otros carriles).

## Archivos propios

- `e2e/flujos-v01.spec.ts`
- `e2e/ayudas/**` (utilidades compartidas de pruebas: vigilar errores de consola, crear y limpiar datos de prueba con la sesión guardada)
- `docs/qa/v0.1.md` (informe con resultados, capturas descritas, valores de Lighthouse y fallos encontrados)

## Contratos

**Usa**: la web tal como está tras la integración 2; la sesión guardada por `e2e/sesion.setup.ts` (`e2e/.auth/dueno.json`, `e2e/.auth/admin.json`); el local de pruebas `e2e-prueba` (acceso `cortesia`) y la carta `demo`. Las rutas de `docs/arquitectura.md` §4.

**Produce**: pruebas y el informe. Nada que importe otro carril.

## Qué probar (cada punto, una prueba o un apartado del informe)

1. **Flujo del dueño** (`@movil`): con la sesión, ir a `/panel` → llega a su local; crear sección «QA» y plato «Croqueta QA» con «½ y ración» (1,50 / 2,80) y alérgenos gluten + leche confirmados; publicar si no lo está; abrir `/c/e2e-prueba` → el plato aparece con los dos precios y los alérgenos con nombre; marcar agotado en el panel → recargar la carta → «Agotado»; borrar la sección. Mide el tiempo entre guardar y verlo en la carta (debe ser al recargar, sin esperar).
2. **Cliente** (`@movil`): `/c/demo` → banda «Carta de ejemplo», aviso fijo visible al hacer scroll, chips de secciones llevan a su sección, filtro: marcar «Crustáceos» oculta las gambas y langostinos; «Incluir trazas» funciona; quitar filtro.
3. **Privacidad**: en `/c/demo` y `/c/e2e-prueba`, ninguna respuesta trae `Set-Cookie`; `document.cookie` vacío; `localStorage`/`sessionStorage` vacíos; ninguna petición a dominios que no sean la propia web o el bucket de Supabase.
4. **Errores**: 404 real en `/c/no-existe`; `/admin` da 404 al dueño; `/panel` sin sesión lleva a `/entrar?siguiente=%2Fpanel`.
5. **SEO básico**: `noindex` en `/entrar`, `/panel/*`, `/admin`; `/c/demo` con `noindex` (demo); canónica y JSON-LD parseable en la carta; `robots.txt` y `sitemap.xml` responden.
6. **Consola limpia**: sin errores de consola ni de hidratación en todas las páginas visitadas (usa la utilidad de `e2e/base.spec.ts` como ejemplo; ponla en `e2e/ayudas/`).
7. **Accesibilidad**: navegación con teclado por `/entrar`, la lista de la carta del panel, el editor de plato y el filtro de la carta; foco visible; nombres accesibles de los botones de agotado y de alérgenos. Si el director instala `@axe-core/playwright`, pasa axe en esas páginas (si no, pídelo en el informe y hazlo a mano con Lighthouse).
8. **Rendimiento y mala cobertura**: Lighthouse móvil de `/c/demo` en el build local (`npm run build && npm run start`), los cuatro valores; peso total transferido sin fotos; prueba con «Slow 3G» de DevTools y con la red cortada tras la primera carga (anota qué pasa).
9. **Móvil real** (anótalo como tarea para el director en el informe): abrir la carta desde un QR impreso en iPhone y Android.

## Tareas (en orden)

1. `e2e/ayudas/` (vigilar errores, crear/borrar datos de prueba). Test: la propia ayuda se usa en la primera prueba.
2. Pruebas 1 a 6 en `e2e/flujos-v01.spec.ts` (con `test.describe` por bloque); limpian siempre lo que crean (`afterAll`).
3. Puntos 7 a 9 y el informe `docs/qa/v0.1.md` con: tabla de pruebas (pasa/falla), valores de Lighthouse, fallos encontrados (cada uno con pasos, esperado/obtenido y carril dueño del archivo probable), y recomendaciones.

## Criterios de terminado

- Todas las pruebas automáticas pasan en verde, o las que fallan están reportadas como fallos de producto con su carril dueño (no desactivadas en silencio).
- El informe está completo y priorizado (bloqueante / importante / menor).

## No toques

Ningún archivo de `src/`. `e2e/base.spec.ts`, `e2e/sesion.setup.ts` y los `e2e/*.spec.ts` de otros carriles, `playwright.config.ts`.

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
