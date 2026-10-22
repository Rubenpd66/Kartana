// Textos legales como funciones: se adaptan a los interruptores activos.
// Si cambias el contenido de un documento, sube su versión (se guarda con cada aceptación).
// Base redactada por el director; debe revisarla un profesional antes de cobrar (PC4).

import type { Interruptores } from "@/lib/config/interruptores";
import { SITIO } from "@/lib/config/sitio";
import type { Titular } from "./titular";

export type Seccion = { titulo: string; parrafos: string[] };
export type DocumentoLegal = { titulo: string; version: string; actualizado: string; secciones: Seccion[] };
export type ContextoLegal = { interruptores: Interruptores; titular: Titular };

export const VERSIONES_LEGALES = {
  condiciones: "2026-10-22",
  privacidad: "2026-10-22",
} as const;

export function avisoLegal({ titular }: ContextoLegal): DocumentoLegal {
  return {
    titulo: "Aviso legal",
    version: "2026-10-22",
    actualizado: "22 de octubre de 2026",
    secciones: [
      {
        titulo: "Titular",
        parrafos: [
          `${SITIO.nombre} es un servicio de ${titular.nombre}. NIF: ${titular.nif}. Domicilio: ${titular.domicilio}. Contacto: ${titular.correo}.`,
        ],
      },
      {
        titulo: "Objeto",
        parrafos: [
          `${SITIO.nombre} ofrece a bares, cafeterías y restaurantes una carta digital con código QR y herramientas para pedir reseñas en Google. Es un servicio dirigido a empresas y profesionales.`,
        ],
      },
      {
        titulo: "Contenido de las cartas",
        parrafos: [
          "Cada carta la escribe y la mantiene su establecimiento. La información sobre platos, precios y alérgenos es responsabilidad exclusiva del establecimiento.",
        ],
      },
      {
        titulo: "Ley aplicable",
        parrafos: ["Este sitio se rige por la ley española."],
      },
    ],
  };
}

export function privacidad({ interruptores, titular }: ContextoLegal): DocumentoLegal {
  const encargados = [
    "Supabase (base de datos, cuentas y archivos), con servidores en Fráncfort (UE).",
    "Vercel (alojamiento de la web). Puede tratar datos técnicos en EE. UU. con las garantías del Marco de Privacidad de Datos UE-EE. UU.",
    "Google, solo si eliges «Entrar con Google» (para identificarte).",
  ];
  if (interruptores.traduccion) {
    encargados.push("Google Cloud Translation, para traducir los textos de la carta (no contienen datos personales).");
  }
  if (interruptores.pagos) {
    encargados.push("Stripe, para gestionar la suscripción y los pagos. Kartana no guarda los datos de tu tarjeta.");
  }

  return {
    titulo: "Política de privacidad",
    version: VERSIONES_LEGALES.privacidad,
    actualizado: "22 de octubre de 2026",
    secciones: [
      {
        titulo: "Responsable",
        parrafos: [`${titular.nombre} (${titular.correo}).`],
      },
      {
        titulo: "Qué datos tratamos",
        parrafos: [
          "De los dueños y personal de los establecimientos: correo electrónico, nombre si lo indicas, datos del negocio (nombre, dirección, horarios, logo, carta) y la fecha y versión en que aceptas las condiciones.",
          "De los clientes de los bares que ven una carta: ningún dato personal. No usamos cookies de seguimiento ni identificadores. Solo contamos visitas, platos vistos y clics en «dejar reseña» de forma agregada, sin saber quién es nadie.",
          "Como cualquier web, el proveedor de alojamiento registra datos técnicos (como la dirección IP) durante un tiempo limitado por seguridad.",
        ],
      },
      {
        titulo: "Para qué y con qué base",
        parrafos: [
          "Para prestar el servicio que contratas (ejecución del contrato) y para avisarte de cambios importantes en él.",
          interruptores.pagos
            ? "Para cobrar la suscripción y cumplir las obligaciones fiscales (obligación legal)."
            : "Durante el piloto el servicio es gratuito y no tratamos datos de pago.",
        ],
      },
      { titulo: "Quién nos ayuda (encargados del tratamiento)", parrafos: encargados },
      {
        titulo: "Cuánto tiempo",
        parrafos: [
          "Mientras tengas cuenta. Si te das de baja, borramos tu cuenta y tu carta en un plazo de 30 días, salvo lo que la ley obligue a conservar.",
        ],
      },
      {
        titulo: "Tus derechos",
        parrafos: [
          `Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${titular.correo}. Si no te atendemos bien, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).`,
        ],
      },
    ],
  };
}

export function politicaCookies(): DocumentoLegal {
  return {
    titulo: "Política de cookies",
    version: "2026-10-22",
    actualizado: "22 de octubre de 2026",
    secciones: [
      {
        titulo: "Resumen",
        parrafos: [
          `${SITIO.nombre} no usa cookies de seguimiento, de publicidad ni de analítica. Por eso no te mostramos ningún aviso de cookies.`,
        ],
      },
      {
        titulo: "La única cookie",
        parrafos: [
          "Cuando entras en tu panel guardamos una cookie técnica de sesión (su nombre empieza por «sb-») para que no tengas que identificarte en cada página. Es imprescindible para el servicio y está exenta de consentimiento (art. 22.2 LSSI).",
          "Las cartas públicas que ven los clientes de los bares no guardan ninguna cookie.",
        ],
      },
    ],
  };
}

export function condiciones({ interruptores, titular }: ContextoLegal): DocumentoLegal {
  return {
    titulo: "Condiciones del servicio",
    version: VERSIONES_LEGALES.condiciones,
    actualizado: "22 de octubre de 2026",
    secciones: [
      {
        titulo: "Quién presta el servicio y a quién",
        parrafos: [
          `${SITIO.nombre} lo presta ${titular.nombre}. Se dirige a empresas y profesionales de la hostelería. Al darte de alta confirmas que actúas en nombre de un negocio.`,
        ],
      },
      {
        titulo: "La carta es responsabilidad del establecimiento",
        parrafos: [
          "Tú escribes y mantienes la carta: platos, descripciones, precios y alérgenos. Debes revisar las traducciones automáticas. La información sobre alérgenos es responsabilidad exclusiva del establecimiento (Reglamento UE 1169/2011 y Real Decreto 126/2015). La carta muestra siempre el aviso «Consulte al personal sobre alérgenos».",
        ],
      },
      {
        titulo: "Reseñas en Google: lo que no se puede hacer",
        parrafos: [
          "El botón y el QR de reseña deben ofrecerse a todos los clientes por igual. Está prohibido usarlos para filtrar a los clientes contentos hacia Google y a los descontentos hacia otro sitio.",
          "Está prohibido ofrecer descuentos, regalos, sorteos o cualquier ventaja a cambio de reseñas, o de cambiar o borrar una reseña, y pedir que se mencione a un empleado o un contenido concreto.",
          `${SITIO.nombre} nunca escribe ni publica reseñas por nadie. Incumplir estas reglas permite suspender la cuenta.`,
        ],
      },
      {
        titulo: "Precio y baja",
        parrafos: [
          interruptores.pagos
            ? "Los planes y precios son los publicados en la web, más IVA. La suscripción se renueva sola cada mes o año y puedes cambiar de plan o darte de baja en cualquier momento desde tu panel; la baja surte efecto al final del periodo pagado."
            : "Durante el piloto el servicio es gratuito. Antes de empezar a cobrar te avisaremos con antelación y no se cobrará nada sin que lo aceptes.",
          "Puedes darte de baja cuando quieras escribiendo a " + titular.correo + ".",
        ],
      },
      {
        titulo: "Disponibilidad y responsabilidad",
        parrafos: [
          "Ponemos todos los medios razonables para que el servicio funcione siempre, pero puede haber interrupciones por mantenimiento o causas ajenas. No respondemos de los daños derivados del contenido que publica el establecimiento.",
        ],
      },
      {
        titulo: "Cambios y ley aplicable",
        parrafos: [
          "Si cambiamos estas condiciones te avisaremos y te pediremos que las aceptes de nuevo. Se rigen por la ley española.",
        ],
      },
    ],
  };
}
