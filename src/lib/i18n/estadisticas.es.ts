// Textos del módulo de estadísticas (/panel/[local]/estadisticas). Carril estadisticas.

export const estadisticasEs = {
  metaTitulo: "Visitas · Kartana",
  titulo: "Visitas",
  intro: "Mira cuánta gente abre tu carta y qué platos miran más.",
  confianza: "Contamos visitas sin cookies y sin saber quién es nadie.",
  rango: {
    etiqueta: "Periodo",
    opciones: { 7: "7 días", 30: "30 días", 90: "90 días" },
  },
  cifras: {
    visitas: "Visitas a tu carta",
    platos: "Platos vistos",
    resenas: "Clics en «dejar reseña»",
    resenasProxima: "Llega en la próxima versión",
  },
  grafico: {
    titulo: "Visitas por día",
    descripcion: (desde: string, hasta: string, total: number) =>
      `Gráfico de barras con las visitas de cada día, del ${desde} al ${hasta}. En total, ${total}.`,
    verNumeros: "Ver los números",
    columnaDia: "Día",
    columnaVisitas: "Visitas",
    sinDatos: "Aún no hay visitas en estos días. Cuando alguien abra tu carta con el QR, aparecerán aquí.",
  },
  idiomas: {
    titulo: "Idiomas de tus visitas",
    sinDatos: "Todavía no hay datos de idiomas.",
    visitas: (n: number) => (n === 1 ? "1 visita" : `${n} visitas`),
  },
  platos: {
    titulo: "Platos más vistos",
    intro: "Un plato cuenta cuando alguien lo mira un momento en su móvil.",
    columnaPlato: "Plato",
    columnaVistas: "Vistas",
    sinDatos: "Aún no hay platos vistos. Aparecerán cuando tus clientes miren la carta.",
  },
  error: "No hemos podido cargar las visitas. Prueba otra vez dentro de un momento.",
} as const;
