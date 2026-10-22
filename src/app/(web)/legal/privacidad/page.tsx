import type { Metadata } from "next";
import { DocumentoLegalVista } from "@/componentes/DocumentoLegalVista";
import { leerInterruptores } from "@/lib/config/interruptores";
import { privacidad } from "@/lib/legal/documentos";
import { TITULAR } from "@/lib/legal/titular";

export const metadata: Metadata = { title: "Política de privacidad", alternates: { canonical: "/legal/privacidad" } };

export default function Pagina() {
  return <DocumentoLegalVista documento={privacidad({ interruptores: leerInterruptores(), titular: TITULAR })} />;
}
