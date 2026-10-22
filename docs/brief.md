# Kartana — brief

> Fase 0 · 22/10/2026 · Dominio previsto: **kartana.app**

## La idea
SaaS para bares, cafeterías y restaurantes pequeños de España que une dos cosas:
1. **Una carta digital con QR**, siempre actualizada, con alérgenos y en varios idiomas.
2. **Un sistema para conseguir más reseñas en Google**, limpio y dentro de las normas.

Objetivo de negocio: vender pronto, puerta a puerta, un producto muy simple, barato y en buen español. Primero un piloto gratis con 3–5 bares.

## Público
- **Cliente que paga:** dueño de un bar o restaurante pequeño. Sin conocimientos técnicos. Lo usa desde el móvil, con prisa, entre servicio y servicio.
- **Usuario final:** el cliente del bar. Escanea el QR y ve la carta en el móvil, sin instalar nada, a veces con mala cobertura. Puede ser turista.

## Funciones

### Imprescindibles (v0.1–v0.4)
**Carta (módulo 1)**
- Panel del dueño, móvil primero: secciones, platos (nombre, descripción, precio, foto opcional), los 14 alérgenos de la UE con iconos, etiquetas (vegano, vegetariano, sin gluten, picante), «agotado» con un toque, orden arrastrando.
- Menú del día con precio, días y horario; horarios del local; logo y color de marca.
- Carta pública en `kartana.app/c/<nombre-del-local>`: carga casi instantánea, funciona con mala cobertura, filtro por alérgenos, aviso fijo «Consulte al personal sobre alérgenos».
- Cambios visibles al instante en todas las mesas.
- QR en PDF listo para imprimir: cartelito de mesa, pegatina y póster, con el logo del local.
- Idiomas de la carta (v0.2): español, inglés, francés, alemán, catalán/valenciano, euskera y gallego. Traducción automática (Google Translate) que el dueño puede corregir plato a plato. El dueño elige qué idiomas muestra.

**Reseñas (módulo 2, v0.3)**
- El dueño busca su negocio en Google; guardamos su identificador de lugar y generamos el enlace directo para escribir una reseña.
- Botón discreto en la carta: «¿Te ha gustado? Déjanos tu opinión en Google». Igual para todos los clientes.
- QR de reseña en PDF (cuenta, ticket, barra).

**Estadísticas (v0.2)**
- Anónimas y agregadas: visitas a la carta por día, platos más vistos, clics en «dejar reseña». Sin cookies, sin identificadores, sin datos personales.

**Negocio (v0.4)**
- Planes con Stripe: **Carta** 10 €/mes + IVA y **Carta + Reseñas** 17 €/mes + IVA. Pago anual con 2 meses gratis. Prueba de 30 días sin tarjeta. Portal de Stripe para cambiar de plan o darse de baja.
- Página de inicio que vende: carta de ejemplo que se abre con el móvil (QR en pantalla), precios claros, alta en 5 minutos.
- Panel de administrador: lista de locales, plan, estado de pago y activar un piloto de 60 días con un botón.
- Todo lo de cobrar, **apagado por defecto** hasta el punto de control 4 (alta fiscal).

### Deseables (si hay tiempo)
- Duplicar un plato; importar la carta desde una lista pegada.
- Plantillas de cartel con varios diseños.
- Panel y web en inglés (después del español).

### Futuras
- **v0.5:** ver las reseñas de Google en el panel y proponer respuestas con IA que el dueño revisa antes de publicar. Solo si Google aprueba el acceso a la API de Business Profile.
- Buzón de sugerencias privado (descartado en la v1; si llega, independiente, opcional y anónimo).
- Varios locales por cuenta (el modelo de datos ya lo permite).

## Reglas de reseñas (obligatorias, comprobadas en la Fase 0)
Fuentes: política de contenido de Google Maps y RDL 24/2021 (Ley de Competencia Desleal y TRLGDCU).
1. **Se pide igual a todos.** Nada de preguntar antes «¿te ha gustado?» con estrellas y mandar solo a los contentos a Google (*review gating*). El botón siempre lleva a Google, sin pasos previos.
2. **Sin incentivos:** ni descuentos, ni regalos, ni sorteos a cambio de reseñas, ni de cambiar o borrar una reseña. Los textos del producto y de los carteles no lo sugieren nunca.
3. **Sin cuotas ni guiones:** no se pide mencionar a un empleado ni contenido concreto (cambio de Google de 2026).
4. **La web nunca escribe ni publica reseñas** por nadie. En la v0.5 solo se proponen *respuestas* del dueño, que él revisa y publica.
5. Un buzón privado, si algún día existe, nunca sustituye ni condiciona el enlace a Google.
6. Las condiciones del servicio prohíben al dueño usar Kartana para incumplir estas reglas.

## Datos y legal
- Solo datos del dueño y de su negocio. Ningún dato personal de los clientes del bar. Ninguna cookie de seguimiento → no hace falta banner de cookies (solo la cookie técnica de sesión del panel).
- Condiciones del servicio B2B: la información de la carta y de los alérgenos es responsabilidad del establecimiento (Reglamento UE 1169/2011 y RD 126/2015).
- Textos legales que se adaptan a lo que esté activo (pagos, traducción, Google).

## Fuera de alcance (v1)
Pedidos y pagos desde la mesa, TPV, reservas, facturación al cliente del bar, app nativa, buzón de sugerencias.

## Versiones
| Versión | Contenido | Para qué |
|---|---|---|
| v0.1 | Panel + carta pública + alérgenos + QR en PDF + admin con pilotos | Empezar el piloto |
| v0.2 | 7 idiomas con traducción corregible + estadísticas | Turistas y valor visible |
| v0.3 | Reseñas: enlace, botón en la carta y QR de reseña | Segundo módulo |
| v0.4 | Stripe (apagado) + página de venta + legal completo | Listo para cobrar tras PC4 |
| v0.5 | Reseñas en el panel + respuestas con IA | Si Google da acceso |
