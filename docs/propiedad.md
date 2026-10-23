# Propiedad de archivos por carril

> Fase 2 · 22/10/2026. Regla: **dos carriles nunca comparten un archivo**. Todo lo que no aparece aquí es del **director**.
> Si un carril necesita cambiar un archivo que no es suyo, lo escribe en su informe final («Cambios compartidos pedidos») con el archivo, el cambio exacto y el motivo. No lo toca.
> Los tests unitarios (`*.test.ts(x)`) van junto al código y son del mismo dueño que el archivo que prueban.

## Del director (siempre)

- `src/app/layout.tsx`, `src/app/(web)/layout.tsx`, `src/app/(web)/page.tsx` (hasta la v0.4), `src/app/(web)/legal/**`, `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/opengraph-image.tsx`, `src/app/favicon.ico`
- `src/app/globals.css`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/api/health/**`
- `src/componentes/Cabecera.tsx`, `Pie.tsx`, `Contenedor.tsx`, `DocumentoLegalVista.tsx`
- `src/lib/config/**`, `src/lib/supabase/**`, `src/lib/legal/**`, `src/lib/i18n/idiomas.ts`, `src/lib/i18n/comun.*`
- **Índices de diccionarios**: `src/lib/i18n/carta.ts` (une `carta.<xx>.ts` y exporta `diccionarioCarta(idioma)`)
- `src/lib/tipos/**` (contratos; los cambios se piden)
- `src/lib/panel/navegacion.ts` **a partir de la v0.2** (en la v0.1 lo crea `acceso`)
- `src/proxy.ts`, `next.config.ts`, `package.json`, `package-lock.json`, `vercel.json`, `playwright.config.ts`, `vitest.config.mts`, `tsconfig.json`, `eslint.config.mjs`, `.env.example`, `.gitignore`, `.github/**`, `.claude/**`
- `e2e/base.spec.ts`
- `docs/**` salvo lo indicado en cada carril; `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`
- Aplicar migraciones al proyecto remoto, ejecutar semillas, generar `src/lib/datos/database.types.ts` (el archivo pasa luego al carril de datos)

## v0.1

| Carril | Archivos y carpetas propios |
|---|---|
| **datos** | `supabase/migrations/<nuevas de la v0.1>` · `supabase/tests/**` · `src/lib/dominio/**` · `src/lib/datos/**` (`publico.ts`, `panel.ts`, `mutaciones.ts`, `admin.ts`, `cache.ts`, `filas.ts`, `mapeos.ts`, `database.types.ts` cuando exista) · `src/lib/validacion/**` |
| **contenido** | `src/componentes/alergenos/**` · `src/lib/i18n/carta.es.ts`, `carta.en.ts`, `carta.fr.ts`, `carta.de.ts`, `carta.ca.ts`, `carta.eu.ts`, `carta.gl.ts` · `src/lib/i18n/carta.diccionarios.test.ts` · `supabase/semillas/demo.sql` · `src/lib/demo/**` · `docs/contenido/**` · nota de iconos en `docs/fuentes-datos.md` (solo la sección «Iconos y recursos gráficos») |
| **acceso** | `src/app/(web)/entrar/**` · `src/app/auth/**` · `src/lib/auth/**` · `src/lib/panel/local-actual.ts` · `src/lib/panel/navegacion.ts` (solo en la v0.1) · `src/lib/imagenes/**` · `src/componentes/ui/**` · `src/componentes/panel/**` (barra y navegación del panel) · `src/app/(panel)/layout.tsx` · `src/app/(panel)/panel/[local]/layout.tsx` · `src/app/(panel)/panel/cuenta/**` · `src/lib/i18n/acceso.es.ts`, `panel.es.ts`, `ui.es.ts` · `e2e/sesion.setup.ts` · `e2e/acceso.spec.ts` |
| **panel-local** | `src/app/(panel)/panel/page.tsx` · `src/app/(panel)/panel/bienvenida/**` · `src/app/(panel)/panel/[local]/page.tsx` · `src/app/(panel)/panel/[local]/local/**` · `src/componentes/panel-local/**` · `src/lib/i18n/panel-local.es.ts` · `e2e/panel-local.spec.ts` |
| **panel-carta** | `src/app/(panel)/panel/[local]/carta/**` · `src/app/(panel)/panel/[local]/menu/**` · `src/componentes/panel-carta/**` · `src/lib/i18n/panel-carta.es.ts` · `e2e/panel-carta.spec.ts` |
| **carta-publica** | `src/app/(carta)/**` · `src/app/(panel)/panel/[local]/vista-previa/**` · `src/componentes/carta/**` · `src/lib/carta/**` · `src/lib/i18n/carta-publica.es.ts` · `e2e/carta-publica.spec.ts` |
| **qr-pdf** | `src/app/(panel)/panel/[local]/qr/**` · `src/lib/qr/**` (incluye `src/lib/qr/fuentes/*.ttf`) · `src/componentes/qr/**` · `src/lib/i18n/qr.es.ts` · `e2e/qr.spec.ts` |
| **admin** | `src/app/(admin)/**` · `src/componentes/admin/**` · `src/lib/i18n/admin.es.ts` · `e2e/admin.spec.ts` |
| **qa-v01** | `e2e/flujos-v01.spec.ts` · `e2e/ayudas/**` · `docs/qa/v0.1.md` |

Ojo con las rutas: `src/app/(panel)/panel/[local]/` contiene carpetas de **varios** carriles. Cada carril es dueño solo de **su subcarpeta** (y `panel-local` solo del `page.tsx` suelto; el `layout.tsx` es de `acceso`).

## v0.2

| Carril | Archivos y carpetas propios |
|---|---|
| **datos-v02** | `supabase/migrations/<nuevas de la v0.2>` · `supabase/tests/**` · `src/lib/datos/traducciones.ts`, `estadisticas.ts` · cambios en `src/lib/datos/filas.ts`, `mapeos.ts`, `panel.ts`, `publico.ts`, `database.types.ts` · `src/lib/validacion/**` · `src/lib/dominio/**` |
| **traduccion** | `src/lib/traduccion/**` · **`src/lib/datos/cache.ts` pasa a este carril** (añade la traducción en segundo plano en `trasGuardarCarta`) |
| **contenido-v02** | `supabase/semillas/demo-traducciones.sql` · `src/lib/demo/traducciones-demo.ts`, `src/lib/demo/generar-traducciones.ts` · `src/lib/i18n/carta.*.ts` (revisión) · `docs/contenido/**` |
| **carta-publica-v02** | lo mismo que `carta-publica` en la v0.1 (incluye la isla de estadísticas `src/componentes/carta/Medidor.tsx`) |
| **estadisticas** | `src/app/api/e/**` · `src/lib/estadisticas/**` · `src/app/(panel)/panel/[local]/estadisticas/**` · `src/componentes/estadisticas/**` · `src/lib/i18n/estadisticas.es.ts` · `e2e/estadisticas.spec.ts` |
| **panel-idiomas** | `src/app/(panel)/panel/[local]/idiomas/**` · `src/componentes/panel-idiomas/**` · `src/lib/i18n/panel-idiomas.es.ts` · `e2e/panel-idiomas.spec.ts` |
| **qa-v02** | `e2e/flujos-v02.spec.ts` · `e2e/ayudas/**` · `docs/qa/v0.2.md` |

En la v0.2 los carriles de la v0.1 que no aparecen están cerrados: sus archivos los mantiene el director o se reasignan en el plan.

## v0.3 – v0.6 (esbozo; se detallará al planificar cada versión)

| Versión | Carril | Archivos previstos |
|---|---|---|
| v0.3 | `datos-v03` | migración (`locales.google_place_id`, `google_place_nombre`, `resenas_activas`), `src/lib/datos/resenas.ts` |
| v0.3 | `resenas` | `src/lib/resenas/**`, `src/app/api/lugares/**`, `src/app/r/**`, `src/app/(panel)/panel/[local]/resenas/**`, `src/lib/i18n/resenas.es.ts` |
| v0.3 | `carta-publica-v03` | carpetas de `carta-publica` (botón de reseña) |
| v0.3 | `qr-resena` | carpetas de `qr-pdf` (plantillas de reseña) |
| v0.4 | `contenido-venta`, `portada`, `legal-v04` | `src/app/(web)/page.tsx` y `src/app/(web)/precios/**` pasan a `portada`; `src/lib/legal/**` pasa a `legal-v04` durante la versión |
| v0.5 | `resenas-panel`, `respuestas-ia` | `src/lib/google-perfil/**`, `src/lib/respuestas/**` |
| v0.6 | `datos-v06`, `pagos`, `panel-suscripcion`, `admin-v06` | `src/lib/pagos/**`, `src/app/api/stripe/**`, `…/suscripcion/**` |
