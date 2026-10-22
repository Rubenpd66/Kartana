import type { CodigoAlergeno } from "@/lib/tipos/dominio";

/** Los 14 alérgenos del anexo II del Reglamento (UE) 1169/2011, en su orden. Mismos códigos que el CHECK de SQL. */
export const ALERGENOS = [
  "gluten",
  "crustaceos",
  "huevos",
  "pescado",
  "cacahuetes",
  "soja",
  "lacteos",
  "frutos_cascara",
  "apio",
  "mostaza",
  "sesamo",
  "sulfitos",
  "altramuces",
  "moluscos",
] as const satisfies readonly CodigoAlergeno[];

export function esAlergeno(valor: string): valor is CodigoAlergeno {
  return (ALERGENOS as readonly string[]).includes(valor);
}
