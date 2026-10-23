# Traducciones de la carta de demostración

> Carril `contenido-v02` · 23/10/2026. Datos: `src/lib/demo/traducciones-demo.ts`. Generador: `src/lib/demo/generar-traducciones.ts`. Semilla: `supabase/semillas/demo-traducciones.sql`.

Traducción **a mano** de «Cafetería La Guagua» (slug `demo`) a inglés, francés, alemán, catalán, euskera y gallego. Se guardan como `origen: "manual"`, así la demo enseña el resultado ideal y no gasta cuota de Google. Son 82 platos, 8 secciones, la descripción del local y el menú del día (nombre, notas, 3 grupos y 9 ítems), más la etiqueta libre «Caña».

## Cómo se usa

1. El director ejecuta `supabase/semillas/demo.sql` y aplica la migración de la v0.2 (columna `traducciones`).
2. Después ejecuta `supabase/semillas/demo-traducciones.sql` como `postgres`. Es idempotente: sustituye las traducciones de las filas de la demo y deja `idiomas_activos = {es,en,fr,de,ca,eu,gl}`. Si falta una fila, para con un error que dice cuál.
3. Para regenerarla tras cambiar los textos:
   `node --experimental-strip-types src/lib/demo/generar-traducciones.ts > supabase/semillas/demo-traducciones.sql`
   (un test comprueba que el archivo guardado coincide con lo que genera el código).

Cada traducción lleva la **huella** del texto original (SHA-256 de `trim` + NFC, 16 primeros hex) y una fecha fija. Si alguien cambia un texto en español de la demo, el panel lo verá como desactualizado y avisará, como con cualquier traducción manual.

Las etiquetas de formato (½ ración, docena, copa…) no se traducen aquí: salen de los diccionarios `src/lib/i18n/carta.<idioma>.ts`.

## Criterios

1. **Platos tradicionales con nombre propio**: se mantiene el nombre y se explica entre paréntesis en el idioma de destino. Ejemplos: «Ajo mataero (pork liver and bread dish, La Mancha style)», «Atascaburras (La Mancha cod and potato mash)», «Zamburiñas (small scallops)».
2. **Platos genéricos**: se traducen («Boquerones en vinagre» → «Anchovies in vinegar»).
3. **Platos con nombre conocido por el turista**: se mantiene y se explica solo si ayuda («Patatas bravas (fried potatoes with spicy sauce)»; «Tigres», «Ferrero de morcilla»).
4. **Platos con nombre en la lengua local** (gallego, catalán, euskera): si el plato es de esa cultura y la lengua tiene nombre propio, se usa («Polbo á galega», «Pop a la gallega», «Zamburiñas» en gallego). Si no, se deja el nombre español con explicación.
5. **Descripciones**: cortas y naturales, sin traducir palabra por palabra. Se conserva el sentido práctico («Precio por unidad», «Se pide por docena…»).
6. **Alérgenos y precios** no cambian: solo se traducen textos.
7. **Registro**: neutro y de cortesía (es «usted» o impersonal en alemán, francés e inglés estándar). Catalán normativo (IEC), euskera batua, gallego normativo (RAG).
8. **Comillas y apóstrofos**: apóstrofo recto (`'`) en todos los idiomas, igual que los diccionarios.
9. **Límites**: ningún texto supera los límites del campo (los comprueba un test).

## Glosario

| Español | en | fr | de | ca | eu | gl |
|---|---|---|---|---|---|---|
| ración / ½ ración | portion / half portion | portion | Portion | ració | razioa | ración |
| a la plancha | grilled (on the griddle) | à la plancha | von der Plancha / vom Grill | a la planxa | planchan | á prancha |
| rebozado | battered | en beignet / pané | im Backteig / paniert | arrebossat | irinetan pasatua | rebozado |
| enharinado y frito | dusted in flour and fried | fariné et frit | in Mehl gewendet und frittiert | enfarinat i fregit | irinetan pasatu eta frijitua | enfarinado e frito |
| gamba / langostino | prawn / king prawn | gamba / crevette royale | Garnele / Riesengarnele | gamba / llagostí | ganba / langostino | gamba / langostino |
| calamar / chopito / chipirón | squid / baby squid / small squid | calamar / petit calamar / chipiron | Kalmar / kleiner Tintenfisch / Chipirón | calamar / xopet / calamarsó | txipiroia / txipiroi txikia | lura / chopito / chipirón |
| sepia | cuttlefish | seiche | Sepia | sèpia | txibia | choco |
| mejillón / berberecho / almeja | mussel / cockle / clam | moule / coque / palourde | Miesmuschel / Herzmuschel / Venusmuschel | musclo / escopinya / cloïssa | muskuilua / berberetxoa / almeja | mexillón / berberecho / ameixa |
| navaja | razor clam | couteau | Schwertmuschel | navalla | nabala | navalla |
| vieira | scallop | coquille Saint-Jacques | Jakobsmuschel | vieira | bieira | vieira |
| boquerón | anchovy (fresh) | anchois | Anchovis | seitó | antxoa | biqueirón |
| bacalao | cod | morue | Kabeljau | bacallà | bakailaoa | bacallau |
| cazuela (plato) | clay casserole | cassolette | Tontöpfchen | cassola | eltzekia | cazola |
| lacón | lacón (boiled pork shoulder) | lacón (épaule de porc) | Lacón (Schweineschulter) | lacón (espatlla de porc bullida) | lacón (txerri-sorbalda egosia) | lacón |
| morcilla | morcilla (blood sausage) | morcilla (boudin noir) | Morcilla (Blutwurst) | morcilla (embotit de sang) | odolkia | morcilla |
| jamón york | cooked ham | jambon blanc | Kochschinken | pernil dolç | urdaiazpiko gozoa | xamón cocido |
| queso de cabra | goat's cheese | fromage de chèvre | Ziegenkäse | formatge de cabra | ahuntz-gazta | queixo de cabra |
| pimientos de Padrón | Padrón peppers | piments de Padrón | Padrón-Paprika | pebrots de Padrón | Padróngo piperrak | pementos de Padrón |
| postre | dessert | dessert | Nachspeise | postre | postrea | sobremesa |
| caña (cerveza) | small glass | demi | kleines Bier | canya | garagardo txikia | cana |
| menú del día | menu of the day | menu du jour | Tagesmenü | menú del dia | eguneko menua | menú do día |

## A revisar por hablante nativo

Las traducciones al inglés, francés y alemán son de uso corriente. Las de catalán son normativas con poco riesgo. Estos puntos conviene que los mire una persona nativa antes de enseñar la demo como «ideal»:

**Euskera (batua)** — el que tiene más dudas:
- «Eltzekiak / eltzekia» para las «cazuelas» (platos servidos en cazuelita). Alternativa: «lapikokoak».
- «Garagardo txikia» para la «caña». Alternativa habitual de barra: «kainua» o «zurito».
- «Txipiroia» para calamar y «txipiroi txikiak» para chopitos y chipirones: en la costa se distingue más.
- «Bieira» (vieira), «nabalak» (navajas), «berberetxoak» (berberechos): son formas usadas, confirmar la preferida.
- «Txerri-aragi magala» para la «magra» de cerdo, «txerri-guruinak» para las «landrecillas», «urdaiazpiko-hasperenak» para los «suspiros de jamón».
- «Irinetan pasatu eta frijitua» para «enharinado y frito» (se repite en muchos platos).
- «Bienmesabe»: «arrain adobatua» no nombra el cazón. Confirmar el término.
- Calcos como «Hareatako almeja txikiak» (tellinas) o «Estalki kurruskariko odolki-bolatxoa» (Ferrero de morcilla).

**Gallego (RAG)**:
- «Cazola» para «cazuela»; «recheo/a» para «relleno» (RAG admite «recheo»).
- «Choco» para sepia y «lura» para calamar: es el uso gallego, pero varía por zona («choco» también sirve para la sepia pequeña).
- «Tellinas» y «Chopitos / Chipirones» se han dejado como en español: en gallego existen «cadelucas» y «choquiños», no confirmados.
- «Cazón en adobo» (Bienmesabe): se deja «cazón»; la RAG también admite «canalla» o «pintarroja» según la especie.
- «Magro de porco», «Fociño», «Miudezas»: confirmar el registro.
- «Prancha» para la plancha: es la forma habitual en gallego.

**Catalán (IEC)** — pocas dudas:
- «Xoriço i morcilla»: se dejó «morcilla», que en Cataluña es más habitual que «botifarra negra» para este embutido concreto.
- «Tallat» (cortado), «seitons» (boquerones), «calamarsons» (chipirones): son formas catalanas correctas pero se usan según zona.
- «Cigaló» sería el término catalán de «carajillo». Se dejó «Carajillo quemao» con explicación porque «quemao» es una forma andaluza y canaria.

**Francés, alemán, inglés**:
- «Bienmesabe»: «émissole» (Mustelus) / «Hundshai» / «dogfish» son los nombres más cercanos a «cazón». Confirmar con el bar qué pescado usa.
- «Crevettes royales» / «Riesengarnelen» / «king prawns» para «langostino» (el nombre de un langostino varía según el país).
- «Gulas»: se explican como imitación de angula hecha con pescado. Confirmar con el bar si la receta es esa.
- «Ajo mataero»: la descripción dice hígado de cerdo y pan (el encargo hablaba de patata e hígado). Se ha seguido la descripción de la demo en español.

## Observaciones sobre la demo en español

(Solo se apuntan; `carta-demo.ts` no se ha tocado.)

- «Cangrejo en salsa rosa» lleva alérgenos `pescado` y `huevos`: parece pensar en surimi. Está bien como orientativo.
- «Ajo mataero» tiene alérgenos solo `gluten`; la receta clásica lleva también pimentón y a veces `sulfitos` en los embutidos. Orientativo, sin cambios.
- Las descripciones «Se piden por docena o por media docena» están dentro del texto, aunque los formatos ya se ven en el precio. Se han traducido tal cual (el texto de la descripción es del bar).
