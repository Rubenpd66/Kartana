import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Interruptor } from "./Interruptor";

afterEach(cleanup);

describe("Interruptor", () => {
  it("es un switch con nombre accesible y estado", () => {
    render(<Interruptor etiqueta="Publicada" valorInicial={false} />);
    const s = screen.getByRole("switch", { name: "Publicada" });
    expect(s.getAttribute("aria-checked")).toBe("false");
  });

  it("cambia al pulsar y avisa con el nuevo valor", () => {
    const onCambiar = vi.fn();
    render(<Interruptor etiqueta="Publicada" valorInicial={false} onCambiar={onCambiar} />);
    const s = screen.getByRole("switch");
    fireEvent.click(s);
    expect(s.getAttribute("aria-checked")).toBe("true");
    expect(onCambiar).toHaveBeenCalledWith(true);
  });

  it("modo controlado: refleja `activado` y no cambia solo", () => {
    const onCambiar = vi.fn();
    render(<Interruptor etiqueta="Agotado" activado={true} onCambiar={onCambiar} />);
    const s = screen.getByRole("switch");
    fireEvent.click(s);
    expect(onCambiar).toHaveBeenCalledWith(false);
    expect(s.getAttribute("aria-checked")).toBe("true");
  });

  it("envía su valor en formularios con un campo oculto", () => {
    const { container } = render(<Interruptor etiqueta="Visible" name="visible" valorInicial />);
    const oculto = container.querySelector('input[type="hidden"][name="visible"]') as HTMLInputElement;
    expect(oculto.value).toBe("true");
    fireEvent.click(screen.getByRole("switch"));
    expect(oculto.value).toBe("false");
  });

  it("desactivado no cambia", () => {
    const onCambiar = vi.fn();
    render(<Interruptor etiqueta="X" valorInicial={false} disabled onCambiar={onCambiar} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onCambiar).not.toHaveBeenCalled();
  });
});
