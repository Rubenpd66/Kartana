// Forma de los diccionarios de la carta pública (uno por idioma: src/lib/i18n/carta.<xx>.ts).
// Los escribe el carril de contenido; los usan la carta pública, el panel y los PDF. Solo tipos.

import type { CodigoAlergeno, CodigoEtiqueta, DiaSemana, FormatoPrecio } from "./dominio";

export type DiccionarioCarta = {
  /** Código BCP 47 para Intl y para el atributo lang: "es-ES", "en", "fr", "de", "ca", "eu", "gl". */
  locale: string;
  /** Nombres oficiales de los 14 alérgenos en este idioma (Reglamento UE 1169/2011 o fuente oficial regional). */
  alergenos: Record<CodigoAlergeno, string>;
  etiquetas: Record<CodigoEtiqueta, string>;
  /** Etiquetas de variantes de venta. "unico" y "otro" se dejan como cadena vacía ("otro" usa el texto del dueño). */
  formatos: Record<FormatoPrecio, string>;
  dias: Record<DiaSemana, string>;
  /** Abreviaturas de 1-3 letras para rangos («L–V»). */
  diasCortos: Record<DiaSemana, string>;
  textos: {
    /** Aviso fijo obligatorio: «Consulte al personal sobre alérgenos». */
    avisoAlergenos: string;
    filtrarAlergenos: string;
    /** Título del panel de filtro: «Ocultar platos que contengan:». */
    ocultarPlatosCon: string;
    incluirTrazas: string;
    quitarFiltro: string;
    /** Plato sin alérgenos confirmados cuando hay un filtro activo. */
    sinInformacionAlergenos: string;
    /** Plato con alérgenos confirmados y lista vacía. */
    sinAlergenosDeclarados: string;
    contiene: string;
    puedeContenerTrazas: string;
    agotado: string;
    /** Variante con precio null: «Según mercado». */
    segunMercado: string;
    menuDelDia: string;
    /** «{dias}, de {inicio} a {fin}». Marcadores literales {dias}, {inicio}, {fin}. */
    horarioMenu: string;
    todoElDia: string;
    horario: string;
    cerrado: string;
    secciones: string;
    idioma: string;
    /** Nota bajo textos sin traducir: «(texto original en español)». */
    textoOriginal: string;
    /** «Traducción automática»: se muestra en idiomas distintos del español. */
    traduccionAutomatica: string;
    /** Botón de reseña (v0.3): «¿Te ha gustado? Déjanos tu opinión en Google». */
    botonResena: string;
    /** Pie: «Información de alérgenos facilitada por el establecimiento». */
    responsabilidadAlergenos: string;
    /** Pie: «Carta digital con Kartana». */
    hechoCon: string;
    cartaNoDisponible: string;
    /** Banda de la carta de demostración (slug "demo"): «Carta de demostración: precios y alérgenos orientativos». */
    avisoDemo: string;
    llamar: string;
    comoLlegar: string;
  };
};
