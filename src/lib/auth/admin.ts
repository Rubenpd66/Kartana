// Segunda llave del administrador: el correo debe estar en ADMIN_EMAILS (la primera es app_metadata.rol).

/** true si `correo` está en `lista` (correos separados por comas; sin distinguir mayúsculas ni espacios). */
export function esCorreoAdmin(correo: string, lista: string | undefined): boolean {
  const buscado = correo.trim().toLowerCase();
  if (!buscado || !lista) return false;
  return lista
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .some((c) => c !== "" && c === buscado);
}
