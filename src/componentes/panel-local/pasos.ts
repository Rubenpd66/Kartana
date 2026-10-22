import type { CartaPanel } from "@/lib/tipos/carta";

export type ClavePaso = "seccionYPlato" | "alergenos" | "logo" | "color" | "publicar" | "qr";

/** Color que trae un local nuevo (valor por defecto de la base de datos). */
export const COLOR_POR_DEFECTO = "#b9461a";

/** Los pasos para dejar la carta lista, con su estado calculado a partir de los datos. */
export function pasosPendientes(carta: CartaPanel): Array<{ clave: ClavePaso; hecho: boolean }> {
  const platos = carta.secciones.flatMap((s) => s.platos);
  const { local } = carta;
  return [
    { clave: "seccionYPlato", hecho: platos.length > 0 },
    { clave: "alergenos", hecho: platos.length > 0 && platos.every((p) => p.alergenosConfirmados) },
    { clave: "logo", hecho: local.logoRuta !== null },
    { clave: "color", hecho: local.colorMarca.toLowerCase() !== COLOR_POR_DEFECTO },
    { clave: "publicar", hecho: local.publicado },
    // No guardamos si el QR se ha descargado: se da por hecho al publicar la carta.
    { clave: "qr", hecho: local.publicado },
  ];
}
