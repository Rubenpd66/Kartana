// Textos del módulo QR y PDF (pantalla /panel/[local]/qr y plantillas de impresión). Carril qr-pdf.

export const qrEs = {
  metaTitulo: "Tu QR · Kartana",
  titulo: "Tu QR",
  intro: "Llévalo a las mesas: al escanearlo se abre tu carta, siempre al día.",
  qrAlt: "Código QR que abre tu carta",
  avisoNoPublicada: "Tu carta aún no está publicada: el QR funcionará cuando la publiques.",
  direccion: "Dirección de tu carta",
  copiarEnlace: "Copiar enlace",
  enlaceCopiado: "Enlace copiado",
  noSePudoCopiar: "No se ha podido copiar. Selecciona la dirección y cópiala a mano.",
  abrirCarta: "Abrir mi carta",
  descargarSvg: "Descargar solo el QR (SVG)",
  consejo: "Consejo: prueba el QR con tu móvil antes de imprimir muchos.",
  descargarPdf: "Descargar PDF",
  formatos: {
    mesa: {
      titulo: "Cartelito de mesa",
      descripcion: "4 por hoja A4 (tamaño A6). Imprime en cartulina, recorta y dobla. Lleva tu logo.",
      uso: "Para cada mesa",
    },
    pegatinas: {
      titulo: "Pegatinas",
      descripcion: "6 por hoja A4 (8 × 8 cm). Para papel adhesivo: mesas, barra o escaparate.",
      uso: "Para pegar donde quieras",
    },
    poster: {
      titulo: "Póster",
      descripcion: "A4 vertical con tu color y tu logo. Para la entrada o la pared.",
      uso: "Para la entrada",
    },
  },
  errores: {
    formato_invalido: "Formato no válido.",
    no_autenticado: "Tu sesión ha caducado. Entra otra vez para seguir.",
    no_encontrado: "No hemos encontrado este local.",
    error_servidor: "No hemos podido preparar el PDF. Inténtalo de nuevo en un momento.",
  },
  // Textos que se imprimen en los PDF.
  pdf: {
    escaneaMesa: "Escanea para ver la carta",
    alergenos: "Alérgenos: consulte al personal",
    carta: "Carta",
    tituloPoster: "Nuestra carta",
    apuntaPoster: "Apunta con la cámara del móvil",
  },
} as const;

export type TextosPdf = typeof qrEs.pdf;
