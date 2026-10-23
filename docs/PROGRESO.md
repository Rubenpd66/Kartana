# Progreso

## Estado actual
**v0.1 cerrada y publicada (23/10/2026, commit `ef3021f`)** en https://kartana-six.vercel.app. CI en verde; 696 tests unitarios y 102 e2e; QR y PDF probados por el usuario («todo bien»). Informe en `docs/qa/v0.1.md`.
**Fase 4 (v0.2 · idiomas y estadísticas): empezando la ola 1** (`datos-v02`, `traduccion`, `contenido-v02`). `pg_cron` y `pg_net` están disponibles en el proyecto. Falta `GOOGLE_CLOUD_API_KEY` (ver TU-TURNO); `TRADUCCION_ACTIVA` sigue en `false`.
- Pendiente heredado del QA: aviso `Date.now() while prerendering` en las páginas con sesión; JS de hidratación (TBT 360–560 ms); `@axe-core/playwright` sin instalar; el PDF con fuentes en Vercel (verlo con sesión).

### v0.2 · ola 1 integrada y migración aplicada (23/10/2026, sin publicar)
`datos-v02`, `traduccion` y `contenido-v02` en `main`; migración `idiomas_estadisticas_v02` aplicada (tablas con RLS, 6 funciones públicas y 3 privadas), semilla de traducciones de la demo cargada (82 platos, 7 idiomas), advisors sin avisos nuevos. Pestañas «Idiomas» y «Visitas» en la navegación del panel: **no publicar hasta que la ola 2 cree sus páginas** (ahora dan 404 y dos e2e de «consola limpia» fallan por eso).
- `pg_cron` **no está activado**: la limpieza diaria de estadísticas (>400 días) no está programada. Activarlo cuando haga falta.
- Hay dos migraciones remotas (`…124512` y `…124551_completa`); en local solo existe la segunda.
- Sigue sin `GOOGLE_CLOUD_API_KEY` (TU-TURNO, punto 0): `TRADUCCION_ACTIVA=false`.

### Siguiente sesión
1. Ola 2 de la v0.2: `carta-publica-v02`, `estadisticas`, `panel-idiomas`; integrarla, e2e completos y publicar.
2. Ola 3: `qa-v02`. Probar `traducirLocal` con la clave de Google y encender `TRADUCCION_ACTIVA`.

## Fase 2 — Contratos y plan por carriles · ✅ 22/10/2026
- kit-arquitecto (Opus, alto): `docs/arquitectura.md`, `src/lib/tipos/` (8 archivos), `docs/propiedad.md`, `docs/plan.md` (v0.1: 9 carriles en 3 olas; v0.2: 7 en 3; v0.3–v0.6 esbozadas) y 16 encargos en `docs/carriles/`.
- Maquetas en `docs/diseno/` (carta pública, panel, editor de plato, QR, admin, entrar, portada) con la carta real de «Cafetería La Guagua» (`docs/datos/carta-la-guagua.md`).
- Requisitos añadidos por el director: precios por variante (½ / ración, mediana / grande, unidad, docena) y carta de demostración.
- 8 decisiones confirmadas (ver DECISIONES). Preparativos: `@react-pdf/renderer` 4.9.0 y `qrcode` 1.5.4 instalados; usuarios de prueba creados y confirmados (credenciales en `.env.local` y secretos de GitHub); SMTP de Gmail comprobado (envía correos).

## Fase 1 — Cimientos · ✅ 22/10/2026
- **Despliegue v0.0:** Vercel, proyecto `kartana` (`prj_1FF6EsbKsC6n7DkIHJAi1Fo4XbCl`), funciones en fra1, enlazado a GitHub (cada push a `main` publica). Dirección: https://kartana-six.vercel.app (`kartana.vercel.app` estaba cogida). `/api/health` → `{estado: ok, bd: ok}`. Las 6 pruebas de navegador pasan contra la web publicada: sin errores de consola ni de hidratación, cabeceras de seguridad presentes.
- Repositorio privado [Rubenpd66/kartana](https://github.com/Rubenpd66/kartana), rama `main`. GitHub CLI 2.103 instalada (permisos `repo` y `workflow`).
- Next.js 16.4.2 + React 19.3 + Tailwind 4 + TypeScript, con Cache Components y Partial Prefetching.
- Supabase: proyecto `kartana` (ref `iewlsyvdkxzcncrbhpyx`, eu-central-1, plan gratis). Migración `20261022153213_base_seguridad_y_salud` aplicada: RLS automática en tablas nuevas de `public` y función `salud()`. Avisos de seguridad: ninguno.
- Clientes de Supabase (navegador, servidor con sesión, público sin cookies, admin con clave secreta) y `src/proxy.ts` solo para zonas con sesión.
- Seguridad: CSP mínima, HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy; sin cabecera `x-powered-by`.
- Diseño base: tokens cálidos (solo claro), Fraunces + Figtree autoalojadas, `Contenedor` único (estrecho 640 px / ancho 1120 px), cabecera, pie, error, 404, «reducir movimiento».
- SEO base: metadatos, robots, sitemap, imagen para redes, JSON-LD.
- Legal base: aviso legal, privacidad, cookies y condiciones como funciones que se adaptan a los interruptores (pagos, traducción).
- Interruptores apagados: `PAGOS_ACTIVOS`, `TRADUCCION_ACTIVA`, `RESENAS_API_ACTIVA`.
- Calidad: ESLint, Vitest (11 tests), Playwright escritorio + móvil contra el build de producción (6 tests), CI en GitHub Actions ✅.
- `/api/health` + cron diario de Vercel.
- Memoria compartida: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.

## Fase 0 — Descubrimiento y decisiones · ✅ 22/10/2026
- Herramientas: node 24, npm 11, git 2.51 y Chromium de Playwright, listos. Docker no instalado (solo hace falta para Strix).
- Conectores comprobados: Supabase, Vercel (plan Hobby), Stripe (entorno de prueba «Kartana»), Context7. Sin conector MCP de GitHub: se usa `gh`.
- Cuestionario respondido: nombre Kartana, 7 idiomas de carta, precios 10/17 € + IVA, gratis en el piloto, código por correo + Google, Google Translate, sin buzón, aspecto claro, pilotos manuales, plan Pro, solo Claude Code.
- Cambios posteriores del usuario: despliegue de prueba en el dominio gratis de Vercel; pagos al final (v0.6).
