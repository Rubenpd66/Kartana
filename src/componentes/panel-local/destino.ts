export type DestinoPanel = { tipo: "ir"; ruta: string } | { tipo: "elegir" };

/** A dónde lleva /panel según las condiciones aceptadas y los locales (ids) del dueño. */
export function destinoDelPanel(condicionesAlDia: boolean, idsLocales: string[]): DestinoPanel {
  if (!condicionesAlDia || idsLocales.length === 0) return { tipo: "ir", ruta: "/panel/bienvenida" };
  if (idsLocales.length === 1) return { tipo: "ir", ruta: `/panel/${idsLocales[0]}` };
  return { tipo: "elegir" };
}
