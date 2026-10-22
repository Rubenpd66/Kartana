# Carta de ejemplo: Cafetería La Guagua

> Generado con `node --experimental-strip-types src/lib/demo/generar-semilla.ts > supabase/semillas/demo.sql` a partir de `src/lib/demo/carta-demo.ts`. No lo edites a mano.

Carta de demostración de Kartana (slug `demo`). Siempre se muestra con la banda «Carta de ejemplo», no sale en Google (`permitir_indexar = false`) y no lleva fotos de platos.

## Qué es orientativo

- **Descripciones y alérgenos: orientativos en todos los platos.** Son los más probables según la receta típica; se guardan como confirmados (`alergenos_confirmados = true`) solo para poder probar el filtro de alérgenos. La carta pública lo avisa con la banda «Carta de ejemplo». No son información fiable para una persona alérgica.
- **Precios**: los de la carta real que pasó el usuario (leídos de una foto), salvo los marcados abajo.
- **Fotos**: ninguna. Las del usuario no se publican hasta saber quién las hizo.

## A revisar con el bar

Precios leídos de la foto con dudas. Se mantienen tal cual.

- **Crujiente de patata y langostino** (Mariscos): unidad 1,25 €. En la foto se leía 1,25 € y parece precio por unidad. Confirmar con el bar.
- **Lacón a la gallega** (Carnes y embutidos): ración mediana 5,50 € · ración grande 6,00 €. En la foto se leían 5,50 € (mediana) y 6,00 € (grande) con dudas. Confirmar con el bar.

## Inventado

Nada de esto estaba en la carta del bar. Sirve para que la demo esté completa.

- **Local**: dirección y teléfono vacíos; descripción «Carta de ejemplo de Kartana con los platos de una cafetería de verdad».
- **Horarios** (inventados): lunes, martes, miércoles, jueves, viernes, sábado: 08:00–16:30 y 19:30–23:30; el resto, cerrado.
- **Menú del día** (inventado): 12,50 €, lunes, martes, miércoles, jueves, viernes de 13:00 a 16:00. Grupos y platos elegidos de la carta. Notas: «Incluye pan, bebida y postre o café».
- **Color de marca**: #a63d12 (elegido para tener contraste suficiente con blanco).
- **Chipirones a la plancha** (Pescados y cefalópodos): Plato visto en las fotos, sin precio en la carta leída. Precio de ejemplo: 8,50 €.
- **Croqueta de jamón y cocido** (Tapas y raciones): Plato visto en las fotos, sin precio en la carta leída. Precio de ejemplo: 1,20 € la unidad.
- **Pan de Calatrava** (Postres): Plato visto en las fotos, sin precio en la carta leída. Precio de ejemplo: 3,50 €.
- **Tarta de chocolates** (Postres): Plato visto en las fotos, sin precio en la carta leída. Precio de ejemplo: 4,00 €.
- **Flan de huevo** (Postres): Plato y precio inventados para completar la sección Postres. No está en la carta del bar.
- **Tarta de queso** (Postres): Plato y precio inventados para completar la sección Postres. No está en la carta del bar.
- **Café solo** (Cafés y bebidas): Plato y precio inventados para completar la sección. No está en la carta del bar.
- **Café con leche** (Cafés y bebidas): Plato y precio inventados para completar la sección. No está en la carta del bar.
- **Cortado** (Cafés y bebidas): Plato y precio inventados para completar la sección. No está en la carta del bar.
- **Carajillo quemao** (Cafés y bebidas): Plato visto en las fotos, sin precio en la carta leída. Precio de ejemplo: 2,50 €.
- **Cerveza** (Cafés y bebidas): Plato y precios inventados para completar la sección. Sirve para probar la etiqueta libre «Caña».
- **Vino tinto de la casa** (Cafés y bebidas): Plato y precios inventados para completar la sección. No está en la carta del bar.
- **Agua mineral** (Cafés y bebidas): Plato y precio inventados para completar la sección. No está en la carta del bar.
- **Refresco** (Cafés y bebidas): Plato y precio inventados para completar la sección. No está en la carta del bar.

## La carta

### Mariscos

| Plato | Descripción | Precios | Alérgenos (orientativos) | Etiquetas |
|---|---|---|---|---|
| Parrillada de marisco | Surtido de marisco a la plancha, para compartir. | ración 18,00 € | crustáceos, moluscos | — |
| Gamba roja a la plancha | Gambas rojas enteras, hechas a la plancha. Se piden por docena o por media docena. | ½ docena 7,00 € · docena 14,00 € | crustáceos | — |
| Gamba blanca | Gambas blancas enteras. Se piden por docena o por media docena. | ½ docena 5,50 € · docena 11,00 € | crustáceos | — |
| Langostino a la plancha | Langostinos enteros, hechos a la plancha. Se piden por docena o por media docena. | ½ docena 4,00 € · docena 8,00 € | crustáceos | — |
| Gamba rebozada | Gambas rebozadas y fritas. Se piden por docena o por media docena. | ½ docena 2,50 € · docena 5,00 € | crustáceos, gluten, huevos | — |
| Crujiente de patata y langostino (revisar) | Langostino con patata crujiente. Precio por unidad. | unidad 1,25 € | crustáceos, gluten | — |
| Mejillones al vapor | Mejillones cocidos al vapor. | ½ ración 2,50 € · ración 5,00 € | moluscos, sulfitos | — |
| Tellinas | Almejas pequeñas de arena, servidas calientes. | ración 7,00 € | moluscos | — |
| Almejas fritas | Almejas enharinadas y fritas. | ración 7,00 € | moluscos, gluten | — |
| Berberechos al vapor | Berberechos cocidos al vapor. | ración 6,50 € | moluscos, sulfitos | — |
| Navajas a la plancha | Navajas hechas a la plancha. Se piden por docena o por media docena. | ½ docena 3,75 € · docena 7,50 € | moluscos | — |
| Vieira | Vieira servida en su concha. Precio por unidad. | unidad 4,00 € | moluscos, gluten | — |
| Zamburiñas | Molusco parecido a la vieira, pero más pequeño. Precio por unidad. | unidad 1,50 € | moluscos, gluten | — |
| Tigres | Mejillón relleno, rebozado y frito. Precio por unidad. | unidad 1,50 € | moluscos, gluten, huevos, lácteos | — |
| Salpicón de marisco | Marisco troceado con verduras, aliñado y servido frío. | ½ ración 3,00 € · ración 4,50 € | crustáceos, moluscos, sulfitos | — |
| Cangrejo en salsa rosa | Cangrejo con salsa rosa, servido frío. | ½ ración 2,50 € · ración 4,25 € | crustáceos, pescado, huevos | — |

### Pescados y cefalópodos

| Plato | Descripción | Precios | Alérgenos (orientativos) | Etiquetas |
|---|---|---|---|---|
| Fritura de pescado | Pescado variado enharinado y frito. | ½ ración 7,00 € · ración 9,50 € | pescado, gluten, moluscos | — |
| Sepia a la plancha | Sepia hecha a la plancha. | ½ ración 6,00 € · ración 9,00 € | moluscos | — |
| Sepia a la andaluza | Sepia enharinada y frita, al estilo andaluz. | ½ ración 6,00 € · ración 9,00 € | moluscos, gluten | — |
| Calamar a la andaluza o a la plancha | Calamar enharinado y frito, o hecho a la plancha. Se elige al pedir. | ½ ración 4,75 € · ración 7,25 € | moluscos, gluten | — |
| Calamar en salsa | Calamar guisado en salsa. | ½ ración 2,75 € · ración 4,75 € | moluscos, gluten, sulfitos | — |
| Calamares a la romana | Calamar rebozado y frito. Se pide por docena o por media docena. | ½ docena 2,40 € · docena 4,75 € | moluscos, gluten, huevos | — |
| Chopitos fritos | Chopitos enharinados y fritos. | ½ ración 4,00 € · ración 6,50 € | moluscos, gluten | — |
| Habas fritas con chopitos | Habas y chopitos fritos. | ½ ración 3,25 € · ración 4,75 € | moluscos, gluten | — |
| Pulpo a la gallega | Pulpo cocido sobre patata, con aceite y pimentón. En ración mediana o grande. | ración mediana 10,00 € · ración grande 12,00 € | moluscos | — |
| Bacalao rebozado | Bacalao rebozado y frito. Precio por unidad. | unidad 3,75 € | pescado, gluten, huevos | — |
| Boquerones en vinagre | Boquerones aliñados en vinagre, servidos fríos. | ración 3,00 € | pescado, sulfitos | — |
| Chipirones a la plancha (inventado) | Chipirones a la plancha, con alioli. | ración 8,50 € | moluscos, huevos | — |

### Cazuelas

| Plato | Descripción | Precios | Alérgenos (orientativos) | Etiquetas |
|---|---|---|---|---|
| Cazuela de gambas | Gambas en cazuela, servidas calientes. | ración 5,00 € | crustáceos, sulfitos | — |
| Cazuela de chopitos | Chopitos en cazuela, servidos calientes. | ración 5,00 € | moluscos, sulfitos | — |
| Cazuela de gambas y chopitos | Gambas y chopitos en cazuela, servidos calientes. | ración 6,00 € | crustáceos, moluscos, sulfitos | — |
| Cazuela de sesos | Sesos en cazuela, servidos calientes. | ración 4,50 € | gluten, sulfitos | — |
| Cazuela de gulas y gambas | Gulas (hechas con pescado) y gambas en cazuela, servidas calientes. | ración 5,00 € | crustáceos, pescado, huevos, gluten | — |
| Cazuela de setas y gambas | Setas y gambas en cazuela, servidas calientes. | ración 5,00 € | crustáceos, sulfitos | — |

### Carnes y embutidos

| Plato | Descripción | Precios | Alérgenos (orientativos) | Etiquetas |
|---|---|---|---|---|
| Lacón a la gallega (revisar) | Lacón cocido con aceite y pimentón. En ración mediana o grande. | ración mediana 5,50 € · ración grande 6,00 € | ninguno | — |
| Lacón | Lacón de cerdo cocido, en lonchas. | ½ ración 2,50 € · ración 5,50 € | ninguno | — |
| Lomo de orza | Lomo de cerdo adobado y conservado en aceite. | ½ ración 4,50 € · ración 6,50 € | sulfitos | — |
| Magra con tomate | Magra de cerdo en salsa de tomate. | ½ ración 2,50 € · ración 4,25 € | sulfitos | — |
| Albóndigas | Albóndigas de carne en salsa. Precio por unidad. | unidad 1,25 € | gluten, huevos, lácteos | — |
| Alas de pollo | Alas de pollo. Precio por unidad. | unidad 1,25 € | gluten | — |
| Rollito de lomo relleno | Rollito de lomo relleno. Precio por unidad. | unidad 2,75 € | gluten, huevos, lácteos | — |
| Rollito de ternera, york, calabacín y crema de queso | Rollito de ternera con jamón york, calabacín y crema de queso. | ración 4,50 € | lácteos, gluten | — |
| Jamón y queso | Plato de jamón y queso. | ración 7,50 € | lácteos | — |
| Chorizo y morcilla | Chorizo y morcilla. Precio por unidad. | unidad 1,50 € | gluten | — |
| Ferrero de morcilla | Bolita de morcilla con cobertura crujiente. Precio por unidad. | unidad 1,50 € | gluten, huevos, frutos de cáscara | — |
| Oreja a la plancha | Oreja de cerdo a la plancha. | ½ ración 3,75 € · ración 5,50 € | ninguno | — |
| Rabo frito | Rabo de cerdo frito. | ½ ración 4,00 € · ración 6,50 € | gluten | — |
| Morro frito | Morro de cerdo frito. | ½ ración 3,50 € · ración 6,00 € | gluten | — |
| Landrecillas fritas | Landrecillas de cerdo fritas. Son glándulas: un plato de casquería. | ½ ración 3,50 € · ración 5,50 € | gluten | — |
| Suspiros de jamón con pimientos de Padrón | Suspiros de jamón fritos, con pimientos de Padrón. | ½ ración 3,75 € · ración 6,00 € | gluten, lácteos, huevos | — |
| Setas con jamón | Setas salteadas con jamón. | ½ ración 2,50 € · ración 4,75 € | ninguno | — |
| Champiñones rellenos de jamón y queso | Champiñones rellenos de jamón y queso. | ración 4,75 € | lácteos, gluten | — |
| Foie de pato con rulo de cabra | Foie de pato con queso de cabra. | ración 6,75 € | lácteos, gluten | — |

### Tapas y raciones

| Plato | Descripción | Precios | Alérgenos (orientativos) | Etiquetas |
|---|---|---|---|---|
| Patatas bravas | Patatas fritas con salsa brava y alioli. | ½ ración 2,25 € · ración 3,75 € | huevos (trazas: gluten) | — |
| Patatas con ajo | Patatas con salsa de ajo. | ½ ración 2,25 € · ración 3,75 € | huevos | — |
| Casco de patatas | Patata asada con alioli por encima. | ración 1,25 € | huevos | — |
| Ensaladilla rusa | Ensaladilla de patata y atún con mayonesa. | ½ ración 2,80 € · ración 4,25 € | huevos, pescado | — |
| Pastel de puerros | Pastel de puerros, servido en porción. | ración 5,00 € | huevos, lácteos, gluten | — |
| Berenjena de york y queso | Berenjena rellena de jamón york y queso. | ración 2,75 € | gluten, huevos, lácteos | — |
| Pimientos del piquillo rellenos | Pimientos del piquillo rellenos. | ración 2,25 € | gluten, lácteos | — |
| Queso frito | Dados de queso empanados y fritos, con salsa. | ½ ración 4,00 € · ración 6,50 € | lácteos, gluten, huevos | — |
| Chupa-chups de queso de cabra | Queso de cabra con forma de piruleta. Precio por unidad. | unidad 1,50 € | lácteos, gluten, huevos | — |
| Rollito de salmón y crema de queso | Rollito de salmón relleno de crema de queso. | ración 3,50 € | pescado, lácteos | — |
| Huevos a la flamenca | Huevos con tomate, verduras y embutido. | ración 4,25 € | huevos | — |
| Parrillada de verduras | Verduras variadas a la plancha. | ½ ración 4,75 € · ración 7,00 € | ninguno | vegetariano |
| Espárragos a la plancha | Espárragos a la plancha. Se piden por docena. | docena 4,00 € | ninguno | vegetariano |
| Croqueta de jamón y cocido (inventado) | Croqueta de jamón y cocido. Precio por unidad. | unidad 1,20 € | gluten, lácteos, huevos | — |

### Especialidades de la tierra

| Plato | Descripción | Precios | Alérgenos (orientativos) | Etiquetas |
|---|---|---|---|---|
| Ajo mataero | Guiso manchego de hígado de cerdo y pan, típico de la matanza. | ½ ración 2,50 € · ración 4,25 € | gluten | — |
| Bienmesabe | Cazón en adobo: trozos de pescado rebozados y fritos, con limón. No es el postre canario. | ½ ración 3,50 € · ración 5,50 € | pescado, gluten, sulfitos | — |
| Atascaburras | Puré manchego de bacalao y patata, con ajo y aceite. | ½ ración 2,50 € · ración 4,25 € | pescado, huevos, frutos de cáscara | — |

### Postres

| Plato | Descripción | Precios | Alérgenos (orientativos) | Etiquetas |
|---|---|---|---|---|
| Pan de Calatrava (inventado) | Postre de pan, leche y huevo, parecido a un flan. | 3,50 € | gluten, huevos, lácteos | — |
| Tarta de chocolates (inventado) | Tarta con varias capas de chocolate. | 4,00 € | gluten, huevos, lácteos, soja | — |
| Flan de huevo (inventado) | Flan de huevo con caramelo. | 3,00 € | huevos, lácteos | — |
| Tarta de queso (inventado) | Tarta de queso al horno. | 4,00 € | lácteos, huevos, gluten | — |

### Cafés y bebidas

| Plato | Descripción | Precios | Alérgenos (orientativos) | Etiquetas |
|---|---|---|---|---|
| Café solo (inventado) | Café solo. | 1,30 € | ninguno | — |
| Café con leche (inventado) | Café con leche. | 1,60 € | lácteos | — |
| Cortado (inventado) | Café con un poco de leche. | 1,40 € | lácteos | — |
| Carajillo quemao (inventado) | Café con licor, flambeado. | 2,50 € | ninguno | — |
| Cerveza (inventado) | Cerveza de barril, en caña o en jarra. | Caña 1,80 € · jarra 3,50 € | gluten | — |
| Vino tinto de la casa (inventado) | Vino tinto, por copa o por botella. | copa 2,20 € · botella 12,00 € | sulfitos | — |
| Agua mineral (inventado) | Agua mineral sin gas. | 1,50 € | ninguno | — |
| Refresco (inventado) | Refresco de lata o botella. | 2,00 € | ninguno | — |

### Menú del día (12,50 €)

**Primeros**

- Ensaladilla rusa
- Mejillones al vapor
- Pastel de puerros

**Segundos**

- Sepia a la plancha
- Albóndigas
- Bienmesabe

**Postres**

- Pan de Calatrava
- Tarta de chocolates
- Flan de huevo

Incluye pan, bebida y postre o café.
