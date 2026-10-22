# Decisiones

Una línea por decisión: **qué**, alternativa descartada y por qué. (U) = la eligió el usuario; (D) = la tomó el director.

## Fase 0 · 22/10/2026

### Producto y negocio
- (U) **Nombre: Kartana; dominio kartana.app** (9,99 $ el primer año, 15 $ después). Descartados kartana.es y kartana.com: ya están registrados. No hay ningún producto de cartas llamado Kartana. La carpeta local sigue llamándose `carta-qr`; el repositorio, Vercel y Supabase se llaman `kartana`.
- (U) **Precios: Carta 10 €/mes + IVA; Carta + Reseñas 17 €/mes + IVA**; anual con 2 meses gratis (100 € y 170 €). Descartados 9/15 (poco margen) y 12/19 (por encima de doXmenu, 12,99 €).
- (D) **Prueba de 30 días sin pedir tarjeta**. Descartado pedir tarjeta: frena el alta en el bar. Al acabar, Stripe pausa la suscripción si no hay tarjeta.
- (U) **Pilotos: activación manual desde el panel de administrador (60 días)**. Descartado el código promocional: necesita Stripe, que llega en la v0.4.
- (U) **Sin buzón de sugerencias en la v1**. Más simple y sin riesgo de parecer *review gating*.
- (D) **El botón de reseña lleva directo a Google, sin preguntar antes por la satisfacción**. Es la única forma segura de no filtrar.

### Fiscal y legal
- (U) **Piloto gratis ya; cobrar solo tras el alta de autónomo** con gestor. Stripe se construye en modo prueba y apagado (`PAGOS_ACTIVOS=false`).
- (D) **Facturas: las genera Stripe; el gestor confirma en el PC4 si valen para Verifactu** (obligatorio para autónomos desde el 1/7/2027). Descartado construir facturación propia: fuera de alcance.
- (D) **Precios mostrados sin IVA («+ IVA»)** porque se vende a empresas. Stripe Tax o tipo fijo del 21 % se decide en el PC4 con el gestor.

### Idiomas
- (U) **Cartas en 7 idiomas: es, en, fr, de, ca, eu, gl.** El dueño activa los que quiera. Google Translate admite los 7.
- (D) **Una dirección por idioma de la carta: `/c/<local>` (español) y `/c/<local>/<idioma>`**, con `hreflang` y canónica. Descartado idioma por cookie (lección 2 de KleyBom).
- (D) **Web y panel en español sin prefijo; inglés después con `/en/`**. El panel no se indexa.
- (D) **Diccionarios de textos por módulo** (`src/lib/i18n/<modulo>.<idioma>.ts`).

### Traducción
- (U) **Google Cloud Translation (NMT básico)**. Gratis hasta 500.000 caracteres/mes; luego 20 $ por millón. Descartados DeepL (planes cambiados en 2026, cuota fija) y Claude (otra cuenta más). Con 6 idiomas de destino, una carta completa (~6.000 caracteres) gasta ~36.000 → unas 13 cartas nuevas al mes gratis.
- (D) **Solo se traduce lo que cambia** (se guarda una huella del texto original) y **nunca se pisa una corrección manual** del dueño.

### Infraestructura
- (U) **Gratis durante el piloto; de pago al activar cobros** (~45 €/mes: Vercel Pro + Supabase Pro). Vercel Hobby no permite uso comercial: antes de mostrar precios o cobrar (v0.4 en producción) se pasa a Pro.
- (D) **Stack: Next.js (última) + TypeScript + Tailwind · Supabase (Postgres, Auth, Storage) · Vercel**. Es el stack del kit y los conectores ya funcionan.
- (D) **Supabase en eu-central-1 (Fráncfort)**: datos en la UE. El plan gratis permite 2 proyectos activos (ya está `forja`).
- (D) **Un cron diario que toca la base de datos** para que el proyecto gratis de Supabase no se pause por inactividad.
- (D) **Carta pública cacheada y regenerada al guardar** (revalidación bajo demanda). Descartado leer la base de datos en cada visita: más lento y más caro. Así carga casi al instante y los cambios se ven enseguida.
- (D) **Carta pública casi sin JavaScript**: HTML y CSS ligeros; solo el filtro de alérgenos y el selector de idioma usan JS. Objetivo: < 100 KB y Lighthouse ≥ 95 en móvil.
- (D) **Fotos reducidas en el navegador antes de subirlas** (WebP, ~1200 px). El plan gratis de Supabase no transforma imágenes.
- (D) **PDF de QR generados en el servidor** con plantillas fijas (mesa, pegatina, póster). La librería exacta se elige en la Fase 1 tras leer su documentación.

### Cuentas y acceso
- (U) **Entrada del dueño: código de 6 cifras por correo + «Entrar con Google»**. Descartados contraseña (se olvida) y solo Google (no todos lo usan).
- (D) **Correos de acceso con Resend** como SMTP de Supabase. El correo integrado de Supabase está muy limitado.
- (D) **Administrador = tu correo** (lista en variable de entorno del servidor), sin pantalla para crear admins.

### Reseñas
- (D) **Buscar la ficha con Google Places API (New): Autocomplete + Place Details solo con el ID**. Coste ~0 € a esta escala (cupos gratis mensuales). Alternativa si falla: pegar el enlace de Google Maps.
- (D) **Enlace de reseña: `https://search.google.com/local/writereview?placeid=<ID>`**, el formato que usa Google.
- (D) **v0.5 depende de que Google apruebe el acceso a la API de Business Profile** (gratis, con solicitud). Además, cada dueño tendrá que dar permiso con su cuenta de Google y la app necesitará verificación de Google.

### Datos y estadísticas
- (D) **Estadísticas sin cookies ni almacenamiento en el móvil del cliente**: contadores por día en el servidor (visitas, vistas de plato, clics en reseña). No se guardan IP ni identificadores. Descartado deduplicar visitas con localStorage: también es almacenamiento en el dispositivo y obligaría a pedir permiso.

### Aspecto
- (U) **Claro, cálido y muy legible**: letra grande, botones grandes, animaciones mínimas que respetan «reducir movimiento». La carta pública usa el logo y el color de cada bar (con contraste comprobado).
- (D) **Ancho máximo: panel y carta 640 px (columna de móvil); web de venta 1120 px**, en un único `Contenedor` con dos tamaños.

### Cambios del usuario tras el cuestionario (22/10/2026)
- (U) **Despliegue de prueba con el dominio gratis de Vercel (`kartana.vercel.app` o el que asigne Vercel)**; kartana.app se compra más adelante. Al pasar al dominio propio, la dirección de Vercel **redirige para siempre** a kartana.app, así que los QR ya impresos siguen funcionando.
- (U) **Pagos (Stripe) al final**: pasan a la última versión (v0.6). La página de venta se adelanta a la v0.4, sin botón de pago.
- (D) **Correos de acceso sin dominio propio: SMTP de Gmail con contraseña de aplicación** durante el piloto (hasta ~500 correos al día). Resend llega con kartana.app. Descartado el correo integrado de Supabase: solo envía a los miembros del equipo de Supabase. «Entrar con Google» funciona sin dominio.
- (D) **GitHub CLI instalada por el director con winget** (v2.103.0).

## Fase 1 · 22/10/2026
- (D) **Next.js 16.4.2 con Cache Components y Partial Prefetching** (lo que trae `create-next-app` por defecto). Descartado desactivarlos: dan cartas estáticas con regeneración al guardar, justo lo que buscamos.
- (D) **Tipografías: Fraunces (títulos, aire de carta de bar) y Figtree (texto, muy legible)**, servidas desde la propia web con `next/font`. Descartadas Geist (fría) e Inter (genérica).
- (D) **Solo modo claro** (decisión del usuario «claro y cálido»). Descartado el modo oscuro automático: cambiaría el aspecto a quien tenga el móvil en oscuro.
- (D) **CSP mínima sin nonces**. Descartada la CSP estricta con nonces: obliga a renderizar todas las páginas en cada visita y las cartas dejarían de ser estáticas.
- (D) **El proxy solo corre en zonas con sesión** (`/panel`, `/admin`, `/entrar`, `/auth`). Así las cartas públicas no tocan cookies y se sirven desde la CDN.
- (D) **Clave secreta de Supabase solo cuando haga falta** (webhooks, tareas programadas). El admin se reconoce por `ADMIN_EMAILS` en el servidor.
- (D) **Migraciones en `supabase/migrations/` creadas con la CLI y aplicadas al proyecto remoto por el director**. Descartada la base de datos local: necesita Docker.
- (D) **RLS automática con un event trigger** (guía oficial de Supabase) además de activarla a mano en cada migración.
- (D) **Cron diario de Vercel a `/api/health`** para que el proyecto gratis de Supabase no se pause. Sin secreto: el endpoint no expone datos.
- (D) **Playwright prueba el build de producción** (puerto 3100), 2 workers, móvil solo con `@movil`.
- (D) **Dirección de pruebas: kartana-six.vercel.app** (Vercel la asigna; `kartana.vercel.app` es de otra cuenta). Funciones en Fráncfort (`fra1`), junto a Supabase.
- (D) **@types/node 24** (Vitest 5 lo exige; coincide con Node 24 instalado).

## Fase 2 · 22/10/2026 (propuestas del arquitecto, confirmadas por el director)
- (D) **Platos agotados: se ven atenuados con «Agotado»**, no desaparecen. Así el cliente sabe que existe pero hoy no hay. Se cambia el texto de la portada.
- (D) **Ordenar con flechas ↑↓ en la v0.1**; arrastrar más adelante. Descartado arrastrar ya: necesita librería y es peor con lector de pantalla.
- (D) **Un local por cuenta en la v0.1** y una sola prueba gratis por persona. El modelo ya admite varios locales.
- (D) **Variantes de precio**: 1–6 precios por plato (`media_racion`, `racion`, `racion_mediana`, `racion_grande`, `unidad`, `docena`… y `otro` con texto libre). Sin precio = «Según mercado».
- (D) **Admin con doble llave**: rol en `app_metadata` puesto por SQL por el director + correo en `ADMIN_EMAILS`. Sin clave secreta hasta la v0.6.
- (D) **Tests SQL**: el carril `datos` puede ejecutar `begin; …; rollback;` con `execute_sql`; `apply_migration` solo lo hace el director.
- (D) **Pruebas de navegador con usuario de prueba y contraseña** + `/auth/e2e`, que solo existe fuera de Vercel con `E2E_ACCESO=true`.
- (D) **Carta de demostración `demo` sin indexar** en Google: alérgenos orientativos de un bar real.
- (D) **Estadísticas por RPC con la clave publicable**, aceptando que alguien podría inflar contadores (no expone datos).
- (D) **PDF con `@react-pdf/renderer` 4 + `qrcode` 1.5** (MIT), QR vectorial, logos en PNG.
- (D) **Freno de gasto de Google en el código**: el «límite de inversión» de Google Cloud no cubre Translation ni Places y sus cuotas diarias no se pueden editar en esta cuenta. Queda el presupuesto de 5 € con alertas por correo y un tope mensual de caracteres en la app (tabla de uso de traducción, v0.2), muy por debajo de los 500.000 gratis.
- (U) **Frase del botón de reseña: «¿Qué te ha parecido? Déjanos tu opinión en Google»** (y equivalentes neutros en los 7 idiomas). Descartada «¿Te ha gustado?…»: puede leerse como invitar solo a los contentos (Google prohíbe pedir reseñas selectivamente).
- (D) **La carta de demostración pertenece a la cuenta `rubenpd66+demo@gmail.com`**, no a la del usuario: no gasta su único local ni exige que haya entrado antes.
- (U pendiente) **Comprar kartana.app antes de imprimir QR para los pilotos** (recomendado): se decide al cerrar la v0.1.

### Forma de trabajar
- (U) **Solo Claude Code, plan Pro → como mucho 2–3 subagentes a la vez.**
