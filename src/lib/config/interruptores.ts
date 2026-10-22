import "server-only";

// Todo lo que cobra o depende de terceros va apagado por defecto.
// Solo se enciende con el valor exacto "true" en la variable de entorno.

export type Interruptores = {
  pagos: boolean;
  traduccion: boolean;
  resenasApi: boolean;
};

export function leerInterruptores(entorno: Record<string, string | undefined> = process.env): Interruptores {
  const activo = (valor: string | undefined) => valor?.trim().toLowerCase() === "true";
  return {
    pagos: activo(entorno.PAGOS_ACTIVOS),
    traduccion: activo(entorno.TRADUCCION_ACTIVA),
    resenasApi: activo(entorno.RESENAS_API_ACTIVA),
  };
}
