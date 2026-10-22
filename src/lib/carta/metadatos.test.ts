import { describe, expect, it } from "vitest";
import { metadatosCarta, metadatosCartaNoEncontrada } from "./metadatos";
import { cartaConPlatos, cartaPublicaEjemplo } from "./pruebas/carta-ejemplo";

describe("metadatosCarta", () => {
  it("título «Carta de {nombre}» sin la marca de Kartana", () => {
    const m = metadatosCarta(cartaPublicaEjemplo());
    expect(m.title).toEqual({ absolute: "Carta de Cafetería La Guagua" });
  });

  it("canónica /c/<slug>", () => {
    const m = metadatosCarta(cartaPublicaEjemplo({ local: { slug: "bar-pepe" } }));
    expect(m.alternates?.canonical).toBe("/c/bar-pepe");
  });

  it("descripción del local si la hay", () => {
    const m = metadatosCarta(cartaPublicaEjemplo());
    expect(m.description).toBe("Raciones, cazuelas y marisco de siempre");
  });

  it("sin descripción, usa los nombres de las secciones", () => {
    const m = metadatosCarta(cartaPublicaEjemplo({ local: { descripcion: null } }));
    expect(m.description).toBe("Carta de Cafetería La Guagua: Mariscos, Tapas y raciones.");
  });

  it("recorta descripciones muy largas", () => {
    const m = metadatosCarta(cartaPublicaEjemplo({ local: { descripcion: "a".repeat(300) } }));
    expect((m.description ?? "").length).toBeLessThanOrEqual(160);
  });

  it("4 platos -> noindex, follow", () => {
    expect(metadatosCarta(cartaConPlatos(4)).robots).toEqual({ index: false, follow: true });
  });

  it("5 platos y permitirIndexar -> index, follow", () => {
    expect(metadatosCarta(cartaConPlatos(5)).robots).toEqual({ index: true, follow: true });
  });

  it("permitirIndexar false -> noindex", () => {
    expect(metadatosCarta(cartaConPlatos(10, false)).robots).toEqual({ index: false, follow: true });
  });

  it("Open Graph con el nombre del local y la URL de la carta", () => {
    const m = metadatosCarta(cartaPublicaEjemplo());
    expect(m.openGraph).toMatchObject({
      title: "Carta de Cafetería La Guagua",
      siteName: "Cafetería La Guagua",
      url: "/c/la-guagua",
      type: "website",
      locale: "es_ES",
    });
  });

  it("la página de carta no encontrada no se indexa", () => {
    expect(metadatosCartaNoEncontrada().robots).toEqual({ index: false, follow: false });
  });
});
