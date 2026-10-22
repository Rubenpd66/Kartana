# AGENTS.md — Memoria compartida del proyecto

Leída por Claude Code (vía CLAUDE.md), Antigravity, Gemini y Codex. Estado actual en `docs/PROGRESO.md`. Lo que le toca al usuario en `docs/TU-TURNO.md`. Decisiones en `docs/DECISIONES.md`; alcance en `docs/brief.md`.

## Proyecto
- **Nombre:** Kartana · **Dominio:** pruebas en la dirección gratis de Vercel; kartana.app más adelante (v0.4).
- **Idea:** SaaS para bares y restaurantes pequeños de España: carta digital con QR siempre al día (alérgenos, 7 idiomas) + botón y QR limpios para pedir reseñas en Google.
- **Idiomas:** web y panel en español sin prefijo (inglés después con `/en/`). Cartas públicas en es, en, fr, de, ca, eu, gl: `/c/<local>` (es) y `/c/<local>/<xx>`. Utilidades en `src/lib/i18n/idiomas.ts`.
- **Ingresos:** suscripción con Stripe en la v0.6, apagada por defecto (`PAGOS_ACTIVOS=false`). Todo lo que cobra o depende de terceros va detrás de un interruptor (`src/lib/config/interruptores.ts`).
- **Datos personales:** solo de los dueños (correo, nombre, datos del negocio). **Ningún dato de los clientes de los bares, ninguna cookie ni almacenamiento en su móvil** en las cartas públicas. Estadísticas solo como contadores agregados en el servidor.
- **Reseñas:** prohibido el *review gating*, los incentivos y escribir reseñas por nadie. El botón va directo a Google, igual para todos. Ver `docs/brief.md`.

## Stack (aprobado en la Fase 0)
Next.js 16.4 (App Router, **Cache Components** y Partial Prefetching activados, `src/proxy.ts`) + TypeScript + Tailwind 4 · Supabase (Postgres, Auth, Storage; proyecto `kartana`, ref `iewlsyvdkxzcncrbhpyx`, eu-central-1) · Vercel. Zod para validar en el servidor. Versiones exactas: `package.json`. **Lee siempre la documentación de la versión instalada** (`node_modules/next/dist/docs/`) antes de escribir código.

## Comandos
- Instalar: `npm ci` · Desarrollo: `npm run dev` · Build: `npm run build` · Lint: `npm run lint` · Tipos: `npm run typecheck`
- Tests unitarios: `npm test` (archivos `*.test.ts` junto al código)
- Tests de navegador: `npm run test:e2e` (en `e2e/`; prueban el build de producción: haz `npm run build` antes). Proyecto móvil solo con `@movil` en el título. Primera vez: `npx playwright install chromium`.
- Migraciones: `npx supabase migration new <nombre>` crea el archivo en `supabase/migrations/`. No hay Docker: no hay base de datos local. El director aplica las migraciones al proyecto remoto.

## Estructura y propiedad
- Ver `docs/arquitectura.md` (modelo de datos, rutas, módulos) y `docs/propiedad.md` (qué archivos son de cada carril) — los crea la Fase 2.
- Grupos de rutas: `src/app/(web)/` (web con cabecera y pie). Las cartas públicas `/c/...` irán en su propio grupo, sin la cabecera de Kartana.
- Componentes compartidos en `src/componentes/`; lógica en `src/lib/`.
- **Archivos compartidos, solo del director:** `src/app/layout.tsx`, `src/app/(web)/layout.tsx`, `Cabecera`, `Pie`, `Contenedor`, `globals.css`, `src/lib/i18n/comun.*`, `src/lib/config/*`, `src/lib/supabase/*`, `src/proxy.ts`, `sitemap.ts`, `robots.ts`, `next.config.ts`, `package.json`, `vercel.json`, `.claude/`, `.github/`.
- Textos en diccionarios **por módulo** (`src/lib/i18n/<modulo>.<idioma>.ts`).
- Ancho de página: **solo** con `<Contenedor ancho="estrecho|ancho">`. No escribas `max-w-*` de página en otros archivos.
- Colores y fuentes: usa los tokens de Tailwind (`bg-fondo`, `text-texto-suave`, `bg-primario`, `font-titulo`…). No metas colores sueltos.

## Reglas
- Secretos solo en `.env.local` (nunca en git); `.env.example` sin valores. `SUPABASE_SECRET_KEY` solo en el servidor (`src/lib/supabase/admin.ts`).
- Un commit por tarea, con mensaje claro. `docs/PROGRESO.md` al día al terminar cada tarea.
- Los subagentes trabajan en su rama o worktree, solo en sus archivos, y no fusionan ni hacen `push` a `main`.
- No inventar: documentación oficial (Context7 o la del paquete instalado) ante la duda.
- TDD en la lógica; un test de navegador por flujo; build de producción probado al cerrar cada versión.
- Datos e imágenes de terceros solo con licencia; fuente y licencia en `docs/fuentes-datos.md`.
- RLS en todas las tablas (se activa sola en `public` por un event trigger, pero cada tabla necesita sus políticas, una por operación); validación con Zod en el servidor; nada de scripts de terceros en zonas con datos personales.
- El usuario es principiante: español sencillo, respuestas cortas y acabar siempre con el siguiente paso.

## Notas técnicas
- **Cache Components:** leer `cookies()`, `headers()` o la sesión fuera de `<Suspense>` es error de build. Datos públicos de cartas: `'use cache'` + `cacheTag` y `updateTag`/`revalidateTag` al guardar, con `crearClientePublico()` (sin cookies). Zonas privadas: `crearClienteServidor()` dentro de `<Suspense>`.
- **Proxy** (`src/proxy.ts`) solo corre en `/panel`, `/admin`, `/entrar`, `/auth` para refrescar la sesión. **No protege nada**: cada página y acción comprueba al usuario con `supabase.auth.getClaims()` cerca de los datos. Nunca `getSession()` en el servidor.
- **CSP mínima** en `next.config.ts` (sin nonces, para no forzar render dinámico). Si se añade un script de terceros, hay que revisarla.
- `LayoutProps`/`PageProps` son tipos globales generados por `next typegen` (lo ejecuta `npm run typecheck`).
- Playwright espera al servidor en `/robots.txt` y usa el puerto 3100.
- Hay un `package-lock.json` suelto en `C:\Users\RUBEN`; por eso `turbopack.root` está fijado en `next.config.ts`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
