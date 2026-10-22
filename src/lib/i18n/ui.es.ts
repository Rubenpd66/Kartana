// Textos de los componentes de interfaz compartidos (src/componentes/ui/*). Carril acceso.

export const uiEs = {
  cargando: "Cargando…",
  enviando: "Un momento…",
  confirmarBorrado: {
    cancelar: "Cancelar",
    borrar: "Sí, borrar",
  },
  subirImagen: {
    elegir: "Elegir imagen",
    cambiar: "Cambiar imagen",
    quitar: "Quitar imagen",
    ayudaFoto: "Puedes hacer la foto con el móvil. La reducimos antes de subirla.",
    ayudaLogo: "Mejor cuadrado y con fondo claro. Lo reducimos antes de subirlo.",
    reduciendo: "Preparando la imagen…",
    subiendo: "Subiendo la imagen…",
    lista: "Imagen subida.",
    miniatura: "Vista previa de la imagen",
    errores: {
      no_es_imagen: "Ese archivo no es una imagen. Prueba con una foto JPG, PNG o WebP.",
      demasiado_grande: "La imagen sigue pesando más de 2 MB. Prueba con otra más pequeña.",
      subida: "No se ha podido subir la imagen. Revisa tu conexión y prueba otra vez.",
    },
  },
} as const;

export type DiccionarioUi = typeof uiEs;
