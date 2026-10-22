// Textos compartidos de la web (cabecera, pie, errores). Diccionario del director.
// Cada módulo tiene el suyo: src/lib/i18n/<modulo>.<idioma>.ts

export const comunEs = {
  saltarAlContenido: "Saltar al contenido",
  menu: {
    inicio: "Inicio",
    entrar: "Entrar",
    abrirMenu: "Abrir menú",
  },
  pie: {
    legal: "Legal",
    avisoLegal: "Aviso legal",
    privacidad: "Privacidad",
    cookies: "Cookies",
    condiciones: "Condiciones del servicio",
    hecho: "Hecho en España para bares de aquí.",
  },
  error: {
    titulo: "Algo ha fallado",
    texto: "Ha habido un error al cargar esta página. Prueba otra vez en unos segundos.",
    reintentar: "Reintentar",
    volver: "Volver al inicio",
  },
  noEncontrada: {
    titulo: "Esta página no existe",
    texto: "Puede que el enlace esté mal escrito o que la página se haya movido.",
    volver: "Volver al inicio",
  },
} as const;

export type DiccionarioComun = typeof comunEs;
