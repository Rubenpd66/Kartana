// Textos propios del carril carta-publica que no van en el diccionario de la carta (DiccionarioCarta):
// la página de carta no encontrada y la vista previa del panel. Los textos que ve el cliente del bar
// en cada idioma están en src/lib/i18n/carta.<xx>.ts.

export const cartaPublicaEs = {
  noEncontrada: {
    texto: "Puede que la dirección esté mal escrita o que el bar la haya retirado. Pregunta al personal.",
    volver: "Ir a Kartana",
  },
  vistaPrevia: {
    metaTitulo: "Vista previa de la carta",
    bandaSinPublicar: "Así verán tu carta (aún no está publicada)",
    bandaPublicada: "Así ven tu carta tus clientes",
    cargando: "Cargando la vista previa…",
    vacia: "Aún no hay nada que enseñar: añade platos visibles en «Carta» y aparecerán aquí.",
    irACarta: "Ir a la carta",
  },
} as const;

export type DiccionarioCartaPublica = typeof cartaPublicaEs;
