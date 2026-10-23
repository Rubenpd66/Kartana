import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EditorPrecios } from "./EditorPrecios";
import { leerPrecios } from "./formulario-plato";

afterEach(cleanup);

function montar(props: Partial<Parameters<typeof EditorPrecios>[0]> = {}) {
  const { container } = render(
    <form>
      <EditorPrecios inicial={[]} {...props} />
    </form>,
  );
  const formulario = container.querySelector("form") as HTMLFormElement;
  return { leer: () => leerPrecios(new FormData(formulario)) };
}

describe("EditorPrecios", () => {
  it("por defecto, un solo campo «Precio» con teclado decimal", () => {
    const { leer } = montar();
    const precio = screen.getByLabelText("Precio") as HTMLInputElement;
    expect(precio.inputMode).toBe("decimal");
    expect(screen.queryByRole("combobox")).toBeNull();
    fireEvent.change(precio, { target: { value: "3,75" } });
    expect(leer()).toEqual({ precios: [{ formato: "unico", texto: null, centimos: 375 }], errores: {} });
  });

  it("carga las variantes existentes con su id", () => {
    const { leer } = montar({
      inicial: [
        { id: "aaaa1111", formato: "media_racion", texto: null, centimos: 225 },
        { id: "bbbb2222", formato: "racion", texto: null, centimos: 375 },
      ],
    });
    expect(leer().precios).toEqual([
      { id: "aaaa1111", formato: "media_racion", texto: null, centimos: 225 },
      { id: "bbbb2222", formato: "racion", texto: null, centimos: 375 },
    ]);
  });

  it("el atajo «½ y ración» crea dos filas con su etiqueta", () => {
    const { leer } = montar();
    fireEvent.click(screen.getByRole("button", { name: "½ y ración" }));
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Precio de ½ ración"), { target: { value: "2,25" } });
    fireEvent.change(screen.getByLabelText("Precio de Ración"), { target: { value: "3.75" } });
    expect(leer()).toEqual({
      precios: [
        { formato: "media_racion", texto: null, centimos: 225 },
        { formato: "racion", texto: null, centimos: 375 },
      ],
      errores: {},
    });
  });

  it("«Otra variante» con «Otra…» pide un texto libre de hasta 30 letras", () => {
    const { leer } = montar({ inicial: [{ id: "aaaa1111", formato: "racion", texto: null, centimos: 375 }] });
    fireEvent.click(screen.getByRole("button", { name: "+ Otra variante…" }));
    const selectores = screen.getAllByRole("combobox");
    expect(selectores).toHaveLength(2);
    fireEvent.change(selectores[1], { target: { value: "otro" } });
    const libre = screen.getByLabelText("Nombre de la variante 2") as HTMLInputElement;
    expect(libre.required).toBe(true);
    expect(libre.maxLength).toBe(30);
    fireEvent.change(libre, { target: { value: "Para compartir" } });
    fireEvent.change(screen.getByLabelText("Precio de Para compartir"), { target: { value: "12" } });
    expect(leer().precios[1]).toEqual({ formato: "otro", texto: "Para compartir", centimos: 1200 });
  });

  it("no pasa de 6 variantes", () => {
    montar();
    const otra = screen.getByRole("button", { name: "+ Otra variante…" });
    for (let i = 0; i < 8; i++) fireEvent.click(otra);
    expect(screen.getAllByRole("combobox")).toHaveLength(6);
    expect((otra as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Como mucho 6 variantes.")).toBeTruthy();
  });

  it("«Según mercado» deja el precio vacío y desactiva el campo", () => {
    const { leer } = montar();
    const precio = screen.getByLabelText("Precio") as HTMLInputElement;
    fireEvent.change(precio, { target: { value: "20" } });
    fireEvent.click(screen.getByLabelText(/Según mercado/));
    expect(precio.disabled).toBe(true);
    expect(leer()).toEqual({ precios: [{ formato: "unico", texto: null, centimos: null }], errores: {} });
  });

  it("quitar filas: con una sola, vuelve a poder ser «sin etiqueta»", () => {
    const { leer } = montar();
    fireEvent.click(screen.getByRole("button", { name: "½ y ración" }));
    fireEvent.click(screen.getByRole("button", { name: "Quitar ½ ración" }));
    const [selector] = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const sinEtiqueta = Array.from(selector.options).find((o) => o.value === "unico")!;
    expect(sinEtiqueta.disabled).toBe(false);
    fireEvent.change(selector, { target: { value: "unico" } });
    // Vuelve al caso simple: un solo campo «Precio» sin selector.
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(leer().precios.map((p) => p.formato)).toEqual(["unico"]);
  });

  it("ordena las variantes con flechas", () => {
    const { leer } = montar();
    fireEvent.click(screen.getByRole("button", { name: "½ y ración" }));
    fireEvent.click(screen.getByRole("button", { name: "Bajar ½ ración" }));
    expect(leer().precios.map((p) => p.formato)).toEqual(["racion", "media_racion"]);
  });

  it("muestra los errores junto a su fila", () => {
    montar({ errores: { "precios.0.centimos": "requerido" } });
    expect(screen.getByText("Escribe el precio o marca «Según mercado».")).toBeTruthy();
    expect(screen.getByLabelText("Precio").getAttribute("aria-invalid")).toBe("true");
  });
});
