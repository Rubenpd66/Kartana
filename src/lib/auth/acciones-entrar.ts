"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { urlSitio } from "@/lib/config/sitio";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { EstadoFormulario, ResultadoError } from "@/lib/tipos/resultado";
import { validarSiguiente } from "./redireccion";

export type EstadoEnviarCodigo = EstadoFormulario<{ correo: string }>;
export type EstadoVerificarCodigo = EstadoFormulario;

const esquemaCorreo = z.string().trim().toLowerCase().max(320).pipe(z.email());
// Se aceptan espacios entre las cifras («482 913»): se quitan antes de validar.
const esquemaCodigo = z.string().transform((v) => v.replace(/\s+/g, "")).pipe(z.string().regex(/^\d{6}$/));

type ErrorAuth = { code?: string; status?: number } | null;

function esLimite(error: ErrorAuth): boolean {
  return !!error && (error.status === 429 || (typeof error.code === "string" && error.code.startsWith("over_")));
}

function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor : "";
}

/** Paso 1: envía el código de 6 cifras. Respuesta neutra: no dice si la cuenta existía. */
export async function enviarCodigo(_previo: EstadoEnviarCodigo, formData: FormData): Promise<EstadoEnviarCodigo> {
  const correo = esquemaCorreo.safeParse(texto(formData, "correo"));
  if (!correo.success) return { ok: false, error: "datos_invalidos", campos: { correo: "invalido" } };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({ email: correo.data, options: { shouldCreateUser: true } });
  if (error) return { ok: false, error: esLimite(error) ? "limite_alcanzado" : "error_servidor" };
  return { ok: true, datos: { correo: correo.data } };
}

/** Paso 2: comprueba el código y lleva al panel (o a `siguiente`, si es una ruta interna). */
export async function verificarCodigo(
  _previo: EstadoVerificarCodigo,
  formData: FormData,
): Promise<EstadoVerificarCodigo> {
  const correo = esquemaCorreo.safeParse(texto(formData, "correo"));
  const codigo = esquemaCodigo.safeParse(texto(formData, "codigo"));
  if (!correo.success || !codigo.success) {
    const campos: ResultadoError["campos"] = {};
    if (!correo.success) campos.correo = "invalido";
    if (!codigo.success) campos.codigo = "formato";
    return { ok: false, error: "datos_invalidos", campos };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ email: correo.data, token: codigo.data, type: "email" });
  if (error) {
    if (esLimite(error)) return { ok: false, error: "limite_alcanzado" };
    return { ok: false, error: "datos_invalidos", campos: { codigo: "incorrecto" } };
  }
  redirect(validarSiguiente(texto(formData, "siguiente")));
}

/** «Continuar con Google»: redirección a Google (sin scripts de Google en la página). */
export async function entrarConGoogle(formData: FormData): Promise<void> {
  const siguiente = validarSiguiente(texto(formData, "siguiente"));
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${urlSitio()}/auth/callback?siguiente=${encodeURIComponent(siguiente)}` },
  });
  if (error || !data?.url) redirect("/auth/error");
  redirect(data.url);
}
