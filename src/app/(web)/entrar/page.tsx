import type { Metadata } from "next";
import { Contenedor } from "@/componentes/Contenedor";

// Provisional (v0.0): la sustituye el carril de acceso con el código por correo y Google.
export const metadata: Metadata = { title: "Entrar", robots: { index: false, follow: false } };

export default function Entrar() {
  return (
    <Contenedor ancho="estrecho" className="py-16 text-center">
      <h1 className="text-3xl font-semibold">Entrar en tu panel</h1>
      <p className="mt-4 text-texto-suave">El acceso para bares estará disponible muy pronto.</p>
    </Contenedor>
  );
}
