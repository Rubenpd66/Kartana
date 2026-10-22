import type { Metadata } from "next";
import { DocumentoLegalVista } from "@/componentes/DocumentoLegalVista";
import { leerInterruptores } from "@/lib/config/interruptores";
import { avisoLegal } from "@/lib/legal/documentos";
import { TITULAR } from "@/lib/legal/titular";

export const metadata: Metadata = { title: "Aviso legal", alternates: { canonical: "/legal/aviso-legal" } };

export default function Pagina() {
  return <DocumentoLegalVista documento={avisoLegal({ interruptores: leerInterruptores(), titular: TITULAR })} />;
}
