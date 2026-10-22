# Carril `estadisticas` · v0.2 · Ola 2

> Agente recomendado: `kit-modulo` · modelo **sonnet**, esfuerzo **high**.

## Objetivo

Recibir de forma **anónima y segura** los eventos de la carta (visitas y platos vistos) y enseñar al dueño, en su panel, **visitas por día, idiomas usados, platos más vistos** y (desde la v0.3) clics en «dejar reseña». Sin cookies, sin almacenamiento en el móvil del cliente, sin IP ni identificadores.

## Archivos propios

- `src/app/api/e/route.ts`
- `src/lib/estadisticas/**` — `bots.ts`, `procesar.ts`, `grafico.ts` (+ tests)
- `src/app/(panel)/panel/[local]/estadisticas/**`
- `src/componentes/estadisticas/**` — `GraficoVisitas.tsx` (SVG hecho en el servidor), `TablaPlatos.tsx`, `SelectorRango.tsx`, `ResumenIdiomas.tsx`
- `src/lib/i18n/estadisticas.es.ts`
- `e2e/estadisticas.spec.ts`

## Contratos

**Usa**:
- `src/lib/validacion/idiomas.ts` → `esquemaEventoEstadistica` (carril `datos-v02`).
- `src/lib/datos/estadisticas.ts` → `registrarEvento(evento)` (con `crearClientePublico()` y la RPC `registrar_estadisticas`) y `obtenerResumenEstadisticas(localId, 7 | 30 | 90)`.
- `exigirUsuario()`, `obtenerLocalActual()`, componentes `ui/*`, `NOMBRE_IDIOMA`.
- Tipos `EventoEstadistica`, `ResumenEstadisticas`.

**Produce**: el route handler y la página. La isla que envía los eventos es del carril `carta-publica-v02` (`src/componentes/carta/Medidor.tsx`).

## Route handler `POST /api/e`

1. Solo `POST`; si `content-length` falta o > 4096 → 204 sin hacer nada (lee el cuerpo con un límite real: corta a 4096 bytes aunque mienta la cabecera).
2. Si el `user-agent` es de un bot conocido (`bots.ts`: Googlebot, bingbot, AhrefsBot, SemrushBot, facebookexternalhit, curl, python-requests, HeadlessChrome sin `@playwright`… lista corta y probada) → 204.
3. `JSON.parse` en `try`; `esquemaEventoEstadistica.safeParse`; si falla → 204.
4. `await registrarEvento(evento)` (nunca lanza).
5. Respuesta `204` con `Cache-Control: no-store`. **No** leas ni registres IP, cabeceras de ubicación, `referer` ni cookies; no hagas `console.log` del cuerpo. Lee la documentación de route handlers en `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.

## Página `/panel/[local]/estadisticas` (estilo del panel; añade una maqueta simple a tu informe si cambias algo)

- Selector de rango 7 / 30 / 90 días (enlaces con `?dias=`; `searchParams` dentro de `<Suspense>`).
- Tres cifras grandes: visitas, platos vistos, clics en reseña (con «llega en la próxima versión» si aún no hay módulo de reseñas).
- Gráfico de barras de visitas por día: **SVG generado en el servidor** (`grafico.ts` calcula las barras; sin librerías de gráficos ni JS), con título y descripción accesibles y la tabla de datos debajo en un `<details>` («Ver los números»).
- Idiomas: lista con porcentaje.
- Platos más vistos: los 10 primeros con nombre y vistas.
- Texto de confianza: «Contamos visitas sin cookies y sin saber quién es nadie».

## Tareas (en orden; cada una empieza por su test)

1. `bots.ts`. Test: detecta los de la lista; deja pasar Chrome y Safari móviles normales.
2. `procesar.ts` (lógica del handler separada: recibe texto del cuerpo y user-agent, devuelve el evento válido o null). Test: cuerpo > 4 KB, JSON roto, más de 100 platos, idioma inválido, bot → null; válido → evento.
3. Route handler. Test con `registrarEvento` simulado: siempre 204; solo llama a `registrarEvento` con eventos válidos.
4. `grafico.ts` (puro: escala, alto de barras, etiquetas de días). Test: días a cero, un día con pico, 90 días.
5. Componentes y página + diccionario. Test de componente del gráfico (tiene `role="img"`, título y tabla).
6. Pruebas de navegador `e2e/estadisticas.spec.ts`: `POST /api/e` con cuerpo válido → 204 y sin `Set-Cookie`; con cuerpo basura → 204; la página del panel carga con la sesión del dueño y muestra el gráfico; tras visitar `/c/e2e-prueba` y recargar la página de estadísticas, las visitas de hoy suben (puede tardar: reintenta con `expect.poll`).

## Criterios de terminado

- El route handler no guarda ni registra nada que identifique a nadie.
- La página se entiende sin saber de estadística, en móvil.
- Lint, tipos, tests, build y e2e en verde.

## No toques

`src/componentes/carta/**` (la isla es de `carta-publica-v02`), `src/lib/datos/*`, `src/lib/validacion/*`, `src/lib/panel/navegacion.ts` (el director añade la pestaña «Estadísticas»), `src/proxy.ts` (no debe correr en `/api/e`).

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
