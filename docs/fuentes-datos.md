# Fuentes de datos, contenidos y servicios

Todo dato, imagen o servicio de terceros, con su licencia o condiciones. Se actualiza en cada fase.

## Normativa consultada (Fase 0)
| Tema | Fuente | Uso |
|---|---|---|
| Reseñas en Google | [Política de contenido de Google Maps](https://support.google.com/contributionpolicy/answer/7422880) | Reglas de petición de reseñas (sin incentivos, sin filtrar, sin cuotas) |
| Reseñas falsas (España) | RDL 24/2021 (Directiva Ómnibus): art. 27.7 LCD y art. 20.4 TRLGDCU — [resumen de Garrigues](https://www.garrigues.com/es_ES/noticia/fake-reviews-real-decreto-ley-242021-introduce-nuevas-medidas-evitar-resenas-falsas-bienes-o) | Reglas de diseño del módulo de reseñas |
| Alérgenos | Reglamento (UE) 1169/2011 y [RD 126/2015](https://www.boe.es/buscar/act.php?id=BOE-A-2015-2293) | 14 alérgenos; responsabilidad del establecimiento |
| Verifactu | RDL 15/2025 (autónomos: 1/7/2027) | Decisión de facturación en el PC4 |
| Uso comercial de Vercel | [Vercel Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines) | Paso a Vercel Pro antes de cobrar |

## Servicios de terceros previstos
| Servicio | Para qué | Condiciones / coste | Estado |
|---|---|---|---|
| Google Cloud Translation | Traducir cartas | 500.000 caracteres/mes gratis; 20 $/millón después | v0.2 |
| Google Places API (New) | Encontrar el ID de la ficha de Google | Cupos gratis mensuales por tipo de llamada | v0.3 |
| Google Business Profile API | Leer reseñas y publicar respuestas | Gratis, con solicitud de acceso | v0.5 (pendiente de aprobación) |
| Stripe | Suscripciones | 1,5 % + 0,25 € por cobro con tarjeta europea + Stripe Billing | v0.4, apagado |
| Resend | Correos de acceso | Plan gratis | v0.1 |

## Iconos y recursos gráficos
- **Iconos de los 14 alérgenos:** pendiente de elegir un juego con licencia libre o dibujarlos propios (Fase 1/2). Se anotará aquí autor y licencia.
  - *Nota del arquitecto (Fase 2, 22/10/2026):* las maquetas de `docs/diseno/` usan **marcadores provisionales** (círculos con dos letras: GL, CR, HU…). **Hace falta un juego definitivo** antes de la v0.1: el carril `contenido` los dibuja propios (SVG en línea, 24×24, un solo color) con licencia propia/CC0. Si se usara un juego ajeno, solo con licencia CC0, CC BY u OFL, anotando aquí autor, enlace y licencia. No usar juegos de licencia comercial o «solo uso personal».
- **Fotos de la carta de ejemplo:** Wikimedia Commons con autor y licencia, o generadas con Nano Banana según `docs/estilo-imagenes.md`.
  - *Nota (Fase 2):* la carta de demostración «Cafetería La Guagua» (`docs/datos/carta-la-guagua.md`) se publica **sin fotos de platos**: las fotos que pasó el usuario no se usan hasta saber quién las hizo y tener permiso.
- **Tipografías en los PDF de QR (v0.1):** Figtree y Fraunces en TTF estáticos (SIL Open Font License 1.1, repositorio oficial de Google Fonts), guardadas en `src/lib/qr/fuentes/`. El carril `qr-pdf` confirma aquí la versión descargada.

- **Iconos de los 14 alérgenos (definitivos, 22/10/2026):** dibujados por el carril `contenido` de Kartana, SVG en línea (`src/componentes/alergenos/trazos.ts`). Licencia propia, ofrecidos también como CC0. No derivan de ningún juego ajeno. Sustituyen a los marcadores provisionales de las maquetas.
- **Diccionarios de la carta:** nombres de alérgenos según el anexo II del Reglamento (UE) 1169/2011 (es, en, fr, de); ACSA (ca); euskadi.eus y ELIKA (eu); terminología pública gallega (gl). Detalle y dudas en `docs/contenido/fuentes-diccionarios.md`. **eu y gl pendientes de revisión por un hablante nativo.**

## Librerías con licencia a vigilar (Fase 2)
| Librería | Uso | Licencia | Versión prevista |
|---|---|---|---|
| `@react-pdf/renderer` | Generar los PDF de QR en el servidor | MIT | 4.x |
| `qrcode` (node-qrcode) | Matriz del código QR | MIT | 1.5.x |

## Datos de ejemplo
| Dato | Fuente | Condiciones |
|---|---|---|
| Carta de «Cafetería La Guagua» (platos y precios) | El usuario, 22/10/2026 (`docs/datos/carta-la-guagua.md`) | Se usa como carta de ejemplo con su nombre, marcada siempre como «Carta de ejemplo»; descripciones y alérgenos orientativos; sin indexar en Google (`permitir_indexar = false`). Pertenece a la cuenta `rubenpd66+demo@gmail.com`. Platos y precios inventados para completar: ver `docs/contenido/carta-demo.md`. |

## Contenido del usuario
- Textos, precios, fotos y logos de cada bar son del establecimiento. Las condiciones del servicio le dan a Kartana licencia solo para mostrarlos en su carta.
