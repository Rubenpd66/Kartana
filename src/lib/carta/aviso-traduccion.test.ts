import { describe, expect, it } from "vitest";
import { mostrarAvisoTraduccion } from "./aviso-traduccion";
import { cartaPublicaEjemplo, platoPublicoEjemplo, traduccion } from "./pruebas/carta-ejemplo";

const conPlato = (traducciones: Parameters<typeof platoPublicoEjemplo>[2]) =>
  cartaPublicaEjemplo({
    secciones: [{ id: "s", nombre: "Tapas", descripcion: null, orden: 0, traducciones: {}, platos: [platoPublicoEjemplo("p", "Caña", traducciones)] }],
  });

describe("mostrarAvisoTraduccion", () => {
  it("nunca en español", () => {
    expect(mostrarAvisoTraduccion(conPlato({ traducciones: { en: { nombre: traduccion("Beer") } } }), "es")).toBe(false);
  });

  it("con algún texto automático a la vista -> sí", () => {
    expect(mostrarAvisoTraduccion(conPlato({ traducciones: { en: { nombre: traduccion("Beer") } } }), "en")).toBe(true);
  });

  it("si todos los textos traducidos son manuales -> no", () => {
    const carta = conPlato({ traducciones: { en: { nombre: traduccion("Beer", "manual") } } });
    carta.secciones[0].traducciones = { en: { nombre: traduccion("Tapas", "manual") } };
    expect(mostrarAvisoTraduccion(carta, "en")).toBe(false);
  });

  it("solo cuenta el idioma pedido", () => {
    expect(mostrarAvisoTraduccion(conPlato({ traducciones: { fr: { nombre: traduccion("Bière") } } }), "en")).toBe(false);
  });

  it("cuenta la descripción del local, los menús y la etiqueta libre de precio", () => {
    const local = cartaPublicaEjemplo({ local: { traducciones: { en: { descripcion: traduccion("Seafood") } } }, secciones: [] });
    expect(mostrarAvisoTraduccion(local, "en")).toBe(true);

    const precio = conPlato({
      precios: [{ id: "a", formato: "otro", texto: "Caña", centimos: 180 }],
      traducciones: { en: { "precio.a.texto": traduccion("Small beer") } },
    });
    expect(mostrarAvisoTraduccion(precio, "en")).toBe(true);

    const menu = cartaPublicaEjemplo({
      secciones: [],
      menus: [
        {
          id: "m",
          nombre: "Menú",
          precioCentimos: 1200,
          dias: [1],
          horaInicio: null,
          horaFin: null,
          grupos: [{ id: "g1", titulo: "Primeros", items: [{ id: "i1", nombre: "Sopa", alergenos: [], alergenosConfirmados: true }] }],
          notas: null,
          orden: 0,
          traducciones: { en: { "item.i1.nombre": traduccion("Soup") } },
        },
      ],
    });
    expect(mostrarAvisoTraduccion(menu, "en")).toBe(true);
  });

  it("no cuenta traducciones de textos que ya no están en la carta", () => {
    expect(mostrarAvisoTraduccion(conPlato({ traducciones: { en: { "precio.viejo.texto": traduccion("Old") } } }), "en")).toBe(false);
  });
});
