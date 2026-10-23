// Cálculo puro del gráfico de barras de visitas (el SVG se dibuja en el servidor, sin JS ni librerías).

export type DiaGrafico = { dia: string; visitas: number };
export type Barra = { dia: string; visitas: number; x: number; y: number; ancho: number; alto: number };
export type Etiqueta = { x: number; texto: string };
export type MarcaY = { valor: number; y: number };

export type Grafico = {
  ancho: number;
  alto: number;
  /** Alto del área de barras (sin las etiquetas de abajo). */
  altoUtil: number;
  margenIzq: number;
  maximo: number;
  barras: Barra[];
  etiquetas: Etiqueta[];
  marcasY: MarcaY[];
  hayDatos: boolean;
};

const ANCHO = 640;
const ALTO = 240;
const ALTO_UTIL = 200;
const MARGEN_IZQ = 36;
const ALTO_MINIMO = 2;
const MAX_ETIQUETAS = 7;

/** Máximo del eje: múltiplo de 4 que cubre el valor, para que las 3 marcas (0, mitad, máx) sean enteras. */
export function escalaMaxima(maximo: number): number {
  if (maximo <= 4) return 4;
  const paso = maximo > 40 ? 20 : 4;
  return Math.ceil(maximo / paso) * paso;
}

function etiquetaDia(dia: string): string {
  const [, mes, d] = dia.split("-");
  return `${Number(d)}/${Number(mes)}`;
}

export function calcularGrafico(dias: DiaGrafico[]): Grafico {
  const maximo = escalaMaxima(Math.max(0, ...dias.map((d) => d.visitas)));
  const util = ANCHO - MARGEN_IZQ;
  const hueco = dias.length > 0 ? util / dias.length : 0;
  const ancho = hueco * 0.7;
  const barras: Barra[] = dias.map((d, i) => {
    const alto = d.visitas > 0 ? Math.max(ALTO_MINIMO, (d.visitas / maximo) * ALTO_UTIL) : 0;
    return { dia: d.dia, visitas: d.visitas, x: MARGEN_IZQ + i * hueco + (hueco - ancho) / 2, y: ALTO_UTIL - alto, ancho, alto };
  });
  const cada = Math.max(1, Math.ceil(dias.length / MAX_ETIQUETAS));
  const etiquetas: Etiqueta[] = barras
    .map((b, i) => ({ b, i }))
    .filter(({ i }) => i % cada === 0)
    .map(({ b }) => ({ x: b.x + b.ancho / 2, texto: etiquetaDia(b.dia) }));
  const marcasY: MarcaY[] = [0, maximo / 2, maximo].map((valor) => ({ valor, y: ALTO_UTIL - (valor / maximo) * ALTO_UTIL }));
  return {
    ancho: ANCHO,
    alto: ALTO,
    altoUtil: ALTO_UTIL,
    margenIzq: MARGEN_IZQ,
    maximo,
    barras,
    etiquetas,
    marcasY,
    hayDatos: dias.some((d) => d.visitas > 0),
  };
}
