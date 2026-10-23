import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { TextosPdf } from "@/lib/i18n/qr.es";
import { direccionCorta, GRIS, LINEA_CORTE, LogoONombre, mm, QrPdf, registrarFuentes, TEXTO, type LogoPdf } from "./comun";

const ANCHO = 105;
const ALTO = 148;

const estilos = StyleSheet.create({
  pagina: { backgroundColor: "#ffffff" },
  celda: { position: "absolute", width: mm(ANCHO), height: mm(ALTO), alignItems: "center", paddingTop: mm(9) },
  corteV: { position: "absolute", left: mm(ANCHO), top: 0, height: mm(ALTO * 2), borderLeftWidth: 0.75, borderLeftColor: LINEA_CORTE, borderLeftStyle: "dashed" },
  corteH: { position: "absolute", top: mm(ALTO), left: 0, width: mm(ANCHO * 2), borderTopWidth: 0.75, borderTopColor: LINEA_CORTE, borderTopStyle: "dashed" },
});

/** 4 cartelitos A6 por hoja A4, con líneas de corte discontinuas. */
export function Mesa({ nombre, logo, url, textos }: { nombre: string; logo: LogoPdf | null; url: string; textos: TextosPdf }): ReactElement {
  const f = registrarFuentes();
  const celdas = [0, 1, 2, 3];
  return (
    <Document title={nombre} author="Kartana">
      <Page size="A4" style={estilos.pagina}>
        {celdas.map((i) => (
          <View key={i} style={[estilos.celda, { left: mm((i % 2) * ANCHO), top: mm(Math.floor(i / 2) * ALTO) }]}>
            <LogoONombre logo={logo} nombre={nombre} anchoMm={80} altoMm={22} tamanoLetra={20} />
            <Text style={{ fontFamily: f.cuerpo, fontWeight: 700, fontSize: 15, color: TEXTO, marginTop: mm(5), marginBottom: mm(3) }}>
              {textos.escaneaMesa}
            </Text>
            <QrPdf url={url} tamanoMm={55} />
            <Text style={{ fontFamily: f.cuerpo, fontSize: 9, color: TEXTO, marginTop: mm(3) }}>{direccionCorta(url)}</Text>
            <Text style={{ fontFamily: f.cuerpo, fontSize: 8, color: GRIS, marginTop: mm(6) }}>{textos.alergenos}</Text>
          </View>
        ))}
        <View style={estilos.corteV} fixed />
        <View style={estilos.corteH} fixed />
      </Page>
    </Document>
  );
}
