# Carril `contenido` · v0.1 · Ola 1

> Agente recomendado: `kit-contenido` · modelo **sonnet**, esfuerzo **high**. Es lo que más tarda de la v0.1: empieza por la carta de demostración.

## Objetivo

Preparar el contenido que usan la carta pública, el panel y los PDF:
1. **La carta de demostración** «Cafetería La Guagua» (slug `demo`), a partir de la carta real que pasó el usuario, como semilla SQL.
2. **Los diccionarios de la carta en 7 idiomas** (es, en, fr, de, ca, eu, gl): nombres oficiales de los 14 alérgenos, etiquetas, formatos de venta, días y textos de la interfaz de la carta.
3. **Los 14 iconos de alérgenos**, dibujados por nosotros (licencia propia/CC0), como componente React con SVG en línea.

## Archivos propios

- `supabase/semillas/demo.sql` (generado) y `src/lib/demo/**` (datos tipados de la demo, generador y tests; la portada de la v0.4 podrá reutilizarlos)
- `docs/contenido/carta-demo.md` (la carta en texto legible, con todo lo que es orientativo o inventado marcado) y `docs/contenido/fuentes-diccionarios.md`
- `src/lib/i18n/carta.es.ts`, `carta.en.ts`, `carta.fr.ts`, `carta.de.ts`, `carta.ca.ts`, `carta.eu.ts`, `carta.gl.ts`
- `src/componentes/alergenos/IconoAlergeno.tsx`, `src/componentes/alergenos/trazos.ts` (+ test)
- En `docs/fuentes-datos.md`, **solo** la sección «Iconos y recursos gráficos».

## Contratos

**Usa**: `src/lib/tipos/i18n.ts` (`DiccionarioCarta`), `src/lib/tipos/dominio.ts` (`CodigoAlergeno`, `CodigoEtiqueta`, `FormatoPrecio`, `DiaSemana`, `Precio`), `src/lib/tipos/contratos.ts` (`PropsIconoAlergeno`), el modelo de `docs/arquitectura.md` §3 (columnas de `locales`, `secciones`, `platos`, `menus`, `accesos`) y la fuente `docs/datos/carta-la-guagua.md`.

**Produce**:
- `export const cartaEs: DiccionarioCarta` (y `cartaEn`, `cartaFr`, `cartaDe`, `cartaCa`, `cartaEu`, `cartaGl`), uno por archivo. El director creará el índice `src/lib/i18n/carta.ts`.
- `export function IconoAlergeno(props: PropsIconoAlergeno)`: SVG 24×24 (`viewBox="0 0 24 24"`), `fill="none" stroke="currentColor"`, trazo 1,75, esquinas redondeadas; con `titulo` → `role="img"` + `<title>`; sin `titulo` → `aria-hidden="true"`. Componente de servidor (sin `"use client"`, sin estado), usable también desde componentes de cliente.
- `supabase/semillas/demo.sql`, que el director ejecuta después de aplicar la migración del carril `datos`.

## Reglas de contenido (importantes)

- **Nombre público**: «Cafetería La Guagua», **siempre marcada como carta de ejemplo**. La carta pública mostrará una banda «Carta de ejemplo» para el slug `demo` (texto `avisoDemo` de tu diccionario). En `descripcion` del local pon algo como «Carta de ejemplo de Kartana con los platos de una cafetería de verdad».
- **Precios**: los de la tabla de `docs/datos/carta-la-guagua.md` (leídos de una foto). La columna «½» es la **media ración** (`media_racion`) y «Ración» es `racion`; en los platos «por docena» con dos precios, «½» es `media_docena` y el otro `docena`; «(unidad)» es `unidad`; pulpo y lacón a la gallega son **un plato con dos variantes** `racion_mediana` y `racion_grande`. Un solo precio sin formato especial → `racion` si la carta original lo pone en la columna «Ración». Los marcados con (?) se mantienen y se listan en `docs/contenido/carta-demo.md` como «a revisar con el bar».
- **Platos nuevos sin precio** (croqueta de jamón y cocido, chipirones a la plancha, pan de Calatrava, tarta de chocolates, carajillo quemao): precio de ejemplo razonable, apuntado como **inventado** en `docs/contenido/carta-demo.md`.
- **Descripciones**: breves (≤ 120 caracteres), útiles para un turista (qué es y cómo se sirve), sin inventar ingredientes raros. Sin adjetivos de marketing vacíos.
- **Alérgenos ORIENTATIVOS**: los más probables según la receta típica (usa las pistas del archivo fuente: bienmesabe = cazón en adobo frito → pescado y gluten; queso frito → lácteos, gluten, huevo; casco de patatas y bravas con alioli → huevo; etc.). Pon `alergenos_confirmados = true` en la demo para que el filtro de alérgenos se pueda probar, y apunta en `docs/contenido/carta-demo.md` que **todos** son orientativos (la banda de «Carta de ejemplo» lo dice en la web). Ante la duda razonable, incluye el alérgeno.
- **Fotos**: **ninguna**. Las fotos que pasó el usuario no se publican hasta saber quién las hizo.
- **Etiquetas**: solo las evidentes (p. ej. `vegetariano` en parrillada de verduras si no lleva nada animal; `casero` en tarta si lo dice la fuente; nada de `vegano` sin seguridad).
- **Secciones**: las de la propuesta del director en `docs/datos/carta-la-guagua.md` + **Postres** y **Cafés y bebidas**, en este orden: Mariscos, Pescados y cefalópodos, Cazuelas, Carnes y embutidos, Tapas y raciones, Especialidades de la tierra, Postres, Cafés y bebidas.
- **Menú del día** de ejemplo: uno, «Menú del día», 12,50 €, lunes a viernes de 13:00 a 16:00, grupos Primeros / Segundos / Postres con 3 platos cada uno sacados de la carta, notas «Incluye pan, bebida y postre o café» (marcado como inventado).
- **Horarios** de ejemplo (inventados, apuntados como tales).
- **Diccionarios**: los nombres de los alérgenos deben ser los **oficiales** de cada idioma: es/en/fr/de del anexo II del Reglamento (UE) 1169/2011 en su versión de cada lengua (EUR-Lex); ca, eu, gl de fuentes oficiales autonómicas (Agència Catalana de Seguretat Alimentària, Elika/Gobierno Vasco, Xunta de Galicia) o, si no hay, la traducción más extendida en organismos públicos. Anota cada fuente en `docs/contenido/fuentes-diccionarios.md`. El texto `avisoAlergenos` en español es literal: «Consulte al personal sobre alérgenos».
- **Formatos de venta** en los 7 idiomas (`tapa`, `media_racion` → «½ ración»/«Half portion»…, `docena` → «Docena»/«Dozen»…); `unico` y `otro` como cadena vacía.
- **Iconos**: dibújalos tú, sencillos y reconocibles a 20 px: gluten (espiga), crustáceos (gamba), huevos (huevo), pescado (pez), cacahuetes (cacahuete), soja (vaina), lácteos (botella de leche o gota), frutos de cáscara (nuez/avellana), apio (tallo), mostaza (bote o semillas), sésamo (semillas), sulfitos (copa con «SO₂» no; mejor copa de vino y molécula simple), altramuces (flor/legumbre de altramuz), moluscos (mejillón/concha). Nada copiado de juegos con licencia restrictiva. Si usas uno ajeno, solo CC0, CC BY u OFL, con autor y licencia en `docs/fuentes-datos.md`.

## La semilla `supabase/semillas/demo.sql`

- Un bloque `do $$ … $$` idempotente: busca al dueño `select id from public.perfiles where correo = 'rubenpd66@gmail.com'` (si no existe, `raise exception` con un mensaje claro: «el admin debe haber entrado una vez en la web»), borra el local con slug `demo` si existe (la cascada borra lo demás), inserta el local (`publicado = true`, `permitir_indexar = false`, `color_marca` con buen contraste, horarios), las secciones con `orden`, los platos con `precios` en el formato exacto de la arquitectura (`[{"id":"…","formato":"media_racion","texto":null,"centimos":250}, …]`, ids `^[a-z0-9]{4,12}$` únicos en cada plato), el menú, y al final `update public.accesos set estado = 'cortesia', vigente_hasta = null where local_id = <id>`.
- Se ejecuta como `postgres` (salta la RLS), así que **comprueba tú** que cada valor cumple los CHECK de la arquitectura (longitudes, códigos de alérgenos, formatos).

## Tareas (en orden; cada una empieza por su test)

1. **Carta de demostración como datos tipados** (`src/lib/demo/carta-demo.ts`): `export const CARTA_DEMO` con el local, ~80 platos en sus secciones (descripción, variantes de precio, alérgenos orientativos, etiquetas) y el menú del día, usando los tipos de `src/lib/tipos/` (así el compilador comprueba códigos de alérgenos y formatos). Marca con comentarios lo inventado o «a revisar».
   Test primero: `src/lib/demo/carta-demo.test.ts` — longitudes dentro de los límites de la arquitectura, 1–6 variantes por plato, `unico` nunca acompañado, `otro` siempre con texto, ids de variante `^[a-z0-9]{4,12}$` y únicos en cada plato, sin platos repetidos, ≤ 40 secciones y ≤ 400 platos, todas las secciones con platos.
2. **Semilla SQL generada** (`src/lib/demo/generar-semilla.ts` + `supabase/semillas/demo.sql`): un script que se ejecuta con `node --experimental-strip-types src/lib/demo/generar-semilla.ts > supabase/semillas/demo.sql` (Node 24) y escribe la semilla a partir de `CARTA_DEMO`, escapando bien las comillas (`'` → `''`) y el jsonb. Escribe también `docs/contenido/carta-demo.md` (la carta legible y la lista de lo orientativo, inventado y «a revisar»).
   Test primero: `src/lib/demo/generar-semilla.test.ts` — el SQL generado contiene el `do $$`, el `raise exception` si falta el dueño, el `update … cortesia`, escapa un nombre con apóstrofo y tiene tantas filas de platos como `CARTA_DEMO`.
3. **Diccionario en español** (`carta.es.ts`) y **los otros 6**.
   Test primero: `src/lib/i18n/carta.diccionarios.test.ts` — los 7 tienen todas las claves de `DiccionarioCarta` (lo garantiza el tipo, pero el test comprueba además que ningún texto obligatorio está vacío salvo `formatos.unico` y `formatos.otro`, que `horarioMenu` contiene `{dias}`, `{inicio}` y `{fin}`, y que no hay dos alérgenos con el mismo nombre en un idioma).
4. **Iconos** (`trazos.ts` con los trazos SVG por código y `IconoAlergeno.tsx`).
   Test primero: `trazos.test.ts` (hay trazo para los 14 códigos) e `IconoAlergeno.test.tsx` con Testing Library (con `titulo` tiene `role="img"` y título; sin él, `aria-hidden`).
5. **Nota en `docs/fuentes-datos.md`** (sección «Iconos y recursos gráficos»): iconos propios, licencia, fecha; fotos de la demo: ninguna publicada; fuente de los precios y platos (el usuario, con permiso para usar el nombre «Cafetería La Guagua» como carta de ejemplo).

## Criterios de terminado

- La semilla crea la carta completa sin errores sobre el modelo de la arquitectura y deja el acceso en `cortesia`.
- Los 7 diccionarios compilan contra `DiccionarioCarta` y pasan su test; fuentes anotadas.
- 14 iconos legibles a 20 px y a 48 px (compruébalo renderizando una página de prueba en tu scratchpad, no en `src/app`).
- Todo lo orientativo o inventado está marcado en `docs/contenido/carta-demo.md`.

## No toques

`src/app/**`, `src/lib/tipos/*`, `src/lib/i18n/idiomas.ts`, `src/lib/i18n/comun.*`, el índice `src/lib/i18n/carta.ts` (es del director), `supabase/migrations/*`, el resto de `docs/fuentes-datos.md`, `docs/datos/*`.

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
