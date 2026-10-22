// Textos del panel de la carta (secciones, platos, agotado, orden y menús del día). Carril panel-carta.
// Los nombres oficiales de alérgenos, etiquetas, formatos y días salen de diccionarioCarta("es").

import type { CodigoError } from "@/lib/tipos/resultado";
import type { FormatoPrecio } from "@/lib/tipos/dominio";

export const panelCartaEs = {
  comun: {
    guardar: "Guardar",
    guardando: "Guardando…",
    guardado: "Guardado",
    cancelar: "Cancelar",
    cerrar: "Cerrar",
    volver: "Volver",
    opcional: "(opcional)",
    caracteres: (usados: number, maximo: number) => `${usados}/${maximo}`,
    subir: (nombre: string) => `Subir ${nombre}`,
    bajar: (nombre: string) => `Bajar ${nombre}`,
    revisaCampos: "Revisa los campos marcados en rojo.",
  },

  errores: {
    no_autenticado: "Tu sesión ha caducado. Vuelve a entrar.",
    sin_permiso: "No puedes cambiar esto.",
    datos_invalidos: "Revisa los campos marcados en rojo.",
    no_encontrado: "No lo encontramos. Puede que ya se haya borrado.",
    limite_alcanzado: "Has llegado al máximo permitido.",
    slug_ocupado: "Esa dirección ya está en uso.",
    slug_reservado: "Esa dirección no se puede usar.",
    conflicto: "Ya existe. Recarga la página y prueba otra vez.",
    servicio_apagado: "Este servicio no está disponible ahora mismo.",
    cuota_agotada: "Has llegado al límite por hoy.",
    error_servidor: "No se ha podido guardar. Revisa tu conexión y prueba otra vez.",
  } satisfies Record<CodigoError, string>,

  campos: {
    requerido: "Este campo es obligatorio.",
    demasiado_largo: "Es demasiado largo.",
    formato: "Revisa este dato.",
    fuera_de_rango: "Este valor no está permitido.",
    duplicado: "Está repetido.",
  } as Record<string, string>,

  lista: {
    metaTitulo: "Tu carta",
    titulo: "Tu carta",
    verCarta: "Ver mi carta",
    ordenar: "Ordenar",
    terminarOrden: "Terminar de ordenar",
    ayudaOrden: "Usa las flechas para cambiar el orden. Se guarda solo.",
    numPlatos: (n: number) => (n === 1 ? "1 plato" : `${n} platos`),
    oculta: "Oculta",
    oculto: "Oculto",
    editarSeccion: (nombre: string) => `Editar sección «${nombre}»`,
    editar: "Editar",
    anadirPlato: (seccion: string) => `+ Añadir plato a «${seccion}»`,
    nuevaSeccion: "+ Nueva sección",
    sinRevisar: "Alérgenos sin revisar",
    sinAlergenos: "Sin alérgenos declarados",
    editarPlato: (nombre: string) => `Editar ${nombre}`,
    seccionVacia: "Esta sección todavía no tiene platos.",
    vacioTitulo: "Empieza tu carta",
    vacioTexto: "Crea tu primera sección (por ejemplo «Tapas», «Bocadillos» o «Postres») y después añade los platos.",
    vacioBoton: "Crear la primera sección",
    guardadoPlato: (nombre: string) => `«${nombre}» guardado.`,
    borradoPlato: "Plato borrado.",
    errorOrden: "No se ha podido guardar el orden. Prueba otra vez.",
  },

  agotado: {
    disponible: "Disponible",
    agotado: "Agotado",
    etiqueta: (nombre: string) => `Agotado: ${nombre}`,
    error: (nombre: string) => `No se ha podido cambiar «${nombre}». Prueba otra vez.`,
  },

  seccion: {
    tituloNueva: "Nueva sección",
    tituloEditar: "Editar sección",
    nombre: "Nombre de la sección",
    nombreAyuda: "Por ejemplo «Tapas y raciones».",
    descripcion: "Descripción",
    visible: "Visible en la carta",
    visibleAyuda: "Si la apagas, la sección y sus platos no se ven en la carta.",
    borrar: "Borrar sección",
    borrarTitulo: (nombre: string) => `¿Borrar la sección «${nombre}»?`,
    borrarTexto: (n: number) =>
      n === 0
        ? "La sección está vacía. Esto no se puede deshacer."
        : `También se borrarán ${n === 1 ? "su plato" : `sus ${n} platos`}. Esto no se puede deshacer.`,
  },

  plato: {
    metaNuevo: "Nuevo plato",
    metaEditar: "Editar plato",
    tituloNuevo: "Nuevo plato",
    tituloEditar: "Editar plato",
    volverCarta: "Volver a la carta",
    nombre: "Nombre del plato",
    descripcion: "Descripción",
    seccion: "Sección",
    sinSecciones: "Antes de añadir platos, crea una sección en tu carta.",
    irACarta: "Ir a la carta",
    noEncontrado: "Este plato no existe o ya se ha borrado.",
    precio: "Precio",
    alergenos: "Alérgenos",
    alergenosAyuda: "Toca los que contiene este plato.",
    confirmar: "He revisado los alérgenos de este plato",
    confirmarAyudaVacio: "Si no marcas ninguno, la carta dirá «Sin alérgenos declarados».",
    sinConfirmar: "Mientras no lo marques, la carta dirá «Consulte al personal sobre alérgenos».",
    trazas: "Puede contener trazas de… (opcional)",
    trazasAyuda: "Solo si hay riesgo de contaminación cruzada.",
    etiquetas: "Etiquetas",
    foto: "Foto",
    fotoEtiqueta: "Foto del plato",
    visible: "Visible en la carta",
    visibleAyuda: "Si lo apagas, el plato no sale en la carta.",
    borrar: "Borrar plato",
    borrarTitulo: (nombre: string) => `¿Borrar «${nombre}»?`,
    borrarTexto: "Se borrará el plato y su foto. Esto no se puede deshacer.",
  },

  precios: {
    precio: "Precio",
    precioDe: (etiqueta: string) => `Precio de ${etiqueta}`,
    precioVariante: (n: number) => `Precio de la variante ${n}`,
    formato: (n: number) => `Etiqueta de la variante ${n}`,
    sinEtiqueta: "Sin etiqueta",
    otra: "Otra…",
    textoLibre: (n: number) => `Nombre de la variante ${n}`,
    textoLibreAyuda: "Por ejemplo «Para compartir».",
    segunMercado: "Según mercado",
    segunMercadoAyuda: "Sin precio fijo",
    quitar: (etiqueta: string) => `Quitar ${etiqueta}`,
    variante: (n: number) => `variante ${n}`,
    atajos: "Atajos:",
    atajo: {
      un_precio: "Un precio",
      media_y_racion: "½ y ración",
      mediana_y_grande: "Mediana y grande",
      por_unidad: "Por unidad",
      media_docena_y_docena: "½ docena y docena",
    },
    otraVariante: "+ Otra variante…",
    maximo: (n: number) => `Como mucho ${n} variantes.`,
    euro: "€",
    errores: {
      importe: "Escribe el precio con números, por ejemplo 3,75.",
      importeVacio: "Escribe el precio o marca «Según mercado».",
      texto: "Escribe el nombre de esta variante.",
      sinEtiqueta: "Con varios precios, cada uno necesita su etiqueta.",
      duplicado: "Esta etiqueta está repetida.",
    },
  },

  /** Etiquetas cortas para el resumen de precios en la lista («½ 2,25 € · Ración 3,75 €»). */
  formatosCortos: {
    media_racion: "½",
    racion_mediana: "Mediana",
    racion_grande: "Grande",
  } satisfies Partial<Record<FormatoPrecio, string>>,

  menus: {
    metaTitulo: "Menús del día",
    titulo: "Menús del día",
    intro: "El menú del día sale arriba de tu carta los días y horas que elijas.",
    nuevo: "+ Nuevo menú",
    vacioTitulo: "Todavía no tienes menú del día",
    vacioTexto: "Crea uno con sus primeros, segundos y postres. Puedes elegir qué días se ve.",
    vacioBoton: "Crear el menú del día",
    sinPrecio: "Sin precio",
    oculto: "Oculto",
    editar: (nombre: string) => `Editar ${nombre}`,
    guardado: (nombre: string) => `«${nombre}» guardado.`,
    borrado: "Menú borrado.",
    limite: (n: number) => `Puedes tener hasta ${n} menús.`,
  },

  menu: {
    metaNuevo: "Nuevo menú del día",
    metaEditar: "Editar menú del día",
    tituloNuevo: "Nuevo menú del día",
    tituloEditar: "Editar menú del día",
    volver: "Volver a los menús",
    noEncontrado: "Este menú no existe o ya se ha borrado.",
    nombre: "Nombre del menú",
    nombrePorDefecto: "Menú del día",
    precio: "Precio",
    precioAyuda: "Déjalo vacío si no quieres poner precio.",
    dias: "Días",
    diasAyuda: "Toca los días en que se sirve.",
    horario: "Horario",
    todoElDia: "Todo el día",
    deA: "De… a…",
    desde: "Desde",
    hasta: "Hasta",
    grupos: "Platos del menú",
    gruposPorDefecto: ["Primeros", "Segundos", "Postres"],
    tituloGrupo: (n: number) => `Nombre del grupo ${n}`,
    quitarGrupo: (titulo: string) => `Quitar el grupo «${titulo}»`,
    anadirGrupo: "+ Añadir grupo",
    nombreItem: (grupo: string, n: number) => `${grupo}: plato ${n}`,
    quitarItem: (nombre: string) => `Quitar ${nombre}`,
    anadirItem: (grupo: string) => `+ Añadir plato a «${grupo}»`,
    alergenosDe: (nombre: string) => `Alérgenos de ${nombre}`,
    confirmarItem: "He revisado los alérgenos",
    sinRevisar: "Alérgenos sin revisar",
    notas: "Notas",
    notasAyuda: "Por ejemplo «Incluye pan, bebida y postre o café».",
    visible: "Visible en la carta",
    borrar: "Borrar menú",
    borrarTitulo: (nombre: string) => `¿Borrar «${nombre}»?`,
    borrarTexto: "Esto no se puede deshacer.",
    errores: {
      precio: "Escribe el precio con números, por ejemplo 12,50.",
      dias: "Elige al menos un día.",
      horas: "Pon la hora de inicio y la de fin.",
      horasOrden: "La hora de fin tiene que ser más tarde que la de inicio.",
    },
  },

  alergenos: {
    grupo: "Alérgenos",
    trazas: "Trazas",
  },
} as const;

export type DiccionarioPanelCarta = typeof panelCartaEs;

/** Mensaje para un código de error de campo ("requerido", "demasiado_largo"…). */
export function textoCampo(codigo: string | undefined): string | undefined {
  if (!codigo) return undefined;
  return panelCartaEs.campos[codigo] ?? panelCartaEs.campos.formato;
}
