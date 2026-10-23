import type { ReactNode } from "react";

/** Banda oscura arriba de la carta: «Carta de ejemplo…» en la demo, «Así verán tu carta» en la vista previa. */
export function BandaDemo({ children }: { children: ReactNode }) {
  return (
    <p className="carta-banda" role="note">
      {children}
    </p>
  );
}
