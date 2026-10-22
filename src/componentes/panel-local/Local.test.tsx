import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { FranjaHoraria } from "@/lib/tipos/dominio";
import type { EstadoFormulario } from "@/lib/tipos/resultado";
import type { ComprobarDireccion } from "./CampoDireccion";
import { EditorHorarios } from "./EditorHorarios";
import { FormularioColor } from "./FormularioColor";
import { FormularioDatosLocal } from "./FormularioDatosLocal";
import { FormularioDireccionCarta } from "./FormularioDireccionCarta";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const OK: EstadoFormulario = { ok: true, datos: undefined };

describe("FormularioDatosLocal", () => {
  const inicial = { nombre: "La Guagua", descripcion: null, direccion: "Calle Mayor 1", telefono: null, permitirIndexar: true };

  it("envía los campos y enseña «Guardado.»", async () => {
    const guardar = vi.fn(async (_p: EstadoFormulario, d: FormData): Promise<EstadoFormulario> => {
      expect(d.get("nombre")).toBe("La Guagua 2");
      expect(d.get("permitirIndexar")).toBeNull();
      return OK;
    });
    render(<FormularioDatosLocal inicial={inicial} guardar={guardar} />);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "La Guagua 2" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Que mi carta salga en Google/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }));
    expect(await screen.findByText("Guardado.")).toBeTruthy();
    expect(guardar).toHaveBeenCalledTimes(1);
  });

  it("muestra el error del campo en español, no el código", async () => {
    const guardar = vi.fn(async (): Promise<EstadoFormulario> => ({ ok: false, error: "datos_invalidos", campos: { telefono: "formato" } }));
    render(<FormularioDatosLocal inicial={inicial} guardar={guardar} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }));
    expect(await screen.findByText("Revisa el formato.")).toBeTruthy();
  });
});

describe("FormularioDireccionCarta", () => {
  it("avisa de que los QR impresos seguirán funcionando y no guarda sin cambios", () => {
    const comprobar = vi.fn<ComprobarDireccion>(async () => "libre");
    render(<FormularioDireccionCarta slugActual="la-guagua" urlBase="https://x.app" guardar={vi.fn(async () => null)} comprobar={comprobar} />);
    expect(screen.getByText(/Si ya has impreso QR, seguirán funcionando/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Guardar dirección" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("con una dirección nueva y libre se puede guardar", async () => {
    vi.useFakeTimers();
    const comprobar = vi.fn<ComprobarDireccion>(async () => "libre");
    render(<FormularioDireccionCarta slugActual="la-guagua" urlBase="https://x.app" guardar={vi.fn(async () => null)} comprobar={comprobar} />);
    fireEvent.change(screen.getByLabelText("Dirección"), { target: { value: "la-guagua-2" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect((screen.getByRole("button", { name: "Guardar dirección" }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("FormularioColor", () => {
  const montar = (guardar = vi.fn(async () => OK)) => {
    render(<FormularioColor inicial="#b9461a" nombreLocal="La Guagua" guardar={guardar} />);
    return guardar;
  };
  const guardarBtn = () => screen.getByRole("button", { name: "Guardar color" }) as HTMLButtonElement;

  it("ofrece 8 colores sugeridos", () => {
    montar();
    expect(screen.getAllByRole("button", { name: /^Usar el color/ })).toHaveLength(8);
  });

  it("un color demasiado claro avisa y no deja guardar", () => {
    montar();
    expect(guardarBtn().disabled).toBe(false);
    fireEvent.change(screen.getByLabelText("O elige otro color"), { target: { value: "#ffee99" } });
    expect(screen.getByRole("alert").textContent).toContain("demasiado claro");
    expect(guardarBtn().disabled).toBe(true);
  });

  it("elegir un sugerido vuelve a permitir guardar y envía el color", async () => {
    const guardar = montar(vi.fn(async (_p: EstadoFormulario, d: FormData) => (d.get("colorMarca") === "#1d4f91" ? OK : null)) as never);
    fireEvent.change(screen.getByLabelText("O elige otro color"), { target: { value: "#ffee99" } });
    fireEvent.click(screen.getByRole("button", { name: "Usar el color azul" }));
    expect(guardarBtn().disabled).toBe(false);
    fireEvent.click(guardarBtn());
    expect(await screen.findByText("Guardado.")).toBeTruthy();
    expect(guardar).toHaveBeenCalled();
  });
});

describe("EditorHorarios", () => {
  const montar = (inicial: FranjaHoraria[] = [{ dia: 1, abre: "08:00", cierra: "16:00" }], guardar = vi.fn(async () => OK)) => {
    render(<EditorHorarios inicial={inicial} guardar={guardar} />);
    return guardar;
  };

  it("enseña la vista previa con resumirHorarios", () => {
    montar([
      { dia: 1 as const, abre: "08:00", cierra: "16:00" },
      { dia: 2 as const, abre: "08:00", cierra: "16:00" },
    ]);
    const vista = screen.getByRole("group", { name: "Así se verá" });
    expect(within(vista).getByText("L–M")).toBeTruthy();
    expect(within(vista).getByText(/08:00–16:00/)).toBeTruthy();
  });

  it("añadir franjas hasta un máximo de 3", () => {
    montar();
    for (let i = 0; i < 2; i++) fireEvent.click(screen.getByRole("button", { name: /Añadir franja Lunes/ }));
    expect(screen.getAllByLabelText(/^Abre/)).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /Añadir franja Lunes/ })).toBeNull();
    expect(screen.getByText("Máximo 3 franjas por día.")).toBeTruthy();
  });

  it("quitar la única franja cierra el día", () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: "Quitar la franja 1 de Lunes" }));
    expect(screen.queryAllByLabelText(/^Abre/)).toHaveLength(0);
    expect(screen.getByText("Todavía no has puesto horarios.")).toBeTruthy();
  });

  it("copiar el lunes a los laborables y guardar envía FranjaHoraria[]", async () => {
    const guardar = montar();
    fireEvent.click(screen.getByRole("button", { name: "Copiar el lunes a todos los días laborables" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar horarios" }));
    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    const enviado = (guardar.mock.calls[0] as unknown[])[0];
    expect(enviado).toEqual([1, 2, 3, 4, 5].map((dia) => ({ dia, abre: "08:00", cierra: "16:00" })));
    expect(await screen.findByText("Guardado.")).toBeTruthy();
  });

  it("no guarda si abre y cierra son iguales", () => {
    const guardar = montar([{ dia: 1, abre: "08:00", cierra: "08:00" }]);
    expect(screen.getByRole("alert").textContent).toContain("no pueden ser iguales");
    expect((screen.getByRole("button", { name: "Guardar horarios" }) as HTMLButtonElement).disabled).toBe(true);
    expect(guardar).not.toHaveBeenCalled();
  });
});
