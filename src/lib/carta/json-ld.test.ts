import { describe, expect, it } from "vitest";
import { cartaEs } from "@/lib/i18n/carta.es";
import { jsonLdCarta, serializarJsonLd } from "./json-ld";
import { BRAVAS, cartaPublicaEjemplo, platoPublicoEjemplo } from "./pruebas/carta-ejemplo";

const URL_CARTA = "https://kartana.test/c/la-guagua";

describe("jsonLdCarta", () => {
  const datos = jsonLdCarta(cartaPublicaEjemplo(), cartaEs, URL_CARTA);

  it("es un Restaurant con nombre, dirección, teléfono y url", () => {
    expect(datos).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: "Cafetería La Guagua",
      address: "Calle Mayor 1, Ciudad Real",
      telephone: "926 000 000",
      url: URL_CARTA,
    });
  });

  it("agrupa los horarios con la misma franja", () => {
    expect(datos.openingHoursSpecification).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["https://schema.org/Monday", "https://schema.org/Tuesday"],
        opens: "08:00",
        closes: "16:30",
      },
    ]);
  });

  it("carta -> secciones -> platos con una oferta por variante de precio", () => {
    const menu = datos.hasMenu;
    expect(menu["@type"]).toBe("Menu");
    expect(menu.hasMenuSection.map((s) => s.name)).toEqual(["Mariscos", "Tapas y raciones"]);
    const bravas = menu.hasMenuSection[1].hasMenuItem[0];
    expect(bravas).toMatchObject({
      "@type": "MenuItem",
      name: "Patatas bravas",
      description: "Patatas fritas con salsa brava y alioli.",
    });
    expect(bravas.offers).toEqual([
      { "@type": "Offer", name: "½ ración", price: "2.25", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Ración", price: "3.75", priceCurrency: "EUR" },
    ]);
  });

  it("suitableForDiet para vegano, vegetariano y sin gluten", () => {
    expect(datos.hasMenu.hasMenuSection[1].hasMenuItem[0].suitableForDiet).toEqual(["https://schema.org/VegetarianDiet"]);
    const plato = platoPublicoEjemplo("x", "Ensalada", { etiquetas: ["vegano", "sin_gluten", "picante"] });
    const otra = jsonLdCarta(
      cartaPublicaEjemplo({ secciones: [{ id: "s", nombre: "S", descripcion: null, orden: 0, traducciones: {}, platos: [plato] }] }),
      cartaEs,
      URL_CARTA,
    );
    expect(otra.hasMenu.hasMenuSection[0].hasMenuItem[0].suitableForDiet).toEqual([
      "https://schema.org/VeganDiet",
      "https://schema.org/GlutenFreeDiet",
    ]);
  });

  it("precio único sin nombre, «otro» con su texto, sin precio sin oferta y agotado como SoldOut", () => {
    const plato = platoPublicoEjemplo("x", "Cerveza", {
      agotado: true,
      precios: [
        { id: "a", formato: "otro", texto: "Caña", centimos: 180 },
        { id: "b", formato: "jarra", texto: null, centimos: null },
      ],
    });
    const unico = platoPublicoEjemplo("y", "Agua", { descripcion: null });
    const otra = jsonLdCarta(
      cartaPublicaEjemplo({ secciones: [{ id: "s", nombre: "S", descripcion: null, orden: 0, traducciones: {}, platos: [plato, unico] }] }),
      cartaEs,
      URL_CARTA,
    );
    const [cerveza, agua] = otra.hasMenu.hasMenuSection[0].hasMenuItem;
    expect(cerveza.offers).toEqual([
      { "@type": "Offer", name: "Caña", price: "1.80", priceCurrency: "EUR", availability: "https://schema.org/SoldOut" },
    ]);
    expect(agua.offers).toEqual([{ "@type": "Offer", price: "5.00", priceCurrency: "EUR" }]);
    expect(agua).not.toHaveProperty("description");
    expect(agua).not.toHaveProperty("suitableForDiet");
  });

  it("omite dirección, teléfono, horario y logo si no hay", () => {
    const otra = jsonLdCarta(
      cartaPublicaEjemplo({ local: { direccion: null, telefono: null, horarios: [], logoUrl: null } }),
      cartaEs,
      URL_CARTA,
    );
    expect(otra).not.toHaveProperty("address");
    expect(otra).not.toHaveProperty("telephone");
    expect(otra).not.toHaveProperty("openingHoursSpecification");
    expect(otra).not.toHaveProperty("image");
    expect(BRAVAS.nombre).toBe("Patatas bravas");
  });
});

describe("serializarJsonLd", () => {
  it("escapa < para que nadie pueda cerrar el <script>", () => {
    const texto = serializarJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(texto).not.toContain("<");
    expect(texto).toContain("\\u003c/script>");
    expect(JSON.parse(texto)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
