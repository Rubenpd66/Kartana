// Filas de ejemplo (como las devuelve Supabase) para los tests de src/lib/datos. Solo para *.test.ts.

import type { FilaAcceso, FilaLocal, FilaMenu, FilaPlato, FilaSeccion } from "../filas";

export const LOCAL_ID = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";
export const SECCION_ID = "a1111111-1111-4111-8111-111111111111";
export const PLATO_ID = "b1111111-1111-4111-8111-111111111111";
export const MENU_ID = "c1111111-1111-4111-8111-111111111111";
export const USUARIO_ID = "11111111-1111-4111-8111-111111111111";

export function filaLocal(cambios: Partial<FilaLocal> = {}): FilaLocal {
  return {
    id: LOCAL_ID,
    dueno_id: USUARIO_ID,
    slug: "la-guagua",
    nombre: "Cafetería La Guagua",
    descripcion: "Mariscos y tapas",
    direccion: "Calle Mayor 1",
    telefono: "600 000 000",
    logo_ruta: `${LOCAL_ID}/logo/abcd1234abcd1234.png`,
    color_marca: "#b9461a",
    horarios: [{ dia: 1, abre: "12:00", cierra: "16:00" }],
    idioma_base: "es",
    idiomas_activos: ["es"],
    traducciones: {},
    publicado: true,
    permitir_indexar: true,
    creado_en: "2026-10-01T10:00:00+00:00",
    actualizado_en: "2026-10-20T10:00:00+00:00",
    ...cambios,
  };
}

export function filaSeccion(cambios: Partial<FilaSeccion> = {}): FilaSeccion {
  return {
    id: SECCION_ID,
    local_id: LOCAL_ID,
    nombre: "Mariscos",
    descripcion: null,
    orden: 0,
    visible: true,
    traducciones: {},
    creado_en: "2026-10-01T10:00:00+00:00",
    actualizado_en: "2026-10-01T10:00:00+00:00",
    ...cambios,
  };
}

export function filaPlato(cambios: Partial<FilaPlato> = {}): FilaPlato {
  return {
    id: PLATO_ID,
    local_id: LOCAL_ID,
    seccion_id: SECCION_ID,
    nombre: "Pulpo a la gallega",
    descripcion: "Con cachelos",
    precios: [
      { id: "pm01", formato: "racion_mediana", texto: null, centimos: 1000 },
      { id: "pg01", formato: "racion_grande", texto: null, centimos: 1200 },
    ],
    alergenos: ["moluscos"],
    trazas: [],
    alergenos_confirmados: true,
    etiquetas: ["recomendado"],
    foto_ruta: null,
    orden: 0,
    agotado: false,
    visible: true,
    traducciones: {},
    creado_en: "2026-10-01T10:00:00+00:00",
    actualizado_en: "2026-10-02T10:00:00+00:00",
    ...cambios,
  };
}

export function filaMenu(cambios: Partial<FilaMenu> = {}): FilaMenu {
  return {
    id: MENU_ID,
    local_id: LOCAL_ID,
    nombre: "Menú del día",
    precio_centimos: 1200,
    dias: [1, 2, 3, 4, 5],
    hora_inicio: "13:00:00",
    hora_fin: "16:00:00",
    contenido: {
      grupos: [
        {
          id: "gr01",
          titulo: "Primeros",
          items: [{ id: "it01", nombre: "Lentejas", alergenos: ["apio"], alergenos_confirmados: true }],
        },
      ],
    },
    notas: "Incluye pan y bebida",
    orden: 0,
    visible: true,
    traducciones: {},
    creado_en: "2026-10-01T10:00:00+00:00",
    actualizado_en: "2026-10-01T10:00:00+00:00",
    ...cambios,
  };
}

export function filaAcceso(cambios: Partial<FilaAcceso> = {}): FilaAcceso {
  return {
    local_id: LOCAL_ID,
    estado: "prueba",
    plan: "carta_resenas",
    vigente_hasta: "2030-01-01T00:00:00+00:00",
    notas: null,
    actualizado_en: "2026-10-01T10:00:00+00:00",
    actualizado_por: null,
    ...cambios,
  };
}
