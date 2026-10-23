// Textos del armazón del panel (barra, navegación, cuenta). Carril acceso.

export const panelEs = {
  barra: {
    inicioPanel: "Ir al inicio del panel",
    cuenta: "Cuenta",
  },
  navegacion: {
    etiqueta: "Panel",
    inicio: "Inicio",
    carta: "Carta",
    menu: "Menú",
    idiomas: "Idiomas",
    estadisticas: "Visitas",
    local: "Local",
    qr: "QR",
  },
  cuenta: {
    metaTitulo: "Tu cuenta",
    titulo: "Tu cuenta",
    correo: "Correo",
    condiciones: "Condiciones del servicio",
    privacidad: "Política de privacidad",
    aceptada: (version: string, fecha: string) => `Aceptaste la versión del ${version} el ${fecha}.`,
    sinAceptar: "Todavía no las has aceptado.",
    leer: "Leer",
    salir: "Salir",
    bajaTitulo: "Darte de baja",
    baja: "Para darte de baja, escríbenos a",
    bajaDetalle: "Borraremos tu cuenta y tu carta en un plazo de 30 días.",
  },
} as const;

export type DiccionarioPanel = typeof panelEs;
