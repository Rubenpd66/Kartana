import { describe, expect, it } from "vitest";
import { cartaPanelEjemplo, platoEjemplo } from "@/lib/dominio/pruebas/carta-ejemplo";
import type { CartaPanel } from "@/lib/tipos/carta";
import { pasosPendientes } from "./pasos";

function vacia(): CartaPanel {
  const c = cartaPanelEjemplo();
  return { ...c, secciones: [], local: { ...c.local, logoRuta: null, colorMarca: "#b9461a", publicado: false } };
}
const hechos = (c: CartaPanel) => Object.fromEntries(pasosPendientes(c).map((p) => [p.clave, p.hecho]));

describe("pasosPendientes", () => {
  it("devuelve los seis pasos en orden", () => {
    expect(pasosPendientes(vacia()).map((p) => p.clave)).toEqual(["seccionYPlato", "alergenos", "logo", "color", "publicar", "qr"]);
  });

  it("carta vacía: todo pendiente", () => {
    expect(Object.values(hechos(vacia())).every((h) => !h)).toBe(true);
  });

  it("con un plato, logo y publicada se completan", () => {
    const c = cartaPanelEjemplo();
    const h = hechos({ ...c, local: { ...c.local, logoRuta: "x/logo/a.png", publicado: true } });
    expect(h.seccionYPlato).toBe(true);
    expect(h.logo).toBe(true);
    expect(h.publicar).toBe(true);
    expect(h.qr).toBe(true);
  });

  it("alérgenos: solo hecho si todos los platos están confirmados", () => {
    const c = vacia();
    const sec = cartaPanelEjemplo().secciones[0];
    const p1 = platoEjemplo("p1", sec.id, "A", 0, { alergenosConfirmados: true });
    const p2 = platoEjemplo("p2", sec.id, "B", 1, { alergenosConfirmados: false });
    expect(hechos({ ...c, secciones: [{ ...sec, platos: [p1, p2] }] }).alergenos).toBe(false);
    expect(hechos({ ...c, secciones: [{ ...sec, platos: [p1] }] }).alergenos).toBe(true);
  });

  it("color: hecho cuando cambia del color por defecto", () => {
    const c = vacia();
    expect(hechos({ ...c, local: { ...c.local, colorMarca: "#1d4f91" } }).color).toBe(true);
  });
});
