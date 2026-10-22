"use client";

import { useState } from "react";
import { Aviso } from "@/componentes/ui/Aviso";
import { SubirImagen } from "@/componentes/ui/SubirImagen";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { rutaNuevoLogo } from "@/lib/dominio/imagenes";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { mensajeGeneral } from "./errores";

const t = panelLocalEs.local.logo;

/**
 * Bloque «Logo»: SubirImagen sube el archivo al bucket desde el navegador y aquí se guarda la ruta
 * (o null al quitarlo) con la acción de servidor.
 */
export function BloqueLogo({
  localId,
  rutaActual,
  urlActual,
  guardar,
}: {
  localId: string;
  rutaActual: string | null;
  urlActual: string | null;
  guardar: (logoRuta: string | null) => Promise<EstadoFormulario>;
}) {
  const [resultado, setResultado] = useState<{ estado: EstadoFormulario; texto: string } | null>(null);

  async function aplicar(ruta: string | null) {
    setResultado({ estado: await guardar(ruta), texto: ruta ? t.guardado : t.quitado });
  }

  const error = resultado ? mensajeGeneral(resultado.estado) : null;
  return (
    <Tarjeta aria-labelledby="bloque-logo">
      <h2 id="bloque-logo" className="mb-4 text-xl">
        {t.titulo}
      </h2>
      <SubirImagen
        tipo="logo"
        etiqueta={t.etiqueta}
        generarRuta={() => rutaNuevoLogo(localId)}
        rutaActual={rutaActual}
        urlActual={urlActual}
        onSubida={(ruta) => void aplicar(ruta)}
        onQuitar={() => void aplicar(null)}
      />
      {error ? (
        <Aviso variante="error" className="mt-3">
          {error}
        </Aviso>
      ) : (
        <p role="status" aria-live="polite" className="mt-3 min-h-6 text-sm font-semibold text-exito">
          {resultado?.estado?.ok ? resultado.texto : ""}
        </p>
      )}
    </Tarjeta>
  );
}
