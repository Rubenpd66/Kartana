// Carta de demostración «Cafetería La Guagua» (slug `demo`), siempre marcada como carta de ejemplo.
//
// Fuente de platos y precios: docs/datos/carta-la-guagua.md (carta real que pasó el usuario, precios
// leídos de una foto). Todo lo que NO viene de ahí lleva un `aviso`:
//   - tipo "inventado": plato o precio que no estaba en la carta del bar.
//   - tipo "revisar": precio leído con dudas en la foto; se mantiene y hay que revisarlo con el bar.
// Las descripciones y los alérgenos son ORIENTATIVOS en todos los platos (la web lo dice con la banda
// «Carta de ejemplo»). No hay fotos de platos: las del usuario no se publican.
//
// Este archivo solo importa TIPOS: así lo puede ejecutar Node directamente (generar-semilla.ts).

import type { CodigoAlergeno, CodigoEtiqueta, DiaSemana, FormatoPrecio, FranjaHoraria, Precio } from "@/lib/tipos/dominio";

export type AvisoPlato = {
  tipo: "inventado" | "revisar";
  /** Qué hay que saber o comprobar (sale en docs/contenido/carta-demo.md). */
  texto: string;
};

export type PlatoDemo = {
  nombre: string;
  /** Orientativa, ≤ 120 caracteres. */
  descripcion: string;
  precios: Precio[];
  /** Orientativos: se guardan con alergenos_confirmados = true para poder probar el filtro. */
  alergenos: CodigoAlergeno[];
  trazas: CodigoAlergeno[];
  etiquetas: CodigoEtiqueta[];
  aviso?: AvisoPlato;
};

export type SeccionDemo = {
  nombre: string;
  descripcion: string | null;
  platos: PlatoDemo[];
};

export type ItemMenuDemo = { id: string; nombre: string; alergenos: CodigoAlergeno[] };
export type GrupoMenuDemo = { id: string; titulo: string; items: ItemMenuDemo[] };

export type MenuDemo = {
  nombre: string;
  precioCentimos: number;
  dias: DiaSemana[];
  horaInicio: string;
  horaFin: string;
  grupos: GrupoMenuDemo[];
  notas: string;
};

export type CartaDemo = {
  local: {
    slug: string;
    nombre: string;
    descripcion: string;
    direccion: string | null;
    telefono: string | null;
    colorMarca: string;
    horarios: FranjaHoraria[];
    publicado: boolean;
    permitirIndexar: boolean;
  };
  secciones: SeccionDemo[];
  menu: MenuDemo;
};

// ---------------------------------------------------------------------------
// Ayudas para escribir los datos sin ruido
// ---------------------------------------------------------------------------

type PrecioCorto = readonly [formato: FormatoPrecio, centimos: number | null, texto?: string];

/** Construye las variantes con ids estables ("v001", "v002"…): únicos en cada plato. */
function precios(...lista: PrecioCorto[]): Precio[] {
  return lista.map(([formato, centimos, texto], i) => ({
    id: `v${String(i + 1).padStart(3, "0")}`,
    formato,
    texto: texto ?? null,
    centimos,
  }));
}

type Opciones = {
  trazas?: CodigoAlergeno[];
  etiquetas?: CodigoEtiqueta[];
  aviso?: AvisoPlato;
};

function plato(
  nombre: string,
  descripcion: string,
  listaPrecios: Precio[],
  alergenos: CodigoAlergeno[],
  opciones: Opciones = {},
): PlatoDemo {
  return {
    nombre,
    descripcion,
    precios: listaPrecios,
    alergenos,
    trazas: opciones.trazas ?? [],
    etiquetas: opciones.etiquetas ?? [],
    ...(opciones.aviso ? { aviso: opciones.aviso } : {}),
  };
}

const PRECIO_INVENTADO = (texto: string): AvisoPlato => ({ tipo: "inventado", texto });
const PLATO_INVENTADO = (texto: string): AvisoPlato => ({ tipo: "inventado", texto });
const PRECIO_A_REVISAR = (texto: string): AvisoPlato => ({ tipo: "revisar", texto });

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

const mariscos: PlatoDemo[] = [
  plato(
    "Parrillada de marisco",
    "Surtido de marisco a la plancha, para compartir.",
    precios(["racion", 1800]),
    ["crustaceos", "moluscos"],
  ),
  plato(
    "Gamba roja a la plancha",
    "Gambas rojas enteras, hechas a la plancha. Se piden por docena o por media docena.",
    precios(["media_docena", 700], ["docena", 1400]),
    ["crustaceos"],
  ),
  plato(
    "Gamba blanca",
    "Gambas blancas enteras. Se piden por docena o por media docena.",
    precios(["media_docena", 550], ["docena", 1100]),
    ["crustaceos"],
  ),
  plato(
    "Langostino a la plancha",
    "Langostinos enteros, hechos a la plancha. Se piden por docena o por media docena.",
    precios(["media_docena", 400], ["docena", 800]),
    ["crustaceos"],
  ),
  plato(
    "Gamba rebozada",
    "Gambas rebozadas y fritas. Se piden por docena o por media docena.",
    precios(["media_docena", 250], ["docena", 500]),
    ["crustaceos", "gluten", "huevos"],
  ),
  plato(
    "Crujiente de patata y langostino",
    "Langostino con patata crujiente. Precio por unidad.",
    precios(["unidad", 125]),
    ["crustaceos", "gluten"],
    { aviso: PRECIO_A_REVISAR("En la foto se leía 1,25 € y parece precio por unidad. Confirmar con el bar.") },
  ),
  plato("Mejillones al vapor", "Mejillones cocidos al vapor.", precios(["media_racion", 250], ["racion", 500]), [
    "moluscos",
    "sulfitos",
  ]),
  plato("Tellinas", "Almejas pequeñas de arena, servidas calientes.", precios(["racion", 700]), ["moluscos"]),
  plato("Almejas fritas", "Almejas enharinadas y fritas.", precios(["racion", 700]), ["moluscos", "gluten"]),
  plato("Berberechos al vapor", "Berberechos cocidos al vapor.", precios(["racion", 650]), ["moluscos", "sulfitos"]),
  plato(
    "Navajas a la plancha",
    "Navajas hechas a la plancha. Se piden por docena o por media docena.",
    precios(["media_docena", 375], ["docena", 750]),
    ["moluscos"],
  ),
  plato("Vieira", "Vieira servida en su concha. Precio por unidad.", precios(["unidad", 400]), ["moluscos", "gluten"]),
  plato(
    "Zamburiñas",
    "Molusco parecido a la vieira, pero más pequeño. Precio por unidad.",
    precios(["unidad", 150]),
    ["moluscos", "gluten"],
  ),
  plato(
    "Tigres",
    "Mejillón relleno, rebozado y frito. Precio por unidad.",
    precios(["unidad", 150]),
    ["moluscos", "gluten", "huevos", "lacteos"],
  ),
  plato(
    "Salpicón de marisco",
    "Marisco troceado con verduras, aliñado y servido frío.",
    precios(["media_racion", 300], ["racion", 450]),
    ["crustaceos", "moluscos", "sulfitos"],
  ),
  plato(
    "Cangrejo en salsa rosa",
    "Cangrejo con salsa rosa, servido frío.",
    precios(["media_racion", 250], ["racion", 425]),
    ["crustaceos", "pescado", "huevos"],
  ),
];

const pescados: PlatoDemo[] = [
  plato(
    "Fritura de pescado",
    "Pescado variado enharinado y frito.",
    precios(["media_racion", 700], ["racion", 950]),
    ["pescado", "gluten", "moluscos"],
  ),
  plato("Sepia a la plancha", "Sepia hecha a la plancha.", precios(["media_racion", 600], ["racion", 900]), [
    "moluscos",
  ]),
  plato(
    "Sepia a la andaluza",
    "Sepia enharinada y frita, al estilo andaluz.",
    precios(["media_racion", 600], ["racion", 900]),
    ["moluscos", "gluten"],
  ),
  plato(
    "Calamar a la andaluza o a la plancha",
    "Calamar enharinado y frito, o hecho a la plancha. Se elige al pedir.",
    precios(["media_racion", 475], ["racion", 725]),
    ["moluscos", "gluten"],
  ),
  plato(
    "Calamar en salsa",
    "Calamar guisado en salsa.",
    precios(["media_racion", 275], ["racion", 475]),
    ["moluscos", "gluten", "sulfitos"],
  ),
  plato(
    "Calamares a la romana",
    "Calamar rebozado y frito. Se pide por docena o por media docena.",
    precios(["media_docena", 240], ["docena", 475]),
    ["moluscos", "gluten", "huevos"],
  ),
  plato("Chopitos fritos", "Chopitos enharinados y fritos.", precios(["media_racion", 400], ["racion", 650]), [
    "moluscos",
    "gluten",
  ]),
  plato(
    "Habas fritas con chopitos",
    "Habas y chopitos fritos.",
    precios(["media_racion", 325], ["racion", 475]),
    ["moluscos", "gluten"],
  ),
  plato(
    "Pulpo a la gallega",
    "Pulpo cocido sobre patata, con aceite y pimentón. En ración mediana o grande.",
    precios(["racion_mediana", 1000], ["racion_grande", 1200]),
    ["moluscos"],
  ),
  plato(
    "Bacalao rebozado",
    "Bacalao rebozado y frito. Precio por unidad.",
    precios(["unidad", 375]),
    ["pescado", "gluten", "huevos"],
  ),
  plato("Boquerones en vinagre", "Boquerones aliñados en vinagre, servidos fríos.", precios(["racion", 300]), [
    "pescado",
    "sulfitos",
  ]),
  plato(
    "Chipirones a la plancha",
    "Chipirones a la plancha, con alioli.",
    precios(["racion", 850]),
    ["moluscos", "huevos"],
    { aviso: PRECIO_INVENTADO("Plato visto en las fotos, sin precio en la carta leída. Precio de ejemplo: 8,50 €.") },
  ),
];

const cazuelas: PlatoDemo[] = [
  plato("Cazuela de gambas", "Gambas en cazuela, servidas calientes.", precios(["racion", 500]), [
    "crustaceos",
    "sulfitos",
  ]),
  plato("Cazuela de chopitos", "Chopitos en cazuela, servidos calientes.", precios(["racion", 500]), [
    "moluscos",
    "sulfitos",
  ]),
  plato(
    "Cazuela de gambas y chopitos",
    "Gambas y chopitos en cazuela, servidos calientes.",
    precios(["racion", 600]),
    ["crustaceos", "moluscos", "sulfitos"],
  ),
  plato("Cazuela de sesos", "Sesos en cazuela, servidos calientes.", precios(["racion", 450]), ["gluten", "sulfitos"]),
  plato(
    "Cazuela de gulas y gambas",
    "Gulas (hechas con pescado) y gambas en cazuela, servidas calientes.",
    precios(["racion", 500]),
    ["crustaceos", "pescado", "huevos", "gluten"],
  ),
  plato(
    "Cazuela de setas y gambas",
    "Setas y gambas en cazuela, servidas calientes.",
    precios(["racion", 500]),
    ["crustaceos", "sulfitos"],
  ),
];

const carnes: PlatoDemo[] = [
  plato(
    "Lacón a la gallega",
    "Lacón cocido con aceite y pimentón. En ración mediana o grande.",
    precios(["racion_mediana", 550], ["racion_grande", 600]),
    [],
    { aviso: PRECIO_A_REVISAR("En la foto se leían 5,50 € (mediana) y 6,00 € (grande) con dudas. Confirmar con el bar.") },
  ),
  plato("Lacón", "Lacón de cerdo cocido, en lonchas.", precios(["media_racion", 250], ["racion", 550]), []),
  plato(
    "Lomo de orza",
    "Lomo de cerdo adobado y conservado en aceite.",
    precios(["media_racion", 450], ["racion", 650]),
    ["sulfitos"],
  ),
  plato("Magra con tomate", "Magra de cerdo en salsa de tomate.", precios(["media_racion", 250], ["racion", 425]), [
    "sulfitos",
  ]),
  plato("Albóndigas", "Albóndigas de carne en salsa. Precio por unidad.", precios(["unidad", 125]), [
    "gluten",
    "huevos",
    "lacteos",
  ]),
  plato("Alas de pollo", "Alas de pollo. Precio por unidad.", precios(["unidad", 125]), ["gluten"]),
  plato("Rollito de lomo relleno", "Rollito de lomo relleno. Precio por unidad.", precios(["unidad", 275]), [
    "gluten",
    "huevos",
    "lacteos",
  ]),
  plato(
    "Rollito de ternera, york, calabacín y crema de queso",
    "Rollito de ternera con jamón york, calabacín y crema de queso.",
    precios(["racion", 450]),
    ["lacteos", "gluten"],
  ),
  plato("Jamón y queso", "Plato de jamón y queso.", precios(["racion", 750]), ["lacteos"]),
  plato("Chorizo y morcilla", "Chorizo y morcilla. Precio por unidad.", precios(["unidad", 150]), ["gluten"]),
  plato(
    "Ferrero de morcilla",
    "Bolita de morcilla con cobertura crujiente. Precio por unidad.",
    precios(["unidad", 150]),
    ["gluten", "huevos", "frutos_cascara"],
  ),
  plato("Oreja a la plancha", "Oreja de cerdo a la plancha.", precios(["media_racion", 375], ["racion", 550]), []),
  plato("Rabo frito", "Rabo de cerdo frito.", precios(["media_racion", 400], ["racion", 650]), ["gluten"]),
  plato("Morro frito", "Morro de cerdo frito.", precios(["media_racion", 350], ["racion", 600]), ["gluten"]),
  plato(
    "Landrecillas fritas",
    "Landrecillas de cerdo fritas. Son glándulas: un plato de casquería.",
    precios(["media_racion", 350], ["racion", 550]),
    ["gluten"],
  ),
  plato(
    "Suspiros de jamón con pimientos de Padrón",
    "Suspiros de jamón fritos, con pimientos de Padrón.",
    precios(["media_racion", 375], ["racion", 600]),
    ["gluten", "lacteos", "huevos"],
  ),
  plato("Setas con jamón", "Setas salteadas con jamón.", precios(["media_racion", 250], ["racion", 475]), []),
  plato(
    "Champiñones rellenos de jamón y queso",
    "Champiñones rellenos de jamón y queso.",
    precios(["racion", 475]),
    ["lacteos", "gluten"],
  ),
  plato("Foie de pato con rulo de cabra", "Foie de pato con queso de cabra.", precios(["racion", 675]), [
    "lacteos",
    "gluten",
  ]),
];

const tapas: PlatoDemo[] = [
  plato(
    "Patatas bravas",
    "Patatas fritas con salsa brava y alioli.",
    precios(["media_racion", 225], ["racion", 375]),
    ["huevos"],
    { trazas: ["gluten"] },
  ),
  plato("Patatas con ajo", "Patatas con salsa de ajo.", precios(["media_racion", 225], ["racion", 375]), ["huevos"]),
  plato("Casco de patatas", "Patata asada con alioli por encima.", precios(["racion", 125]), ["huevos"]),
  plato(
    "Ensaladilla rusa",
    "Ensaladilla de patata y atún con mayonesa.",
    precios(["media_racion", 280], ["racion", 425]),
    ["huevos", "pescado"],
  ),
  plato("Pastel de puerros", "Pastel de puerros, servido en porción.", precios(["racion", 500]), [
    "huevos",
    "lacteos",
    "gluten",
  ]),
  plato("Berenjena de york y queso", "Berenjena rellena de jamón york y queso.", precios(["racion", 275]), [
    "gluten",
    "huevos",
    "lacteos",
  ]),
  plato("Pimientos del piquillo rellenos", "Pimientos del piquillo rellenos.", precios(["racion", 225]), [
    "gluten",
    "lacteos",
  ]),
  plato(
    "Queso frito",
    "Dados de queso empanados y fritos, con salsa.",
    precios(["media_racion", 400], ["racion", 650]),
    ["lacteos", "gluten", "huevos"],
  ),
  plato(
    "Chupa-chups de queso de cabra",
    "Queso de cabra con forma de piruleta. Precio por unidad.",
    precios(["unidad", 150]),
    ["lacteos", "gluten", "huevos"],
  ),
  plato(
    "Rollito de salmón y crema de queso",
    "Rollito de salmón relleno de crema de queso.",
    precios(["racion", 350]),
    ["pescado", "lacteos"],
  ),
  plato("Huevos a la flamenca", "Huevos con tomate, verduras y embutido.", precios(["racion", 425]), ["huevos"]),
  plato(
    "Parrillada de verduras",
    "Verduras variadas a la plancha.",
    precios(["media_racion", 475], ["racion", 700]),
    [],
    { etiquetas: ["vegetariano"] },
  ),
  plato(
    "Espárragos a la plancha",
    "Espárragos a la plancha. Se piden por docena.",
    precios(["docena", 400]),
    [],
    { etiquetas: ["vegetariano"] },
  ),
  plato(
    "Croqueta de jamón y cocido",
    "Croqueta de jamón y cocido. Precio por unidad.",
    precios(["unidad", 120]),
    ["gluten", "lacteos", "huevos"],
    { aviso: PRECIO_INVENTADO("Plato visto en las fotos, sin precio en la carta leída. Precio de ejemplo: 1,20 € la unidad.") },
  ),
];

const especialidades: PlatoDemo[] = [
  plato(
    "Ajo mataero",
    "Guiso manchego de hígado de cerdo y pan, típico de la matanza.",
    precios(["media_racion", 250], ["racion", 425]),
    ["gluten"],
  ),
  plato(
    "Bienmesabe",
    "Cazón en adobo: trozos de pescado rebozados y fritos, con limón. No es el postre canario.",
    precios(["media_racion", 350], ["racion", 550]),
    ["pescado", "gluten", "sulfitos"],
  ),
  plato(
    "Atascaburras",
    "Puré manchego de bacalao y patata, con ajo y aceite.",
    precios(["media_racion", 250], ["racion", 425]),
    ["pescado", "huevos", "frutos_cascara"],
  ),
];

const postres: PlatoDemo[] = [
  plato("Pan de Calatrava", "Postre de pan, leche y huevo, parecido a un flan.", precios(["unico", 350]), [
    "gluten",
    "huevos",
    "lacteos",
  ], { aviso: PRECIO_INVENTADO("Plato visto en las fotos, sin precio en la carta leída. Precio de ejemplo: 3,50 €.") }),
  plato("Tarta de chocolates", "Tarta con varias capas de chocolate.", precios(["unico", 400]), [
    "gluten",
    "huevos",
    "lacteos",
    "soja",
  ], { aviso: PRECIO_INVENTADO("Plato visto en las fotos, sin precio en la carta leída. Precio de ejemplo: 4,00 €.") }),
  plato("Flan de huevo", "Flan de huevo con caramelo.", precios(["unico", 300]), ["huevos", "lacteos"], {
    aviso: PLATO_INVENTADO("Plato y precio inventados para completar la sección Postres. No está en la carta del bar."),
  }),
  plato("Tarta de queso", "Tarta de queso al horno.", precios(["unico", 400]), ["lacteos", "huevos", "gluten"], {
    aviso: PLATO_INVENTADO("Plato y precio inventados para completar la sección Postres. No está en la carta del bar."),
  }),
];

const bebidas: PlatoDemo[] = [
  plato("Café solo", "Café solo.", precios(["unico", 130]), [], {
    aviso: PLATO_INVENTADO("Plato y precio inventados para completar la sección. No está en la carta del bar."),
  }),
  plato("Café con leche", "Café con leche.", precios(["unico", 160]), ["lacteos"], {
    aviso: PLATO_INVENTADO("Plato y precio inventados para completar la sección. No está en la carta del bar."),
  }),
  plato("Cortado", "Café con un poco de leche.", precios(["unico", 140]), ["lacteos"], {
    aviso: PLATO_INVENTADO("Plato y precio inventados para completar la sección. No está en la carta del bar."),
  }),
  plato("Carajillo quemao", "Café con licor, flambeado.", precios(["unico", 250]), [], {
    aviso: PRECIO_INVENTADO("Plato visto en las fotos, sin precio en la carta leída. Precio de ejemplo: 2,50 €."),
  }),
  plato("Cerveza", "Cerveza de barril, en caña o en jarra.", precios(["otro", 180, "Caña"], ["jarra", 350]), ["gluten"], {
    aviso: PLATO_INVENTADO("Plato y precios inventados para completar la sección. Sirve para probar la etiqueta libre «Caña»."),
  }),
  plato("Vino tinto de la casa", "Vino tinto, por copa o por botella.", precios(["copa", 220], ["botella", 1200]), ["sulfitos"], {
    aviso: PLATO_INVENTADO("Plato y precios inventados para completar la sección. No está en la carta del bar."),
  }),
  plato("Agua mineral", "Agua mineral sin gas.", precios(["unico", 150]), [], {
    aviso: PLATO_INVENTADO("Plato y precio inventados para completar la sección. No está en la carta del bar."),
  }),
  plato("Refresco", "Refresco de lata o botella.", precios(["unico", 200]), [], {
    aviso: PLATO_INVENTADO("Plato y precio inventados para completar la sección. No está en la carta del bar."),
  }),
];

const SECCIONES: SeccionDemo[] = [
  { nombre: "Mariscos", descripcion: null, platos: mariscos },
  { nombre: "Pescados y cefalópodos", descripcion: null, platos: pescados },
  { nombre: "Cazuelas", descripcion: null, platos: cazuelas },
  { nombre: "Carnes y embutidos", descripcion: null, platos: carnes },
  { nombre: "Tapas y raciones", descripcion: null, platos: tapas },
  { nombre: "Especialidades de la tierra", descripcion: null, platos: especialidades },
  { nombre: "Postres", descripcion: null, platos: postres },
  { nombre: "Cafés y bebidas", descripcion: null, platos: bebidas },
];

// ---------------------------------------------------------------------------
// Menú del día (INVENTADO: precio, horario y platos elegidos de la carta)
// ---------------------------------------------------------------------------

function itemMenu(grupoId: string, indice: number, nombre: string): ItemMenuDemo {
  const origen = SECCIONES.flatMap((s) => s.platos).find((p) => p.nombre === nombre);
  if (!origen) throw new Error(`El menú usa un plato que no está en la carta: ${nombre}`);
  return { id: `${grupoId}i${indice}`, nombre, alergenos: [...origen.alergenos] };
}

function grupoMenu(id: string, titulo: string, nombres: string[]): GrupoMenuDemo {
  return { id, titulo, items: nombres.map((n, i) => itemMenu(id, i + 1, n)) };
}

const MENU: MenuDemo = {
  nombre: "Menú del día",
  precioCentimos: 1250,
  dias: [1, 2, 3, 4, 5],
  horaInicio: "13:00",
  horaFin: "16:00",
  grupos: [
    grupoMenu("grp1", "Primeros", ["Ensaladilla rusa", "Mejillones al vapor", "Pastel de puerros"]),
    grupoMenu("grp2", "Segundos", ["Sepia a la plancha", "Albóndigas", "Bienmesabe"]),
    grupoMenu("grp3", "Postres", ["Pan de Calatrava", "Tarta de chocolates", "Flan de huevo"]),
  ],
  notas: "Incluye pan, bebida y postre o café",
};

// Horarios INVENTADOS: lunes a sábado, mañana y tarde; domingo cerrado.
const HORARIOS: FranjaHoraria[] = ([1, 2, 3, 4, 5, 6] as DiaSemana[]).flatMap((dia) => [
  { dia, abre: "08:00", cierra: "16:30" },
  { dia, abre: "19:30", cierra: "23:30" },
]);

export const CARTA_DEMO: CartaDemo = {
  local: {
    slug: "demo",
    nombre: "Cafetería La Guagua",
    descripcion: "Carta de ejemplo de Kartana con los platos de una cafetería de verdad",
    direccion: null,
    telefono: null,
    // Terracota oscuro: contraste sobre blanco por encima de 4,5:1.
    colorMarca: "#a63d12",
    horarios: HORARIOS,
    publicado: true,
    permitirIndexar: false,
  },
  secciones: SECCIONES,
  menu: MENU,
};

export function todosLosPlatosDemo(carta: CartaDemo = CARTA_DEMO): PlatoDemo[] {
  return carta.secciones.flatMap((s) => s.platos);
}
