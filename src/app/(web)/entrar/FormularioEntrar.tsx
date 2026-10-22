"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Aviso } from "@/componentes/ui/Aviso";
import { Boton } from "@/componentes/ui/Boton";
import { BotonEnviar } from "@/componentes/ui/BotonEnviar";
import { Campo } from "@/componentes/ui/Campo";
import {
  entrarConGoogle,
  enviarCodigo,
  verificarCodigo,
  type EstadoEnviarCodigo,
  type EstadoVerificarCodigo,
} from "@/lib/auth/acciones-entrar";
import { accesoEs as t } from "@/lib/i18n/acceso.es";
import { LogoGoogle } from "./LogoGoogle";

function errorEnvio(estado: EstadoEnviarCodigo): string | null {
  if (!estado || estado.ok) return null;
  if (estado.error === "datos_invalidos") return t.errores.correo;
  if (estado.error === "limite_alcanzado") return t.errores.limiteEnvio;
  return t.errores.servidor;
}

function errorVerificar(estado: EstadoVerificarCodigo): string | null {
  if (!estado || estado.ok) return null;
  if (estado.error === "limite_alcanzado") return t.errores.limiteVerificar;
  if (estado.campos?.codigo === "formato") return t.errores.codigoFormato;
  if (estado.campos?.codigo === "incorrecto") return t.errores.codigoIncorrecto;
  if (estado.campos?.correo) return t.errores.correo;
  return t.errores.servidor;
}

/**
 * Entrar en dos pasos en la misma página: correo → código de 6 cifras.
 * Las acciones validan otra vez en el servidor; aquí solo se ayuda al usuario.
 */
export function FormularioEntrar({ siguiente }: { siguiente: string }) {
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [correo, setCorreo] = useState("");
  const [reenvios, setReenvios] = useState(0);
  const tituloCodigo = useRef<HTMLHeadingElement>(null);

  const [estadoEnvio, enviar] = useActionState(async (previo: EstadoEnviarCodigo, datos: FormData) => {
    const r = await enviarCodigo(previo, datos);
    if (r?.ok) {
      setCorreo(r.datos.correo);
      if (datos.get("reenvio") === "1") setReenvios((n) => n + 1);
      setPaso("codigo");
    }
    return r;
  }, null);
  const [estadoVerificar, verificar] = useActionState(verificarCodigo, null);

  // Al pasar al código, el foco va al título del paso 2 (lo anuncia el lector de pantalla).
  useEffect(() => {
    if (paso === "codigo") tituloCodigo.current?.focus();
  }, [paso]);

  if (paso === "correo") {
    const error = errorEnvio(estadoEnvio);
    const enCampo = !!estadoEnvio && !estadoEnvio.ok && estadoEnvio.error === "datos_invalidos";
    return (
      <div className="space-y-4">
        <p className="text-sm text-texto-suave">{t.paso1.antetitulo}</p>
        <h1 className="text-[1.75rem]">{t.paso1.titulo}</h1>
        <p className="text-texto-suave">{t.paso1.texto}</p>

        <form action={enviar} className="space-y-4">
          <Campo
            etiqueta={t.paso1.correo}
            name="correo"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            inputMode="email"
            placeholder={t.paso1.correoMarcador}
            defaultValue={correo}
            error={enCampo ? error : null}
          />
          {error && !enCampo ? <Aviso variante="error">{error}</Aviso> : null}
          <BotonEnviar tamano="grande" bloque>
            {t.paso1.enviar}
          </BotonEnviar>
        </form>

        <div className="flex items-center gap-3 text-sm text-texto-suave before:h-px before:flex-1 before:bg-borde after:h-px after:flex-1 after:bg-borde">
          {t.paso1.separador}
        </div>

        <form action={entrarConGoogle}>
          <input type="hidden" name="siguiente" value={siguiente} />
          {/* Normas de marca de Google: fondo blanco, borde gris, logotipo «G» a color y texto oscuro. */}
          <button
            type="submit"
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-6 text-lg font-semibold text-[#1f1f1f] hover:bg-[#f8f9fa]"
          >
            <LogoGoogle />
            {t.paso1.google}
          </button>
        </form>

        <p className="text-sm text-texto-suave">
          {t.paso1.nota}{" "}
          <Link href="/legal/condiciones" className="underline">
            {t.paso1.condiciones}
          </Link>{" "}
          {t.paso1.y}{" "}
          <Link href="/legal/privacidad" className="underline">
            {t.paso1.privacidad}
          </Link>
          .
        </p>
      </div>
    );
  }

  const errorCodigo = errorVerificar(estadoVerificar);
  const errorReenvio = errorEnvio(estadoEnvio);
  const errorEnCampo = !!(estadoVerificar && !estadoVerificar.ok && estadoVerificar.campos?.codigo);

  return (
    <div className="space-y-4">
      <p className="text-sm text-texto-suave">{t.paso2.antetitulo}</p>
      <h1 ref={tituloCodigo} tabIndex={-1} className="text-[1.75rem] focus:outline-none">
        {t.paso2.titulo}
      </h1>
      {errorReenvio ? (
        <Aviso variante="error">{errorReenvio}</Aviso>
      ) : (
        <Aviso variante="exito">
          {reenvios > 0 ? t.paso2.reenviado : t.paso2.enviado}{" "}
          <span className="block text-sm">
            {t.paso2.enviadoA} <strong className="break-all">{correo}</strong>
          </span>
        </Aviso>
      )}

      <form action={verificar} className="space-y-4">
        <input type="hidden" name="correo" value={correo} />
        <input type="hidden" name="siguiente" value={siguiente} />
        <Campo
          etiqueta={t.paso2.codigo}
          name="codigo"
          type="text"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          title={t.errores.codigoFormato}
          claseEntrada="text-center text-[2rem] font-bold tracking-[0.5em]"
          error={errorEnCampo ? errorCodigo : null}
        />
        {errorCodigo && !errorEnCampo ? <Aviso variante="error">{errorCodigo}</Aviso> : null}
        <BotonEnviar tamano="grande" bloque>
          {t.paso2.entrar}
        </BotonEnviar>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <form action={enviar}>
          <input type="hidden" name="correo" value={correo} />
          <input type="hidden" name="reenvio" value="1" />
          <BotonEnviar variante="fantasma">{t.paso2.reenviar}</BotonEnviar>
        </form>
        <Boton variante="fantasma" onClick={() => setPaso("correo")}>
          {t.paso2.cambiarCorreo}
        </Boton>
      </div>
    </div>
  );
}
