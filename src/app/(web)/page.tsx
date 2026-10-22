import { Contenedor } from "@/componentes/Contenedor";
import { SITIO, urlSitio } from "@/lib/config/sitio";

// Portada provisional (v0.0). La página de venta completa llega en la v0.4.
export default function Inicio() {
  const datosEstructurados = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITIO.nombre,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITIO.descripcion,
    url: urlSitio(),
    inLanguage: "es",
  };

  return (
    <Contenedor className="py-16 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados).replace(/</g, "\\u003c") }}
      />
      <p className="mb-4 inline-block rounded-full bg-superficie-suave px-3 py-1 text-sm font-medium text-texto-suave">
        Muy pronto · piloto con bares
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold sm:text-5xl">{SITIO.lema}</h1>
      <p className="mt-6 max-w-xl text-lg text-texto-suave">{SITIO.descripcion}</p>
      <ul className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
        {[
          ["Cambios al instante", "Agotas un plato y desaparece de todas las mesas."],
          ["Alérgenos claros", "Los 14 de la UE con iconos y filtro para el cliente."],
          ["Más reseñas", "Un botón limpio hacia Google, igual para todos."],
        ].map(([titulo, texto]) => (
          <li key={titulo} className="rounded-2xl border border-borde bg-superficie p-5">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <p className="mt-1 text-texto-suave">{texto}</p>
          </li>
        ))}
      </ul>
    </Contenedor>
  );
}
