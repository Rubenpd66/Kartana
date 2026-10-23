# Progreso

## Estado actual
**Fase 3 (v0.1) · ola 3 integrada (23/10/2026).** En `main` están todos los carriles de la v0.1, incluidos `qr-pdf` (pantalla `/panel/<local>/qr`, PDF de mesa, pegatinas y póster, SVG suelto) y `qa-v01` (informe en `docs/qa/v0.1.md`). Falta el cierre de la v0.1: arreglos del QA, publicar y pruebas en móvil real.
- Lint, tipos, 696 tests unitarios y build en verde; e2e 102 pasados, 1 saltado.
- `e2e-prueba` devuelto a «sin publicar» tras la ola 3 (algún agente lo dejó publicado). Rol admin puesto a `rubenpd66@gmail.com`.
- Fuentes de los PDF (Figtree, Fraunces, OFL) en `docs/fuentes-datos.md`; `next.config.ts` las incluye en la función de Vercel. **Tras publicar, comprobar que el PDF lleva «Figtree».**
- Pendiente del QA: (I1) contraste de la insignia «Sin revisar» en `/panel/<id>/menu/nuevo`; (I2) aviso `Date.now() while prerendering` en las páginas con sesión; (M2) zonas táctiles pequeñas en el pie; (M4) el e2e `carta-publica.spec.ts:141` depende de que `e2e-prueba` esté sin publicar; JS de hidratación (TBT 360–560 ms). Lighthouse móvil: rendimiento 84–91, accesibilidad 100.
- Sin instalar aún `@axe-core/playwright` (el QA usa `axe-core` a mano).

### Siguiente sesión
1. Arreglar I1, M2 y revisar I2 (ver arriba).
2. Publicar (push a `main`) y comprobar en Vercel el PDF con fuentes y `/c/demo`.
3. El usuario imprime un PDF y prueba el QR con dos móviles (iPhone y Android).
4. Cierre de la v0.1 (ver `docs/plan.md`) y empezar la v0.2.

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
