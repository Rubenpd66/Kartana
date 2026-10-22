import { describe, expect, it } from "vitest";
import { condiciones, privacidad } from "./documentos";
import { TITULAR } from "./titular";

const apagado = { pagos: false, traduccion: false, resenasApi: false };
const texto = (doc: { secciones: { parrafos: string[] }[] }) => doc.secciones.flatMap((s) => s.parrafos).join(" ");

describe("textos legales adaptables", () => {
  it("sin pagos no menciona Stripe y habla del piloto gratuito", () => {
    expect(texto(privacidad({ interruptores: apagado, titular: TITULAR }))).not.toContain("Stripe");
    expect(texto(condiciones({ interruptores: apagado, titular: TITULAR }))).toContain("piloto el servicio es gratuito");
  });

  it("con pagos menciona Stripe y la renovación", () => {
    const conPagos = { ...apagado, pagos: true };
    expect(texto(privacidad({ interruptores: conPagos, titular: TITULAR }))).toContain("Stripe");
    expect(texto(condiciones({ interruptores: conPagos, titular: TITULAR }))).toContain("se renueva");
  });

  it("solo menciona la traducción automática si está activa", () => {
    expect(texto(privacidad({ interruptores: apagado, titular: TITULAR }))).not.toContain("Translation");
    expect(texto(privacidad({ interruptores: { ...apagado, traduccion: true }, titular: TITULAR }))).toContain(
      "Translation",
    );
  });

  it("las condiciones siempre prohíben filtrar e incentivar reseñas", () => {
    const t = texto(condiciones({ interruptores: apagado, titular: TITULAR }));
    expect(t).toContain("filtrar");
    expect(t).toContain("a cambio de reseñas");
  });
});
