# Carril `qa-v03` · v0.3 · Ola 3

> Agente recomendado: `kit-qa` · modelo **sonnet**, esfuerzo **medium**.


> **Decisiones del usuario (23/10/2026), mandan sobre el resto de este documento:**
> - **D2: no se guarda el nombre de la ficha de Google.** No existe `google_place_nombre` ni `nombreFicha` (ni columna, ni CHECK, ni grant, ni campo en tipos, esquemas o límites). El panel enseña «Ficha de Google conectada» y un enlace «Comprobar en Google Maps» (`https://www.google.com/maps/place/?q=place_id:<placeId>`). El nombre de Place Details solo se muestra en el momento de elegir y no se guarda.
> - D1: se rechazan los enlaces cortos `maps.app.goo.gl`. D3: al conectar la ficha, el botón se enciende solo. D4: el QR de reseña se puede descargar antes de conectar la ficha. D5: sin mirar el plan contratado. D6: la carta `demo` no lleva botón de reseña. D7: Places en la política de privacidad sin subir versión.
> - D8: la navegación del panel pasa a **Inicio, Carta, Menú, QR y «Más»** (en «Más»: Idiomas, Reseñas, Visitas, Local). La hace el director en la integración 1.

## Objetivo

Comprobar de punta a punta la v0.3 integrada: conectar la ficha de Google, el botón de la carta, la redirección `/r/<slug>`, el QR de reseña y las estadísticas de clics; y, sobre todo, que **se cumplen las reglas de reseñas** (igual para todos, sin incentivos, sin filtro, sin datos del cliente). Reportar fallos con pasos; no arreglar código de otros carriles.

## Archivos propios

- `e2e/flujos-v03.spec.ts`
- `e2e/ayudas/**` (ampliar las utilidades de la v0.1 y la v0.2, p. ej. `e2e/ayudas/v03.ts`)
- `docs/qa/v0.3.md`

## Contratos

**Usa**: la web tras la integración 2 de la v0.3; sesiones guardadas `e2e/.auth/dueno.json` y `admin.json`; local `e2e-prueba`; carta `demo`. Rutas y reglas en `docs/arquitectura.md` §4.1 y §5.7. Funciones puras que puedes importar en las pruebas: `contieneTextoProhibidoResena`, `rutaResena`, `urlEscribirResena` (`src/lib/dominio/resenas.ts`), `diccionarioCarta` (`src/lib/i18n/carta.ts`), `IDIOMAS_CARTA`. ID de ficha de prueba: `ChIJN1t_tDeuEmsRUsoyG83frY4` (ejemplo de la documentación de Google); enlace `g.page` de prueba: `https://g.page/r/PRUEBAkartana01/review`.

## Qué probar

1. **Flujo del dueño** (`@movil` en al menos uno): entrar → `/panel/<id>/resenas` → pegar un enlace malo (`https://maps.app.goo.gl/abc`) → error claro; pegar el ID de prueba → conectado y botón encendido → «Probar el enlace» apunta a Google directamente (no a `/r/`) → apagar → encender → cambiar a un enlace `g.page` → quitar. La pestaña «Reseñas» del panel lleva a la página.
2. **Botón en la carta**: con el botón encendido y el local publicado, `/c/e2e-prueba` muestra el botón al final, con `href="/r/e2e-prueba"` y `rel="nofollow"`; en cada idioma activo el texto es el `botonResena` de su diccionario; no hay estrellas, ni preguntas previas, ni ventanas emergentes; el botón **no** se precarga (al cargar la carta no sale ninguna petición a `/r/`). Apagado → no sale. La vista previa del panel lo enseña sin enlace.
3. **`/r/<slug>`** (con `request` y `maxRedirects: 0`): 307 a `https://search.google.com/local/writereview?placeid=…` (o al enlace `g.page`); `Cache-Control: no-store`, `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer`; **sin `Set-Cookie`**; `HEAD` no cuenta; un bot (`Googlebot`) no cuenta; con `Sec-Purpose: prefetch` no cuenta; con el user-agent normal (`UA_NO_BOT`) sí cuenta (sube «Clics en dejar reseña» en estadísticas, con `expect.poll`); botón apagado → 307 a `/c/<slug>` sin contar; slug inexistente → 307 a `/c/<slug>` (que da 404); slug antiguo (si puedes cambiarlo y restaurarlo por el panel sin romper nada; si no, márcala como omitida) → sigue funcionando. Nunca sigas la redirección hasta Google: intercepta `https://search.google.com/**` y `https://g.page/**` con `page.route` cuando uses el navegador.
4. **`/robots.txt`** contiene `Disallow: /r/`.
5. **`/api/lugares`**: con el interruptor apagado (lo normal en CI) → 404 `servicio_apagado`; ninguna respuesta lleva la clave. Si el director ha encendido `RESENAS_API_ACTIVA` en tu entorno, una búsqueda real («La Guagua Las Palmas») devuelve sugerencias y elegir una conecta la ficha; si no, márcalo como omitido con motivo. Busca `GOOGLE_CLOUD_API_KEY` y `AIza` en `.next/static/**`: no debe aparecer.
6. **QR de reseña**: en `/panel/<id>/qr` la sección `#resena` se ve; los tres PDF (`tarjetas`, `tiras`, `cartel`) y el SVG se descargan; el QR del SVG apunta a `<web>/r/e2e-prueba` (decodifícalo si tienes cómo; si no, compara con el QR esperado).
7. **Textos sin incentivos ni filtro**: `contieneTextoProhibidoResena` es false para `botonResena` en los 7 idiomas, para todos los textos de `src/lib/i18n/qr.es.ts` que se imprimen (`pdf`) y para el texto visible de `/c/e2e-prueba` (todos los idiomas activos) y de la sección de reseña de `/panel/<id>/qr` (excepto el recordatorio de reglas para el dueño). Revisa a ojo un PDF de cada formato y descríbelo en el informe.
8. **Privacidad** (repite la de la v0.2 con el botón encendido): en `/c/e2e-prueba` y tras pulsar el botón, sin `Set-Cookie`, `document.cookie` vacío, `localStorage`/`sessionStorage`/IndexedDB vacíos (`comprobarAlmacenamientoVacio`); la carta solo pide a la propia web y al bucket de imágenes (`vigilarSalientes`).
9. **Rendimiento**: Lighthouse móvil de `/c/demo` (los cuatro valores) y peso del JS de la carta comparado con la v0.2 (no debe crecer: el botón es HTML).
10. **Consola limpia** en `/panel/<id>/resenas`, `/panel/<id>/qr` y `/c/e2e-prueba`.

## Tareas (en orden)

1. Ampliar `e2e/ayudas/` (`conectarFichaPorPanel`, `quitarFichaPorPanel`, `peticionR(slug, cabeceras)`, `clicsResenaHoy`).
2. Pruebas 1–8 y 10 en `e2e/flujos-v03.spec.ts`. Cada prueba deja `e2e-prueba` como estaba: sin publicar, cortesía, sin platos y **sin ficha de Google**. Cambia la configuración **por el panel** (las acciones invalidan la caché).
3. Punto 9 e informe `docs/qa/v0.3.md`: tabla pasa/falla, valores, fallos priorizados con su carril dueño (`datos-v03`, `resenas`, `carta-publica-v03`, `qr-resena` o director) y una sección «Reglas de reseñas» con el resultado de cada regla.

## Criterios de terminado

- Pruebas en verde o fallos reportados (nunca desactivados en silencio).
- Informe completo, con la comprobación de las reglas de reseñas.

## No toques

Ningún archivo de `src/`; los `e2e/*.spec.ts` de otros carriles; `playwright.config.ts`.

## Reglas de reseñas (lo que estás comprobando)

Fuente: `docs/brief.md` → «Reglas de reseñas» (política de Google y ley española de competencia desleal y consumidores).
1. **Igual para todos**: el botón y el QR llevan directos a Google, sin preguntar antes «¿te ha gustado?», sin estrellas y sin mostrarse solo a algunos clientes (*review gating*, prohibido).
2. **Sin incentivos**: ningún texto ni cartel ofrece ni sugiere descuentos, regalos, sorteos ni nada a cambio de una reseña (ni de cambiarla o borrarla).
3. **Sin guiones**: no se pide mencionar a un empleado ni un contenido concreto.
4. **Kartana nunca escribe ni publica reseñas** por nadie.
5. Ningún dato del cliente del bar: ni cookies, ni almacenamiento en su móvil, ni IP, ni identificadores. Los clics se cuentan solo como un número por día.

## Contexto del proyecto (para quien no ha leído nada más)

**Kartana** es un SaaS para bares y restaurantes pequeños de España: carta digital con QR siempre al día (14 alérgenos UE, 7 idiomas) y, en esta v0.3, un botón limpio para pedir reseñas en Google. El dueño usa el panel **desde el móvil, con prisa**; el cliente del bar abre la carta escaneando un QR, a veces con mala cobertura y a veces siendo turista.

- Repositorio: `C:\Users\RUBEN\carta-qr` (git, rama `main`). Web de pruebas: https://kartana-six.vercel.app
- Stack: **Next.js 16.4** (App Router, **Cache Components**), React 19.3, TypeScript, Tailwind 4, Zod 4, Supabase, Vercel, Playwright. Versiones exactas en `package.json`.
- Documentos de referencia: `docs/arquitectura.md` (§3.7 y §5.7 son la v0.3), `docs/propiedad.md`, `docs/qa/v0.2.md` (formato del informe anterior), `e2e/ayudas/**` (utilidades ya hechas: `SLUG_E2E`, `clienteDueno`, `idLocalDePruebas`, `asegurarPublicado`, `restaurarPublicado`, `publicarPorPanel`, `restaurarPublicacionPorPanel` (usa estas dos: publicar por el panel invalida la caché de la carta y de `/r/`), `vigilarErrores`, `UA_NO_BOT`, `comprobarAlmacenamientoVacio`, `vigilarSalientes`).

## Reglas técnicas obligatorias

1. Las pruebas de navegador usan el **build de producción** (`npm run build` antes) y Playwright arranca el servidor en `PUERTO_E2E` (por defecto 3100). El proyecto móvil solo corre tests con `@movil` en el título.
2. Primera vez en una máquina: `npx playwright install chromium`.
3. Si una página usa `<Suspense>`, espera a que cargue (`expect(a.or(b)).toBeVisible()`) antes de leer su estado; `isVisible()` a secas da falsos negativos.
4. Nunca llames a Google de verdad desde las pruebas (salvo el punto 5 si el director lo enciende a propósito): intercepta las redirecciones.
5. No uses la clave secreta de Supabase; usa las sesiones guardadas.

## Forma de trabajar

- Trabaja en tu rama o worktree (`carril/qa-v03`); en un worktree nuevo, `npm ci` primero. **Un commit por tarea**, mensaje en español claro. **No fusiones ni hagas `push` a `main`.**
- Toca **solo tus archivos**. Lo que falle en `src/` se reporta con su carril dueño, no se arregla.
- Playwright va con `workers: 1`; usa `PUERTO_E2E=3131` si algún otro carril está probando a la vez.

## Comandos de verificación

```
npm run lint
npm run typecheck
npm run build
PUERTO_E2E=3131 npm run test:e2e
```

## Informe final (tu última respuesta)

1. Qué has hecho, con sus commits.
2. Archivos creados o cambiados (todos deben ser tuyos).
3. Resultado de las pruebas (pasan/fallan/omitidas con motivo) y de Lighthouse.
4. Fallos encontrados, priorizados, con pasos para reproducirlos y su carril dueño.
5. **Cambios compartidos pedidos** (p. ej. en `playwright.config.ts`) con el cambio exacto y el motivo.
