// Huella de un texto original de la carta (docs/arquitectura.md §3.4). Pura: servidor y navegador.
// Si la huella guardada en una traducción no coincide con la del original actual, está desactualizada.

import type { CalcularHuella } from "@/lib/tipos/contratos";

/** 16 primeros caracteres hex del SHA-256 de `texto.trim().normalize("NFC")` (Web Crypto). */
export const calcularHuella: CalcularHuella = async (texto) => {
  const bytes = new TextEncoder().encode(texto.trim().normalize("NFC"));
  const resumen = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  let hex = "";
  for (const b of resumen.subarray(0, 8)) hex += b.toString(16).padStart(2, "0");
  return hex;
};
