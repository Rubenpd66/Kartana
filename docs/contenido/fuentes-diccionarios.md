# Fuentes de los diccionarios de la carta (7 idiomas)

> Carril `contenido` · v0.1 · 22/10/2026. Archivos: `src/lib/i18n/carta.{es,en,fr,de,ca,eu,gl}.ts`.

## Criterio

- Los 14 alérgenos son los del **anexo II del Reglamento (UE) n.º 1169/2011**.
- Se usa el **nombre del anexo en cada idioma**, abreviado para una carta: se quita «y productos a base de…» (en una carta es redundante) y las excepciones del texto legal.
- Cuando el anexo no existe en el idioma (catalán, euskera y gallego no son lenguas oficiales de la UE), se usa la fuente oficial autonómica o, si no hay página con la lista completa, la terminología de organismos públicos de esa comunidad. Cada caso está abajo.

## es, en, fr, de: texto del anexo II (Oficina de Publicaciones de la UE)

Descargado el 22/10/2026 del *Diario Oficial* (versión oficial en cada lengua):

| Idioma | Dónde se consultó |
|---|---|
| es | [DOUE L 304 de 22.11.2011 en BOE](https://www.boe.es/doue/2011/304/L00018-00063.pdf), p. 43 |
| en | [Publications Office (xhtml)](http://publications.europa.eu/resource/celex/32011R1169.ENG.xhtml) |
| fr | [Publications Office (xhtml)](http://publications.europa.eu/resource/celex/32011R1169.FRA.xhtml) |
| de | [Publications Office (xhtml)](http://publications.europa.eu/resource/celex/32011R1169.DEU.xhtml) |

Equivalente en EUR-Lex: `https://eur-lex.europa.eu/legal-content/<ES|EN|FR|DE>/TXT/?uri=CELEX:32011R1169` (anexo II).

### Nombres del anexo y lo que usa la carta

| Código | es | en | fr | de |
|---|---|---|---|---|
| gluten | Cereales con gluten (*Cereales que contengan gluten*) | Cereals containing gluten | Céréales contenant du gluten | Glutenhaltiges Getreide |
| crustaceos | Crustáceos | Crustaceans | Crustacés | Krebstiere |
| huevos | Huevos | Eggs | Œufs | Eier |
| pescado | Pescado | Fish | Poissons | Fische |
| cacahuetes | Cacahuetes | Peanuts | Arachides | Erdnüsse |
| soja | Soja | **Soybeans** | Soja | Sojabohnen |
| lacteos | Leche y derivados (*Leche y sus derivados (incluida la lactosa)*) | **Milk and dairy** (anexo: *Milk*) | Lait | Milch (einschließlich Laktose) |
| frutos_cascara | Frutos de cáscara | **Tree nuts** (anexo: *Nuts*) | Fruits à coque | Schalenfrüchte |
| apio | Apio | Celery | Céleri | Sellerie |
| mostaza | Mostaza | Mustard | Moutarde | Senf |
| sesamo | Granos de sésamo | Sesame seeds | Graines de sésame | Sesamsamen |
| sulfitos | Dióxido de azufre y sulfitos | Sulphur dioxide and sulphites | Anhydride sulfureux et sulfites | Schwefeldioxid und Sulfite |
| altramuces | Altramuces | Lupin | Lupin | Lupinen |
| moluscos | Moluscos | Molluscs | Mollusques | Weichtiere |

Desviaciones deliberadas respecto al texto del anexo (todas por claridad para el cliente):

- **en · «Tree nuts»** en vez de «Nuts»: en una lista donde también está «Peanuts», «Nuts» se confunde con los cacahuetes. Es el término que usa la Food Standards Agency británica.
- **en · «Milk and dairy»** en vez de «Milk»: para que quede claro que incluye queso, nata, etc.
- **es · «Leche y derivados»** en vez de «Leche y sus derivados (incluida la lactosa)»: abreviado.
- **de · «Sulfite»** con *f* (el texto del anexo alemán trae «Sulphite», con *ph*, que no es la forma habitual hoy).

## ca: Agència Catalana de Seguretat Alimentària (ACSA)

Fuente: [Al·lèrgens de declaració obligatòria](https://acsa.gencat.cat/ca/seguretat_alimentaria/seguretat_alimentaria_per_temes/alergies_i_intolerancies_alimentaries/allergens-de-declaracio-obligatoria/) (consultada el 22/10/2026). Títulos de la página, en orden:

Cereals que contenen gluten · Crustacis i productes que contenen crustacis · Ous i productes que contenen ou · Peix i productes que contenen peix · Cacauet i productes que contenen cacauet · Soja i productes que contenen soja · Llet i els seus derivats (inclosa la lactosa) · Fruita seca de clofolla · Api i productes derivats · Mostassa i productes derivats · Grans de sèsam i productes que contenen grans de sèsam · Anhídrid sulfurós i sulfits en quantitats superiors a 10 mg/kg o 10 mg/L (SO2) · Tramussos i productes a base de tramussos · Mol·luscs i productes a base de mol·luscs.

Uso en la carta: **Cereals amb gluten**, Crustacis, Ous, Peix, **Cacauets** (la ACSA lo pone en singular), Soja, **Llet i derivats**, Fruita seca de clofolla, Api, Mostassa, Grans de sèsam, Anhídrid sulfurós i sulfits, Tramussos, Mol·luscs.

## eu: Eusko Jaurlaritza y ELIKA

No se encontró una página oficial en euskera con los 14 nombres juntos. Se montó la lista con la terminología de dos fuentes públicas del País Vasco:

- [Eusko Jaurlaritza · Janari-alergiak eta -intolerantziak](https://www.euskadi.eus/informazioa/janari-alergiak-eta-intolerantziak/web01-a3contal/eu/): esnea, arrautza(k), arraina(k), krustazeoak, moluskuak, kakahuetea, lupinuak, zerealak, oskoldun fruitu lehorrak, sesamoa, ziapea.
- [ELIKA · Alergiak eta intolerantziak](https://www.elika.eus/alergiak-intolerantziak/) y los textos de [kontsumitzailea.elika.eus](https://kontsumitzailea.elika.eus/): apioa, soja, sulfitoak.
- Apoyo: [Consumer EROSKI en euskera](https://www.consumer.es/eu/seguridad-alimentaria-eu/alergenoetarako-etiketa-seguruagoa.html) (apioa, ziapea, sesamo aleak, krustazeoak, moluskuak, sulfitoak). No es un organismo público.

**Dudas de traducción (eu)**: ver el apartado final.

## gl: Xunta de Galicia

No se encontró una página de la Xunta con la lista completa de los 14 en gallego. Se usó la forma habitual en documentos públicos gallegos (menús escolares de la Xunta, formación del CEFORE y [Galipedia, «Alerxia alimentaria»](https://gl.wikipedia.org/wiki/Alerxia_alimentaria)) y la ortografía de la Real Academia Galega. **Es el idioma con menos respaldo oficial: conviene una revisión de una persona gallega.**

## Textos de la interfaz y días

Los textos de `textos`, los días, los formatos de venta y las etiquetas son nuestros (no hay fuente oficial). Se revisaron contra el uso habitual en cartas de restaurantes de cada idioma. Notas por idioma:

- **fr**: los dos puntos y signos de interrogación llevan espacio duro (` `), como exige la tipografía francesa. «Selon arrivage» es la fórmula habitual para el pescado y marisco «según mercado».
- **de**: «Tagespreis» es el equivalente de «según mercado». Se usa el trato de usted («Sie»).
- **ca**: aviso con «Consulteu» (plural) y reseña con «T'ha agradat» (tú), igual que en español («Consulte» / «¿Te ha gustado?»).
- **Formatos de venta**: «½ ración» y «½ docena» se dejan con el símbolo ½ en es y fr (no cambia de idioma); en el resto se escriben con palabras.

## Dudas de traducción para revisar con hablantes nativos

1. **gl · «Tremoces»** (altramuces): la forma gallega propia es *tremoceiro* (planta) o *tremoço* (semilla); la Galipedia y algunos documentos oficiales gallegos escriben «altramuces» (castellanismo). Se eligió «Tremoces». Comprobar qué usa la Xunta en sus carteles.
2. **gl · «Cacahuetes»**: se mantiene la forma castellana, muy extendida; la RAG admite *cacahuete*. Alternativa: *Améndoas de terra* (poco usada).
3. **gl · «Froitos de casca»** frente a «Froitos secos»: la Galipedia usa «froitos secos». Se eligió «Froitos de casca» por ser la traducción literal del anexo.
4. **eu · «Ziapea»** (mostaza): es la palabra vasca habitual (la usan Eusko Jaurlaritza y Consumer EROSKI); algunas cartas usan «mostaza» como préstamo. Se eligió «Ziapea».
5. **eu · «Esnea eta eratorriak»**: «eratorriak» es la forma que usan los textos de ELIKA para «derivados».
6. **eu · «Razioa / Pintxoa»**: «ración» se escribe *razioa* en euskera, pero en bares es frecuente «erreazioa» o dejarlo en castellano. «Pintxoa» es la grafía vasca de «pincho».
7. **eu · `horarioMenu` `{dias}, {inicio}–{fin}`**: en euskera las horas llevan sufijos (*13:00etatik 16:00etara*) que cambian según el número; para no dar una frase incorrecta se usa un rango con guion.
8. **eu · «Hauek ditu» / «Hauen arrastoak izan ditzake»**: formas cortas pensadas para ir seguidas de la lista de alérgenos («Hauek ditu: gluten, arrautzak»). Si la interfaz no pone la lista justo detrás, hay que cambiarlas.
9. **ca · «Pinxo»** (pincho): es la forma catalana habitual; «pincho» también se ve en cartas catalanas. 
10. **ca · «Gerra»** (jarra de cerveza): «gerra» es correcto; en bares se oye «jarra» o «gerra de cervesa».
11. **fr · «Pichet»** (jarra): en carta de bar francesa de cerveza se diría «chope»; «pichet» es lo normal para vino o agua. Se eligió «Pichet» por ser genérico.
12. **fr · «Végan»**: la grafía académica es «végane»; «végan» es lo más común en cartas.
13. **en · «Each»** para «Unidad»: alternativa «Per piece». Se eligió «Each» por ser más corto en una etiqueta de precio.
14. **Todos · `botonResena`**: el texto de ejemplo del encargo («¿Te ha gustado? Déjanos tu opinión en Google») se tradujo tal cual. Si en la v0.3 se decide que la pregunta previa «¿Te ha gustado?» orienta hacia las reseñas positivas (riesgo de *review gating* en espíritu, aunque el botón es igual para todos), conviene cambiarlo por una frase neutra como «Cuéntanos qué te ha parecido en Google» en los 7 idiomas.
