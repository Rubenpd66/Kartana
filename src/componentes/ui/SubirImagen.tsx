"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { reducirImagen } from "@/lib/imagenes/reducir";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { uiEs } from "@/lib/i18n/ui.es";
import type { PropsSubirImagen } from "@/lib/tipos/contratos";
import { clasesBoton } from "./Boton";

const t = uiEs.subirImagen;
const MAXIMO_BYTES = 2 * 1024 * 1024;

type Estado =
  | { fase: "inicio" }
  | { fase: "reduciendo" }
  | { fase: "subiendo" }
  | { fase: "lista" }
  | { fase: "error"; error: keyof typeof t.errores };

/**
 * Elige una imagen (o hace la foto con el móvil), la reduce en el navegador
 * (foto: WebP 1200 px calidad 0,8; logo: PNG 512 px), rechaza lo que pase de 2 MB,
 * la sube al bucket `imagenes` con la sesión del navegador y llama a `onSubida(ruta)`.
 * No guarda nada en la base de datos: eso lo hace la acción de quien lo usa.
 */
export function SubirImagen({ generarRuta, tipo, urlActual, etiqueta, onSubida, onQuitar }: PropsSubirImagen) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>({ fase: "inicio" });
  const [vista, setVista] = useState<string | null>(urlActual);
  const urlLocal = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (urlLocal.current) URL.revokeObjectURL(urlLocal.current);
    },
    [],
  );

  async function alElegir(archivo: File | undefined) {
    if (!archivo) return;
    setEstado({ fase: "reduciendo" });
    let blob: Blob;
    try {
      blob =
        tipo === "foto"
          ? await reducirImagen(archivo, { ladoMax: 1200, tipo: "image/webp", calidad: 0.8 })
          : await reducirImagen(archivo, { ladoMax: 512, tipo: "image/png" });
    } catch {
      setEstado({ fase: "error", error: "no_es_imagen" });
      return;
    } finally {
      if (entrada.current) entrada.current.value = "";
    }
    if (blob.size > MAXIMO_BYTES) {
      setEstado({ fase: "error", error: "demasiado_grande" });
      return;
    }

    setEstado({ fase: "subiendo" });
    const ruta = generarRuta();
    const { error } = await crearClienteNavegador()
      .storage.from("imagenes")
      .upload(ruta, blob, { contentType: blob.type, upsert: false });
    if (error) {
      setEstado({ fase: "error", error: "subida" });
      return;
    }

    if (urlLocal.current) URL.revokeObjectURL(urlLocal.current);
    urlLocal.current = URL.createObjectURL(blob);
    setVista(urlLocal.current);
    setEstado({ fase: "lista" });
    onSubida(ruta);
  }

  function quitar() {
    setVista(null);
    setEstado({ fase: "inicio" });
    onQuitar?.();
  }

  const ocupado = estado.fase === "reduciendo" || estado.fase === "subiendo";
  const hayImagen = !!vista;
  const mensaje =
    estado.fase === "reduciendo" ? t.reduciendo : estado.fase === "subiendo" ? t.subiendo : estado.fase === "lista" ? t.lista : "";

  return (
    <div className="space-y-3">
      <p id={`${id}-etiqueta`} className="font-semibold">
        {etiqueta}
      </p>
      <p id={`${id}-ayuda`} className="-mt-2 text-sm text-texto-suave">
        {tipo === "foto" ? t.ayudaFoto : t.ayudaLogo}
      </p>

      {vista ? (
        <Image
          src={vista}
          alt={t.miniatura}
          width={96}
          height={96}
          unoptimized
          className={`size-24 rounded-[14px] border border-borde bg-superficie-suave ${tipo === "logo" ? "object-contain" : "object-cover"}`}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={`${id}-archivo`}
          className={`${clasesBoton({ variante: "secundario" })} cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foco`}
        >
          <span aria-hidden="true">{hayImagen ? t.cambiar : t.elegir}</span>
          <input
            ref={entrada}
            id={`${id}-archivo`}
            type="file"
            accept="image/*"
            aria-label={etiqueta}
            aria-describedby={`${id}-ayuda`}
            disabled={ocupado}
            onChange={(e) => alElegir(e.target.files?.[0])}
            className="sr-only"
          />
        </label>
        {vista && onQuitar ? (
          <button type="button" onClick={quitar} disabled={ocupado} className={clasesBoton({ variante: "fantasma" })}>
            {t.quitar}
          </button>
        ) : null}
      </div>

      {ocupado ? <progress className="block h-2 w-full accent-primario" aria-label={mensaje} /> : null}
      <p role="status" aria-live="polite" className="text-sm text-texto-suave">
        {mensaje}
      </p>
      {estado.fase === "error" ? (
        <p role="alert" className="text-sm font-medium text-peligro">
          {t.errores[estado.error]}
        </p>
      ) : null}
    </div>
  );
}
