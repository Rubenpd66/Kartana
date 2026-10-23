import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("@/lib/supabase/cliente", () => ({ crearClienteNavegador: () => ({}) }));

const { EditorPlato } = await import("./EditorPlato");

afterEach(cleanup);

const LOCAL = "3f1c2d4e-0000-4000-8000-000000000001";
const SECCION = "3f1c2d4e-0000-4000-8000-000000000002";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function montar(guardar = vi.fn()) {
  render(
    <EditorPlato
      localId={LOCAL}
      plato={null}
      seccionInicial={SECCION}
      secciones={[{ id: SECCION, nombre: "Tapas" }]}
      urlFoto={null}
      acciones={{ guardar, borrar: vi.fn() }}
    />,
  );
  return guardar;
}

describe("EditorPlato", () => {
  it("plato simple: nombre, precio, alérgenos y guardar", async () => {
    const guardar = montar(vi.fn().mockResolvedValue({ ok: true, datos: { platoId: "x" } }));
    fireEvent.change(screen.getByLabelText("Nombre del plato"), { target: { value: "Tortilla" } });
    fireEvent.change(screen.getByLabelText("Precio"), { target: { value: "3,5" } });
    fireEvent.click(within(screen.getByRole("group", { name: "Alérgenos" })).getByRole("button", { name: "Huevos" }));
    fireEvent.click(screen.getByLabelText(/He revisado los alérgenos/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    const fd = guardar.mock.calls[0][0] as FormData;
    expect(fd.get("platoId")).toMatch(UUID);
    expect(fd.get("esNuevo")).toBe("true");
    expect(fd.get("localId")).toBe(LOCAL);
    expect(fd.get("seccionId")).toBe(SECCION);
    expect(fd.get("precios.0.importe")).toBe("3,5");
    expect(fd.getAll("alergenos")).toEqual(["huevos"]);
    expect(fd.get("alergenosConfirmados")).toBe("true");
    expect(fd.get("visible")).toBe("true");
  });

  it("no envía si falta el nombre o el precio, y marca los campos", () => {
    const guardar = montar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(guardar).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nombre del plato").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Escribe el precio o marca «Según mercado».")).toBeTruthy();
  });

  it("muestra los errores que devuelve el servidor", async () => {
    montar(vi.fn().mockResolvedValue({ ok: false, error: "error_servidor" }));
    fireEvent.change(screen.getByLabelText("Nombre del plato"), { target: { value: "Tortilla" } });
    fireEvent.change(screen.getByLabelText("Precio"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("No se ha podido guardar. Revisa tu conexión y prueba otra vez.")).toBeTruthy();
  });

  it("avisa de que los alérgenos están sin revisar hasta marcar la casilla", () => {
    montar();
    expect(screen.getByText(/la carta dirá «Consulte al personal sobre alérgenos»/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/He revisado los alérgenos/));
    expect(screen.getByText(/la carta dirá «Sin alérgenos declarados»/)).toBeTruthy();
  });
});
