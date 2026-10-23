import type { DiccionarioCarta } from "@/lib/tipos/i18n";

/** Aviso fijo abajo, siempre visible: «Consulte al personal sobre alérgenos». Respeta la zona segura del móvil. */
export function AvisoAlergenos({ diccionario }: { diccionario: DiccionarioCarta }) {
  return (
    <p className="aviso-fijo" role="note">
      {diccionario.textos.avisoAlergenos}
    </p>
  );
}
