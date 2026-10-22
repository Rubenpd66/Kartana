import Link from "next/link";
import { Contenedor } from "@/componentes/Contenedor";
import { cartaEs } from "@/lib/i18n/carta.es";
import { cartaPublicaEs as t } from "@/lib/i18n/carta-publica.es";

// Carta que no existe, no está publicada o no tiene acceso activo. Responde 404 (ver page.tsx).
export default function CartaNoEncontrada() {
  return (
    <div className="flex flex-1 items-center py-24">
      <Contenedor ancho="estrecho" className="text-center">
        <p className="font-titulo text-6xl font-semibold text-primario">404</p>
        <h1 className="mt-4 text-3xl font-semibold">{cartaEs.textos.cartaNoDisponible}</h1>
        <p className="mt-4 text-texto-suave">{t.noEncontrada.texto}</p>
        <Link
          href="/"
          prefetch={false}
          className="mt-8 inline-flex min-h-12 items-center rounded-full bg-primario px-6 font-medium text-sobre-primario hover:bg-primario-hover"
        >
          {t.noEncontrada.volver}
        </Link>
      </Contenedor>
    </div>
  );
}
