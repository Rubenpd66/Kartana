# Carril `contenido-v02` · v0.2 · Ola 1

> Agente recomendado: `kit-contenido` · modelo **sonnet**, esfuerzo **medium**. Trabajo largo: va en la primera ola.

## Objetivo

1. Traducir **a mano y con cuidado** la carta de demostración «Cafetería La Guagua» a inglés, francés, alemán, catalán, euskera y gallego, como traducciones `manual` (así la demo enseña el resultado ideal y no gasta cuota de Google).
2. Revisar la calidad de los diccionarios de la carta en catalán, euskera y gallego (`src/lib/i18n/carta.ca.ts`, `carta.eu.ts`, `carta.gl.ts`) que se hicieron en la v0.1.

## Archivos propios

- `supabase/semillas/demo-traducciones.sql` y su generador en `src/lib/demo/traducciones-demo.ts` + `src/lib/demo/generar-traducciones.ts` (+ tests)
- `src/lib/i18n/carta.ca.ts`, `carta.eu.ts`, `carta.gl.ts` (solo revisión; mismas claves) y, si hace falta corregir algo, `carta.en.ts`, `carta.fr.ts`, `carta.de.ts`
- `docs/contenido/traducciones-demo.md` (criterios y glosario)

## Contratos

**Usa**: `src/lib/demo/carta-demo.ts` (datos de la demo de la v0.1), `src/lib/tipos/dominio.ts` (`TextoTraducido`, `IdiomaDestino`, campos traducibles), el formato jsonb de `docs/arquitectura.md` §3.4, y la función de huella `src/lib/dominio/huella.ts` (la crea `datos-v02` en esta ola; si aún no está, copia la definición exacta en tu generador: SHA-256 de `texto.trim().normalize("NFC")`, 16 primeros hex).

**Produce**: una semilla que el director ejecuta **después** de `supabase/semillas/demo.sql` y de la migración de la v0.2. Debe hacer `update … set traducciones = …` en el local `demo`, sus secciones, platos (incluidos textos libres de variantes con formato `otro`, si los hay) y menús, con `origen: "manual"` y la huella del original. Y activa los 7 idiomas en el local (`idiomas_activos`).

## Criterios de traducción

- Los **nombres propios de platos tradicionales** se mantienen y se explican: «Ajo mataero (potato and liver spread, La Mancha style)». Los platos genéricos se traducen («Patatas bravas» → «Patatas bravas (fried potatoes with spicy sauce)» en inglés, porque el nombre es conocido; «Boquerones en vinagre» → «Anchovies in vinegar»). Decide un criterio coherente y escríbelo en `docs/contenido/traducciones-demo.md` con un glosario.
- Descripciones naturales, cortas, sin traducir literal palabra a palabra.
- Catalán normativo (IEC), euskera batua, gallego normativo (RAG). Si no estás seguro de un término culinario en eu o gl, márcalo en el glosario como «a revisar por hablante nativo».
- Las etiquetas de formatos (½ ración, docena…) **no** se traducen aquí: van en los diccionarios.

## Tareas (en orden; cada una empieza por su test)

1. `src/lib/demo/traducciones-demo.ts` (datos tipados por idioma y campo). Test primero: hay traducción de todos los campos traducibles de la demo en los 6 idiomas; ninguna vacía; longitudes dentro de los límites de cada campo.
2. Generador y semilla. Test: el SQL contiene `origen":"manual"`, escapa apóstrofos, calcula huellas iguales a las de la función de referencia.
3. Revisión de diccionarios ca/eu/gl (y en/fr/de si ves fallos). Test existente `carta.diccionarios.test.ts` sigue en verde.
4. `docs/contenido/traducciones-demo.md` con criterios, glosario y lista «a revisar por nativo».

## Criterios de terminado

- La demo se ve completa en los 7 idiomas tras ejecutar la semilla.
- Lint, tipos, tests y build en verde.

## No toques

`src/app/**`, `src/lib/datos/*`, `src/lib/traduccion/*`, `src/lib/tipos/*`, migraciones, `src/lib/demo/carta-demo.ts` (solo léelo; si encuentras errores en la demo en español, apúntalos en el informe).

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
