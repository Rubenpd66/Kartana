import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { EditorMenu } from "./EditorMenu";

afterEach(cleanup);

const LOCAL = "3f1c2d4e-0000-4000-8000-000000000001";

function montar(guardar = vi.fn().mockResolvedValue({ ok: true, datos: { menuId: "m" } })) {
  render(<EditorMenu localId={LOCAL} menu={null} acciones={{ guardar, borrar: vi.fn() }} />);
  return guardar;
}

describe("EditorMenu", () => {
  it("empieza con Primeros, Segundos y Postres, cada uno con un plato vacío", () => {
    montar();
    expect((screen.getByLabelText("Nombre del menú") as HTMLInputElement).value).toBe("Menú del día");
    expect((screen.getByLabelText("Nombre del grupo 1") as HTMLInputElement).value).toBe("Primeros");
    expect((screen.getByLabelText("Nombre del grupo 3") as HTMLInputElement).value).toBe("Postres");
    expect(screen.getByLabelText("Segundos: plato 1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lunes" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Sábado" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("añade y quita platos y grupos", () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: "+ Añadir plato a «Primeros»" }));
    expect(screen.getByLabelText("Primeros: plato 2")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Primeros: plato 2"), { target: { value: "Gazpacho" } });
    fireEvent.click(screen.getByRole("button", { name: "Quitar Gazpacho" }));
    expect(screen.queryByLabelText("Primeros: plato 2")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Quitar el grupo «Postres»" }));
    expect(screen.queryByLabelText("Nombre del grupo 3")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "+ Añadir grupo" }));
    expect((screen.getByLabelText("Nombre del grupo 3") as HTMLInputElement).value).toBe("");
  });

  it("no pasa de 12 platos por grupo ni de 6 grupos", () => {
    montar();
    const anadirPlato = screen.getByRole("button", { name: "+ Añadir plato a «Primeros»" }) as HTMLButtonElement;
    for (let i = 0; i < 15; i++) fireEvent.click(anadirPlato);
    expect(screen.getByLabelText("Primeros: plato 12")).toBeTruthy();
    expect(screen.queryByLabelText("Primeros: plato 13")).toBeNull();
    expect(anadirPlato.disabled).toBe(true);

    const anadirGrupo = screen.getByRole("button", { name: "+ Añadir grupo" }) as HTMLButtonElement;
    for (let i = 0; i < 5; i++) fireEvent.click(anadirGrupo);
    expect(screen.getByLabelText("Nombre del grupo 6")).toBeTruthy();
    expect(anadirGrupo.disabled).toBe(true);
  });

  it("guarda una EntradaMenu con los platos, sus alérgenos y el horario", async () => {
    const guardar = montar();
    fireEvent.change(screen.getByLabelText("Precio"), { target: { value: "12,50" } });
    fireEvent.click(screen.getByRole("button", { name: "Sábado" }));
    fireEvent.click(screen.getByLabelText("De… a…"));
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "13:00" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "16:00" } });
    fireEvent.change(screen.getByLabelText("Primeros: plato 1"), { target: { value: "Lentejas" } });
    const alergenos = screen.getByRole("group", { name: "Alérgenos de Lentejas" });
    fireEvent.click(within(alergenos).getByRole("button", { name: "Apio" }));
    fireEvent.click(screen.getAllByLabelText("He revisado los alérgenos")[0]);
    fireEvent.change(screen.getByLabelText(/Notas/), { target: { value: "Incluye pan" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    expect(guardar).toHaveBeenCalledWith({
      localId: LOCAL,
      nombre: "Menú del día",
      precioCentimos: 1250,
      dias: [1, 2, 3, 4, 5, 6],
      horaInicio: "13:00",
      horaFin: "16:00",
      grupos: [
        { titulo: "Primeros", items: [{ nombre: "Lentejas", alergenos: ["apio"], alergenosConfirmados: true }] },
        { titulo: "Segundos", items: [] },
        { titulo: "Postres", items: [] },
      ],
      notas: "Incluye pan",
      visible: true,
    });
  });

  it("no guarda sin días y lo explica", () => {
    const guardar = montar();
    for (const dia of ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]) fireEvent.click(screen.getByRole("button", { name: dia }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(guardar).not.toHaveBeenCalled();
    expect(screen.getByText("Elige al menos un día.")).toBeTruthy();
  });
});
