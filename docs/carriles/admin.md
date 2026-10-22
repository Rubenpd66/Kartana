# Carril `admin` · v0.1 · Ola 3

> Agente recomendado: `kit-modulo` · modelo **sonnet**, esfuerzo **medium**.

## Objetivo

Una página `/admin` para el dueño de Kartana: ver **todos los locales** con su dueño, plan, estado de acceso y días restantes, y **activar un piloto de 60 días con un botón**. También poder quitar el acceso (vencido) o dar cortesía. Solo el administrador la ve; a cualquier otra persona le da 404.

## Archivos propios

- `src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/page.tsx`, `src/app/(admin)/admin/acciones.ts` (y lo que cuelgue de `src/app/(admin)/`)
- `src/componentes/admin/**` — `TablaLocales.tsx`, `FilaLocal.tsx`, `BotonPiloto.tsx`, `FiltroEstado.tsx`
- `src/lib/i18n/admin.es.ts`
- `e2e/admin.spec.ts`

## Contratos

**Usa**:
- `src/lib/auth/sesion.ts` → `exigirAdmin()` (comprueba `app_metadata.rol = "admin"` **y** `ADMIN_EMAILS`; si no, `notFound()`).
- `src/lib/datos/admin.ts` → `listarLocalesAdmin()`, `activarPiloto(localId)`, `cambiarEstadoAcceso(localId, "vencido" | "cortesia")`. Las políticas RLS de admin y la función SQL `activar_piloto` hacen la segunda comprobación en la base de datos.
- Tipos `FilaAdmin`, `AccesoEfectivo`, `EstadoAcceso`, `Resultado`.
- `src/componentes/ui/*`, `rutaCarta`.

**Produce**: la página y sus acciones.

## Cómo se autoriza al admin (sin clave secreta de Supabase)

Doble llave: el director pone `app_metadata.rol = "admin"` por SQL a su usuario (el usuario no puede cambiar `app_metadata`) y su correo está en `ADMIN_EMAILS`. La página llama a `exigirAdmin()` dentro de `<Suspense>`; **cada acción** vuelve a llamar a `exigirAdmin()` antes de nada. No uses `crearClienteAdmin()`.

## Pantalla (maqueta: `docs/diseno/admin.html`)

- Layout `(admin)`: barra con «Kartana · Admin» y enlace al panel. `metadata.robots = { index: false, follow: false }`.
- Resumen arriba: nº de locales, publicados, en prueba, en piloto, vencidos.
- Filtro por estado (enlaces con `?estado=`; lee `searchParams` dentro de `<Suspense>`).
- Lista (en móvil, tarjetas; en escritorio, tabla): nombre del local (enlace a `/c/<slug>` si publicado), correo del dueño, alta, nº de platos, estado con insignia de color **y texto**, «vence el 12/12/2026 (quedan 18 días)».
- Acciones por local: **«Activar piloto 60 días»** (botón principal; si ya es piloto, «Renovar piloto 60 días desde hoy»), «Dar cortesía», «Quitar acceso» (con confirmación). Tras la acción, aviso con el nuevo estado y fecha. El botón muestra estado de carga y se desactiva para evitar dobles envíos.

## Tareas (en orden; cada una empieza por su test)

1. Funciones puras en `src/componentes/admin/formato.ts`: `textoVencimiento(acceso, ahora)`, `resumenEstados(filas)`, `filtrarPorEstado(filas, estado)`. Test primero.
2. Acciones (`acciones.ts`, `"use server"`): `activarPilotoAccion(localId)`, `cambiarEstadoAccion(localId, estado)` — Zod (uuid; estado en la lista), `exigirAdmin()`, mutación, devuelven `EstadoFormulario<AccesoEfectivo>`. Test con módulos simulados: no admin → `notFound` (no se llama a la mutación); uuid inválido → `datos_invalidos`; ok.
3. Componentes y página. Test de componente: la fila muestra el texto del estado; el botón cambia a «Renovar» si es piloto.
4. Pruebas de navegador `e2e/admin.spec.ts`: con la sesión `admin` (`e2e/.auth/admin.json`) la página lista el local `e2e-prueba`; activar piloto cambia su estado a «Piloto» y la fecha; luego `cambiarEstado` de vuelta a «cortesía» para dejarlo como estaba. Con la sesión `dueno`, `/admin` devuelve 404. Sin sesión, 404 (no redirige a `/entrar`: no revela que existe).

## Criterios de terminado

- Solo el admin ve la página; todo lo demás, 404.
- Activar piloto deja `estado = piloto` y `vigente_hasta = hoy + 60 días`, y la carta del local vuelve a verse al momento si estaba caducada.
- Lint, tipos, tests, build y e2e en verde.

## No toques

`src/lib/datos/*`, `src/lib/auth/*`, `src/proxy.ts` (ya cubre `/admin`), las carpetas del panel, `src/lib/tipos/*`.

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
