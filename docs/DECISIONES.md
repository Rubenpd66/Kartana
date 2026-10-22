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

### Forma de trabajar
- (U) **Solo Claude Code, plan Pro → como mucho 2–3 subagentes a la vez.**
