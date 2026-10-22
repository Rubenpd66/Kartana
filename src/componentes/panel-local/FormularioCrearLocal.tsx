"use client";

import { useActionState, useState } from "react";
import { Aviso } from "@/componentes/ui/Aviso";
import { BotonEnviar } from "@/componentes/ui/BotonEnviar";
import { Campo } from "@/componentes/ui/Campo";
import { normalizarSlug } from "@/lib/dominio/slugs";
import { panelLocalEs } from "@/lib/i18n/panel-local.es";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import { CampoDireccion, type ComprobarDireccion } from "./CampoDireccion";
import type { EstadoVisible } from "./direccion";
import { mensajeCampo, mensajeGeneral } from "./errores";

const t = panelLocalEs.bienvenida;

/** Paso 2 de la bienvenida: nombre del bar y su dirección (se sugiere sola y se puede editar). */
export function FormularioCrearLocal({
  crear,
  comprobar,
  urlBase,
}: {
  crear: (previo: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>;
  comprobar: ComprobarDireccion;
  urlBase: string;
}) {
  const [estado, accion] = useActionState(crear, null);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditado, setSlugEditado] = useState(false);
  const [estadoSlug, setEstadoSlug] = useState<EstadoVisible>("vacio");

  const general = mensajeGeneral(estado);
  const puedeCrear = nombre.trim() !== "" && estadoSlug === "libre";

  return (
    <form action={accion} className="space-y-5" noValidate>
      <Campo
        name="nombre"
        etiqueta={t.nombre}
        placeholder={t.nombreEjemplo}
        value={nombre}
        onChange={(e) => {
          setNombre(e.target.value);
          if (!slugEditado) setSlug(normalizarSlug(e.target.value));
        }}
        autoComplete="organization"
        error={mensajeCampo(estado, "nombre")}
        maxLength={80}
        required
      />
      <CampoDireccion
        valor={slug}
        onCambiar={(s) => {
          setSlug(s);
          setSlugEditado(true);
        }}
        comprobar={comprobar}
        urlBase={urlBase}
        onEstado={setEstadoSlug}
        errorServidor={mensajeCampo(estado, "slug")}
      />
      <p className="text-sm text-texto-suave">{t.pruebaGratis}</p>
      {general ? <Aviso variante="error">{general}</Aviso> : null}
      <BotonEnviar tamano="grande" bloque disabled={!puedeCrear}>
        {t.crear}
      </BotonEnviar>
    </form>
  );
}
