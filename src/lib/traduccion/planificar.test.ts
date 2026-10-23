import { describe, expect, it } from "vitest";
import { planificarTraducciones } from "./planificar";
import { HUELLA_A, HUELLA_B, textoDe, traducido } from "./pruebas/textos-ejemplo";

describe("planificarTraducciones", () => {
  it("si falta la traducción, es pendiente con el original y la huella actual", () => {
    const pendientes = planificarTraducciones([textoDe("nombre", "Pulpo a la gallega")], ["en"]);
    expect(pendientes).toEqual([
      { tabla: "platos", filaId: "plato-1", campo: "nombre", idioma: "en", original: "Pulpo a la gallega", huella: HUELLA_A },
    ]);
  });

  it("una automática con la huella vieja es pendiente", () => {
    const texto = textoDe("nombre", "Pulpo", { en: traducido("Octopus", "auto", HUELLA_B) });
    expect(planificarTraducciones([texto], ["en"])).toHaveLength(1);
  });

  it("una automática al día no es pendiente", () => {
    const texto = textoDe("nombre", "Pulpo", { en: traducido("Octopus", "auto", HUELLA_A) });
    expect(planificarTraducciones([texto], ["en"])).toEqual([]);
  });

  it("una automática al día pero vacía se vuelve a traducir", () => {
    const texto = textoDe("nombre", "Pulpo", { en: traducido("  ", "auto", HUELLA_A) });
    expect(planificarTraducciones([texto], ["en"])).toHaveLength(1);
  });

  it("una manual NUNCA es pendiente, esté al día o desactualizada", () => {
    const alDia = textoDe("nombre", "Pulpo", { en: traducido("Octopus", "manual", HUELLA_A) });
    const vieja = textoDe("descripcion", "Con cachelos", { en: traducido("With potatoes", "manual", HUELLA_B) });
    const vacia = textoDe("notas", "Pan incluido", { en: traducido("", "manual", HUELLA_B) });
    expect(planificarTraducciones([alDia, vieja, vacia], ["en"])).toEqual([]);
  });

  it("solo planifica los idiomas activos", () => {
    const texto = textoDe("nombre", "Pulpo", { fr: traducido("Poulpe", "auto", HUELLA_A) });
    const pendientes = planificarTraducciones([texto], ["fr", "de"]);
    expect(pendientes.map((p) => p.idioma)).toEqual(["de"]);
  });

  it("ignora el español aunque llegue en la lista", () => {
    expect(planificarTraducciones([textoDe("nombre", "Pulpo")], ["es" as never, "gl"]).map((p) => p.idioma)).toEqual(["gl"]);
  });

  it("no traduce textos vacíos o solo con espacios", () => {
    expect(planificarTraducciones([textoDe("descripcion", ""), textoDe("notas", "   \n")], ["en", "fr"])).toEqual([]);
  });

  it("sin idiomas no hay nada pendiente", () => {
    expect(planificarTraducciones([textoDe("nombre", "Pulpo")], [])).toEqual([]);
  });

  it("combina textos e idiomas", () => {
    const textos = [textoDe("nombre", "Pulpo"), textoDe("descripcion", "Con cachelos")];
    expect(planificarTraducciones(textos, ["en", "ca", "eu"])).toHaveLength(6);
  });
});
