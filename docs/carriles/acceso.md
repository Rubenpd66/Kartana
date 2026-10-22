# Carril `acceso` · v0.1 · Ola 1

> Agente recomendado: `kit-modulo` · modelo **opus**, esfuerzo **medium** (seguridad).

## Objetivo

Que el dueño pueda **entrar** con un código de 6 cifras por correo o con Google, que el servidor sepa siempre quién es (y si es admin), que quede guardada su aceptación de condiciones, y dejar listo el **armazón del panel** (barras, navegación, componentes de interfaz y subida de imágenes) que usarán `panel-local`, `panel-carta`, `qr-pdf` y `admin`. Además, una forma segura de iniciar sesión en las pruebas de navegador **una vez por ejecución**.

## Archivos propios

- `src/app/(web)/entrar/page.tsx` (sustituye la provisional) y lo que cuelgue de `src/app/(web)/entrar/`
- `src/app/auth/callback/route.ts`, `src/app/auth/salir/route.ts`, `src/app/auth/e2e/route.ts`, `src/app/auth/error/page.tsx`
- `src/lib/auth/**` — `sesion.ts`, `aceptaciones.ts`, `redireccion.ts`, `admin.ts`, `acciones-entrar.ts` (+ tests)
- `src/lib/panel/local-actual.ts`, `src/lib/panel/navegacion.ts` (este último pasa al director tras la v0.1)
- `src/lib/imagenes/**` — `reducir.ts` (+ test)
- `src/componentes/ui/**` — `Boton.tsx`, `Campo.tsx`, `AreaTexto.tsx`, `Casilla.tsx`, `Interruptor.tsx`, `Selector.tsx`, `Aviso.tsx`, `Tarjeta.tsx`, `Insignia.tsx`, `ConfirmarBorrado.tsx`, `SubirImagen.tsx`, `Esqueleto.tsx`
- `src/componentes/panel/**` — `BarraPanel.tsx`, `NavegacionPanel.tsx`
- `src/app/(panel)/layout.tsx`, `src/app/(panel)/panel/[local]/layout.tsx`, `src/app/(panel)/panel/cuenta/**`
- `src/lib/i18n/acceso.es.ts`, `src/lib/i18n/panel.es.ts`, `src/lib/i18n/ui.es.ts`
- `e2e/sesion.setup.ts`, `e2e/acceso.spec.ts`

## Contratos

**Usa**: `src/lib/tipos/cuentas.ts` (`Usuario`, `DocumentoAceptable`), `resultado.ts`, `carta.ts` (`LocalResumen`), `contratos.ts` (bloque «CARRIL acceso»). Tablas `perfiles` y `aceptaciones_legales` y la columna `locales` según `docs/arquitectura.md` §3.2 (las crea el carril `datos` en esta misma ola: programa contra el contrato y prueba con clientes simulados). `VERSIONES_LEGALES` de `src/lib/legal/documentos.ts`. `rutaNuevoLogo`/`rutaNuevaFotoPlato` **no** son tuyas: `SubirImagen` recibe la ruta ya generada por quien lo usa (`generarRuta`).

**Produce** (firmas en `src/lib/tipos/contratos.ts`):
- `src/lib/auth/sesion.ts`: `obtenerUsuario`, `exigirUsuario`, `exigirAdmin`.
- `src/lib/auth/aceptaciones.ts`: `condicionesAlDia`, `registrarAceptaciones`.
- `src/lib/panel/local-actual.ts`: `obtenerLocalActual(localId)` → `LocalResumen` o `notFound()` (consulta propia y mínima a `locales` + `accesos` con `crearClienteServidor()`). `calcularAccesoEfectivo` del carril `datos` aún no existe en esta ola: calcula el acceso con la misma regla — `estado !== "vencido" && (vigenteHasta === null || vigenteHasta > ahora)` — en una función interna con su test, y pide en el informe que se sustituya por la de `datos` en la integración.
- `src/lib/imagenes/reducir.ts`: `reducirImagen`.
- Componentes `src/componentes/ui/*` con props sencillas y tipadas (`PropsBoton` y `PropsSubirImagen` están en el contrato; el resto los defines tú y los documentas con un comentario JSDoc en cada archivo).
- `src/lib/panel/navegacion.ts`: `export const NAVEGACION_PANEL` — lista de `{ clave, etiqueta, ruta: (localId) => string, icono }` con Inicio (`/panel/[local]`), Carta, Menú, Local, QR. (En la v0.2 el director añadirá Idiomas y Estadísticas.)

## Diseño de la autenticación (decidido en la arquitectura)

- **Código por correo**: dos pasos en la misma página `/entrar` con `useActionState`.
  1. Acción `enviarCodigo(estado, formData)`: Zod (`correo` válido, ≤ 320), `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`. Respuesta neutra siempre («Si el correo es correcto, te llegará un código en unos segundos»), sin revelar si la cuenta existe. Error de límite de Supabase → mensaje «Espera un minuto antes de pedir otro código».
  2. Acción `verificarCodigo(estado, formData)`: Zod (`correo`, `codigo` = 6 cifras), `supabase.auth.verifyOtp({ email, token, type: "email" })`, y `redirect(siguiente)` (por defecto `/panel`). Campo del código con `inputMode="numeric"`, `autoComplete="one-time-code"`, letra grande. Botón «Reenviar código» y «Cambiar correo».
- **Entrar con Google**: acción `entrarConGoogle(formData)`: `signInWithOAuth({ provider: "google", options: { redirectTo: \`${urlSitio()}/auth/callback?siguiente=…\` } })` y `redirect(data.url)`. **Sin script de Google**: botón propio con el logotipo «G» en SVG en línea respetando las normas de marca de Google (fondo blanco, borde, texto «Continuar con Google»).
- `/auth/callback`: `exchangeCodeForSession(code)` con `crearClienteServidor()` y redirección a `siguiente` validado; si falla, `/auth/error`.
- `/auth/salir`: solo `POST` (formulario con botón «Salir»), `signOut()` y redirección a `/`.
- `siguiente`: `validarSiguiente(valor)` en `redireccion.ts` — solo rutas que empiezan por `/` y no por `//` ni contienen `\`; si no, `/panel`.
- **Sesión en servidor** (`sesion.ts`): `obtenerUsuario` envuelto en `React.cache`; usa `crearClienteServidor()` y `auth.getClaims()`; devuelve `{ id: claims.sub, correo: claims.email, esAdmin }`. `esAdmin` = `claims.app_metadata?.rol === "admin"` **y** correo en `ADMIN_EMAILS` (lista separada por comas, comparación en minúsculas y sin espacios) — función pura `esCorreoAdmin(correo, lista)` en `admin.ts` con test.
- **Aceptación** (`aceptaciones.ts`): `condicionesAlDia()` comprueba que existen filas de `condiciones` y `privacidad` con las versiones de `VERSIONES_LEGALES` para el usuario. `registrarAceptaciones()` inserta las dos (ignora el duplicado `23505`). La fecha la pone la base de datos. La pantalla que la pide es `/panel/bienvenida` (carril `panel-local`), no la tuya.
- **Login de pruebas** (`/auth/e2e`, POST): si `process.env.E2E_ACCESO !== "true"` **o** `process.env.VERCEL` existe → `404`. Si no, lee `{ quien: "dueno" | "admin" }` (Zod), toma las credenciales de `E2E_EMAIL`/`E2E_PASSWORD` o `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` del entorno (nunca del cuerpo), hace `signInWithPassword` con `crearClienteServidor()` (las cookies quedan en la respuesta) y responde 204. `e2e/sesion.setup.ts` lo llama una vez para cada perfil y guarda `e2e/.auth/dueno.json` y `e2e/.auth/admin.json` con `storageState`. En el informe, describe el cambio exacto que necesita `playwright.config.ts` (proyecto `setup` y `dependencies`), las variables nuevas para `.env.example` y los secretos de CI.

## Armazón del panel

- `src/app/(panel)/layout.tsx`: barra superior fija y mínima (marca Kartana a la izquierda; enlace «Cuenta» a la derecha) + `<main id="contenido">`. Sin lecturas de sesión en el nivel superior: lo que necesite al usuario va en un componente dentro de `<Suspense>`. `metadata.robots = { index: false, follow: false }`.
- `src/app/(panel)/panel/[local]/layout.tsx`: no hace `await params` arriba; pasa la promesa a un componente dentro de `<Suspense>` que llama a `exigirUsuario()` y `obtenerLocalActual(localId)` y pinta el nombre del local y la **navegación inferior** fija en móvil (5 pestañas con icono y texto, la activa marcada con `aria-current="page"`), lateral en escritorio. Debe respetar el área segura del iPhone (`padding-bottom: env(safe-area-inset-bottom)`).
- `src/app/(panel)/panel/cuenta/page.tsx`: correo, fecha y versión de las condiciones aceptadas, enlaces a los textos legales, botón «Salir», y el texto «Para darte de baja, escríbenos a …» (correo de `TITULAR`).
- Componentes `ui/*`: estilo de las maquetas (`docs/diseno/estilos.css`), Tailwind con tokens, botones `min-h-12` (y `min-h-14` en `tamano="grande"`), estados `disabled`/`cargando` (con `aria-busy`), `Aviso` con variantes `info|exito|aviso|error` y `role="status"`/`"alert"`. `Interruptor` accesible (`role="switch"`, `aria-checked`). `ConfirmarBorrado` con `<dialog>` nativo.
- `SubirImagen` (cliente): elige archivo (`accept="image/*"`, permite cámara en móvil), lo reduce con `reducirImagen` (foto: WebP lado 1200, calidad 0,8; logo: PNG lado 512), rechaza > 2 MB tras reducir, lo sube con `crearClienteNavegador().storage.from("imagenes").upload(ruta, blob, { contentType, upsert: false })`, enseña progreso y miniatura, y llama a `onSubida(ruta)`. No guarda nada en la base de datos (eso lo hace la acción del carril que lo usa).

## Tareas (en orden; cada una empieza por su test)

1. `redireccion.ts` y `admin.ts` (puros). Test: `validarSiguiente` con `/panel`, `//malo.com`, `https://…`, `/\\malo`, vacío; `esCorreoAdmin` con mayúsculas, espacios y lista vacía.
2. `sesion.ts`. Test con `crearClienteServidor` simulado: sin claims → null; con claims normales → `esAdmin: false`; con rol admin pero correo fuera de la lista → `false`; ambos → `true`. `exigirUsuario` llama a `redirect` con `siguiente` codificado; `exigirAdmin` llama a `notFound`.
3. `aceptaciones.ts`. Test con cliente simulado: al día / falta una / registrar ignora duplicados.
4. Acciones de entrar (`acciones-entrar.ts`, `"use server"`). Test: correo inválido → `datos_invalidos`; código con letras → error; OTP correcto → `redirect`; error de límite → código de error propio.
5. Página `/entrar` y componentes del formulario (diccionario `acceso.es.ts`). Test de componente: paso 1 → paso 2 tras éxito; mensajes en `aria-live`.
6. `/auth/callback`, `/auth/salir`, `/auth/error`, `/auth/e2e`. Test: `e2e` devuelve 404 sin `E2E_ACCESO` o con `VERCEL`; `callback` rechaza `siguiente` externo.
7. `reducirImagen` (test con un canvas simulado o, si jsdom no da para más, test de la función que calcula las dimensiones de salida `calcularDimensiones(ancho, alto, ladoMax)`).
8. Componentes `ui/*` (tests de los que tienen lógica: `Interruptor`, `SubirImagen` con subida simulada, `ConfirmarBorrado`).
9. Armazón del panel (`(panel)/layout.tsx`, `[local]/layout.tsx`, `NavegacionPanel`, `local-actual.ts`, `navegacion.ts`, `/panel/cuenta`). Test: `NavegacionPanel` marca la pestaña activa; `obtenerLocalActual` llama a `notFound` si no hay fila.
10. Pruebas de navegador: `e2e/sesion.setup.ts` y `e2e/acceso.spec.ts` — `/entrar` carga sin errores de consola y tiene `noindex` (`@movil`); el paso del código se valida en el navegador; con la sesión guardada, `/panel/cuenta` muestra el correo; `/admin` da 404 al dueño de pruebas. (Las que necesitan la base de datos se ejecutan tras la integración 1; márcalas con `test.skip(!process.env.E2E_EMAIL, …)`.)

## Criterios de terminado

- Se puede entrar con código (probado a mano por el director tras configurar la plantilla) y con Google (si el proveedor está configurado); salir funciona.
- Ninguna página ni acción usa `getSession()`; ningún layout lee la sesión fuera de `<Suspense>`.
- `/auth/e2e` es imposible de usar en Vercel.
- Los componentes de interfaz cubren lo que necesitan las maquetas del panel (`docs/diseno/panel-carta.html`, `editor-plato.html`, `qr.html`).
- Lint, tipos, tests, build y e2e (los que no necesitan BD) en verde.

## No toques

`src/lib/supabase/*`, `src/proxy.ts` (ya cubre `/panel`, `/admin`, `/entrar`, `/auth`), `src/lib/datos/*` y `src/lib/dominio/*` (carril `datos`), `src/lib/legal/*`, `playwright.config.ts`, `.gitignore`, `.env.example`, `src/app/(web)/layout.tsx`, `Cabecera.tsx` (el botón «Entrar» ya apunta a `/entrar`).

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
