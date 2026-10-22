import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CodigoAlergeno } from "@/lib/tipos/dominio";
import { IconoAlergeno } from "./IconoAlergeno";
import { CODIGOS_ALERGENO } from "./trazos";

afterEach(cleanup);

describe("IconoAlergeno", () => {
  it("con título es una imagen accesible con <title>", () => {
    render(<IconoAlergeno codigo="gluten" titulo="Cereales con gluten" />);
    const svg = screen.getByRole("img", { name: "Cereales con gluten" });
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.querySelector("title")?.textContent).toBe("Cereales con gluten");
    expect(svg.getAttribute("aria-hidden")).toBeNull();
  });

  it("sin título se oculta a los lectores de pantalla", () => {
    const { container } = render(<IconoAlergeno codigo="huevos" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("role")).toBeNull();
    expect(svg.querySelector("title")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("usa el lienzo 24×24, trazo de 1,75, un solo color y esquinas redondeadas", () => {
    const { container } = render(<IconoAlergeno codigo="pescado" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg.getAttribute("fill")).toBe("none");
    expect(svg.getAttribute("stroke")).toBe("currentColor");
    expect(svg.getAttribute("stroke-width")).toBe("1.75");
    expect(svg.getAttribute("stroke-linecap")).toBe("round");
    expect(svg.getAttribute("stroke-linejoin")).toBe("round");
  });

  it("mide 24 px por defecto y acepta otro tamaño", () => {
    const { container, rerender } = render(<IconoAlergeno codigo="soja" />);
    expect(container.querySelector("svg")!.getAttribute("width")).toBe("24");
    expect(container.querySelector("svg")!.getAttribute("height")).toBe("24");
    rerender(<IconoAlergeno codigo="soja" tamano={48} />);
    expect(container.querySelector("svg")!.getAttribute("width")).toBe("48");
    expect(container.querySelector("svg")!.getAttribute("height")).toBe("48");
  });

  it("deja pasar la clase", () => {
    const { container } = render(<IconoAlergeno codigo="apio" className="text-texto-suave" />);
    expect(container.querySelector("svg")!.getAttribute("class")).toBe("text-texto-suave");
  });

  it("dibuja algo para cada uno de los 14 alérgenos", () => {
    for (const codigo of CODIGOS_ALERGENO as readonly CodigoAlergeno[]) {
      const { container, unmount } = render(<IconoAlergeno codigo={codigo} />);
      expect(container.querySelectorAll("path").length, codigo).toBeGreaterThan(0);
      unmount();
    }
  });

  it("es un componente de servidor: sin «use client» ni estado", () => {
    const fuente = readFileSync(resolve(process.cwd(), "src/componentes/alergenos/IconoAlergeno.tsx"), "utf8");
    expect(fuente).not.toMatch(/["']use client["']/);
    expect(fuente).not.toMatch(/useState|useEffect|useRef/);
  });
});
