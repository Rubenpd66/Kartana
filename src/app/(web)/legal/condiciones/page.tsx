import type { Metadata } from "next";
import { DocumentoLegalVista } from "@/componentes/DocumentoLegalVista";
import { leerInterruptores } from "@/lib/config/interruptores";
import { condiciones } from "@/lib/legal/documentos";
import { TITULAR } from "@/lib/legal/titular";

export const metadata: Metadata = { title: "Condiciones del servicio", alternates: { canonical: "/legal/condiciones" } };

export default function Pagina() {
  return <DocumentoLegalVista documento={condiciones({ interruptores: leerInterruptores(), titular: TITULAR })} />;
}
