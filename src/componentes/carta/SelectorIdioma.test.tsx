import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cartaEn } from "@/lib/i18n/carta.en";
import { cartaEs } from "@/lib/i18n/carta.es";
import { SelectorIdioma } from "./SelectorIdioma";

afterEach(cleanup);

describe("SelectorIdioma", () => {
  it("un enlace por idioma activo, en el orden de la carta, con su nombre, hreflang y lang", () => {
    const { container } = render(
      <SelectorIdioma slug="demo" idiomasActivos={["fr", "es", "en"]} idioma="es" diccionario={cartaEs} modo="publica" />,
    );
    const lista = container.querySelector("details ul")!;
    const enlaces = within(lista as HTMLElement).getAllByRole("link");
    expect(enlaces.map((a) => [a.textContent, a.getAttribute("href"), a.getAttribute("hreflang"), a.getAttribute("lang")])).toEqual([
      ["Español", "/c/demo", "es", "es"],
      ["English", "/c/demo/en", "en", "en"],
      ["Français", "/c/demo/fr", "fr", "fr"],
    ]);
  });

  it("el idioma actual lleva aria-current y sale en el resumen", () => {
    const { container } = render(
      <SelectorIdioma slug="demo" idiomasActivos={["es", "en"]} idioma="en" diccionario={cartaEn} modo="publica" />,
    );
    expect(screen.getByRole("link", { name: "English" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Español" }).getAttribute("aria-current")).toBeNull();
    expect(container.querySelector("summary")!.textContent).toContain("English");
    expect(container.querySelector("summary")!.textContent).toContain(cartaEn.textos.idioma);
  });

  it("oculto con un solo idioma activo", () => {
    const { container } = render(<SelectorIdioma slug="demo" idiomasActivos={["es"]} idioma="es" diccionario={cartaEs} modo="publica" />);
    expect(container.innerHTML).toBe("");
  });

  it("en la vista previa, los enlaces cambian ?idioma= en la misma página", () => {
    render(<SelectorIdioma slug="demo" idiomasActivos={["es", "de"]} idioma="es" diccionario={cartaEs} modo="vista_previa" />);
    expect(screen.getByRole("link", { name: "Deutsch" }).getAttribute("href")).toBe("?idioma=de");
    expect(screen.getByRole("link", { name: "Español" }).getAttribute("href")).toBe("?idioma=es");
  });

  it("ignora idiomas que no son de la carta", () => {
    render(<SelectorIdioma slug="demo" idiomasActivos={["es", "xx" as "en", "en"]} idioma="es" diccionario={cartaEs} modo="publica" />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
