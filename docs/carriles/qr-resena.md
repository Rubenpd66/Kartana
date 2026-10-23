# Carril `qr-resena` · v0.3 · Ola 2

> Agente recomendado: `kit-modulo` · modelo **sonnet**, esfuerzo **high** (maquetación de PDF con `@react-pdf/renderer`).


> **Decisiones del usuario (23/10/2026), mandan sobre el resto de este documento:**
> - **D2: no se guarda el nombre de la ficha de Google.** No existe `google_place_nombre` ni `nombreFicha` (ni columna, ni CHECK, ni grant, ni campo en tipos, esquemas o límites). El panel enseña «Ficha de Google conectada» y un enlace «Comprobar en Google Maps» (`https://www.google.com/maps/place/?q=place_id:<placeId>`). El nombre de Place Details solo se muestra en el momento de elegir y no se guarda.
> - D1: se rechazan los enlaces cortos `maps.app.goo.gl`. D3: al conectar la ficha, el botón se enciende solo. D4: el QR de reseña se puede descargar antes de conectar la ficha. D5: sin mirar el plan contratado. D6: la carta `demo` no lleva botón de reseña. D7: Places en la política de privacidad sin subir versión.
> - D8: la navegación del panel pasa a **Inicio, Carta, Menú, QR y «Más»** (en «Más»: Idiomas, Reseñas, Visitas, Local). La hace el director en la integración 1.

## Objetivo

Que el dueño imprima un **QR de reseña** listo para usar: **tarjetas** para la carpeta de la cuenta, **tiras** para grapar al ticket y un **cartel de barra**. El QR lleva a `https://<web>/r/<slug>`, que manda al cliente directo al formulario de reseña de Google. Textos neutros, iguales para todos, **sin incentivos** y en los idiomas de la carta.

## Archivos propios

Los mismos que el carril `qr-pdf` de la v0.1:
- `src/app/(panel)/panel/[local]/qr/**` — `page.tsx`, `pdf/route.ts`, `svg/route.ts` (+ tests)
- `src/lib/qr/**` — añade `plantillas/TarjetasResena.tsx`, `plantillas/TirasResena.tsx`, `plantillas/CartelResena.tsx`, `textos-resena.ts` (+ tests); amplía `formatos.ts`, `generar.ts`, `descarga.ts`
- `src/componentes/qr/**` — añade `SeccionQrResena.tsx`
- `src/lib/i18n/qr.es.ts`
- `e2e/qr.spec.ts`

## Contratos

**Usa** (ya integrados en `main` tras la ola 1):
- `obtenerConfigResenas(localId)` de `src/lib/datos/resenas.ts` (con sesión): `{ localId, slug, activas, destino, nombreFicha }` o null.
- `rutaResena(slug)` (`"/r/<slug>"`) y `contieneTextoProhibidoResena(texto)` de `src/lib/dominio/resenas.ts`.
- `diccionarioCarta(idioma).textos.botonResena` (la frase neutra ya escrita en los 7 idiomas; no la cambies ni la reescribas).
- Tipos `FormatoQrResena` (`"tarjetas" | "tiras" | "cartel"`) y `TipoQr` (`"carta" | "resena"`) de `src/lib/tipos/resenas.ts`.
- Lo que ya hay en tu módulo: `generarPdf`, `qrComoSvg`, `localDelDuenoOError`, `urlDeLaCarta`, `descargarLogo`, plantillas `Mesa`, `Pegatinas`, `Poster` y `comun.tsx` (fuentes Figtree/Fraunces en `src/lib/qr/fuentes/`).
- `urlSitio()` de `src/lib/config/sitio.ts`.

**Produce**: las descargas `GET /panel/[local]/qr/pdf?tipo=resena&formato=tarjetas|tiras|cartel` y `GET /panel/[local]/qr/svg?tipo=resena`, y la sección «QR para pedir reseñas» en `/panel/[local]/qr` (con `id="resena"`: el carril `resenas` enlaza a `/panel/<id>/qr#resena`).

## Requisitos

- **Dirección del QR de reseña**: `urlSitio() + rutaResena(local.slug)` (función `urlDeResena` en `descarga.ts`). Nunca la URL de Google directamente: así, si el dueño cambia de ficha, apaga el botón o cambia el slug, lo impreso sigue funcionando (`/r/` lleva a la carta si no hay destino).
- **Se puede descargar aunque aún no haya ficha conectada** (el QR llevará a la carta hasta que la conecte). La pantalla lo avisa.
- **Rutas**: `tipo` por defecto `carta` (lo de la v0.1 no cambia). Con `tipo=resena`, `formato` debe ser uno de `FormatoQrResena` (Zod; si no, 400 `formato_invalido`). Nombre del archivo: `kartana-<slug>-resena-<formato>.pdf` y `kartana-<slug>-qr-resena.svg`. Mismas comprobaciones de sesión (401) y de dueño (404), y mismas cabeceras `private, no-store`.
- **Plantillas** (A4, QR **negro sobre blanco**, vectorial, sin logo dentro del QR, zona de silencio de al menos 4 módulos):
  - `tarjetas`: 10 por A4 (85 × 55 mm, 2 × 5) con marcas de corte. Nombre del local (y logo pequeño si lo hay), la frase `botonResena` en español grande, debajo la misma frase en **hasta 3 idiomas más** de `idiomasActivos` (en letra pequeña, cada una con su atributo de idioma si la librería lo permite), QR de al menos 30 mm y «Escanea con la cámara del móvil».
  - `tiras`: 8 por A4 (80 mm de ancho, el del papel de ticket; 2 × 4) en **blanco y negro**, sin logo: frase en español, QR de al menos 30 mm, nombre del local. Para grapar a la cuenta o al ticket.
  - `cartel`: A4 apaisado con **dos carteles A5** verticales (línea de corte en el centro), banda con el color de marca y el logo, frase grande, QR de al menos 70 mm, las frases en los otros idiomas activos (hasta 3) y «Escanea con la cámara del móvil».
  - **Prohibido** en cualquier plantilla: estrellas, «5», caras, «si te ha gustado», descuentos, regalos, sorteos, «gratis», pedir que se nombre a un empleado o qué escribir. Solo la frase neutra, el nombre del local y la instrucción de escanear.
- **Textos de los PDF**: una función pura `textosPdfResena(idiomasActivos)` en `src/lib/qr/textos-resena.ts` que devuelve la frase principal (español) y la lista de frases en otros idiomas (orden de `IDIOMAS_CARTA`, como mucho 3, sin repetir el español), sacadas de `diccionarioCarta`. Los textos propios del PDF («Escanea con la cámara del móvil») van en `qr.es.ts` → `pdf.resena`.
- **Pantalla `/panel/[local]/qr`**: añade debajo de lo que ya hay la sección `SeccionQrResena` (`id="resena"`): título «QR para pedir reseñas», una frase («Al escanearlo se abre directamente el formulario de reseña de Google. Para todos tus clientes por igual.»), el QR en pantalla, la dirección `…/r/<slug>` con «Copiar enlace» (reutiliza `BotonCopiar`), los tres formatos con «Descargar PDF», «Descargar solo el QR (SVG)» y un recordatorio corto de las reglas para el dueño («Ofrécelo a todos por igual y sin nada a cambio»). Avisos: sin ficha → «Aún no has conectado tu ficha de Google: este QR llevará a tu carta hasta que lo hagas» con enlace a `/panel/<id>/resenas`; con ficha pero botón apagado → lo mismo con «tienes las reseñas apagadas». Lee la configuración con `obtenerConfigResenas` dentro del `<Suspense>` que ya existe. Sigue la maqueta `docs/diseno/qr.html` (mismas tarjetas de formato y miniaturas).

## Tareas (en orden; cada una empieza por su test)

1. `textos-resena.ts`. Test: solo español → sin frases extra; con `en, fr, de, ca` → 3 frases en el orden de `IDIOMAS_CARTA`; ninguna frase (ni los textos de `qr.es.ts` → `pdf.resena`) cumple `contieneTextoProhibidoResena`.
2. `formatos.ts` y `descarga.ts` (`FORMATOS_QR_RESENA`, `urlDeResena`, `nombreArchivoPdf` con tipo). Tests.
3. Plantillas y `generarPdf` con `tipo`. Test: cada formato devuelve un PDF (`%PDF`), de menos de 300 KB, con y sin logo, con 1 y con 7 idiomas activos (texto largo en euskera y alemán no se sale: revisa a ojo un PDF de cada y anótalo en el informe).
4. Rutas `pdf` y `svg` con `tipo`. Tests: `tipo=resena&formato=poster` → 400; sin `tipo` sigue igual que antes; el SVG de reseña codifica `…/r/<slug>` (decodifica la matriz o compara con `qrComoSvg(urlDeResena(slug))`).
5. `SeccionQrResena` + página + diccionario. Test de componente: los tres avisos (sin ficha, apagada, encendida sin aviso), enlaces de descarga con `tipo=resena`, `id="resena"`.
6. Pruebas de navegador (amplía `e2e/qr.spec.ts`): la sección se ve en `/panel/<id>/qr` (`@movil`); los tres PDF de reseña se descargan (200, `application/pdf`, empiezan por `%PDF`, < 300 KB); el SVG de reseña se descarga; `formato` inválido → 400; sin sesión → 401. **No cambies la ficha de Google ni la publicación de `e2e-prueba`**: tus pruebas deben pasar con o sin ficha conectada (el carril `carta-publica-v03` la cambia a la vez).

## Criterios de terminado

- Los tres PDF se imprimen bien en A4, con el QR legible (pruébalo con la cámara del móvil desde la pantalla) y textos que no sugieren nada a cambio.
- Lo de la v0.1 (QR de la carta) sigue igual: sus pruebas pasan sin tocarlas.
- Lint, tipos, tests, build y e2e en verde.

## No toques

`src/lib/datos/**`, `src/lib/dominio/**`, `src/lib/i18n/carta.*.ts`, `src/app/r/**` y `src/lib/resenas/**` (carril `resenas`), `src/app/(panel)/panel/[local]/resenas/**`, `src/componentes/carta/**`, `package.json` (no hacen falta dependencias nuevas).

## Reglas de reseñas (obligatorias)

Fuente: `docs/brief.md` → «Reglas de reseñas» (política de Google y ley española de competencia desleal y consumidores).
1. **Igual para todos**: el botón y el QR llevan directos a Google, sin preguntar antes «¿te ha gustado?», sin estrellas y sin mostrarse solo a algunos clientes (*review gating*, prohibido).
2. **Sin incentivos**: ningún texto ni cartel ofrece ni sugiere descuentos, regalos, sorteos ni nada a cambio de una reseña (ni de cambiarla o borrarla).
3. **Sin guiones**: no se pide mencionar a un empleado ni un contenido concreto.
4. **Kartana nunca escribe ni publica reseñas** por nadie.
5. Ningún dato del cliente del bar: ni cookies, ni almacenamiento en su móvil, ni IP, ni identificadores.

## Contexto del proyecto (para quien no ha leído nada más)

**Kartana** es un SaaS para bares y restaurantes pequeños de España: carta digital con QR siempre al día (14 alérgenos UE, 7 idiomas) y, en esta v0.3, un botón limpio para pedir reseñas en Google. El dueño usa el panel **desde el móvil, con prisa**; el cliente del bar abre la carta escaneando un QR, a veces con mala cobertura y a veces siendo turista.

- Repositorio: `C:\Users\RUBEN\carta-qr` (git, rama `main`). Web de pruebas: https://kartana-six.vercel.app
- Stack: **Next.js 16.4** (App Router, **Cache Components** y Partial Prefetching activados, `src/proxy.ts`), React 19.3, TypeScript estricto, Tailwind 4, **Zod 4**, Supabase (Postgres + Auth + Storage, proyecto `iewlsyvdkxzcncrbhpyx`, eu-central-1), Vercel, `@react-pdf/renderer` 4 y `qrcode` 1.5. Versiones exactas en `package.json`.
- Documentos de referencia (léelos si necesitas más detalle, pero este encargo basta): `docs/arquitectura.md` (§3.7 y §5.7 son la v0.3), `docs/propiedad.md`, `src/lib/tipos/*.ts`, maqueta `docs/diseno/qr.html`.
- Ya existen y **no los modifiques**: clientes de Supabase en `src/lib/supabase/` — `crearClienteServidor()` (con la sesión por cookies; quien lo use debe estar dentro de `<Suspense>`), `crearClientePublico()`, `crearClienteNavegador()`, `crearClienteAdmin()` (**no usar**). Idiomas en `src/lib/i18n/idiomas.ts` (`IDIOMAS_CARTA`). `urlSitio()` en `src/lib/config/sitio.ts`. `exigirUsuario()` en `src/lib/auth/sesion.ts`, `obtenerLocalActual()` en `src/lib/panel/local-actual.ts`, `obtenerLocalDelDueno()` en `src/lib/datos/panel.ts`. Componentes en `src/componentes/ui/`. `diccionarioCarta(idioma)` en `src/lib/i18n/carta.ts`. `<Contenedor>` en `src/componentes/Contenedor.tsx`.

## Reglas técnicas obligatorias

1. **Lee la documentación instalada** de Next en `node_modules/next/dist/docs/` antes de usar una API de Next. Para `@react-pdf/renderer` y `qrcode`, su documentación oficial (Context7). No inventes APIs. Los route handlers de PDF no llevan `export const runtime` (es incompatible con Cache Components; el de por defecto ya es Node.js).
2. **Cache Components**: leer `cookies()`, `headers()` o la sesión fuera de `<Suspense>` es error de build.
3. **Sesión**: en servidor, siempre `supabase.auth.getClaims()` (vía `obtenerUsuario`); **nunca** `getSession()`.
4. **Validación con Zod en el servidor** en cada route handler (`tipo`, `formato`).
5. **Seguridad**: nada de scripts de terceros; ningún secreto en el navegador.
6. **Textos**: en `src/lib/i18n/qr.es.ts` (objeto `as const`) o, para la frase del cliente, en `diccionarioCarta`. Español sencillo, de tú al dueño.
7. **Estilo**: tokens de Tailwind (`bg-fondo`, `bg-superficie`, `text-texto`, `text-texto-suave`, `border-borde`, `bg-primario`, `text-sobre-primario`, `font-titulo`…). Ningún color suelto en la interfaz (en los PDF, el color de marca del local y negro). Ancho solo con `<Contenedor>`. Zonas táctiles de al menos 48 px.
8. **TDD**: primero el test (Vitest, `*.test.ts(x)`; para módulos con `import "server-only"` usa `vi.mock("server-only", () => ({}))`), míralo fallar, implementa, míralo pasar. Las pruebas de navegador usan el build de producción; el proyecto móvil solo corre tests con `@movil` en el título.
9. **Accesibilidad**: el QR en pantalla con texto alternativo («Código QR que abre el formulario de reseña de Google»), `aria-live` en «Enlace copiado», contraste AA.

## Forma de trabajar

- Trabaja en tu rama o worktree (`carril/qr-resena`); en un worktree nuevo, `npm ci` primero. **Un commit por tarea**, mensaje en español claro. **No fusiones ni hagas `push` a `main`.**
- Toca **solo tus archivos**. Si necesitas cambiar otro, **no lo cambies**: escríbelo en tu informe.
- Si un contrato no te encaja, adapta tu código si puedes y pide el cambio en el informe.
- **Pruebas de navegador en paralelo con otros carriles**: usa tu propio puerto (`PUERTO_E2E=3122`); Playwright va con `workers: 1`. El local `e2e-prueba` es compartido con `carta-publica-v03`, que trabaja a la vez: **no cambies** su ficha de Google ni su publicación. Si una página usa `<Suspense>`, espera a que cargue antes de leer su estado.

## Comandos de verificación (todos en verde antes de terminar)

```
npm run lint
npm run typecheck
npm test
npm run build
PUERTO_E2E=3122 npm run test:e2e -- e2e/qr.spec.ts
```

## Informe final (tu última respuesta)

1. Qué has hecho, tarea por tarea, con sus commits.
2. Archivos creados o cambiados (todos deben ser tuyos).
3. Resultado de cada comando de verificación (pega el resumen) y el tamaño de cada PDF.
4. **Cambios compartidos pedidos**: archivo, cambio exacto y motivo.
5. Riesgos, dudas y lo que queda pendiente (p. ej. si algún idioma no cabe en las tarjetas).
