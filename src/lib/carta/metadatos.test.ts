import { describe, expect, it } from "vitest";
import { metadatosCarta, metadatosCartaNoEncontrada } from "./metadatos";
import { cartaConPlatos, cartaConTraducidos, cartaPublicaEjemplo, traduccion } from "./pruebas/carta-ejemplo";

describe("metadatosCarta por idioma", () => {
  it("canónica a sí misma en cada idioma", () => {
    const carta = cartaConTraducidos(10, 10);
    expect(metadatosCarta(carta, "en").alternates?.canonical).toBe("/c/la-guagua/en");
    expect(metadatosCarta(carta, "es").alternates?.canonical).toBe("/c/la-guagua");
  });

  it("hreflang: solo idiomas activos e indexables, más x-default a la española", () => {
    const carta = cartaConTraducidos(10, 10);
    carta.local.idiomasActivos = ["es", "en", "fr"];
    carta.secciones[0].platos = carta.secciones[0].platos.map((p) => ({
      ...p,
      traducciones: { ...p.traducciones, de: { nombre: traduccion("Gericht") } },
    }));
    // de está traducido pero no activo; fr está activo pero sin traducir: ninguno sale.
    expect(metadatosCarta(carta, "en").alternates?.languages).toEqual({
      es: "/c/la-guagua",
      en: "/c/la-guagua/en",
      "x-default": "/c/la-guagua",
    });
  });

  it("89 % traducido -> noindex, follow y fuera del hreflang", () => {
    const m = metadatosCarta(cartaConTraducidos(100, 89), "en");
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.alternates?.languages).toEqual({ es: "/c/la-guagua", "x-default": "/c/la-guagua" });
  });

  it("90 % traducido -> index", () => {
    expect(metadatosCarta(cartaConTraducidos(10, 9), "en").robots).toEqual({ index: true, follow: true });
  });

  it("carta no indexable: solo x-default", () => {
    expect(metadatosCarta(cartaConTraducidos(10, 10, false), "en").alternates?.languages).toEqual({
      "x-default": "/c/la-guagua",
    });
  });

  it("descripción traducida y locale de Open Graph del idioma", () => {
    const carta = cartaConTraducidos(10, 10);
    carta.local.traducciones = { en: { descripcion: traduccion("Seafood and tapas") } };
    const m = metadatosCarta(carta, "en");
    expect(m.description).toBe("Seafood and tapas");
    expect(m.openGraph).toMatchObject({ locale: "en_GB", url: "/c/la-guagua/en" });
  });
});

describe("metadatosCarta", () => {
  it("el título lleva la palabra «carta» del idioma de la página", () => {
    const c = cartaPublicaEjemplo();
    expect(metadatosCarta(c, "en").title).toEqual({ absolute: "Cafetería La Guagua – Menu" });
    expect(metadatosCarta(c, "fr").title).toEqual({ absolute: "Carte de Cafetería La Guagua" });
    expect(metadatosCarta(c, "de").title).toEqual({ absolute: "Speisekarte von Cafetería La Guagua" });
    expect(metadatosCarta(c, "ca").title).toEqual({ absolute: "Carta de Cafetería La Guagua" });
  });

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
