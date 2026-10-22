// Textos de /entrar y /auth/* (carril acceso). Español sencillo, de tú.

export const accesoEs = {
  metaTitulo: "Entrar",
  paso1: {
    antetitulo: "Paso 1 de 2",
    titulo: "Entra en tu panel",
    texto: "Te enviamos un código de 6 cifras a tu correo. Sin contraseñas.",
    correo: "Tu correo",
    correoMarcador: "tu@correo.com",
    enviar: "Enviarme el código",
    separador: "o",
    google: "Continuar con Google",
    nota: "Al entrar por primera vez te pediremos aceptar las",
    condiciones: "condiciones del servicio",
    y: "y la",
    privacidad: "política de privacidad",
  },
  paso2: {
    antetitulo: "Paso 2 de 2",
    titulo: "Escribe el código",
    enviado: "Si el correo es correcto, te llegará un código en unos segundos. Mira también en «Spam».",
    enviadoA: "Correo:",
    codigo: "Código de 6 cifras",
    entrar: "Entrar",
    reenviar: "Reenviar código",
    reenviado: "Te hemos enviado un código nuevo. Usa el del último correo.",
    cambiarCorreo: "Cambiar correo",
  },
  errores: {
    correo: "Escribe un correo válido, como nombre@gmail.com.",
    codigoFormato: "El código son 6 cifras, sin letras.",
    codigoIncorrecto: "Ese código no es correcto o ha caducado. Revisa el último correo o pide otro.",
    limiteEnvio: "Espera un minuto antes de pedir otro código.",
    limiteVerificar: "Demasiados intentos. Espera un minuto y prueba otra vez.",
    servidor: "No hemos podido hacerlo ahora. Prueba otra vez en unos segundos.",
  },
  errorPagina: {
    metaTitulo: "No se ha podido entrar",
    titulo: "No se ha podido entrar",
    texto: "El enlace ha caducado o algo ha fallado al volver de Google. Prueba otra vez: suele funcionar a la segunda.",
    volver: "Volver a entrar",
  },
} as const;

export type DiccionarioAcceso = typeof accesoEs;
