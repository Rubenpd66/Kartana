// Cliente de Supabase simulado para los tests de src/lib/datos. Solo para *.test.ts.
// Cada `from(tabla)` devuelve una consulta encadenable que registra los métodos llamados y, al hacer
// `await`, resuelve con la siguiente respuesta preparada para esa tabla.

export type RespuestaFalsa = { data?: unknown; error?: { code?: string; message?: string } | null; count?: number | null };

export type LlamadaFalsa = { tabla: string; metodos: Array<{ metodo: string; args: unknown[] }> };

type Opciones = {
  tablas?: Record<string, RespuestaFalsa | RespuestaFalsa[]>;
  rpc?: Record<string, RespuestaFalsa | RespuestaFalsa[]>;
  /** Claims de la sesión; null = sin sesión. */
  claims?: { sub: string; email?: string } | null;
  storage?: RespuestaFalsa;
};

const METODOS = [
  "select",
  "insert",
  "update",
  "delete",
  "upsert",
  "eq",
  "neq",
  "in",
  "is",
  "match",
  "order",
  "limit",
  "single",
  "maybeSingle",
  "returns",
] as const;

function siguiente(cola: RespuestaFalsa | RespuestaFalsa[] | undefined): RespuestaFalsa {
  if (cola === undefined) return { data: null, error: null };
  if (Array.isArray(cola)) return cola.length > 1 ? (cola.shift() as RespuestaFalsa) : (cola[0] ?? { data: null, error: null });
  return cola;
}

export function crearSupabaseFalso(opciones: Opciones = {}) {
  const llamadas: LlamadaFalsa[] = [];
  const rpcs: Array<{ funcion: string; args: unknown }> = [];
  const borrados: Array<{ bucket: string; rutas: string[] }> = [];

  const cliente = {
    from(tabla: string) {
      const llamada: LlamadaFalsa = { tabla, metodos: [] };
      llamadas.push(llamada);
      let respuesta: RespuestaFalsa | null = null;
      const consulta: Record<string, unknown> = {};
      for (const metodo of METODOS) {
        consulta[metodo] = (...args: unknown[]) => {
          llamada.metodos.push({ metodo, args });
          return consulta;
        };
      }
      consulta.then = (resolver: (r: RespuestaFalsa) => unknown, rechazar?: (e: unknown) => unknown) => {
        respuesta ??= siguiente(opciones.tablas?.[tabla]);
        return Promise.resolve({ data: null, error: null, ...respuesta }).then(resolver, rechazar);
      };
      return consulta;
    },
    rpc(funcion: string, args?: unknown) {
      rpcs.push({ funcion, args });
      const respuesta = siguiente(opciones.rpc?.[funcion]);
      return Promise.resolve({ data: null, error: null, ...respuesta });
    },
    auth: {
      async getClaims() {
        const claims = opciones.claims === undefined ? { sub: "11111111-1111-4111-8111-111111111111" } : opciones.claims;
        return claims ? { data: { claims }, error: null } : { data: null, error: null };
      },
    },
    storage: {
      from(bucket: string) {
        return {
          async remove(rutas: string[]) {
            borrados.push({ bucket, rutas });
            return { data: [], error: null, ...opciones.storage };
          },
        };
      },
    },
  };

  /** Métodos llamados en las consultas a `tabla` (en orden). */
  const metodosDe = (tabla: string) => llamadas.filter((l) => l.tabla === tabla).map((l) => l.metodos);

  return { cliente, llamadas, rpcs, borrados, metodosDe };
}
