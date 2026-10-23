import { describe, expect, it } from "vitest";
import type { TextoTraducible } from "@/lib/tipos/traduccion";
import { agruparTextos, estadoCampo, necesitaAtencion, tipoDeCampo } from "./agrupar";

const H = "aaaaaaaaaaaaaaaa";
const OTRA = "bbbbbbbbbbbbbbbb";
const t = (campo: string, over: Partial<TextoTraducible> = {}): TextoTraducible => ({
  tabla: "platos",
  filaId: "p1",
  campo,
  original: "Bravas",
  huellaActual: H,
  traducciones: {},
  ...over,
});
const tr = (texto: string, origen: "auto" | "manual", huella = H) => ({ texto, origen, huella, fecha: "2026-01-01" });

describe("estadoCampo (los cinco estados)", () => {
  it("falta, auto al día, manual al día, auto vieja y manual vieja", () => {
    expect(estadoCampo(t("nombre"), "en")).toBe("falta");
    expect(estadoCampo(t("nombre", { traducciones: { en: tr("Bravas", "auto") } }), "en")).toBe("al_dia_auto");
    expect(estadoCampo(t("nombre", { traducciones: { en: tr("X", "manual") } }), "en")).toBe("al_dia_manual");
    expect(estadoCampo(t("nombre", { traducciones: { en: tr("X", "auto", OTRA) } }), "en")).toBe("desactualizada_auto");
    expect(estadoCampo(t("nombre", { traducciones: { en: tr("X", "manual", OTRA) } }), "en")).toBe("desactualizada_manual");
  });
  it("necesitaAtencion", () => {
    expect(necesitaAtencion("falta")).toBe(true);
    expect(necesitaAtencion("desactualizada_manual")).toBe(true);
    expect(necesitaAtencion("al_dia_manual")).toBe(false);
  });
});

describe("agruparTextos", () => {
  const textos: TextoTraducible[] = [
    t("descripcion", { tabla: "locales", filaId: "l1", original: "Bar" }),
    t("nombre", { tabla: "secciones", filaId: "s1", original: "Tapas" }),
    t("nombre", { filaId: "p1", original: "Bravas" }),
    t("descripcion", { filaId: "p1", original: "Con alioli", traducciones: { en: tr("With aioli", "auto") } }),
    t("nombre", { filaId: "p2", original: "Ajo mataero", traducciones: { en: tr("Ajo mataero", "manual", OTRA) } }),
    t("descripcion", { filaId: "p2", original: "   " }),
  ];
  it("conserva el orden, pone título y descarta vacíos", () => {
    const g = agruparTextos(textos, "en");
    expect(g.map((x) => [x.tabla, x.titulo, x.campos.length])).toEqual([
      ["locales", null, 1],
      ["secciones", "Tapas", 1],
      ["platos", "Bravas", 2],
      ["platos", "Ajo mataero", 1],
    ]);
  });
  it("con soloPendientes deja lo que falta o hay que revisar", () => {
    const g = agruparTextos(textos, "en", true);
    expect(g.map((x) => x.titulo)).toEqual([null, "Tapas", "Bravas", "Ajo mataero"]);
    expect(g[2]!.campos.map((c) => c.texto.campo)).toEqual(["nombre"]);
    expect(g[3]!.campos[0]!.estado).toBe("desactualizada_manual");
  });
});

describe("tipoDeCampo", () => {
  it("clasifica los campos", () => {
    expect(tipoDeCampo("nombre")).toBe("nombre");
    expect(tipoDeCampo("notas")).toBe("notas");
    expect(tipoDeCampo("precio.ab12.texto")).toBe("precio");
    expect(tipoDeCampo("grupo.ab12.titulo")).toBe("grupo");
    expect(tipoDeCampo("item.ab12.nombre")).toBe("item");
  });
});
