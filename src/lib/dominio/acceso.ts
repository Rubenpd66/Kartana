import type { Acceso, AccesoEfectivo } from "@/lib/tipos/cuentas";

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Acceso calculado «ahora». Misma regla que privado.local_con_acceso() en SQL:
 * estado distinto de "vencido" y (sin fecha de fin o fecha de fin en el futuro).
 */
export function calcularAccesoEfectivo(
  acceso: Pick<Acceso, "estado" | "plan" | "vigenteHasta">,
  ahora: Date,
): AccesoEfectivo {
  const fin = acceso.vigenteHasta === null ? null : new Date(acceso.vigenteHasta).getTime();
  const activo = acceso.estado !== "vencido" && (fin === null || fin > ahora.getTime());
  const diasRestantes = fin === null ? null : Math.max(0, Math.ceil((fin - ahora.getTime()) / DIA_MS));
  return { estado: acceso.estado, plan: acceso.plan, activo, diasRestantes, vigenteHasta: acceso.vigenteHasta };
}
