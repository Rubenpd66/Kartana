import type { Metadata } from "next";
import { DocumentoLegalVista } from "@/componentes/DocumentoLegalVista";
import { politicaCookies } from "@/lib/legal/documentos";

export const metadata: Metadata = { title: "Política de cookies", alternates: { canonical: "/legal/cookies" } };

export default function Pagina() {
  return <DocumentoLegalVista documento={politicaCookies()} />;
}
