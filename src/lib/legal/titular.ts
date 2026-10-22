// Datos del titular del servicio (LSSI art. 10). Se completan en el punto de control 4,
// tras el alta fiscal. Mientras tanto se muestran como pendientes, sin inventar datos.

export const TITULAR = {
  nombre: "Rubén Pérez",
  nif: "Pendiente (alta fiscal en trámite)",
  domicilio: "Pendiente (alta fiscal en trámite)",
  correo: "rubenpd66@gmail.com",
  pais: "España",
} as const;

export type Titular = typeof TITULAR;
