import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { TextosPdf } from "@/lib/i18n/qr.es";
import { LINEA_CORTE, mm, QrPdf, recortar, registrarFuentes, TEXTO } from "./comun";

const LADO = 80;
const HUECO = 6;
// Centradas en la hoja: 2 columnas y 3 filas de 80 mm con 6 mm entre ellas.
const IZQUIERDA = (210 - (LADO * 2 + HUECO)) / 2;
const ARRIBA = (297 - (LADO * 3 + HUECO * 2)) / 2;

const estilos = StyleSheet.create({
  pagina: { backgroundColor: "#ffffff" },
  pegatina: {
    position: "absolute",
    width: mm(LADO),
    height: mm(LADO),
    borderWidth: 0.75,
    borderColor: LINEA_CORTE,
    borderStyle: "dashed",
    borderRadius: mm(8),
    alignItems: "center",
    justifyContent: "center",
  },
});

/** 6 pegatinas cuadradas de 80 × 80 mm con esquinas redondeadas y guía de corte. */
export function Pegatinas({ nombre, url, textos }: { nombre: string; url: string; textos: TextosPdf }): ReactElement {
  const f = registrarFuentes();
  return (
    <Document title={nombre} author="Kartana">
      <Page size="A4" style={estilos.pagina}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[estilos.pegatina, { left: mm(IZQUIERDA + (i % 2) * (LADO + HUECO)), top: mm(ARRIBA + Math.floor(i / 2) * (LADO + HUECO)) }]}
          >
            <QrPdf url={url} tamanoMm={50} />
            <Text style={{ fontFamily: f.cuerpo, fontWeight: 700, fontSize: 14, color: TEXTO, marginTop: mm(1) }}>{textos.carta}</Text>
            <Text style={{ fontFamily: f.cuerpo, fontSize: 9, color: TEXTO, marginTop: mm(0.5), textAlign: "center", paddingHorizontal: mm(6) }}>
              {recortar(nombre, 40)}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
