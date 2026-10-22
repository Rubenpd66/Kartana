# Carril `panel-idiomas` · v0.2 · Ola 2

> Agente recomendado: `kit-modulo` · modelo **sonnet**, esfuerzo **high**.

## Objetivo

Que el dueño elija **en qué idiomas se ve su carta**, vea cómo van las traducciones, pueda **traducir con un botón** y **corregir a mano** cualquier texto, plato a plato, sabiendo que su corrección **nunca** se pisará. Si cambia el texto en español de algo que corrigió, se le avisa para que lo revise.

## Archivos propios

- `src/app/(panel)/panel/[local]/idiomas/**` — `page.tsx`, `[idioma]/page.tsx`, acciones
- `src/componentes/panel-idiomas/**` — `SelectorIdiomas.tsx`, `EstadoIdioma.tsx`, `CampoTraduccion.tsx`, `BotonTraducir.tsx`
- `src/lib/i18n/panel-idiomas.es.ts`
- `e2e/panel-idiomas.spec.ts`

## Contratos

**Usa**:
- `src/lib/datos/traducciones.ts` → `listarTextosTraducibles`, `guardarTraduccionManual`, `descartarTraduccionManual`, `actualizarIdiomasActivos`.
- `src/lib/traduccion/traducir-local.ts` → `traducirLocal(localId)`; `src/lib/traduccion/estado.ts` → `resumirTraducciones`.
- `src/lib/datos/panel.ts` → `obtenerLocalDelDueno` (idiomas activos).
- `leerInterruptores()` para saber si la traducción automática está encendida.
- `exigirUsuario()`, `obtenerLocalActual()`, `ui/*`, `NOMBRE_IDIOMA`, `IDIOMAS_CARTA`, `rutaCarta`.
- Tipos `TextoTraducible`, `EstadoCampoTraduccion`, `ResumenTraduccion`, `EntradaIdiomas`, `EntradaTraduccionManual`.

**Produce**: páginas y acciones propias.

## Pantallas

### `/panel/[local]/idiomas`
- Lista de los 7 idiomas con interruptor (el español siempre activo y bloqueado). Guardar → `actualizarIdiomasActivos` (y la carta muestra el selector).
- Por cada idioma activo (`EstadoIdioma`): «32 de 34 textos traducidos», «2 correcciones tuyas para revisar» (aviso), enlace «Revisar textos» → `/idiomas/<xx>`, y enlace a la carta en ese idioma.
- `BotonTraducir` «Traducir lo que falta» → acción que llama a `traducirLocal`. Si la traducción automática está apagada (`servicio_apagado`): texto claro («La traducción automática aún no está disponible; puedes escribir tú las traducciones») y el botón desactivado. Si se corta por cuota: «Hemos traducido una parte; mañana seguimos con el resto».
- Recordatorio: «Revisa las traducciones automáticas: la información de alérgenos es responsabilidad del establecimiento».

### `/panel/[local]/idiomas/[idioma]`
- Textos agrupados por sección y plato (nombre, descripción, variantes con texto libre, menús). Cada `CampoTraduccion` enseña el original en español (pequeño), la traducción editable y una insignia: «Automática», «Corregida por ti», «Falta», o **«Revisa: el español cambió»** (para `desactualizada_manual`).
- Guardar un campo → `guardarTraduccionManual` (pasa a «Corregida por ti»). «Volver a la automática» → `descartarTraduccionManual`.
- Botón por plato «Mantener el nombre original en todos los idiomas» (guarda como manual el texto en español; útil para «Ajo mataero»).
- Filtro: «Solo lo que falta o hay que revisar».

## Tareas (en orden; cada una empieza por su test)

1. Función pura `estadoCampo(texto: TextoTraducible, idioma): EstadoCampoTraduccion` y agrupación por sección/plato (`src/componentes/panel-idiomas/agrupar.ts`). Test: los cinco estados; agrupación ordenada.
2. Diccionario `panel-idiomas.es.ts`.
3. Acciones (`acciones.ts`): `guardarIdiomasAccion`, `traducirAhoraAccion`, `guardarTraduccionAccion`, `descartarTraduccionAccion`, `mantenerOriginalAccion`. Zod + mutación. Test con módulos simulados (incluido `servicio_apagado` y corte por cuota).
4. `SelectorIdiomas` y `EstadoIdioma`. Test de componente: el español no se puede desactivar.
5. `CampoTraduccion` (formulario por campo con `useActionState`, insignias). Test: guardar cambia la insignia; «Volver a la automática».
6. Páginas.
7. Pruebas de navegador `e2e/panel-idiomas.spec.ts` (sesión dueño, local `e2e-prueba`): activar inglés → `/c/e2e-prueba/en` responde 200; corregir a mano el nombre de un plato en inglés → aparece en `/c/e2e-prueba/en`; cambiar el nombre en español del plato → la página de idiomas muestra «Revisa: el español cambió» y la carta inglesa **sigue** con la corrección; desactivar inglés al final.

## Criterios de terminado

- Una corrección manual nunca desaparece sin que el dueño lo pida.
- Todo usable en el móvil; textos largos con `textarea` que crece.
- Lint, tipos, tests, build y e2e en verde.

## No toques

`src/lib/traduccion/*`, `src/lib/datos/*`, `src/app/(panel)/panel/[local]/carta/**`, `src/lib/panel/navegacion.ts` (el director añade la pestaña «Idiomas»).

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
