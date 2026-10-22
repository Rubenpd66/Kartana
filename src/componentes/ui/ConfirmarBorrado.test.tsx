import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfirmarBorrado } from "./ConfirmarBorrado";

// jsdom no implementa del todo <dialog>: lo simulamos con el atributo open.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(cleanup);

function pintar(onConfirmar = vi.fn()) {
  render(
    <ConfirmarBorrado
      etiquetaBoton="Borrar plato"
      titulo="¿Borrar «Croquetas»?"
      descripcion="No se puede deshacer."
      onConfirmar={onConfirmar}
    />,
  );
  return onConfirmar;
}

describe("ConfirmarBorrado", () => {
  it("abre un diálogo con título y descripción al pulsar el botón", () => {
    pintar();
    const dialogo = screen.getByRole("dialog", { hidden: true });
    expect(dialogo.hasAttribute("open")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Borrar plato" }));
    expect(dialogo.hasAttribute("open")).toBe(true);
    expect(screen.getByRole("heading", { name: "¿Borrar «Croquetas»?" })).toBeTruthy();
    expect(dialogo.getAttribute("aria-labelledby")).toBeTruthy();
  });

  it("cancelar cierra sin borrar", () => {
    const onConfirmar = pintar();
    fireEvent.click(screen.getByRole("button", { name: "Borrar plato" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("dialog", { hidden: true }).hasAttribute("open")).toBe(false);
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("confirmar llama a onConfirmar y cierra", async () => {
    const onConfirmar = pintar(vi.fn().mockResolvedValue(undefined));
    fireEvent.click(screen.getByRole("button", { name: "Borrar plato" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, borrar" }));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole("dialog", { hidden: true }).hasAttribute("open")).toBe(false));
  });
});
