// Reduce imágenes en el navegador antes de subirlas (fotos WebP 1200 px, logos PNG 512 px).
// Solo navegador: usa createImageBitmap y canvas.

type Dimensiones = { ancho: number; alto: number };

/** Medidas de salida: el lado más largo queda en `ladoMax` como mucho, sin agrandar nunca. */
export function calcularDimensiones(ancho: number, alto: number, ladoMax: number): Dimensiones {
  if (!(ancho > 0 && alto > 0 && ladoMax > 0)) throw new Error("dimensiones_invalidas");
  const escala = Math.min(1, ladoMax / Math.max(ancho, alto));
  return { ancho: Math.max(1, Math.round(ancho * escala)), alto: Math.max(1, Math.round(alto * escala)) };
}

type Lienzo = {
  dibujar: (imagen: CanvasImageSource, d: Dimensiones) => void;
  exportar: (tipo: string, calidad?: number) => Promise<Blob | null>;
};

function crearLienzo(d: Dimensiones): Lienzo {
  if (typeof OffscreenCanvas !== "undefined") {
    const lienzo = new OffscreenCanvas(d.ancho, d.alto);
    const ctx = lienzo.getContext("2d");
    if (!ctx) throw new Error("sin_lienzo");
    return {
      dibujar: (img) => ctx.drawImage(img, 0, 0, d.ancho, d.alto),
      exportar: (type, quality) => lienzo.convertToBlob({ type, quality }),
    };
  }
  const lienzo = document.createElement("canvas");
  lienzo.width = d.ancho;
  lienzo.height = d.alto;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("sin_lienzo");
  return {
    dibujar: (img) => ctx.drawImage(img, 0, 0, d.ancho, d.alto),
    exportar: (type, quality) => new Promise((ok) => lienzo.toBlob(ok, type, quality)),
  };
}

const TIPOS_ENTRADA = /^image\/(jpeg|png|webp|gif|avif|heic|heif|bmp)$/;

/**
 * Reduce `archivo` a `ladoMax` px por el lado largo y lo exporta como `tipo`.
 * Si el navegador no sabe codificar WebP (Safari antiguo), devuelve JPEG: mira `blob.type`.
 * Lanza Error("no_es_imagen") si el archivo no es una imagen admitida (SVG no se admite).
 */
export async function reducirImagen(
  archivo: File,
  opciones: { ladoMax: number; tipo: "image/webp" | "image/png"; calidad?: number },
): Promise<Blob> {
  if (!TIPOS_ENTRADA.test(archivo.type)) throw new Error("no_es_imagen");

  let mapa: ImageBitmap;
  try {
    mapa = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  } catch {
    throw new Error("no_es_imagen");
  }

  try {
    const d = calcularDimensiones(mapa.width, mapa.height, opciones.ladoMax);
    const lienzo = crearLienzo(d);
    lienzo.dibujar(mapa, d);
    const blob = await lienzo.exportar(opciones.tipo, opciones.calidad);
    if (blob && blob.type === opciones.tipo) return blob;
    if (opciones.tipo === "image/webp") {
      const jpeg = await lienzo.exportar("image/jpeg", opciones.calidad);
      if (jpeg) return jpeg;
    }
    if (blob) return blob;
    throw new Error("no_es_imagen");
  } finally {
    mapa.close();
  }
}
