import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BotonCopiar } from "./BotonCopiar";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const textos = { etiqueta: "Copiar enlace", copiado: "Enlace copiado", error: "No se ha podido copiar." };

describe("BotonCopiar", () => {
  it("copia el texto y lo anuncia", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<BotonCopiar texto="https://x.test/c/demo" {...textos} />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar enlace" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Enlace copiado"));
    expect(writeText).toHaveBeenCalledWith("https://x.test/c/demo");
  });

  it("si el navegador no deja copiar, avisa del error", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => { throw new Error("no"); }) } });
    render(<BotonCopiar texto="x" {...textos} />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar enlace" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("No se ha podido copiar."));
  });

  it("sin API del portapapeles también avisa", async () => {
    vi.stubGlobal("navigator", {});
    render(<BotonCopiar texto="x" {...textos} />);
    fireEvent.click(screen.getByRole("button", { name: "Copiar enlace" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("No se ha podido copiar."));
  });
});
