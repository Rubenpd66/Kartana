import type {
  CartaPanel,
  CartaPublica,
  Local,
  LocalPublico,
  Menu,
  MenuPublico,
  Plato,
  PlatoPublico,
  Seccion,
  SeccionPublica,
} from "@/lib/tipos/carta";

const porOrden = <T extends { orden: number }>(a: T, b: T) => a.orden - b.orden;

export function aLocalPublico(local: Local, urlPublica: (ruta: string) => string): LocalPublico {
  return {
    id: local.id,
    slug: local.slug,
    nombre: local.nombre,
    descripcion: local.descripcion,
    direccion: local.direccion,
    telefono: local.telefono,
    colorMarca: local.colorMarca,
    horarios: local.horarios,
    idiomaBase: local.idiomaBase,
    idiomasActivos: local.idiomasActivos,
    traducciones: local.traducciones,
    permitirIndexar: local.permitirIndexar,
    actualizadoEn: local.actualizadoEn,
    logoUrl: local.logoRuta ? urlPublica(local.logoRuta) : null,
  };
}

export function aPlatoPublico(plato: Plato, urlPublica: (ruta: string) => string): PlatoPublico {
  return {
    id: plato.id,
    nombre: plato.nombre,
    descripcion: plato.descripcion,
    precios: plato.precios,
    alergenos: plato.alergenos,
    trazas: plato.trazas,
    alergenosConfirmados: plato.alergenosConfirmados,
    etiquetas: plato.etiquetas,
    orden: plato.orden,
    agotado: plato.agotado,
    traducciones: plato.traducciones,
    fotoUrl: plato.fotoRuta ? urlPublica(plato.fotoRuta) : null,
  };
}

export function aSeccionPublica(seccion: Seccion, platos: PlatoPublico[]): SeccionPublica {
  return {
    id: seccion.id,
    nombre: seccion.nombre,
    descripcion: seccion.descripcion,
    orden: seccion.orden,
    traducciones: seccion.traducciones,
    platos,
  };
}

export function aMenuPublico(menu: Menu): MenuPublico {
  return {
    id: menu.id,
    nombre: menu.nombre,
    precioCentimos: menu.precioCentimos,
    dias: menu.dias,
    horaInicio: menu.horaInicio,
    horaFin: menu.horaFin,
    grupos: menu.grupos,
    notas: menu.notas,
    orden: menu.orden,
    traducciones: menu.traducciones,
  };
}

/**
 * Carta del panel -> carta pública (la vista previa): solo lo visible, ordenado, sin secciones vacías,
 * con URLs absolutas de logo y fotos. No modifica la entrada.
 */
export function convertirACartaPublica(carta: CartaPanel, urlPublica: (ruta: string) => string): CartaPublica {
  const secciones = carta.secciones
    .filter((s) => s.visible)
    .sort(porOrden)
    .map((s) =>
      aSeccionPublica(
        s,
        s.platos
          .filter((p) => p.visible)
          .sort(porOrden)
          .map((p) => aPlatoPublico(p, urlPublica)),
      ),
    )
    .filter((s) => s.platos.length > 0);

  return {
    local: aLocalPublico(carta.local, urlPublica),
    secciones,
    menus: carta.menus
      .filter((m) => m.visible)
      .sort(porOrden)
      .map(aMenuPublico),
  };
}
