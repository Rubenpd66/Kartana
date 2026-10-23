import { describe, expect, it } from "vitest";
import { NAVEGACION_PANEL, pestanaActiva } from "./navegacion";

const ID = "3f1c2d4e-0000-4000-8000-000000000001";

describe("NAVEGACION_PANEL", () => {
  it("tiene Inicio, Carta, Menú, Idiomas, Visitas, Local y QR en ese orden", () => {
    expect(NAVEGACION_PANEL.map((e) => e.clave)).toEqual(["inicio", "carta", "menu", "idiomas", "estadisticas", "local", "qr"]);
    expect(NAVEGACION_PANEL.map((e) => e.etiqueta)).toEqual(["Inicio", "Carta", "Menú", "Idiomas", "Visitas", "Local", "QR"]);
  });

  it("construye las rutas con el id del local", () => {
    expect(NAVEGACION_PANEL.map((e) => e.ruta(ID))).toEqual([
      `/panel/${ID}`,
      `/panel/${ID}/carta`,
      `/panel/${ID}/menu`,
      `/panel/${ID}/idiomas`,
      `/panel/${ID}/estadisticas`,
      `/panel/${ID}/local`,
      `/panel/${ID}/qr`,
    ]);
  });
});

describe("pestanaActiva", () => {
  it("Inicio solo en la ruta exacta", () => {
    expect(pestanaActiva(`/panel/${ID}`, ID)).toBe("inicio");
    expect(pestanaActiva(`/panel/${ID}/`, ID)).toBe("inicio");
  });

  it("las demás también en sus subrutas", () => {
    expect(pestanaActiva(`/panel/${ID}/carta`, ID)).toBe("carta");
    expect(pestanaActiva(`/panel/${ID}/carta/plato/nuevo`, ID)).toBe("carta");
    expect(pestanaActiva(`/panel/${ID}/menu/abc`, ID)).toBe("menu");
    expect(pestanaActiva(`/panel/${ID}/qr`, ID)).toBe("qr");
  });

  it("no confunde prefijos parecidos", () => {
    expect(pestanaActiva(`/panel/${ID}/cartas`, ID)).toBeNull();
    expect(pestanaActiva(`/panel/${ID}/vista-previa`, ID)).toBeNull();
    expect(pestanaActiva(`/panel/otro`, ID)).toBeNull();
  });

  it("ignora un prefijo de idioma (/en/…)", () => {
    expect(pestanaActiva(`/en/panel/${ID}/local`, ID)).toBe("local");
  });
});
