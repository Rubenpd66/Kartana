# Plan de construcción · v0.1 a v0.6

> Fase 2 · 22/10/2026. Cómo se reparte el trabajo entre agentes para que construyan **en paralelo sin pisarse**.
> Límite: plan Pro → **como mucho 3 carriles a la vez** (olas de 2–3). Lo que más tarda va en la primera ola de cada versión.
> Encargos detallados: `docs/carriles/<carril>.md` (v0.1 y v0.2). v0.3–v0.6 están esbozadas y se detallarán al llegar.
> Propiedad de archivos: `docs/propiedad.md`. Modelo y rutas: `docs/arquitectura.md`. Contratos: `src/lib/tipos/`.

## Cómo leer este plan

- **Versión**: algo que se puede publicar y usar.
- **Ola**: grupo de carriles que trabajan a la vez porque no se esperan entre sí. Una ola empieza cuando la anterior está **integrada** (fusionada, migraciones aplicadas, build verde).
- **Integración**: tareas del director entre olas (fusionar ramas, aplicar migraciones, crear índices de diccionarios, tocar archivos compartidos que pidan los carriles).
- **Modelo y esfuerzo**: recomendación para lanzar al agente (`opus`/`sonnet`; esfuerzo `medium`/`high`).

## Resumen

| Versión | Olas | Carriles | Para qué |
|---|---|---|---|
| v0.1 | 3 | 9 | Empezar el piloto: panel, carta pública, alérgenos, QR en PDF, admin con pilotos |
| v0.2 | 3 | 7 | 7 idiomas con traducción corregible y estadísticas anónimas |
| v0.3 | 2 | 5 (esbozo) | Reseñas: ficha de Google, botón, QR de reseña |
| v0.4 | 2 | 4 (esbozo) | Página de venta, legal completo, dominio propio |
| v0.5 | 2 | 3 (esbozo, depende de Google) | Reseñas en el panel y respuestas con IA |
| v0.6 | 3 | 5 (esbozo) | Cobrar con Stripe (apagado hasta el PC4) |

---

## v0.1 — Empezar el piloto

### Antes de la ola 1 (director y usuario)

| Tarea | Quién | Bloquea |
|---|---|---|
| Aprobar maquetas (`docs/diseno/`) — **punto de control 2** | usuario | todo |
| Confirmar las decisiones abiertas (al final de este plan) | director | todo |
| Supabase → Auth: plantilla «Magic Link» con `{{ .Token }}` (código de 6 cifras), longitud de código 6, URLs de redirección (`http://localhost:3000/**`, `http://localhost:3100/**`, `https://kartana-six.vercel.app/**`) | director | ola 1 (acceso) |
| Proveedor Google en Supabase (cliente OAuth del proyecto `kartana` de Google Cloud) | director + usuario (TU-TURNO 3) | probar «Entrar con Google»; no bloquea el código |
| Crear usuarios de prueba con contraseña (`E2E_EMAIL`, `E2E_ADMIN_EMAIL`) y poner `E2E_*` en `.env.local` y secretos de GitHub; `E2E_ACCESO=true` solo en local y CI | director | e2e de la ola 1 en adelante |
| Rol de admin por SQL para el correo del usuario y para `E2E_ADMIN_EMAIL` (`docs/arquitectura.md` §5.2) — **después** de aplicar la migración de la ola 1 | director | admin (ola 3) |
| Instalar dependencias de la ola 3 ya (para no tocar `package.json` a mitad): `@react-pdf/renderer@4` y `qrcode@1.5` (+ `@types/qrcode`), versiones exactas | director | qr-pdf |
| Añadir `e2e/.auth/` a `.gitignore` | director | acceso |

### Ola 1 · base (3 carriles en paralelo)

| Carril | Qué entrega | Depende de | Modelo / esfuerzo | Encargo |
|---|---|---|---|---|
| **datos** | Migraciones v0.1 (tablas, RLS, funciones, Storage), tests SQL, `src/lib/dominio`, `src/lib/validacion`, `src/lib/datos` (consultas, mutaciones, caché) | contratos (`src/lib/tipos`) | **opus / high** (camino crítico) | `docs/carriles/datos.md` |
| **contenido** | 14 iconos de alérgenos propios, diccionarios de la carta en 7 idiomas, carta de demostración «Cafetería La Guagua» (`supabase/semillas/demo.sql`) | contratos | **sonnet / high** (lo que más tarda: 80 platos con descripciones, alérgenos orientativos y 7 idiomas) | `docs/carriles/contenido.md` |
| **acceso** | `/entrar` (código + Google), `/auth/*`, sesión y admin, aceptación de condiciones, armazón del panel, componentes de interfaz, subida de imágenes, login de pruebas | contratos | **opus / medium** (seguridad) | `docs/carriles/acceso.md` |

Por qué esta ola va primero: todo lo demás necesita la base de datos (datos), la forma de entrar y el armazón del panel (acceso), y los textos e iconos que usan el panel y la carta (contenido). La carta de demostración es lo más lento y no depende de nadie.

### Integración 1 (director)

1. Revisar y fusionar las tres ramas (orden: datos → acceso → contenido).
2. Aplicar las migraciones de `datos` con `apply_migration`; renombrar los archivos con la versión de `list_migrations`. Ejecutar `supabase/tests/*.sql` (en transacción con `rollback`). Pasar `get_advisors` (seguridad y rendimiento): cero avisos.
3. Generar tipos (`generate_typescript_types`) en `src/lib/datos/database.types.ts`.
4. Poner el rol de admin por SQL; crear el local de pruebas `e2e-prueba` del usuario de pruebas con acceso `cortesia`.
5. Ejecutar `supabase/semillas/demo.sql` (carta de demostración, acceso `cortesia`, `permitir_indexar = false`).
6. Crear el índice `src/lib/i18n/carta.ts` (`diccionarioCarta(idioma)`).
7. `playwright.config.ts`: proyecto `setup` con `e2e/sesion.setup.ts` y `storageState` (lo describe el informe de `acceso`).
8. Aplicar los «cambios compartidos pedidos» de los informes. `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`.

### Ola 2 · panel y carta (3 carriles en paralelo)

| Carril | Qué entrega | Depende de | Modelo / esfuerzo | Encargo |
|---|---|---|---|---|
| **panel-local** | `/panel`, bienvenida (aceptar + crear local), inicio con estado y lista de pasos, datos del local, horarios, logo, color con contraste, publicar | datos, acceso | **sonnet / high** | `docs/carriles/panel-local.md` |
| **panel-carta** | Secciones y platos, editor con variantes de precio y 14 alérgenos, agotado de un toque, ordenar, fotos, menús del día | datos, acceso, contenido | **opus / high** (la pantalla que más se usa) | `docs/carriles/panel-carta.md` |
| **carta-publica** | `/c/[slug]` estática con caché, filtro de alérgenos sin JS, aviso fijo, JSON-LD, redirección de slugs antiguos, vista previa del panel | datos, contenido | **opus / high** (Cache Components) | `docs/carriles/carta-publica.md` |

### Integración 2 (director)

Fusionar; `sitemap.ts` con `listarCartasIndexables()`; cambios compartidos; build y e2e; desplegar una vista previa en Vercel y probar en el móvil.

### Ola 3 · QR, admin y pruebas (3 carriles en paralelo)

| Carril | Qué entrega | Depende de | Modelo / esfuerzo | Encargo |
|---|---|---|---|---|
| **qr-pdf** | Pantalla de QR y PDF de cartelito de mesa, pegatinas y póster con logo | datos, acceso, panel-local (logo) | **sonnet / high** | `docs/carriles/qr-pdf.md` |
| **admin** | `/admin`: todos los locales, plan, estado, días restantes, botón «Activar piloto 60 días» | datos, acceso | **sonnet / medium** | `docs/carriles/admin.md` |
| **qa-v01** | Pruebas de navegador de los flujos completos de la v0.1, móvil, accesibilidad, Lighthouse de la carta | olas 1 y 2 integradas | **sonnet / medium** | `docs/carriles/qa-v01.md` |

### Cierre de la v0.1 (director)

Build de producción en local y e2e verdes; desplegar; pruebas en el móvil real (carta con mala cobertura: modo avión tras cargar, «3G lenta» en DevTools); `PROGRESO.md`; **punto de control**: el usuario crea su carta de un bar piloto.

---

## v0.2 — Idiomas y estadísticas

### Antes de la ola 1

| Tarea | Quién |
|---|---|
| Clave de API de Google Cloud **restringida a Cloud Translation API** → `GOOGLE_CLOUD_API_KEY` en `.env.local` y Vercel (solo servidor). `TRADUCCION_ACTIVA` sigue en `false` hasta probarlo | usuario + director |
| Comprobar si la extensión `pg_cron` está disponible en el proyecto (para limpiar estadísticas viejas) | director |
| Pasar `src/lib/datos/cache.ts` al carril `traduccion` (anotado en `propiedad.md`) | director |

### Ola 1 (3 carriles)

| Carril | Qué entrega | Depende de | Modelo / esfuerzo | Encargo |
|---|---|---|---|---|
| **datos-v02** | Migración de estadísticas, cuota de traducción y funciones de traducciones (nunca pisan lo manual); consultas y mutaciones de idiomas, traducciones y estadísticas | v0.1 | **opus / medium** | `docs/carriles/datos-v02.md` |
| **traduccion** | Cliente de Google Translate, huellas, planificación de pendientes, `traducirLocal`, traducción en segundo plano al guardar | contratos v0.2 | **opus / high** | `docs/carriles/traduccion.md` |
| **contenido-v02** | Traducción manual (revisada) de la carta de demostración a 6 idiomas; revisión de los diccionarios de la carta en ca, eu y gl | v0.1 | **sonnet / medium** (largo) | `docs/carriles/contenido-v02.md` |

### Integración 1

Migración, tests SQL, tipos, semilla de traducciones de la demo; probar `traducirLocal` con `TRADUCCION_ACTIVA=true` en local con un local de pruebas; añadir «Idiomas» y «Estadísticas» a `src/lib/panel/navegacion.ts`.

### Ola 2 (3 carriles)

| Carril | Qué entrega | Depende de | Modelo / esfuerzo | Encargo |
|---|---|---|---|---|
| **carta-publica-v02** | `/c/[slug]/[idioma]`, selector de idioma sin JS, `hreflang`, `lang`, textos sin traducir marcados, isla de estadísticas | datos-v02, contenido-v02 | **opus / medium** | `docs/carriles/carta-publica-v02.md` |
| **estadisticas** | `POST /api/e` y página del panel con visitas por día, idiomas y platos más vistos | datos-v02 | **sonnet / high** | `docs/carriles/estadisticas.md` |
| **panel-idiomas** | Activar idiomas, estado por idioma, «traducir ahora», corregir a mano campo a campo, avisos de traducción desactualizada | datos-v02, traduccion | **sonnet / high** | `docs/carriles/panel-idiomas.md` |

### Ola 3 (1 carril) y cierre

| Carril | Qué entrega | Modelo / esfuerzo | Encargo |
|---|---|---|---|
| **qa-v02** | e2e de idiomas, `hreflang`, «sin cookies ni almacenamiento» en la carta, beacon de estadísticas, Lighthouse en cada idioma | **sonnet / medium** | `docs/carriles/qa-v02.md` |

Director: `sitemap.ts` con las páginas por idioma; encender `TRADUCCION_ACTIVA` en Vercel; revisar que la política de privacidad menciona la traducción (ya lo hace con el interruptor).

---

## v0.3 — Reseñas (esbozo)

- **Antes**: clave de Places API (New) restringida a esa API (puede ser la misma clave de Google Cloud con dos APIs); `RESENAS_API_ACTIVA`.
- **Ola 1**:
  - `datos-v03` (opus/medium): `locales.google_place_id`, `google_place_nombre`, `resenas_activas`; `registrar_estadisticas` acepta `p_tipo = 'resena'`; consultas.
  - `resenas` (opus/high): `GET /api/lugares` (Autocomplete con token de sesión, solo con sesión y por `RESENAS_API_ACTIVA`), elegir ficha y guardar `place_id` (Place Details solo con `id` y `displayName`), alternativa «pegar enlace de Google Maps», `GET /r/[slug]` que cuenta el clic y redirige 307 a `https://search.google.com/local/writereview?placeid=…`, página `/panel/[local]/resenas`.
- **Ola 2**:
  - `carta-publica-v03` (sonnet/medium): botón discreto al final de la carta, igual para todos, enlace a `/r/<slug>` con `rel="nofollow"`. Nada de preguntas previas ni estrellas.
  - `qr-resena` (sonnet/medium): PDF de reseña (tarjeta para la cuenta, tira de ticket, cartel de barra) que apunta a `/r/<slug>`; textos sin incentivos.
  - `qa-v03` (sonnet/medium): incluye una comprobación de textos «sin incentivos ni filtro».
- Director: `robots.ts` con `Disallow: /r/`; condiciones del servicio ya prohíben el *review gating*.

## v0.4 — Vender puerta a puerta (esbozo)

- **Antes (usuario)**: comprar kartana.app; Resend; Vercel Pro antes de mostrar precios.
- **Ola 1**: `contenido-venta` (sonnet/high: textos de la portada, preguntas frecuentes, comparativa, capturas de la demo) · `legal-v04` (opus/medium: textos legales completos según lo activo; nueva versión en `VERSIONES_LEGALES` → el panel vuelve a pedir la aceptación).
- **Ola 2**: `portada` (opus/high: `/` y `/precios` con la carta de demostración y su QR en pantalla; sin botón de pago) · `qa-v04` (Lighthouse de la portada, SEO).
- Director: dominio, redirección 308 permanente de `kartana-six.vercel.app` → `kartana.app` (los QR impresos siguen funcionando), SMTP con Resend, `NEXT_PUBLIC_SITIO_URL`.

## v0.5 — Reseñas en el panel (esbozo, solo si Google aprueba la API de Business Profile)

- **Ola 1**: `google-perfil` (opus/high: OAuth por dueño, tokens cifrados, lectura de reseñas) · `datos-v05`.
- **Ola 2**: `respuestas-ia` (opus/high: propuesta de respuesta que el dueño revisa y publica; nunca se escribe una reseña) · `qa-v05`.

## v0.6 — Cobrar (esbozo, apagado hasta el punto de control 4)

- **Antes**: clave secreta de Supabase (`SUPABASE_SECRET_KEY`) para el webhook; Stripe en modo prueba.
- **Ola 1**: `datos-v06` (columnas de Stripe en `accesos`, función de webhook) · `pagos` (Checkout, portal, webhook firmado, prueba de 30 días sin tarjeta, pausa al acabar).
- **Ola 2**: `panel-suscripcion` · `admin-v06` (estado de pago en el admin) · `legal-pagos`.
- **Ola 3**: `qa-v06` + auditoría de seguridad (`kit-auditor`) antes de encender `PAGOS_ACTIVOS`.

---

## Decisiones que el director debe confirmar antes de la ola 1

1. **Platos agotados**: se ven atenuados con «Agotado» (recomendado: informa al cliente) en vez de desaparecer. Si se confirma, cambiar en la portada el texto «Agotas un plato y desaparece de todas las mesas».
2. **Orden de secciones y platos en la v0.1 con flechas ↑↓** (grandes, accesibles, sin librerías); «arrastrar» en una versión posterior con `@dnd-kit` solo en el panel.
3. **Un local por cuenta en la v0.1** (y una sola prueba gratis por persona), aunque el modelo admite varios.
4. **Tests SQL en transacción**: permitir al carril `datos` ejecutar `begin; <migración>; <tests>; rollback;` con `execute_sql` (sin dejar cambios), y que `apply_migration` lo siga haciendo solo el director.
5. **Login de pruebas** con usuario y contraseña de prueba + ruta `/auth/e2e` que solo existe fuera de Vercel con `E2E_ACCESO=true`.
6. **Comprar kartana.app antes de imprimir QR para los pilotos** (los QR llevarían el dominio definitivo; la redirección desde Vercel queda como red de seguridad).
7. **Carta de demostración `demo` sin indexar** en Google (`permitir_indexar = false`): sus precios son reales pero los alérgenos son orientativos y el bar es real.
8. **Estadísticas por RPC con clave publicable** (sin clave secreta), aceptando que alguien podría inflar contadores.
