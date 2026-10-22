# Carril `panel-carta` · v0.1 · Ola 2

> Agente recomendado: `kit-modulo` · modelo **opus**, esfuerzo **high**. Es la pantalla que más usará el dueño, desde el móvil y con prisa.

## Objetivo

Que el dueño gestione su carta desde el móvil en segundos: **secciones**, **platos** (nombre, descripción, **variantes de precio**, sección, **14 alérgenos**, trazas, etiquetas, foto opcional, visible), **«agotado» de un toque**, **ordenar** con flechas, y los **menús del día**. Cada cambio se ve al momento en la carta pública (la mutación ya invalida la caché).

## Archivos propios

- `src/app/(panel)/panel/[local]/carta/**` — lista (`page.tsx`), `plato/nuevo/page.tsx`, `plato/[plato]/page.tsx`, acciones
- `src/app/(panel)/panel/[local]/menu/**` — lista, `[menu]/page.tsx`, `nuevo/page.tsx`, acciones
- `src/componentes/panel-carta/**` — `ListaCarta`, `FilaPlato`, `BotonAgotado`, `EditorSeccion`, `EditorPlato`, `EditorPrecios`, `SelectorAlergenos`, `SelectorEtiquetas`, `EditorMenu`, `FlechasOrden`…
- `src/lib/i18n/panel-carta.es.ts`
- `e2e/panel-carta.spec.ts`

## Contratos

**Usa**:
- `src/lib/auth/sesion.ts` → `exigirUsuario()`; `src/lib/panel/local-actual.ts` → `obtenerLocalActual()`.
- `src/lib/datos/panel.ts` → `obtenerCartaDelDueno`, `obtenerPlatoDelDueno`, `obtenerMenuDelDueno`.
- `src/lib/datos/mutaciones.ts` → `guardarSeccion`, `borrarSeccion`, `guardarPlato`, `borrarPlato`, `cambiarAgotado`, `reordenar`, `guardarMenu`, `borrarMenu`.
- `src/lib/validacion/carta.ts`, `menu.ts` → esquemas para validar también en el navegador.
- `src/lib/dominio/*` → `ALERGENOS`, `ETIQUETAS`, `FORMATOS_PRECIO`, `LIMITES`, `formatearPrecio`, `rutaNuevaFotoPlato`, `urlPublicaImagen`.
- `src/lib/i18n/carta.ts` → `diccionarioCarta("es")` (nombres oficiales de alérgenos, etiquetas, formatos, días).
- `src/componentes/alergenos/IconoAlergeno.tsx`, `src/componentes/ui/*` (incluido `SubirImagen`, `Interruptor`, `ConfirmarBorrado`).
- Tipos: `Plato`, `Seccion`, `Menu`, `EntradaPlato`, `EntradaMenu`, `Precio`, `PrecioEntrada`, `FormatoPrecio`, `EstadoFormulario`.

**Produce**: páginas, componentes y acciones propias.

## Pantallas (maquetas: `docs/diseno/panel-carta.html` y `docs/diseno/editor-plato.html`)

### Lista de la carta `/panel/[local]/carta`
- Secciones plegables en orden; cabecera de sección con nombre, nº de platos, flechas ↑↓, «Editar» y un aviso si está oculta.
- Fila de plato: nombre, precio(s) resumidos («½ 2,25 € · Ración 3,75 €»), iconos de alérgenos pequeños (o «Alérgenos sin revisar» en color de aviso si `alergenosConfirmados` es false), y a la derecha el **botón Agotado** grande (alternar con un toque; `useOptimistic` para que cambie al instante y se revierta si falla; texto, no solo color: «Disponible»/«Agotado»). Tocar el resto de la fila abre el editor.
- Ordenar: flechas ↑↓ (48 px) en modo «Ordenar» (un botón activa ese modo para que no estorben). Llaman a `reordenar` con la lista completa del grupo.
- Botones: «+ Añadir plato» al final de cada sección y «+ Nueva sección» al final de la lista. Estado vacío amable para la primera vez.

### Editor de plato `/panel/[local]/carta/plato/nuevo?seccion=<id>` y `/plato/[plato]`
- Nombre (obligatorio), descripción (opcional, contador de caracteres), sección (selector).
- **Variantes de precio** (`EditorPrecios`, requisito del director):
  - Por defecto, **un solo campo «Precio»** (formato `unico`) con teclado decimal (`inputMode="decimal"`), que acepta «3,75», «3.75» o «3» y lo convierte a céntimos en el servidor y en el navegador.
  - Atajos de un toque debajo: **«½ y ración»** (lo más habitual: crea `media_racion` + `racion`), **«Mediana y grande»** (`racion_mediana` + `racion_grande`), **«Por unidad»** (`unidad`), **«½ docena y docena»**, y **«Otra variante…»** (añade una fila con selector de formato y, si elige «Otra», campo de texto libre de hasta 30 caracteres).
  - Cada fila: etiqueta (selector con los formatos del diccionario), precio y botón quitar; flechas para ordenar; casilla «Según mercado» que deja el precio vacío (`centimos: null`). Máximo 6. Si queda una sola fila, puede volver a «sin etiqueta».
  - Las variantes existentes conservan su `id` al guardar (las nuevas van sin `id`).
- **Alérgenos** (`SelectorAlergenos`): rejilla de 14 botones grandes (icono + nombre oficial), estado `aria-pressed`; debajo, casilla obligatoria para quitar el aviso: «He revisado los alérgenos de este plato» (`alergenosConfirmados`). Si no marca ningún alérgeno pero confirma, la carta dirá «Sin alérgenos declarados».
- «Puede contener trazas de…» plegado (`<details>`), misma rejilla en pequeño.
- Etiquetas: chips (vegano, vegetariano, sin gluten…).
- Foto: `SubirImagen` tipo `foto` con `generarRuta={() => rutaNuevaFotoPlato(localId, platoId)}`. En un plato **nuevo** aún no hay `platoId`: genera el uuid en el navegador con `crypto.randomUUID()` al abrir «nuevo» y envíalo como `platoId` con `esNuevo: true` (contrato `EntradaPlato`; `guardarPlato` lo crea con ese id).
- «Visible en la carta» (interruptor) y, al final, «Borrar plato» con `ConfirmarBorrado`.
- Barra inferior fija con «Guardar» grande; tras guardar vuelve a la lista con un aviso «Guardado» y desplazamiento hasta el plato.
- Validación en el navegador con el mismo esquema Zod; errores por campo junto al campo.

### Secciones
- `EditorSeccion` en un `<dialog>`: nombre, descripción, visible, borrar (avisando de cuántos platos se borran).

### Menús del día `/panel/[local]/menu`
- Lista de menús con nombre, precio, días y horario, visible y flechas.
- Editor: nombre (por defecto «Menú del día»), precio, días (7 botones L M X J V S D), horario opcional («Todo el día» o de–a), grupos (por defecto Primeros, Segundos, Postres) con ítems: nombre + alérgenos (mismo `SelectorAlergenos` en tamaño compacto) + confirmación; notas («Incluye pan, bebida y postre o café»). Máximos de `LIMITES`.

## Tareas (en orden; cada una empieza por su test)

1. Funciones puras en `src/componentes/panel-carta/precios.ts`: `textoACentimos("3,75") === 375` (acepta coma y punto, rechaza negativos y más de 2 decimales), `centimosATexto(375) === "3,75"`, `aplicarAtajo("media_y_racion")`, `resumirPrecios(precios, diccionario)`. Test primero.
2. Diccionario `panel-carta.es.ts`.
3. `EditorPrecios`. Test de componente: precio simple; atajo «½ y ración» crea dos filas; «Otra variante» exige texto; no pasa de 6; «Según mercado».
4. `SelectorAlergenos` y `SelectorEtiquetas`. Test: alterna `aria-pressed`, envía los códigos en el formulario.
5. Editor de plato completo + acciones (crear, guardar, borrar). Test de las acciones con mutaciones simuladas (pasa `EntradaPlato` correcta; devuelve errores por campo).
6. Lista de la carta + `BotonAgotado` optimista + secciones + ordenar. Test: el botón cambia al instante y vuelve atrás si la acción falla.
7. Menús del día (lista + editor + acciones). Test del editor de grupos/ítems.
8. Pruebas de navegador `e2e/panel-carta.spec.ts` (sesión `e2e/.auth/dueno.json`, local `e2e-prueba`): crear sección y plato con «½ y ración» y dos alérgenos → aparece en la vista previa y en `/c/e2e-prueba` con los dos precios; marcar agotado → la carta pública lo muestra «Agotado» al recargar (prueba clave de caché); ordenar dos platos; crear un menú del día; borrar lo creado al final. Al menos una con `@movil`.

## Criterios de terminado

- Marcar «agotado» es **un toque** y se refleja en la carta pública al recargar.
- Un plato con precio simple se crea con: nombre, precio, alérgenos, guardar. Sin pasos de más.
- Los 14 alérgenos con nombre oficial e icono; el aviso de «sin revisar» es visible.
- Lint, tipos, tests, build y e2e en verde.

## No toques

`src/app/(panel)/panel/[local]/layout.tsx` y `page.tsx`, `…/local/**`, `…/qr/**`, `…/vista-previa/**`, `src/lib/datos/*`, `src/lib/dominio/*`, `src/lib/validacion/*`, `src/componentes/ui/*`, `src/componentes/alergenos/*`, `src/lib/i18n/carta.*`, `src/lib/tipos/*`.

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
