import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SelectorAlergenos } from "./SelectorAlergenos";
import { SelectorEtiquetas } from "./SelectorEtiquetas";

afterEach(cleanup);

const enviado = (container: HTMLElement, nombre: string) =>
  new FormData(container.querySelector("form") as HTMLFormElement).getAll(nombre);

describe("SelectorAlergenos", () => {
  it("muestra los 14 alérgenos con su nombre oficial", () => {
    render(<SelectorAlergenos etiqueta="Alérgenos" name="alergenos" inicial={[]} />);
    const grupo = screen.getByRole("group", { name: "Alérgenos" });
    expect(grupo.querySelectorAll("button")).toHaveLength(14);
    expect(screen.getByRole("button", { name: "Cereales con gluten" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dióxido de azufre y sulfitos" })).toBeTruthy();
  });

  it("alterna aria-pressed y envía los códigos en el formulario, en el orden oficial", () => {
    const { container } = render(
      <form>
        <SelectorAlergenos etiqueta="Alérgenos" name="alergenos" inicial={["huevos"]} />
      </form>,
    );
    const huevos = screen.getByRole("button", { name: "Huevos" });
    const gluten = screen.getByRole("button", { name: "Cereales con gluten" });
    expect(huevos.getAttribute("aria-pressed")).toBe("true");
    expect(gluten.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(gluten);
    expect(gluten.getAttribute("aria-pressed")).toBe("true");
    expect(enviado(container, "alergenos")).toEqual(["gluten", "huevos"]);

    fireEvent.click(huevos);
    expect(huevos.getAttribute("aria-pressed")).toBe("false");
    expect(enviado(container, "alergenos")).toEqual(["gluten"]);
  });

  it("modo controlado: avisa con la lista nueva", () => {
    const onCambiar = vi.fn();
    render(<SelectorAlergenos etiqueta="Alérgenos de Lentejas" valor={["apio"]} onCambiar={onCambiar} tamano="compacto" />);
    fireEvent.click(screen.getByRole("button", { name: "Mostaza" }));
    expect(onCambiar).toHaveBeenCalledWith(["apio", "mostaza"]);
    fireEvent.click(screen.getByRole("button", { name: "Apio" }));
    expect(onCambiar).toHaveBeenLastCalledWith([]);
  });
});

describe("SelectorEtiquetas", () => {
  it("alterna aria-pressed y envía los códigos", () => {
    const { container } = render(
      <form>
        <SelectorEtiquetas etiqueta="Etiquetas" name="etiquetas" inicial={["picante"]} />
      </form>,
    );
    expect(screen.getByRole("group", { name: "Etiquetas" }).querySelectorAll("button")).toHaveLength(8);
    const vegano = screen.getByRole("button", { name: "Vegano" });
    fireEvent.click(vegano);
    expect(vegano.getAttribute("aria-pressed")).toBe("true");
    expect(enviado(container, "etiquetas")).toEqual(["vegano", "picante"]);
    fireEvent.click(screen.getByRole("button", { name: "Picante" }));
    expect(enviado(container, "etiquetas")).toEqual(["vegano"]);
  });
});
