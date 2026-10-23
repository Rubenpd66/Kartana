# Carril `carta-publica-v03` · v0.3 · Ola 2

> Agente recomendado: `kit-modulo` · modelo **sonnet**, esfuerzo **medium**.

## Objetivo

Poner en la carta pública el **botón discreto de reseña**, al final de la carta, **igual para todos** los clientes y en su idioma: «¿Qué te ha parecido? Déjanos tu opinión en Google». Es un enlace normal a `/r/<slug>` (que cuenta el clic y lleva a Google). Sin preguntas previas, sin estrellas, sin ventanas emergentes y **sin JavaScript nuevo**.

## Archivos propios

Los mismos que el carril `carta-publica` de la v0.1 y la v0.2:
- `src/app/(carta)/**` (páginas `/c/[slug]` y `/c/[slug]/[idioma]`)
- `src/app/(panel)/panel/[local]/vista-previa/**`
- `src/componentes/carta/**` — añade `BotonResena.tsx` (+ test)
- `src/lib/carta/**`
- `src/lib/i18n/carta-publica.es.ts`
- `e2e/carta-publica.spec.ts`

## Contratos

**Usa** (ya integrados en `main` tras la ola 1):
- `obtenerDestinoResena(slug)` de `src/lib/datos/resenas.ts`: cliente público, `'use cache'` con las mismas etiquetas que la carta (`carta:<slug>`, `local:<id>`); devuelve `{ localId, slugActual, destino }` o null. **El botón sale si `destino !== null`.**
- `obtenerConfigResenas(localId)` (con sesión) para la vista previa: el botón sale si `activas`.
- `rutaResena(slug)` de `src/lib/dominio/resenas.ts` → `"/r/<slug>"`.
- `contieneTextoProhibidoResena(texto)` (mismo archivo), para tus tests.
- `diccionarioCarta(idioma).textos.botonResena` (ya existe en los 7 idiomas; **no** lo cambies).
- `PropsCartaVista.conResena?: boolean` (nuevo, opcional, por defecto false) y `PropsBotonResena` en `src/lib/tipos/contratos.ts`.

**Produce**: `BotonResena` y el uso de `conResena` en `CartaVista`.

## Requisitos

- **`BotonResena`** (componente de servidor, **sin** `"use client"`):
  - `modo="publica"`: `<a href={rutaResena(slug)} rel="nofollow">` con el texto `diccionario.textos.botonResena`. **Un `<a>` normal, nunca `next/link`** (la precarga de `Link` llamaría a `/r/` y contaría clics falsos). Mismo pestaña (sin `target`).
  - `modo="vista_previa"`: el mismo aspecto pero **sin enlace** (`<span>`), con una nota pequeña de `carta-publica.es.ts` («En tu carta, este botón lleva a tus reseñas de Google»). Así el dueño no suma clics desde el panel.
  - Aspecto: discreto (botón secundario: borde, fondo de superficie, texto normal), centrado, **al menos 48 px de alto**, foco visible; un icono neutro opcional (bocadillo de conversación en SVG en línea, `aria-hidden`). **Prohibido**: estrellas (★ ni iconos de estrella), caras, «5», colores de éxito/peligro que sugieran valorar, animaciones que llamen la atención, ventana emergente, aparecer al cabo de un tiempo o solo en algunos idiomas. Referencia: `docs/diseno/carta-publica.html` (bloque `.resena`).
- **`CartaVista`**: si `conResena` es true, pinta `<BotonResena>` **después** de la última sección y menús y **antes** de `PieCarta` (también cuando la carta no tiene platos). Si es false o no viene, nada.
- **Páginas `/c/[slug]` y `/c/[slug]/[idioma]`**: tras obtener la carta, `const destino = await obtenerDestinoResena(slug)` y pasan `conResena={destino?.destino != null}`. Las páginas siguen siendo estáticas (la función está cacheada; no leas cookies, cabeceras ni `searchParams`). Nada más cambia: ni `hreflang`, ni JSON-LD, ni metadatos.
- **Vista previa** (`/panel/[local]/vista-previa`): `conResena={config?.activas ?? false}` con `obtenerConfigResenas(localId)` dentro del `<Suspense>` que ya existe.
- Sigue sin haber más `"use client"` en `src/componentes/carta/` que `Medidor.tsx` (y lo que ya hubiera). El peso de JS de la carta no cambia.

## Tareas (en orden; cada una empieza por su test)

1. `BotonResena`. Test de componente: en público es un `<a>` con `href="/r/bar-pepe"` y `rel` que contiene `nofollow`, sin `target`; el texto es exactamente `botonResena` del diccionario, en **cada uno de los 7 idiomas**; `contieneTextoProhibidoResena(texto)` es false en los 7; no contiene `★` ni ningún elemento con «star»/«estrella» en clases o títulos; en vista previa no hay ningún `<a>`.
2. `CartaVista` con `conResena`. Test: false/ausente → sin botón; true → botón presente, después de la última sección y antes del pie; con carta vacía también sale.
3. Páginas públicas y vista previa. Test de la lógica si la extraes a `src/lib/carta/` (p. ej. `mostrarBotonResena(destino)`).
4. Pruebas de navegador (amplía `e2e/carta-publica.spec.ts`; sesión `e2e/.auth/dueno.json`, local `e2e-prueba`; ver «Forma de trabajar»):
   - Prepara por el **panel**: publica el local (ayudas de `e2e/ayudas/`) y en `/panel/<id>/resenas` pega `ChIJN1t_tDeuEmsRUsoyG83frY4` (queda conectado y encendido).
   - `/c/e2e-prueba` muestra el botón al final con `href="/r/e2e-prueba"` y `rel="nofollow"`.
   - Clic en el botón con `page.route("https://search.google.com/**", r => r.fulfill({ status: 200, body: "ok" }))` (**nunca** se llega a Google de verdad): la página acaba en `https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4`.
   - `@movil`: el botón mide al menos 48 px de alto y no tapa el aviso fijo de alérgenos; la carta sigue sin cookies ni almacenamiento (`comprobarAlmacenamientoVacio` de `e2e/ayudas/v02.ts`).
   - Apagar el botón en el panel → `/c/e2e-prueba` ya no lo muestra (la acción invalida la caché).
   - `/c/demo` no lo muestra (la demo no tiene ficha salvo que el director diga lo contrario).
   - Al terminar: «Quitar» la ficha en el panel y restaurar la publicación.

## Criterios de terminado

- El botón sale igual para todos, en el idioma de la carta, solo si el dueño lo encendió, y es un enlace sin JavaScript.
- Ningún texto ni icono sugiere valorar con estrellas, filtrar o recibir algo a cambio.
- Lint, tipos, tests, build y e2e en verde.

## No toques

`src/lib/datos/**`, `src/lib/dominio/**`, `src/lib/i18n/carta.*.ts` (los diccionarios de la carta, del director), `src/app/r/**` y `src/lib/resenas/**` (carril `resenas`), `src/app/(panel)/panel/[local]/resenas/**`, `src/lib/qr/**`, `src/app/layout.tsx`, `sitemap.ts`, `robots.ts`, `src/proxy.ts`.

## Reglas de reseñas (obligatorias)

Fuente: `docs/brief.md` → «Reglas de reseñas» (política de Google y ley española de competencia desleal y consumidores).
1. **Igual para todos**: el botón y el QR llevan directos a Google, sin preguntar antes «¿te ha gustado?», sin estrellas y sin mostrarse solo a algunos clientes (*review gating*, prohibido).
2. **Sin incentivos**: ningún texto ofrece ni sugiere descuentos, regalos, sorteos ni nada a cambio de una reseña (ni de cambiarla o borrarla).
3. **Sin guiones**: no se pide mencionar a un empleado ni un contenido concreto.
4. **Kartana nunca escribe ni publica reseñas** por nadie.
5. Ningún dato del cliente del bar: ni cookies, ni almacenamiento en su móvil, ni IP, ni identificadores. Los clics se cuentan solo como un número por día (en `/r/`, no en la carta).

## Contexto del proyecto (para quien no ha leído nada más)

**Kartana** es un SaaS para bares y restaurantes pequeños de España: carta digital con QR siempre al día (14 alérgenos UE, 7 idiomas) y, en esta v0.3, un botón limpio para pedir reseñas en Google. El dueño usa el panel **desde el móvil, con prisa**; el cliente del bar abre la carta escaneando un QR, a veces con mala cobertura y a veces siendo turista.

- Repositorio: `C:\Users\RUBEN\carta-qr` (git, rama `main`). Web de pruebas: https://kartana-six.vercel.app
- Stack: **Next.js 16.4** (App Router, **Cache Components** y Partial Prefetching activados, `src/proxy.ts`), React 19.3, TypeScript estricto, Tailwind 4, **Zod 4**, Supabase (Postgres + Auth + Storage, proyecto `iewlsyvdkxzcncrbhpyx`, eu-central-1), Vercel. Versiones exactas en `package.json`.
- Documentos de referencia (léelos si necesitas más detalle, pero este encargo basta): `docs/arquitectura.md` (§3.7 y §5.7 son la v0.3), `docs/propiedad.md`, `src/lib/tipos/*.ts`.
- Ya existen y **no los modifiques**: clientes de Supabase en `src/lib/supabase/` — `crearClienteServidor()` (con la sesión por cookies; quien lo use debe estar dentro de `<Suspense>`), `crearClientePublico()` (anónimo, sin cookies, para `'use cache'`), `crearClienteNavegador()`, `crearClienteAdmin()` (**no usar**). `leerInterruptores()` en `src/lib/config/interruptores.ts`. Idiomas en `src/lib/i18n/idiomas.ts` (`IDIOMAS_CARTA`, `rutaCarta`). `urlSitio()` en `src/lib/config/sitio.ts`. `trasGuardarCarta` en `src/lib/datos/cache.ts`. `exigirUsuario()` en `src/lib/auth/sesion.ts`, `obtenerLocalActual()` en `src/lib/panel/local-actual.ts`. Componentes en `src/componentes/ui/`. `diccionarioCarta(idioma)` en `src/lib/i18n/carta.ts`. `<Contenedor ancho="estrecho|ancho">` en `src/componentes/Contenedor.tsx`.

## Reglas técnicas obligatorias

1. **Lee la documentación instalada** de Next en `node_modules/next/dist/docs/` antes de usar una API de Next (esta versión cambia cosas). Para Supabase y librerías, documentación oficial (Context7). No inventes APIs.
2. **Cache Components**: leer `cookies()`, `headers()` o la sesión fuera de `<Suspense>` es error de build. Los datos públicos van con `'use cache'` + `cacheTag`; nunca leas cookies dentro de `'use cache'`.
3. **Sesión**: en servidor, siempre `supabase.auth.getClaims()`; **nunca** `getSession()`.
4. **Validación con Zod en el servidor** en cada acción de servidor y route handler.
5. **Seguridad**: nada de scripts de terceros; nada de `dangerouslySetInnerHTML` (salvo JSON-LD con `<` escapado); nada de cookies ni `localStorage` en la carta pública.
6. **Textos**: todos en el diccionario de tu módulo (`src/lib/i18n/carta-publica.es.ts` para la nota de la vista previa) o en el de la carta (`botonResena`). Nada de textos sueltos en componentes.
7. **Estilo**: tokens de Tailwind (`bg-fondo`, `bg-superficie`, `bg-superficie-suave`, `text-texto`, `text-texto-suave`, `border-borde`, `bg-primario`, `text-sobre-primario`, `font-titulo`…) y las variables de color de marca que ya usa la carta (`carta.css`). Ningún color suelto. Ancho solo con `<Contenedor>`. Móvil primero: zonas táctiles de al menos 48 px (`min-h-12`), letra base 17 px, foco visible, «reducir movimiento».
8. **TDD**: primero el test (Vitest, `*.test.ts(x)` junto al código), míralo fallar, implementa, míralo pasar. Las pruebas de navegador usan el build de producción (`npm run build` antes); el proyecto móvil solo corre tests con `@movil` en el título.
9. **Accesibilidad**: el enlace tiene un texto que se entiende solo (no «pulsa aquí»), contraste AA, nada que dependa solo del color.

## Forma de trabajar

- Trabaja en tu rama o worktree (`carril/carta-publica-v03`); en un worktree nuevo, `npm ci` primero. **Un commit por tarea**, mensaje en español claro. **No fusiones ni hagas `push` a `main`.**
- Toca **solo tus archivos**. Si necesitas cambiar otro, **no lo cambies**: escríbelo en tu informe.
- Si un contrato no te encaja, adapta tu código si puedes y pide el cambio en el informe.
- No apliques migraciones ni cambies Supabase o Vercel.
- **Pruebas de navegador en paralelo con otros carriles**: usa tu propio puerto (`PUERTO_E2E=3121`); Playwright va con `workers: 1`. El local `e2e-prueba` es **compartido** con el carril `qr-resena`, que trabaja a la vez (él no toca la ficha de Google, pero sí puede publicar y despublicar): cada prueba lo deja como lo encontró (sin publicar, cortesía, sin platos, sin ficha de Google) y cambia la configuración **por el panel** (las acciones invalidan la caché). Si una página usa `<Suspense>`, espera a que cargue antes de leer su estado.

## Comandos de verificación (todos en verde antes de terminar)

```
npm run lint
npm run typecheck
npm test
npm run build
PUERTO_E2E=3121 npm run test:e2e -- e2e/carta-publica.spec.ts
```

## Informe final (tu última respuesta)

1. Qué has hecho, tarea por tarea, con sus commits.
2. Archivos creados o cambiados (todos deben ser tuyos).
3. Resultado de cada comando de verificación (pega el resumen) y el peso de JS de `/c/demo` antes y después (no debe crecer).
4. **Cambios compartidos pedidos**: archivo, cambio exacto y motivo.
5. Riesgos, dudas y lo que queda pendiente.
