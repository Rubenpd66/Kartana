import Link from "next/link";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";

/** Pie: quién responde de los alérgenos y «Carta digital con Kartana». */
export function PieCarta({ diccionario }: { diccionario: DiccionarioCarta }) {
  return (
    <footer className="mt-10 pb-6 text-center text-[0.8125rem] text-texto-suave">
      <p>{diccionario.textos.responsabilidadAlergenos}</p>
      <p>
        {/* Sin precarga: quien mira la carta casi nunca va a la portada y la cobertura puede ser mala. */}
        <Link href="/" prefetch={false} className="inline-flex min-h-12 items-center underline underline-offset-4">
          {diccionario.textos.hechoCon}
        </Link>
      </p>
    </footer>
  );
}
