# Progreso

## Estado actual
**Fase 3 (v0.1) · integración 1 casi terminada (23/10/2026).** Carriles `datos`, `acceso` y `contenido` fusionados en `main`.
- Migraciones aplicadas: `modelo_v01` (20261022231431) e `imagenes_v01` (20261022231619). Comprobado: 8 tablas con RLS, 35 políticas, 20 funciones privadas, 4 RPC, 15 triggers.
- Test SQL de Storage: OK. Advisors: seguridad, solo «leaked password protection» (ajuste de Auth); rendimiento, índices sin usar (base vacía) y varias políticas SELECT por tabla (diseño: una por perfil).
- Tipos generados en `src/lib/datos/database.types.ts`. Rol admin al usuario de pruebas admin; local `e2e-prueba` (cortesía) del dueño de pruebas. El rol admin del usuario real se pone cuando entre por primera vez.
- Lint, tipos, 444 tests unitarios y build en verde; e2e 18 de 20 (los 2 que faltan esperan a `/panel`, que crea panel-local en la ola 2).
- 23/10: test SQL `01_rls_v01` en verde en el proyecto remoto (dentro de `begin … rollback`; no deja datos). Semilla `supabase/semillas/demo.sql` aplicada: `/c/demo` publicado, 8 secciones, 82 platos, 1 menú, acceso de cortesía sin caducidad.
**Siguiente:** lanzar la ola 2.

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
