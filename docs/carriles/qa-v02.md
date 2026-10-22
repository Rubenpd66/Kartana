# Carril `qa-v02` · v0.2 · Ola 3

> Agente recomendado: `kit-qa` · modelo **sonnet**, esfuerzo **medium**.

## Objetivo

Comprobar de punta a punta la v0.2 integrada: los 7 idiomas de la carta (rutas, `hreflang`, textos, alérgenos en cada idioma), la regla «nunca pisar una corrección manual», las estadísticas anónimas y que la carta **sigue sin cookies ni almacenamiento**. Reportar fallos con pasos; no arreglar código de otros carriles.

## Archivos propios

- `e2e/flujos-v02.spec.ts`
- `e2e/ayudas/**` (ampliar las utilidades de la v0.1)
- `docs/qa/v0.2.md`

## Contratos

**Usa**: la web tras la integración 2 de la v0.2; sesiones guardadas `e2e/.auth/dueno.json` y `admin.json`; local `e2e-prueba` y la carta `demo` (con traducciones manuales de la semilla). Rutas de `docs/arquitectura.md` §4.

## Qué probar

1. **Idiomas** (`@movil` en al menos dos): para cada uno de los 7 idiomas de `/c/demo`: responde 200 (español en `/c/demo`), `lang` correcto en el contenedor, nombres de alérgenos del diccionario de ese idioma, aviso de alérgenos traducido, `hreflang` con los 7 + `x-default`, canónica propia. `/c/demo/es` → 404.
2. **Traducción automática** (si el director ha encendido `TRADUCCION_ACTIVA` en el entorno de pruebas; si no, márcalas como omitidas con motivo): activar alemán en `e2e-prueba`, «Traducir lo que falta», comprobar que aparece el alemán; corregir a mano un nombre; cambiar el español; volver a traducir → la corrección manual sigue.
3. **Estadísticas**: visitar `/c/e2e-prueba` dos veces y ver que suben las visitas del día en el panel; un `POST /api/e` con 150 platos o con un `localId` de otro local no cambia nada visible.
4. **Privacidad** (repetir la de la v0.1 en todos los idiomas): sin `Set-Cookie`, `document.cookie` vacío, `localStorage`/`sessionStorage`/IndexedDB vacíos; las únicas peticiones salientes son a la propia web (`/api/e`) y al bucket de imágenes.
5. **Rendimiento**: Lighthouse móvil de `/c/demo` y `/c/demo/de` (los cuatro valores) y peso del JS de la carta comparado con la v0.1.
6. **Consola limpia** en todas las páginas nuevas (idiomas y estadísticas del panel, cartas por idioma).

## Tareas (en orden)

1. Ampliar `e2e/ayudas/` (comprobar `hreflang`, comprobar almacenamiento vacío).
2. Pruebas 1–4 y 6 en `e2e/flujos-v02.spec.ts`, limpiando lo que crean.
3. Punto 5 e informe `docs/qa/v0.2.md` (tabla pasa/falla, valores, fallos priorizados con su carril dueño).

## Criterios de terminado

- Pruebas en verde o fallos reportados (nunca desactivados en silencio).
- Informe completo.

## No toques

Ningún archivo de `src/`; los `e2e/*.spec.ts` de otros carriles; `playwright.config.ts`.

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
