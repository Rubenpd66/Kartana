import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { leerInterruptores } from "./interruptores";

describe("leerInterruptores", () => {
  it("apaga todo si no hay variables", () => {
    expect(leerInterruptores({})).toEqual({ pagos: false, traduccion: false, resenasApi: false });
  });

  it("solo enciende con 'true' exacto (ignora mayúsculas y espacios)", () => {
    expect(leerInterruptores({ PAGOS_ACTIVOS: " TRUE " }).pagos).toBe(true);
    expect(leerInterruptores({ PAGOS_ACTIVOS: "1" }).pagos).toBe(false);
    expect(leerInterruptores({ PAGOS_ACTIVOS: "yes" }).pagos).toBe(false);
  });
});
