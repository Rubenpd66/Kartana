import { Contenedor } from "@/componentes/Contenedor";
import type { DocumentoLegal } from "@/lib/legal/documentos";

export function DocumentoLegalVista({ documento }: { documento: DocumentoLegal }) {
  return (
    <Contenedor ancho="estrecho" como="article" className="py-12">
      <h1 className="text-3xl font-semibold">{documento.titulo}</h1>
      <p className="mt-2 text-sm text-texto-suave">Última actualización: {documento.actualizado}</p>
      {documento.secciones.map((s) => (
        <section key={s.titulo} className="mt-8">
          <h2 className="text-xl font-semibold">{s.titulo}</h2>
          {s.parrafos.map((p) => (
            <p key={p} className="mt-3">
              {p}
            </p>
          ))}
        </section>
      ))}
    </Contenedor>
  );
}
