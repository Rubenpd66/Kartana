"use client";

import { useEffect } from "react";
import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { EventoEstadistica } from "@/lib/tipos/estadisticas";

const MAX_PLATOS = 100;

/**
 * Isla de estadísticas: la única pieza de JavaScript de la carta. No pinta nada.
 * Envía una «visita» al cargar y, al ocultar la página, los platos vistos (≥ 50 % en pantalla durante ≥ 1 s).
 * Sin cookies, sin almacenamiento y sin identificadores: solo contadores agregados en el servidor.
 */
export function Medidor({ localId, idioma, modo }: { localId: string; idioma: IdiomaCarta; modo: "publica" | "vista_previa" }) {
  useEffect(() => {
    if (modo !== "publica" || typeof navigator.sendBeacon !== "function") return;
    const enviar = (tipo: EventoEstadistica["tipo"], platos: string[]) => {
      const evento: EventoEstadistica = { tipo, localId, idioma, platos };
      navigator.sendBeacon("/api/e", new Blob([JSON.stringify(evento)], { type: "application/json" }));
    };
    enviar("visita", []);

    const vistos = new Set<string>();
    const esperas = new Map<Element, ReturnType<typeof setTimeout>>();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const { target, isIntersecting } of entradas) {
          const id = (target as HTMLElement).dataset.platoId;
          if (!id) continue;
          if (!isIntersecting) {
            clearTimeout(esperas.get(target));
            esperas.delete(target);
          } else if (!esperas.has(target) && !vistos.has(id)) {
            esperas.set(
              target,
              setTimeout(() => {
                esperas.delete(target);
                if (vistos.size < MAX_PLATOS) vistos.add(id);
              }, 1000),
            );
          }
        }
      },
      { threshold: 0.5 },
    );
    document.querySelectorAll("[data-plato-id]").forEach((el) => observador.observe(el));

    let enviado = false;
    const alOcultar = (e: Event) => {
      if (enviado || (e.type === "visibilitychange" && document.visibilityState !== "hidden")) return;
      enviado = true;
      observador.disconnect();
      if (vistos.size > 0) enviar("vistas", [...vistos]);
    };
    document.addEventListener("visibilitychange", alOcultar);
    window.addEventListener("pagehide", alOcultar);
    return () => {
      observador.disconnect();
      esperas.forEach(clearTimeout);
      document.removeEventListener("visibilitychange", alOcultar);
      window.removeEventListener("pagehide", alOcultar);
    };
  }, [localId, idioma, modo]);

  return null;
}
