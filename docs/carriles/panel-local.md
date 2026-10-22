# Carril `panel-local` · v0.1 · Ola 2

> Agente recomendado: `kit-modulo` · modelo **sonnet**, esfuerzo **high**.

## Objetivo

Todo lo del panel que no es la carta en sí: la **primera vez** (aceptar condiciones y crear el local), la **pantalla de inicio** con el estado de la carta y una lista de pasos, los **datos del local** (nombre, dirección de la carta, descripción, dirección, teléfono, horarios, logo, color de marca) y **publicar/despublicar**.

## Archivos propios

- `src/app/(panel)/panel/page.tsx`
- `src/app/(panel)/panel/bienvenida/**` (página, acciones, componentes locales)
- `src/app/(panel)/panel/[local]/page.tsx` (solo este archivo suelto; el `layout.tsx` de esa carpeta es de `acceso`)
- `src/app/(panel)/panel/[local]/local/**`
- `src/componentes/panel-local/**`
- `src/lib/i18n/panel-local.es.ts`
- `e2e/panel-local.spec.ts`

## Contratos

**Usa** (ya existen tras la ola 1):
- `src/lib/auth/sesion.ts` → `exigirUsuario()`; `src/lib/auth/aceptaciones.ts` → `condicionesAlDia()`, `registrarAceptaciones()`.
- `src/lib/panel/local-actual.ts` → `obtenerLocalActual(localId)`.
- `src/lib/datos/panel.ts` → `listarMisLocales`, `obtenerLocalDelDueno`, `obtenerAccesoDelLocal`, `obtenerCartaDelDueno` (para contar platos en la lista de pasos), `comprobarSlug`.
- `src/lib/datos/mutaciones.ts` → `crearLocal`, `actualizarLocal`, `guardarHorarios`, `guardarLogo`, `publicarLocal` (ya validan con Zod, comprueban sesión e invalidan la caché).
- `src/lib/validacion/local.ts` → los mismos esquemas, para validar también en el navegador.
- `src/lib/dominio/*` → `normalizarSlug`, `validarSlug`, `colorMarcaValido`, `colorTextoSobre`, `ratioContraste`, `rutaNuevoLogo`, `urlPublicaImagen`, `resumirHorarios`, `LIMITES`.
- `src/componentes/ui/*` (incluido `SubirImagen`), `src/lib/i18n/carta.ts` → `diccionarioCarta("es")` para nombres de días.
- `rutaCarta` y `urlSitio()` para mostrar la dirección pública.

**Produce**: páginas y acciones de servidor propias (nadie más las importa).

## Pantallas (ver `docs/diseno/panel-carta.html` para el estilo general del panel)

1. **`/panel`**: `exigirUsuario()`; si `!condicionesAlDia()` → `redirect("/panel/bienvenida")`; `listarMisLocales()`: 0 → `/panel/bienvenida`; 1 → `/panel/<id>`; más → lista para elegir.
2. **`/panel/bienvenida`** (dos pasos en una página):
   - Paso 1 (si faltan): casilla obligatoria «He leído y acepto las [condiciones del servicio] y la [política de privacidad]» (enlaces a `/legal/condiciones` y `/legal/privacidad` en pestaña nueva) → `registrarAceptaciones()`.
   - Paso 2: «¿Cómo se llama tu bar?» → el slug se sugiere en directo con `normalizarSlug` y se puede editar; se comprueba con `comprobarSlug` (acción con antirrebote de 400 ms) y se enseña la dirección final `kartana…/c/<slug>`; botón grande «Crear mi carta» → `crearLocal` → `redirect("/panel/<id>")`. Explica en una línea que la prueba gratis dura 30 días.
3. **`/panel/[local]`** (inicio):
   - Estado: «Borrador» / «Publicada» con la dirección pública y botón «Ver mi carta» (si publicada) o «Vista previa» (`/panel/[local]/vista-previa`).
   - Acceso: «Prueba gratis: te quedan N días» / «Piloto: N días» / «Acceso caducado: escríbenos» (con el correo del titular). Si caducado, avisa de que la carta no se ve.
   - **Lista de pasos** con casillas automáticas: añade tu primera sección y plato · revisa los alérgenos · sube tu logo · elige tu color · publica tu carta · descarga tu QR.
   - Botón **Publicar / Despublicar** (`publicarLocal`) con confirmación al despublicar.
4. **`/panel/[local]/local`** (datos del local), en bloques que se guardan por separado (cada uno su formulario y su acción):
   - Datos: nombre, descripción corta, dirección, teléfono, «que mi carta salga en Google» (`permitirIndexar`).
   - Dirección de la carta (slug): campo con comprobación en directo y **aviso**: «Si ya has impreso QR, seguirán funcionando: llevaremos a la dirección nueva».
   - Logo: `SubirImagen` tipo `logo` con `generarRuta={() => rutaNuevoLogo(localId)}` → `guardarLogo`. Botón «Quitar logo».
   - Color de marca: 8 colores sugeridos que cumplen contraste + selector libre (`<input type="color">`); vista previa de un botón y la cabecera de la carta con ese color; si no llega a 4,5:1 con blanco, se explica y no se deja guardar («Este color es demasiado claro para leer texto blanco encima»).
   - Horarios: los 7 días; cada día «Cerrado» o de 1 a 3 franjas (`abre`/`cierra` con `<input type="time">`); botón «Copiar el lunes a todos los días laborables». Vista previa con `resumirHorarios`.

## Acciones de servidor

En archivos `acciones.ts` dentro de tus carpetas, con `"use server"`. Cada una: recibe `FormData` o un objeto, lo pasa a la mutación de `src/lib/datos/mutaciones.ts` (que valida, comprueba sesión e invalida caché) y devuelve `EstadoFormulario`. Después de guardar, `refresh()` no hace falta si redirige; si no, deja que `useActionState` muestre «Guardado».

## Tareas (en orden; cada una empieza por su test)

1. Diccionario `panel-local.es.ts` y función pura `pasosPendientes(carta: CartaPanel): Array<{clave, hecho}>` en `src/componentes/panel-local/pasos.ts`. Test de la función.
2. `/panel` (redirecciones). Test con módulos simulados: sin condiciones → bienvenida; 0/1/2 locales.
3. Bienvenida: componentes y acciones. Test de componente: no deja continuar sin la casilla; sugiere el slug; enseña «ocupado».
4. Inicio `/panel/[local]`. Test de componente del bloque de acceso (prueba con días, caducado) y de la lista de pasos.
5. Datos del local: bloque datos y slug. Test de componente con acción simulada.
6. Logo y color. Test: el selector no deja guardar un color sin contraste.
7. Horarios. Test del editor (añadir/quitar franja, máximo 3, copiar a laborables) y de la conversión del formulario a `FranjaHoraria[]`.
8. Pruebas de navegador `e2e/panel-local.spec.ts` (usa la sesión guardada `e2e/.auth/dueno.json`, local `e2e-prueba`): cambiar el nombre y verlo en el inicio; cambiar horarios y verlos en la vista previa; despublicar y comprobar que `/c/e2e-prueba` da 404, y volver a publicar (`@movil` en al menos una).

## Criterios de terminado

- Un dueño nuevo llega de `/entrar` a su panel con el local creado en menos de 1 minuto.
- Todas las acciones devuelven errores comprensibles (diccionario) y nunca el mensaje técnico.
- Zonas táctiles ≥ 48 px, todo usable con una mano en un móvil de 360 px de ancho.
- Lint, tipos, tests, build y e2e en verde.

## No toques

`src/app/(panel)/layout.tsx` y `src/app/(panel)/panel/[local]/layout.tsx` (de `acceso`), `src/app/(panel)/panel/[local]/carta|menu|qr|vista-previa/**` (otros carriles), `src/lib/datos/*`, `src/lib/dominio/*`, `src/lib/validacion/*`, `src/componentes/ui/*`, `src/lib/tipos/*`.

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
