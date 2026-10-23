# Carril `resenas` · v0.3 · Ola 1

> Agente recomendado: `kit-modulo` · modelo **opus**, esfuerzo **high** (seguridad, API de Google, redirección pública).

## Objetivo

Que el dueño conecte su **ficha de Google** en un minuto desde el móvil (buscándola o pegando un enlace) y que exista la dirección **`/r/<slug>`** que usan el botón de la carta y el QR de reseña: cuenta un clic **anónimo** y manda al cliente **directo** al formulario de reseña de Google. Igual para todos, sin preguntas previas, sin incentivos, sin cookies.

## Archivos propios

- `src/lib/resenas/**` — `places.ts` (cliente de Google Places, `server-only`), `lugares.ts` (lógica de `/api/lugares`), `redirigir.ts` (lógica de `/r/`), + tests
- `src/app/api/lugares/route.ts`
- `src/app/r/[slug]/route.ts`
- `src/app/(panel)/panel/[local]/resenas/**` — `page.tsx`, `acciones.ts` (+ test)
- `src/componentes/resenas/**` — `BuscadorFicha.tsx` (`"use client"`), `FormEnlaceManual.tsx`, `FichaConectada.tsx`, `ReglasResenas.tsx`, `MuestraBoton.tsx`
- `src/lib/i18n/resenas.es.ts`
- `public/resenas/**` (solo si la atribución de Google exige su logotipo)
- `e2e/resenas.spec.ts`
- **Durante la v0.3 también**: `src/app/(panel)/panel/[local]/estadisticas/page.tsx` y `src/lib/i18n/estadisticas.es.ts` (solo el cambio de la tarea 8).

## Contratos

**Usa** (los escribe `datos-v03` **a la vez que tú**: programa contra las firmas de `src/lib/tipos/contratos.ts`, bloque «v0.3 · Reseñas», y simula esos módulos en tus tests con `vi.mock`):
- `src/lib/dominio/resenas.ts`: `LIMITES_RESENAS`, `rutaResena`, `urlEscribirResena`, `urlFichaEnMaps`, `interpretarEnlaceGoogle`.
- `src/lib/validacion/resenas.ts`: `esquemaBuscarLugares`, `esquemaElegirFicha`, `esquemaEnlaceManual`, `esquemaResenasActivas`, `esquemaSlugRuta`.
- `src/lib/datos/resenas.ts`: `obtenerConfigResenas`, `guardarFichaGoogle`, `cambiarResenasActivas`, `quitarFichaGoogle`, `obtenerDestinoResena`, `registrarClicResena`, `consumirCuotaLugares`.
- Tipos de `src/lib/tipos/resenas.ts`: `DestinoResena`, `ConfigResenas`, `DestinoResenaPublico`, `SugerenciaLugar`, `FichaGoogle`, `RespuestaLugares`.
- Ya existentes: `leerInterruptores()` (`resenasApi`), `esBot()` (`src/lib/estadisticas/bots.ts`, solo importar), `exigirUsuario()`, `obtenerLocalActual()`, `crearClienteServidor()`, `obtenerResumenEstadisticas(localId, 30)` (`src/lib/datos/estadisticas.ts`), `rutaCarta()` (`src/lib/i18n/idiomas.ts`), `diccionarioCarta("es").textos.botonResena`, componentes `src/componentes/ui/*` (`Boton`, `BotonEnviar`, `Campo`, `Interruptor`, `Aviso`, `Tarjeta`, `ConfirmarBorrado`…).

**Produce**: `buscarLugares` y `detallesLugar` (firmas `BuscarLugares`, `DetallesLugar`), `GET /api/lugares`, `GET`/`HEAD /r/[slug]` y la página `/panel/[local]/resenas`. Los carriles de la ola 2 (`carta-publica-v03`, `qr-resena`) enlazan a `/r/<slug>` con `rutaResena()`; no importan nada tuyo.

## Requisitos

Detalle completo en `docs/arquitectura.md` §5.7. Resumen:

### `GET /r/[slug]` (`src/app/r/[slug]/route.ts` + `src/lib/resenas/redirigir.ts`)
- Lógica en una función pura y probada `decidirRedireccion({ slug, metodo, cabeceras, destino })` que devuelve `{ estado, location, contarLocalId }`; el route handler solo la aplica.
- Slug que no cumple `esquemaSlugRuta` → **404** (con `X-Robots-Tag: noindex, nofollow`).
- `obtenerDestinoResena(slug)` null o con `destino` null → **307** a `/c/<slugActual o slug>` (URL absoluta: `new URL(rutaCarta(slug), request.url)`), **sin contar**.
- Con destino → **307** a `urlEscribirResena(destino)` y `after(() => registrarClicResena(localId))` (lee `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`), **salvo** si: método `HEAD` (exporta `HEAD` aparte; comprueba en la documentación de `route.md` si hace falta), cabecera `Sec-Purpose` o `Purpose` con `prefetch`, cabecera `Next-Router-Prefetch`, o `esBot(user-agent)`.
- Cabeceras en **todas** las respuestas: `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`. Nunca `Set-Cookie`. No leas ni registres IP, `referer`, idioma ni la query (ignórala). Con Cache Components, un `GET` que lee la petición es dinámico (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`, «With Cache Components»).
- El proxy no corre en `/r/` (no lo cambies). El director añade `Disallow: /r/` a `robots.ts`: pídelo en el informe.

### `GET /api/lugares?local=&q=&sesion=` (`src/app/api/lugares/route.ts` + `src/lib/resenas/lugares.ts`)
Orden de comprobaciones (cada una con su test): interruptor apagado → **404** `{ error: "servicio_apagado" }` · Zod (`esquemaBuscarLugares`) → **400** `datos_invalidos` · `crearClienteServidor()` + `getClaims()` sin usuario → **401** `no_autenticado` · `consumirCuotaLugares(local)` false → **429** `cuota_agotada` · `buscarLugares(q, sesion)` error → **502** `error_servidor` · si no, **200** `{ sugerencias }`. Todas con `Cache-Control: no-store, private`. El cuerpo sigue el tipo `RespuestaLugares`. Nunca escribas `q` en los logs.

### Cliente de Google (`src/lib/resenas/places.ts`, `import "server-only"`)
- Documentación oficial (léela antes): Autocomplete (New) `https://developers.google.com/maps/documentation/places/web-service/place-autocomplete`, Place Details (New) `…/place-details`, tokens de sesión `…/session-tokens`, políticas y atribución `…/policies`.
- `buscarLugares(texto, sesion)`: `POST https://places.googleapis.com/v1/places:autocomplete`; cabeceras `Content-Type: application/json`, `X-Goog-Api-Key: process.env.GOOGLE_CLOUD_API_KEY`, `X-Goog-FieldMask: suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat`; cuerpo `{ input: texto, sessionToken: sesion, includedRegionCodes: ["es"], languageCode: "es" }`; `signal: AbortSignal.timeout(5000)`; `cache: "no-store"`. Devuelve como mucho `LIMITES_RESENAS.sugerencias` `{ placeId, nombre: mainText.text, direccion: secondaryText?.text ?? null }`, descartando las que no tengan `placeId`.
- `detallesLugar(placeId, sesion)`: `GET https://places.googleapis.com/v1/places/<placeId codificado>?sessionToken=<sesion>&languageCode=es` con `X-Goog-FieldMask: id,displayName`. Devuelve `{ placeId: id, nombre: displayName.text }` (recorta el nombre a 120). 404 de Google → `no_encontrado`.
- Sin clave → `servicio_apagado`. Respuesta no 2xx, JSON raro o tiempo agotado → `error_servidor`. Nunca devuelvas ni registres el mensaje de Google ni la clave.
- **Nunca** guardes sugerencias ni detalles (política de caché de Google): solo se guarda lo que pasa `guardarFichaGoogle`.

### Página `/panel/[local]/resenas` (maqueta: `docs/diseno/resenas.html`)
- Contenido dentro de `<Suspense>` (esqueleto mientras carga): `exigirUsuario`, `obtenerLocalActual`, `obtenerConfigResenas`, `leerInterruptores().resenasApi`, clics de 30 días con `obtenerResumenEstadisticas`. `metadata.robots = { index: false, follow: false }`.
- **Sin ficha**: título «Más reseñas en Google» y una frase de para qué sirve. Si el interruptor está encendido: `BuscadorFicha` (se rellena con el nombre del local) y debajo, plegado (`<details>`), «¿No aparece tu negocio? Pega el enlace». Si está apagado: solo `FormEnlaceManual`, con los pasos para sacar el enlace oficial (Perfil de Empresa de Google → «Pedir reseñas» → copiar enlace) y la nota de que también vale el ID de sitio.
- **Con ficha** (`FichaConectada`): nombre de la ficha o «Enlace de reseñas guardado»; «Ver mi ficha en Google Maps» (`urlFichaEnMaps`, solo con `place_id`); «Probar el enlace» (abre `urlEscribirResena(destino)` en otra pestaña con `rel="noopener noreferrer"`: **no** pasa por `/r/`, así el dueño no suma clics); `Interruptor` «Mostrar el botón en mi carta» (acción `cambiarActivas`); «Cambiar de ficha»; «Quitar» con `ConfirmarBorrado`.
- `MuestraBoton`: cómo se verá el botón en la carta (la frase `botonResena` del diccionario en español, sin enlace) con la nota «Sale al final de tu carta, igual para todos tus clientes». El dueño **no** puede cambiar esa frase.
- Enlace «Imprimir el QR de reseñas» → `/panel/<id>/qr#resena` y la cifra «Veces que se abrió el enlace (últimos 30 días): N» con enlace a Estadísticas. No digas «reseñas conseguidas» (no lo sabemos).
- `ReglasResenas` (siempre visible, breve): pide opinión a todos por igual; no ofrezcas nada a cambio (ni descuentos, ni invitaciones, ni sorteos); no pidas que mencionen a nadie ni qué escribir; Kartana nunca escribe reseñas por ti; enlace a `/legal/condiciones`. (Este texto **explica** lo prohibido al dueño; no lo verá ningún cliente.)
- **Acciones** (`acciones.ts`, `"use server"`, cada una con Zod + comprobación de usuario, devuelven `EstadoFormulario`): `elegirFicha` (interruptor → cuota → `detallesLugar` → `guardarFichaGoogle({ destino: { tipo: "place_id", placeId: ficha.placeId }, nombreFicha: ficha.nombre, activar: true })`), `guardarEnlaceManual` (`interpretarEnlaceGoogle` → `guardarFichaGoogle({ …, nombreFicha: null, activar: true })`), `cambiarActivas`, `quitarFicha`. Errores con códigos traducidos por `resenas.es.ts`.

### `BuscadorFicha` (`"use client"`, el único JS nuevo del panel en este carril)
- Campo con etiqueta; espera **350 ms** tras teclear y **mínimo 3 letras**; cancela la petición anterior con `AbortController`; token de sesión `crypto.randomUUID()` creado en la primera búsqueda y renovado tras elegir.
- Resultados como lista de botones grandes (nombre en negrita, dirección debajo), cada uno dentro de un `<form action={elegirFicha}>` con `placeId` y `sesion` ocultos. Estado en `aria-live="polite"` («3 resultados», «Ninguno coincide»).
- Mensajes: 401 → «Vuelve a cargar la página»; 429 → «Has buscado mucho hoy. Prueba mañana o pega el enlace»; 404/502 → «El buscador no está disponible ahora. Pega el enlace».
- **Atribución de Google** bajo los resultados, según su política vigente (compruébala en la página de políticas). Si exige el logotipo, sírvelo desde `public/resenas/` (nunca desde Google) y anota en el informe de dónde lo bajaste y con qué licencia.
- Nada de `localStorage`, nada de scripts de Google.

## Tareas (en orden; cada una empieza por su test)

1. `redirigir.ts` (`decidirRedireccion`). Test: slug inválido → 404; sin destino → 307 a `/c/<slugActual>` sin contar; slug antiguo → usa `slugActual`; con destino `place_id` y `enlace` → 307 a la URL de Google y cuenta; `HEAD`, `Sec-Purpose: prefetch`, `Purpose: prefetch`, `Next-Router-Prefetch: 1` y un bot → no cuenta; query ignorada.
2. Route handler `/r/[slug]` con las cabeceras. Test del handler con `obtenerDestinoResena` y `registrarClicResena` simulados (y `after` simulado): cabeceras presentes, sin `Set-Cookie`, se cuenta solo cuando toca.
3. `places.ts`. Tests con `fetch` simulado: URL, método, cabeceras (clave, field mask), cuerpo; recorta a 5; sin clave; error 500; tiempo agotado; JSON sin `suggestions`; detalles con 404.
4. `lugares.ts` + route handler `/api/lugares`. Test del orden de comprobaciones (cada código de estado) y de que no llama a Google sin cuota.
5. `resenas.es.ts` y componentes (`ReglasResenas`, `MuestraBoton`, `FichaConectada`, `FormEnlaceManual`). Test: `MuestraBoton` usa exactamente `diccionarioCarta("es").textos.botonResena`; ningún texto **dirigido al cliente** de tu diccionario cumple `contieneTextoProhibidoResena` (los de reglas para el dueño, agrúpalos en una clave `reglas` y exclúyelos).
6. `BuscadorFicha`. Test (Testing Library, `fetch` y temporizadores simulados): no busca con 2 letras; una sola petición tras teclear deprisa; mismo token durante la búsqueda; mensajes de 401/429; lista accesible.
7. `acciones.ts` y `page.tsx`. Test de acciones con los módulos de datos y `places.ts` simulados: `elegirFicha` con interruptor apagado → `servicio_apagado`; sin cuota → `cuota_agotada`; guarda el `placeId` que devuelve Google (no el del formulario) y el nombre; `guardarEnlaceManual` con `maps.app.goo.gl` → `datos_invalidos`.
8. Estadísticas: en `src/lib/i18n/estadisticas.es.ts` cambia `resenasProxima` por una nota útil («Enciende el botón en Reseñas») y en la página enlázala a `/panel/<id>/resenas` cuando no haya clics. Ajusta su test si existe.
9. Pruebas de navegador `e2e/resenas.spec.ts` (sesión `e2e/.auth/dueno.json`, local `e2e-prueba`; ver «Forma de trabajar»). **Nunca llaman a Google**: en CI `RESENAS_API_ACTIVA` está apagada. Con la migración de `datos-v03` aplicada (pídesela al director si aún no lo está):
   - La página `/panel/<id>/resenas` carga y muestra «pegar enlace» (interruptor apagado).
   - Pegar `https://maps.app.goo.gl/abc` → error visible; pegar `ChIJN1t_tDeuEmsRUsoyG83frY4` (ID de ejemplo de la documentación de Google) → «conectado» y botón encendido.
   - Con el local publicado **por el panel** (`publicarPorPanel`/`restaurarPublicacionPorPanel` de `e2e/ayudas/publicar.ts`; publicar escribiendo directamente en la base de datos deja la caché de `/r/` y de la carta sin invalidar): `request.get("/r/e2e-prueba", { maxRedirects: 0 })` → 307, `location` = `https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4`, `cache-control` con `no-store`, `x-robots-tag` con `noindex`, **sin** `set-cookie`. `HEAD` → 307.
   - Con el user-agent no bot de `e2e/ayudas/v02.ts` (`UA_NO_BOT`), un `GET /r/e2e-prueba` sube los clics del día en `/panel/<id>/estadisticas` (`expect.poll`).
   - Apagar el botón en el panel → `/r/e2e-prueba` → 307 a `/c/e2e-prueba`.
   - `/r/esto-no-existe-xyz` → 307 a `/c/esto-no-existe-xyz`; `/r/Mal_Slug` → 404.
   - `GET /api/lugares?…` con el interruptor apagado → 404 `servicio_apagado`.
   - Al terminar: «Quitar» la ficha y restaurar la publicación (el local queda como estaba).

## Criterios de terminado

- `/r/` nunca pone cookies, nunca se cachea, solo cuenta clics reales y siempre lleva a algún sitio útil.
- La clave de Google no aparece en ningún archivo que llegue al navegador (compruébalo buscando `GOOGLE_CLOUD_API_KEY` en `.next/static` tras el build).
- Con `RESENAS_API_ACTIVA=false` todo funciona con «pegar enlace».
- Lint, tipos, tests, build y e2e en verde.

## No toques

`src/lib/datos/**`, `src/lib/dominio/**`, `src/lib/validacion/**` (carril `datos-v03`), `src/componentes/carta/**` (el botón es de `carta-publica-v03`), `src/lib/qr/**` y `…/qr/**` (`qr-resena`), `src/lib/estadisticas/**` (solo importa `esBot`), `src/app/api/e/**`, `src/lib/panel/navegacion.ts` y `src/componentes/panel/**` (la pestaña «Reseñas» la añade el director: pídela), `src/app/robots.ts`, `src/proxy.ts`, `next.config.ts`, `src/lib/legal/**`, `package.json` (no hacen falta dependencias: usa `fetch`).

## Reglas de reseñas (obligatorias)

Fuente: `docs/brief.md` → «Reglas de reseñas» (política de Google y ley española de competencia desleal y consumidores).
1. **Igual para todos**: el botón y el QR llevan directos a Google, sin preguntar antes «¿te ha gustado?», sin estrellas y sin mostrarse solo a algunos clientes (*review gating*, prohibido). El dueño solo puede encender o apagar el botón: ni cambiar su texto ni condicionarlo.
2. **Sin incentivos**: ningún texto ofrece ni sugiere descuentos, regalos, sorteos ni nada a cambio de una reseña (ni de cambiarla o borrarla).
3. **Sin guiones**: no se pide mencionar a un empleado ni un contenido concreto.
4. **Kartana nunca escribe ni publica reseñas** por nadie: no hay ningún campo para escribir reseñas.
5. Ningún dato del cliente del bar: ni cookies, ni almacenamiento en su móvil, ni IP, ni identificadores. Los clics se cuentan solo como un número por día.

## Contexto del proyecto (para quien no ha leído nada más)

**Kartana** es un SaaS para bares y restaurantes pequeños de España: carta digital con QR siempre al día (14 alérgenos UE, 7 idiomas) y, en esta v0.3, un botón limpio para pedir reseñas en Google. El dueño usa el panel **desde el móvil, con prisa**; el cliente del bar abre la carta escaneando un QR, a veces con mala cobertura y a veces siendo turista.

- Repositorio: `C:\Users\RUBEN\carta-qr` (git, rama `main`). Web de pruebas: https://kartana-six.vercel.app
- Stack: **Next.js 16.4** (App Router, **Cache Components** y Partial Prefetching activados, `src/proxy.ts`), React 19.3, TypeScript estricto, Tailwind 4, **Zod 4**, Supabase (Postgres + Auth + Storage, proyecto `iewlsyvdkxzcncrbhpyx`, eu-central-1), Vercel. Versiones exactas en `package.json`.
- Documentos de referencia (léelos si necesitas más detalle, pero este encargo basta): `docs/arquitectura.md` (§3.7 y §5.7 son la v0.3), `docs/propiedad.md`, `src/lib/tipos/*.ts`, maqueta `docs/diseno/resenas.html`.
- Ya existen y **no los modifiques**: clientes de Supabase en `src/lib/supabase/` — `crearClienteServidor()` (con la sesión por cookies; quien lo use debe estar dentro de `<Suspense>`), `crearClientePublico()` (anónimo, sin cookies, para `'use cache'`), `crearClienteNavegador()`, `crearClienteAdmin()` (**no usar**: no hay clave secreta). `leerInterruptores()` en `src/lib/config/interruptores.ts` (`resenasApi` = `RESENAS_API_ACTIVA`). Idiomas en `src/lib/i18n/idiomas.ts`. `urlSitio()` en `src/lib/config/sitio.ts`. `trasGuardarCarta`, `etiquetaCarta`, `etiquetaLocal` en `src/lib/datos/cache.ts`. `esBot()` en `src/lib/estadisticas/bots.ts`. `exigirUsuario()` en `src/lib/auth/sesion.ts`, `obtenerLocalActual()` en `src/lib/panel/local-actual.ts`. Componentes de interfaz en `src/componentes/ui/`. `diccionarioCarta(idioma)` en `src/lib/i18n/carta.ts` (incluye `textos.botonResena` en los 7 idiomas). Variables de entorno: `GOOGLE_CLOUD_API_KEY` (solo servidor) y `RESENAS_API_ACTIVA` (ya en `.env.example`).

## Reglas técnicas obligatorias

1. **Lee la documentación instalada** de Next en `node_modules/next/dist/docs/` antes de usar una API de Next (esta versión cambia cosas). Para Supabase, Google y librerías, documentación oficial (Context7 o la web oficial). No inventes APIs.
2. **Cache Components**: leer `cookies()`, `headers()` o la sesión fuera de `<Suspense>` es error de build. Los datos públicos van con `'use cache'` + `cacheTag`; nunca leas cookies dentro de `'use cache'`.
3. **Sesión**: en servidor, siempre `supabase.auth.getClaims()`; **nunca** `getSession()`. El proxy no protege nada: cada página, acción y route handler comprueba al usuario cerca de los datos.
4. **Validación con Zod en el servidor** en cada acción de servidor y route handler. Errores al usuario como `CodigoError` (`src/lib/tipos/resultado.ts`) traducidos por tu diccionario; nunca el mensaje técnico.
5. **Seguridad**: nada de scripts de terceros; nada de `dangerouslySetInnerHTML`; ningún secreto en el navegador (nada de `NEXT_PUBLIC_` para la clave); nada de cookies ni `localStorage` en la carta pública ni en `/r/`.
6. **Textos**: todos en `src/lib/i18n/resenas.es.ts` (objeto `as const`). Español sencillo y cercano, de tú al dueño.
7. **Estilo**: tokens de Tailwind (`bg-fondo`, `bg-superficie`, `bg-superficie-suave`, `text-texto`, `text-texto-suave`, `border-borde`, `bg-primario`, `hover:bg-primario-hover`, `text-sobre-primario`, `text-exito`, `text-aviso`, `text-peligro`, `font-titulo`). Ningún color suelto. Ancho de página solo con `<Contenedor>`; no escribas `max-w-*` de página. Móvil primero: zonas táctiles de al menos 48 px (`min-h-12`), letra base 17 px, foco visible, «reducir movimiento». Referencia: maquetas de `docs/diseno/`.
8. **TDD**: primero el test (Vitest, `*.test.ts(x)` junto al código; para módulos con `import "server-only"` usa `vi.mock("server-only", () => ({}))`), míralo fallar, implementa, míralo pasar. Las pruebas de navegador usan el build de producción (`npm run build` antes); el proyecto móvil solo corre tests con `@movil` en el título.
9. **Accesibilidad**: etiquetas en todos los campos, `aria-live` para mensajes de estado, contraste AA, orden de tabulación lógico, nada que dependa solo del color.

## Forma de trabajar

- Trabaja en tu rama o worktree (`carril/resenas`); en un worktree nuevo, `npm ci` primero. **Un commit por tarea**, mensaje en español claro. **No fusiones ni hagas `push` a `main`.**
- Toca **solo tus archivos**. Si necesitas cambiar otro (compartido o de otro carril, incluidos `package.json`, `src/lib/tipos/*`, `robots.ts`, `navegacion.ts`), **no lo cambies**: escríbelo en tu informe.
- Si un contrato no te encaja, adapta tu código si puedes y pide el cambio en el informe.
- No apliques migraciones, no cambies Supabase, Vercel ni Google Cloud: lo hace el director.
- **Pruebas de navegador en paralelo con otros carriles**: usa tu propio puerto (`PUERTO_E2E=3111`); Playwright va con `workers: 1`. El local `e2e-prueba` es **compartido**: cada prueba lo deja como lo encontró (sin publicar, acceso cortesía, sin platos y, desde la v0.3, sin ficha de Google). Cambia la configuración de reseñas **por el panel** (las acciones invalidan la caché); si escribes directamente en la base de datos, la carta y `/r/` seguirán con la caché vieja. Si una página usa `<Suspense>`, espera a que cargue antes de leer su estado.

## Comandos de verificación (todos en verde antes de terminar)

```
npm run lint
npm run typecheck
npm test
npm run build
PUERTO_E2E=3111 npm run test:e2e -- e2e/resenas.spec.ts
```

## Informe final (tu última respuesta)

1. Qué has hecho, tarea por tarea, con sus commits.
2. Archivos creados o cambiados (todos deben ser tuyos).
3. Resultado de cada comando de verificación (pega el resumen).
4. **Cambios compartidos pedidos**: archivo, cambio exacto y motivo. Como mínimo: `robots.ts` (`/r/` en `disallow`), pestaña «Reseñas» en `navegacion.ts` + icono, línea de Google Places en la política de privacidad cuando se encienda `RESENAS_API_ACTIVA`, variables de entorno en Vercel.
5. Riesgos, dudas y lo que queda pendiente (incluida la atribución de Google que hayas puesto y su fuente).
