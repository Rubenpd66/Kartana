import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const enviarCodigo = vi.fn();
const verificarCodigo = vi.fn();
const entrarConGoogle = vi.fn();
vi.mock("@/lib/auth/acciones-entrar", () => ({
  enviarCodigo: (...a: unknown[]) => enviarCodigo(...a),
  verificarCodigo: (...a: unknown[]) => verificarCodigo(...a),
  entrarConGoogle: (...a: unknown[]) => entrarConGoogle(...a),
}));

const { FormularioEntrar } = await import("./FormularioEntrar");

beforeEach(() => {
  vi.clearAllMocks();
  enviarCodigo.mockResolvedValue({ ok: true, datos: { correo: "bar@x.es" } });
  verificarCodigo.mockResolvedValue({ ok: false, error: "datos_invalidos", campos: { codigo: "incorrecto" } });
});
afterEach(cleanup);

async function pedirCodigo() {
  render(<FormularioEntrar siguiente="/panel/abc" />);
  fireEvent.change(screen.getByLabelText("Tu correo"), { target: { value: "Bar@x.es" } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Enviarme el código" }));
  });
}

describe("FormularioEntrar", () => {
  it("empieza en el paso 1 con correo y Google", () => {
    render(<FormularioEntrar siguiente="/panel" />);
    expect(screen.getByRole("heading", { name: "Entra en tu panel" })).toBeTruthy();
    const correo = screen.getByLabelText("Tu correo") as HTMLInputElement;
    expect(correo.type).toBe("email");
    expect(correo.required).toBe(true);
    expect(correo.autocomplete).toBe("email");
    expect(screen.getByRole("button", { name: "Continuar con Google" })).toBeTruthy();
  });

  it("pasa al paso 2 tras enviar el código y lo anuncia", async () => {
    await pedirCodigo();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Escribe el código" })).toBeTruthy());
    const fd = enviarCodigo.mock.calls[0][1] as FormData;
    expect(fd.get("correo")).toBe("Bar@x.es");
    expect(screen.getByRole("status").textContent).toContain("te llegará un código");
    const codigo = screen.getByLabelText("Código de 6 cifras") as HTMLInputElement;
    expect(codigo.inputMode).toBe("numeric");
    expect(codigo.autocomplete).toBe("one-time-code");
    expect(codigo.pattern).toBe("[0-9]{6}");
    expect(codigo.required).toBe(true);
  });

  it("muestra el error del paso 1 en una alerta y se queda en el paso 1", async () => {
    enviarCodigo.mockResolvedValue({ ok: false, error: "limite_alcanzado" });
    await pedirCodigo();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Espera un minuto"));
    expect(screen.getByRole("heading", { name: "Entra en tu panel" })).toBeTruthy();
  });

  it("envía el código con el correo normalizado y siguiente, y muestra el error en el campo", async () => {
    await pedirCodigo();
    await waitFor(() => screen.getByLabelText("Código de 6 cifras"));
    fireEvent.change(screen.getByLabelText("Código de 6 cifras"), { target: { value: "000000" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    });
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("no es correcto"));
    const fd = verificarCodigo.mock.calls[0][1] as FormData;
    expect(fd.get("correo")).toBe("bar@x.es");
    expect(fd.get("codigo")).toBe("000000");
    expect(fd.get("siguiente")).toBe("/panel/abc");
    expect(screen.getByLabelText("Código de 6 cifras").getAttribute("aria-invalid")).toBe("true");
  });

  it("«Cambiar correo» vuelve al paso 1 con el correo puesto", async () => {
    await pedirCodigo();
    await waitFor(() => screen.getByRole("button", { name: "Cambiar correo" }));
    fireEvent.click(screen.getByRole("button", { name: "Cambiar correo" }));
    expect(screen.getByRole("heading", { name: "Entra en tu panel" })).toBeTruthy();
    expect((screen.getByLabelText("Tu correo") as HTMLInputElement).value).toBe("bar@x.es");
  });

  it("«Reenviar código» vuelve a pedirlo para el mismo correo", async () => {
    await pedirCodigo();
    await waitFor(() => screen.getByRole("button", { name: "Reenviar código" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
    });
    expect(enviarCodigo).toHaveBeenCalledTimes(2);
    expect((enviarCodigo.mock.calls[1][1] as FormData).get("correo")).toBe("bar@x.es");
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("código nuevo"));
  });
});
