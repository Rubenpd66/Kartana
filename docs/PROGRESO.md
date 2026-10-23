# Progreso

## Estado actual
**v0.2 cerrada y publicada (23/10/2026).** **v0.3 (reseñas): plan detallado y decisiones tomadas; ola 1 SIN EMPEZAR** (se pararon los agentes por el límite del plan antes de guardar nada; worktrees y ramas limpiados).
- Plan: `docs/plan.md` (v0.3), encargos en `docs/carriles/{datos-v03,resenas,carta-publica-v03,qr-resena,qa-v03}.md`, tipos en `src/lib/tipos/resenas.ts`. Decisiones D1–D8 en `docs/DECISIONES.md` y al principio de cada encargo (mandan sobre el resto): **no se guarda el nombre de la ficha de Google**, el botón se enciende solo al conectar, la demo sin botón, menú del panel con «Más».
- Clave de Google ampliada a Places API (comprobada). `RESENAS_API_ACTIVA=false` hasta probar el carril `resenas`. `TRADUCCION_ACTIVA=true` en Vercel.
- `e2e-prueba` limpio (sin publicar, solo `es`, sin secciones).

### Siguiente sesión
1. Lanzar la ola 1 de la v0.3, de uno en uno: `datos-v03` (kit-datos, opus/medium, rama `carril/datos-v03`) y `resenas` (kit-modulo, opus/high, rama `carril/resenas`, `PUERTO_E2E=3102`). Recordarles que el bloque «Decisiones del usuario» del encargo manda.
2. En cuanto entregue `datos-v03`: aplicar su migración (si lleva `delete`, en una sesión normal de `claude`), tests SQL, tipos.
3. Integración 1: `robots.ts` con `Disallow: /r/`, navegación con «Más», `database.types.ts`. Luego ola 2 (`carta-publica-v03`, `qr-resena`) y `qa-v03`.
4. Pendientes menores de la v0.2: `<html lang>` (H1), límite de ritmo de `POST /api/e` (H4), `pg_cron`, revisión nativa de eu/gl.

### v0.2 · ola 3 (QA) integrada (23/10/2026)
`qa-v02` en `main` (`docs/qa/v0.2.md`): 149 e2e pasados, 943 unitarios, Lighthouse móvil `/c/demo` 93–97 y `/c/demo/de` 97 (TBT 160–180 ms, mejor que la v0.1). Sin cookies ni almacenamiento en ningún idioma.
- **Traducción real probada con Google (clave puesta):** «Croquetas de jamón» → «Schinkenkroketten»; la corrección manual sobrevive a un cambio del español. 98 caracteres de cuota usados. **`TRADUCCION_ACTIVA=true` en Vercel desde el 23/10/2026** (desplegado con `b72bf88`); falta que el usuario lo vea en el panel de producción.
- Pendientes de QA: (H1) `<html lang="es">` en todas las cartas; (H4) sin límite de ritmo en `POST /api/e` (conviene antes del lanzamiento); (H2) `textos.textoOriginal` sin usar; (H3) `hreflang` de 7 idiomas en el `<head>` sin probar en una carta indexable; abiertos de la v0.1: I2 (`Date.now()` en el panel), M1 (`/admin` 200).
- Para el usuario: probar la carta desde un QR impreso (iPhone y Android); Lighthouse sobre la URL de Vercel.

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
