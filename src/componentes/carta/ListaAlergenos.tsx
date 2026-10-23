import type { CodigoAlergeno } from "@/lib/tipos/dominio";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { IconoCarta } from "./IconosCarta";

/** Lista «Contiene»: cada alérgeno con su icono y su nombre (nunca solo el icono). */
export function ListaAlergenos({
  alergenos,
  diccionario,
  tamano = 20,
}: {
  alergenos: CodigoAlergeno[];
  diccionario: DiccionarioCarta;
  tamano?: number;
}) {
  if (alergenos.length === 0) return null;
  return (
    <ul aria-label={diccionario.textos.contiene} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-suave">
      {alergenos.map((codigo) => (
        <li key={codigo} className="inline-flex items-center gap-1">
          <IconoCarta codigo={codigo} tamano={tamano} />
          {diccionario.alergenos[codigo]}
        </li>
      ))}
    </ul>
  );
}
