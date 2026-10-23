import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { TextosPdf } from "@/lib/i18n/qr.es";
import { colorTextoSobre } from "@/lib/dominio/contraste";
import { BLANCO, direccionCorta, LogoONombre, mm, QrPdf, registrarFuentes, TEXTO, type LogoPdf } from "./comun";

const estilos = StyleSheet.create({
  pagina: { backgroundColor: BLANCO, alignItems: "center" },
  banda: { width: "100%", height: mm(58), alignItems: "center", justifyContent: "center" },
  cajaLogo: { backgroundColor: BLANCO, borderRadius: mm(5), padding: mm(4) },
});

/** Póster A4 vertical: banda de color de marca con el logo, título, QR grande y dirección escrita. */
export function Poster({
  nombre,
  logo,
  colorMarca,
  url,
  textos,
}: {
  nombre: string;
  logo: LogoPdf | null;
  colorMarca: string;
  url: string;
  textos: TextosPdf;
}): ReactElement {
  const f = registrarFuentes();
  const sobreMarca = colorTextoSobre(colorMarca);
  return (
    <Document title={nombre} author="Kartana">
      <Page size="A4" style={estilos.pagina}>
        <View style={[estilos.banda, { backgroundColor: colorMarca }]}>
          {logo ? (
            <View style={estilos.cajaLogo}>
              <LogoONombre logo={logo} nombre={nombre} anchoMm={110} altoMm={34} tamanoLetra={30} />
            </View>
          ) : (
            <LogoONombre logo={null} nombre={nombre} anchoMm={170} altoMm={40} tamanoLetra={36} color={sobreMarca} />
          )}
        </View>
        <Text style={{ fontFamily: f.titulo, fontSize: 42, color: TEXTO, marginTop: mm(12), marginBottom: mm(8) }}>{textos.tituloPoster}</Text>
        <QrPdf url={url} tamanoMm={120} />
        <Text style={{ fontFamily: f.cuerpo, fontWeight: 700, fontSize: 20, color: TEXTO, marginTop: mm(8) }}>{textos.apuntaPoster}</Text>
        <Text style={{ fontFamily: f.cuerpo, fontSize: 14, color: TEXTO, marginTop: mm(4) }}>{direccionCorta(url)}</Text>
      </Page>
    </Document>
  );
}
