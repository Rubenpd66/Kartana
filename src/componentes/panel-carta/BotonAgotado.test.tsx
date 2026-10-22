import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Resultado } from "@/lib/tipos/resultado";
import { BotonAgotado } from "./BotonAgotado";

afterEach(cleanup);

/** Promesa que el test resuelve cuando quiere. */
function diferida() {
  let resolver!: (r: Resultado) => void;
  const promesa = new Promise<Resultado>((r) => (resolver = r));
  return { promesa, resolver };
}

describe("BotonAgotado", () => {
  it("dice su estado con texto y con aria-pressed", () => {
    render(<BotonAgotado nombre="Queso frito" agotado={true} onCambiar={vi.fn()} />);
    const boton = screen.getByRole("button", { name: "Agotado: Queso frito" });
    expect(boton.getAttribute("aria-pressed")).toBe("true");
    expect(boton.textContent).toContain("Agotado");
  });

  it("cambia al instante con un toque y pide el valor nuevo", async () => {
    const { promesa, resolver } = diferida();
    const onCambiar = vi.fn(() => promesa);
    render(<BotonAgotado nombre="Patatas bravas" agotado={false} onCambiar={onCambiar} />);
    const boton = screen.getByRole("button", { name: "Agotado: Patatas bravas" });
    expect(boton.textContent).toContain("Disponible");
    fireEvent.click(boton);
    expect(boton.getAttribute("aria-pressed")).toBe("true");
    expect(boton.textContent).toContain("Agotado");
    expect(onCambiar).toHaveBeenCalledWith(true);
    // Las acciones pendientes se enlazan entre sí: hay que terminarla para no afectar a las demás pruebas.
    await act(async () => resolver({ ok: true, datos: undefined }));
  });

  it("vuelve atrás y avisa si la acción falla", async () => {
    const { promesa, resolver } = diferida();
    render(<BotonAgotado nombre="Patatas bravas" agotado={false} onCambiar={() => promesa} />);
    const boton = screen.getByRole("button", { name: "Agotado: Patatas bravas" });
    fireEvent.click(boton);
    expect(boton.getAttribute("aria-pressed")).toBe("true");
    await act(async () => resolver({ ok: false, error: "error_servidor" }));
    expect(boton.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("alert").textContent).toBe("No se ha podido cambiar «Patatas bravas». Prueba otra vez.");
  });

  it("si sale bien, se queda con el valor que llega del servidor", async () => {
    const { promesa, resolver } = diferida();
    const { rerender } = render(<BotonAgotado nombre="Bravas" agotado={false} onCambiar={() => promesa} />);
    fireEvent.click(screen.getByRole("button"));
    await act(async () => {
      rerender(<BotonAgotado nombre="Bravas" agotado={true} onCambiar={() => promesa} />);
      resolver({ ok: true, datos: undefined });
    });
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
