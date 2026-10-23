import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BRAVAS, GAMBA, PULPO, platoPublicoEjemplo, traduccion } from "@/lib/carta/pruebas/carta-ejemplo";
import { cartaEn } from "@/lib/i18n/carta.en";
import { cartaEs } from "@/lib/i18n/carta.es";
import { Precios } from "./Precios";
import { TarjetaPlato } from "./TarjetaPlato";

afterEach(cleanup);

const texto = (el: Element | null) => (el?.textContent ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();

describe("Precios", () => {
  it("una línea por variante con su etiqueta: patatas bravas", () => {
    const { container } = render(<Precios precios={BRAVAS.precios} diccionario={cartaEs} />);
    expect([...container.querySelectorAll("li")].map(texto)).toEqual(["½ ración 2,25 €", "Ración 3,75 €"]);
  });

  it("pulpo en ración mediana y grande; gamba por docena", () => {
    const { container, rerender } = render(<Precios precios={PULPO.precios} diccionario={cartaEs} />);
    expect([...container.querySelectorAll("li")].map(texto)).toEqual(["Ración mediana 10,00 €", "Ración grande 12,00 €"]);
    rerender(<Precios precios={GAMBA.precios} diccionario={cartaEs} />);
    expect([...container.querySelectorAll("li")].map(texto)).toEqual(["Docena 14,00 €"]);
  });

  it("único sin etiqueta, «otro» con su texto y sin precio «Según mercado»", () => {
    const { container } = render(
      <Precios
        diccionario={cartaEs}
        precios={[
          { id: "a", formato: "otro", texto: "Caña", centimos: 180 },
          { id: "b", formato: "jarra", texto: null, centimos: null },
        ]}
      />,
    );
    expect([...container.querySelectorAll("li")].map(texto)).toEqual(["Caña 1,80 €", "Jarra Según mercado"]);
    cleanup();
    const otro = render(<Precios diccionario={cartaEs} precios={[{ id: "a", formato: "unico", texto: null, centimos: 850 }]} />);
    expect([...otro.container.querySelectorAll("li")].map(texto)).toEqual(["8,50 €"]);
  });
});

describe("en inglés", () => {
  const PLATO_EN = {
    ...BRAVAS,
    precios: [
      { id: "v001", formato: "media_racion" as const, texto: null, centimos: 225 },
      { id: "v003", formato: "otro" as const, texto: "Caña", centimos: 180 },
    ],
    traducciones: { en: { nombre: traduccion("Spicy potatoes"), "precio.v003.texto": traduccion("Small beer") } },
  };

  it("muestra la traducción; sin traducción, el original con lang «es»", () => {
    const { container } = render(<TarjetaPlato plato={PLATO_EN} diccionario={cartaEn} idioma="en" />);
    const titulo = screen.getByRole("heading", { level: 3, name: "Spicy potatoes" });
    expect(titulo.getAttribute("lang")).toBeNull();
    const descripcion = container.querySelector(".descripcion")!;
    expect(descripcion.textContent).toBe("Patatas fritas con salsa brava y alioli.");
    expect(descripcion.getAttribute("lang")).toBe("es");
  });

  it("formatos del diccionario inglés, «otro» con su traducción, etiquetas y alérgenos en inglés", () => {
    const { container } = render(<TarjetaPlato plato={PLATO_EN} diccionario={cartaEn} idioma="en" />);
    expect([...container.querySelectorAll(".precios li")].map(texto)).toEqual(["Half portion €2.25", "Small beer €1.80"]);
    expect(screen.getByText("Vegetarian")).toBeTruthy();
    expect(screen.getByText("Eggs")).toBeTruthy();
  });

  it("«otro» sin traducción: original con lang «es»", () => {
    const { container } = render(
      <Precios precios={[{ id: "x", formato: "otro", texto: "Caña", centimos: 180 }]} diccionario={cartaEn} idioma="en" traducciones={{}} />,
    );
    const etiqueta = container.querySelector("li span")!;
    expect(etiqueta.textContent?.trim()).toBe("Caña");
    expect(etiqueta.getAttribute("lang")).toBe("es");
  });

  it("lleva data-plato-id para las estadísticas", () => {
    const { container } = render(<TarjetaPlato plato={PLATO_EN} diccionario={cartaEn} idioma="en" />);
    expect(container.querySelector("article")!.getAttribute("data-plato-id")).toBe(BRAVAS.id);
  });
});

describe("TarjetaPlato", () => {
  it("nombre como h3, descripción y etiquetas", () => {
    render(<TarjetaPlato plato={BRAVAS} diccionario={cartaEs} />);
    expect(screen.getByRole("heading", { level: 3, name: "Patatas bravas" })).toBeTruthy();
    expect(screen.getByText("Patatas fritas con salsa brava y alioli.")).toBeTruthy();
    expect(screen.getByText("Vegetariano")).toBeTruthy();
    expect(screen.getByText("Picante")).toBeTruthy();
  });

  it("alérgenos con su nombre (no solo el icono)", () => {
    render(<TarjetaPlato plato={GAMBA} diccionario={cartaEs} />);
    const lista = screen.getByRole("list", { name: "Contiene" });
    expect(within(lista).getByText("Crustáceos")).toBeTruthy();
    expect(screen.getByText("Puede contener trazas de: Moluscos")).toBeTruthy();
  });

  it("atributos data-* para el filtro", () => {
    const { container } = render(<TarjetaPlato plato={GAMBA} diccionario={cartaEs} />);
    const articulo = container.querySelector("article.plato")!;
    expect(articulo.getAttribute("data-alergenos")).toBe("crustaceos");
    expect(articulo.getAttribute("data-trazas")).toBe("moluscos");
    expect(articulo.getAttribute("data-confirmado")).toBe("si");
  });

  it("agotado: clase y insignia en texto", () => {
    const { container } = render(<TarjetaPlato plato={{ ...BRAVAS, agotado: true }} diccionario={cartaEs} />);
    expect(container.querySelector("article")!.classList.contains("agotado")).toBe(true);
    expect(screen.getByText("Agotado")).toBeTruthy();
  });

  it("sin confirmar: data-confirmado «no», aviso visible y etiqueta «sin información» para el filtro", () => {
    const plato = platoPublicoEjemplo("x", "Chipirones", { alergenosConfirmados: false });
    const { container } = render(<TarjetaPlato plato={plato} diccionario={cartaEs} />);
    expect(container.querySelector("article")!.getAttribute("data-confirmado")).toBe("no");
    expect(container.querySelector(".sin-info")?.textContent).toBe(cartaEs.textos.sinInformacionAlergenos);
    expect(screen.getByText(cartaEs.textos.avisoAlergenos)).toBeTruthy();
    expect(screen.queryByText(cartaEs.textos.sinAlergenosDeclarados)).toBeNull();
  });

  it("confirmado y sin alérgenos: «Sin alérgenos declarados»", () => {
    render(<TarjetaPlato plato={platoPublicoEjemplo("x", "Agua")} diccionario={cartaEs} />);
    expect(screen.getByText(cartaEs.textos.sinAlergenosDeclarados)).toBeTruthy();
    expect(screen.queryByText(cartaEs.textos.avisoAlergenos)).toBeNull();
  });

  it("foto con carga diferida y medidas", () => {
    const { container } = render(<TarjetaPlato plato={PULPO} diccionario={cartaEs} />);
    const img = container.querySelector("img")!;
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("decoding")).toBe("async");
    expect(img.getAttribute("width")).toBe("96");
    expect(img.getAttribute("height")).toBe("96");
    expect(img.getAttribute("alt")).toBe("");
  });
});
