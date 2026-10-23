import path from "node:path";
import { existsSync } from "node:fs";
import { Font, Image, Path, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { crearMatriz, MARGEN_MODULOS, trazadoQr } from "../matriz";

// Piezas comunes de las plantillas PDF. Genéricas: la URL y los textos entran por parámetro
// (las reutilizará el carril qr-resena con sus propias plantillas).

/** Milímetros a puntos (unidad del PDF). */
export const mm = (valor: number): number => (valor * 72) / 25.4;

export const NEGRO = "#000000";
export const BLANCO = "#ffffff";
export const TEXTO = "#1f1a17";
export const GRIS = "#6b625c";
export const LINEA_CORTE = "#9a918a";

export type LogoPdf = { datos: Buffer; formato: "png" | "jpg" };

export type FamiliasPdf = { cuerpo: string; titulo: string };

let familias: FamiliasPdf | null = null;

/**
 * Registra Figtree y Fraunces (TTF estáticos en `fuentes/`, licencia SIL OFL). Si no se encuentran
 * los archivos (p. ej. no viajan en el despliegue), cae a Helvetica/Times, que vienen con la librería.
 * Se hace una sola vez por proceso.
 */
export function registrarFuentes(): FamiliasPdf {
  if (familias) return familias;
  Font.registerHyphenationCallback((palabra) => [palabra]);
  const carpeta = path.join(process.cwd(), "src", "lib", "qr", "fuentes");
  const f = (nombre: string) => path.join(carpeta, nombre);
  if (["Figtree-Regular.ttf", "Figtree-Bold.ttf", "Fraunces-SemiBold.ttf"].every((n) => existsSync(f(n)))) {
    Font.register({
      family: "Figtree",
      fonts: [
        { src: f("Figtree-Regular.ttf"), fontWeight: 400 },
        { src: f("Figtree-Bold.ttf"), fontWeight: 700 },
      ],
    });
    Font.register({ family: "Fraunces", src: f("Fraunces-SemiBold.ttf"), fontWeight: 600 });
    familias = { cuerpo: "Figtree", titulo: "Fraunces" };
  } else {
    familias = { cuerpo: "Helvetica", titulo: "Times-Roman" };
  }
  return familias;
}

/** Acorta con «…» un texto demasiado largo para su hueco. */
export function recortar(texto: string, maximo: number): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length <= maximo ? limpio : `${limpio.slice(0, Math.max(1, maximo - 1)).trimEnd()}…`;
}

/** Dirección corta para escribirla a mano o leerla: sin «https://». */
export function direccionCorta(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/**
 * QR como vectores: siempre negro sobre blanco, con zona tranquila de 4 módulos incluida
 * en `tamanoMm`. Nunca lleva logo dentro (se lee peor).
 */
export function QrPdf({ url, tamanoMm }: { url: string; tamanoMm: number }): ReactElement {
  const matriz = crearMatriz(url);
  const lado = matriz.tamano + MARGEN_MODULOS * 2;
  return (
    <Svg viewBox={`0 0 ${lado} ${lado}`} style={{ width: mm(tamanoMm), height: mm(tamanoMm) }}>
      <Rect x={0} y={0} width={lado} height={lado} fill={BLANCO} />
      <Path d={trazadoQr(matriz, MARGEN_MODULOS)} fill={NEGRO} />
    </Svg>
  );
}

const estilos = StyleSheet.create({
  caja: { alignItems: "center", justifyContent: "center" },
});

/**
 * Logo del local o, si no hay, su nombre en la letra de títulos.
 * Cabe en `anchoMm` × `altoMm` sin deformarse.
 */
export function LogoONombre({
  logo,
  nombre,
  anchoMm,
  altoMm,
  tamanoLetra,
  color = TEXTO,
}: {
  logo: LogoPdf | null;
  nombre: string;
  anchoMm: number;
  altoMm: number;
  tamanoLetra: number;
  color?: string;
}): ReactElement {
  const fuentes = registrarFuentes();
  const letra = nombre.length > 28 ? tamanoLetra * 0.75 : nombre.length > 18 ? tamanoLetra * 0.88 : tamanoLetra;
  return (
    <View style={[estilos.caja, { width: mm(anchoMm), height: mm(altoMm) }]}>
      {logo ? (
        <Image
          src={{ data: logo.datos, format: logo.formato }}
          style={{ maxWidth: mm(anchoMm), maxHeight: mm(altoMm), objectFit: "contain" }}
        />
      ) : (
        <Text style={{ fontFamily: fuentes.titulo, fontSize: letra, color, textAlign: "center", lineHeight: 1.15 }}>
          {recortar(nombre, 48)}
        </Text>
      )}
    </View>
  );
}
