import { describe, expect, it } from "vitest";
import { TAMANO_MAXIMO_EVENTO, procesarEvento } from "./procesar";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
const LOCAL = "0b7e4f3a-1111-4222-8333-444455556666";
const cuerpo = (o: object) => JSON.stringify({ tipo: "visita", localId: LOCAL, idioma: "es", platos: [], ...o });

describe("procesarEvento", () => {
  it("devuelve el evento válido", () => {
    expect(procesarEvento(cuerpo({}), UA)).toEqual({ tipo: "visita", localId: LOCAL, idioma: "es", platos: [] });
  });
  it("descarta cuerpos de más de 4 KB", () => {
    expect(procesarEvento(cuerpo({ relleno: "x".repeat(TAMANO_MAXIMO_EVENTO) }), UA)).toBeNull();
  });
  it("descarta JSON roto", () => expect(procesarEvento("{no", UA)).toBeNull());
  it("descarta más de 100 platos", () => {
    const platos = Array.from({ length: 101 }, (_, i) => `p${String(i).padStart(5, "0")}`);
    expect(procesarEvento(cuerpo({ tipo: "vistas", platos }), UA)).toBeNull();
  });
  it("descarta idioma inválido", () => expect(procesarEvento(cuerpo({ idioma: "xx" }), UA)).toBeNull());
  it("descarta bots", () => expect(procesarEvento(cuerpo({}), "Googlebot/2.1")).toBeNull());
  it("descarta tipo inválido", () => expect(procesarEvento(cuerpo({ tipo: "otro" }), UA)).toBeNull());
});
