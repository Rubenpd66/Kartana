import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cartaDemoPublica, cartaPublicaEjemplo } from "@/lib/carta/pruebas/carta-ejemplo";
import { ALERGENOS } from "@/lib/dominio/alergenos";
import { cartaEs } from "@/lib/i18n/carta.es";
import { CartaVista } from "./CartaVista";

afterEach(cleanup);

const texto = (el: Element | null) => (el?.textContent ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();

describe("CartaVista con la carta de demostración", () => {
  it("un solo h1 con el nombre, h2 por sección y menú, banda de ejemplo y aviso fijo", () => {
    const carta = cartaDemoPublica();
    render(<CartaVista carta={carta} idioma="es" diccionario={cartaEs} modo="publica" />);
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0].textContent).toBe("Cafetería La Guagua");
    const h2 = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2).toEqual(["Menú del día", ...carta.secciones.map((s) => s.nombre)]);
    expect(screen.getByText(cartaEs.textos.avisoDemo)).toBeTruthy();
    expect(screen.getAllByText(cartaEs.textos.avisoAlergenos).some((el) => el.classList.contains("aviso-fijo"))).toBe(true);
  });

  it("color del bar y color del texto encima como variables en línea", () => {
    const { container } = render(<CartaVista carta={cartaDemoPublica()} idioma="es" diccionario={cartaEs} modo="publica" />);
    const raiz = container.querySelector<HTMLElement>(".carta")!;
    expect(raiz.style.getPropertyValue("--marca")).toBe("#a63d12");
    expect(raiz.style.getPropertyValue("--sobre-marca")).toBe("#ffffff");
    expect(raiz.getAttribute("lang")).toBe("es");
  });

  it("navegación con anclas a cada sección", () => {
    const carta = cartaDemoPublica();
    render(<CartaVista carta={carta} idioma="es" diccionario={cartaEs} modo="publica" />);
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    const enlaces = within(nav).getAllByRole("link");
    expect(enlaces).toHaveLength(carta.secciones.length + 1);
    expect(enlaces[1].getAttribute("href")).toBe(`#seccion-${carta.secciones[0].id}`);
    expect(document.getElementById(`seccion-${carta.secciones[0].id}`)).not.toBeNull();
  });

  it("filtro con las 14 casillas, trazas y botón de quitar (reset)", () => {
    const { container } = render(<CartaVista carta={cartaDemoPublica()} idioma="es" diccionario={cartaEs} modo="publica" />);
    const filtro = screen.getByRole("form", { name: cartaEs.textos.filtrarAlergenos });
    for (const c of ALERGENOS) {
      expect(within(filtro).getByRole("checkbox", { name: cartaEs.alergenos[c] }).id).toBe(`f-${c}`);
    }
    expect(within(filtro).getByRole("checkbox", { name: cartaEs.textos.incluirTrazas }).id).toBe("f-trazas");
    expect(within(filtro).getByRole("button", { name: cartaEs.textos.quitarFiltro }).getAttribute("type")).toBe("reset");
    expect(container.querySelector(".carta .filtro")).not.toBeNull();
  });

  it("menú del día con precio, días y grupos", () => {
    render(<CartaVista carta={cartaDemoPublica()} idioma="es" diccionario={cartaEs} modo="publica" />);
    const menu = screen.getByRole("region", { name: "Menú del día" });
    expect(texto(menu)).toContain("12,50 €");
    expect(texto(menu)).toContain("Lunes a Viernes, de 13:00 a 16:00");
    expect(within(menu).getByRole("heading", { level: 3, name: "Primeros" })).toBeTruthy();
    expect(texto(menu)).toContain("Incluye pan, bebida y postre o café");
  });

  it("pie con la responsabilidad de alérgenos y enlace a Kartana", () => {
    render(<CartaVista carta={cartaDemoPublica()} idioma="es" diccionario={cartaEs} modo="publica" />);
    expect(screen.getByText(cartaEs.textos.responsabilidadAlergenos)).toBeTruthy();
    expect(screen.getByRole("link", { name: cartaEs.textos.hechoCon }).getAttribute("href")).toBe("/");
  });
});

describe("CartaVista con una carta normal", () => {
  it("sin banda de ejemplo y con teléfono, mapa y horario", () => {
    render(<CartaVista carta={cartaPublicaEjemplo()} idioma="es" diccionario={cartaEs} modo="publica" />);
    expect(screen.queryByText(cartaEs.textos.avisoDemo)).toBeNull();
    expect(screen.getByRole("link", { name: /Llamar/ }).getAttribute("href")).toBe("tel:926000000");
    expect(screen.getByRole("link", { name: /Cómo llegar/ }).getAttribute("href")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Calle%20Mayor%201%2C%20Ciudad%20Real",
    );
    const horario = screen.getByText("Horario").closest("details")!;
    expect(texto(horario)).toContain("L–M");
    expect(texto(horario)).toContain("08:00–16:30");
  });

  it("estado vacío sin secciones ni menús (y sin filtro)", () => {
    render(<CartaVista carta={cartaPublicaEjemplo({ secciones: [], menus: [] })} idioma="es" diccionario={cartaEs} modo="vista_previa" />);
    expect(screen.getByText(cartaEs.textos.cartaNoDisponible)).toBeTruthy();
    expect(screen.queryByRole("form")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("marca el modo para los estilos de la vista previa", () => {
    const { container } = render(<CartaVista carta={cartaPublicaEjemplo()} idioma="es" diccionario={cartaEs} modo="vista_previa" />);
    expect(container.querySelector(".carta")!.getAttribute("data-modo")).toBe("vista_previa");
  });
});

describe("sin JavaScript propio", () => {
  it("ningún componente de la carta es de cliente", () => {
    const carpeta = __dirname;
    const archivos = readdirSync(carpeta).filter((a) => a.endsWith(".tsx") && !a.endsWith(".test.tsx"));
    expect(archivos.length).toBeGreaterThan(5);
    for (const a of archivos) {
      expect(readFileSync(path.join(carpeta, a), "utf8"), a).not.toMatch(/["']use client["']/);
    }
  });
});
