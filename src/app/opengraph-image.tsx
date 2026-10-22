import { ImageResponse } from "next/og";
import { SITIO } from "@/lib/config/sitio";

export const alt = `${SITIO.nombre} · Carta digital con QR para bares`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ImagenParaRedes() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#fbf7f1",
          color: "#1f1a17",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, color: "#b9461a" }}>{SITIO.nombre}</div>
        <div style={{ fontSize: 44, marginTop: 24, maxWidth: 900 }}>{SITIO.lema}</div>
      </div>
    ),
    size,
  );
}
