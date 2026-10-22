import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AccesoEfectivo } from "@/lib/tipos/cuentas";
import { BloqueAcceso } from "./BloqueAcceso";
import { BotonPublicar } from "./BotonPublicar";
import { ListaPasos } from "./ListaPasos";

afterEach(cleanup);

const acceso = (c: Partial<AccesoEfectivo>): AccesoEfectivo => ({
  estado: "prueba",
  plan: "carta_resenas",
  activo: true,
  diasRestantes: 23,
  vigenteHasta: "2026-12-01T00:00:00Z",
  ...c,
});

describe("BloqueAcceso", () => {
  it("prueba con días", () => {
    render(<BloqueAcceso acceso={acceso({})} correoTitular="a@b.es" />);
    expect(screen.getByText("Prueba gratis: te quedan 23 días.")).toBeTruthy();
  });
  it("un solo día en singular", () => {
    render(<BloqueAcceso acceso={acceso({ diasRestantes: 1 })} correoTitular="a@b.es" />);
    expect(screen.getByText("Prueba gratis: te quedan 1 día.")).toBeTruthy();
  });
  it("piloto", () => {
    render(<BloqueAcceso acceso={acceso({ estado: "piloto", diasRestantes: 40 })} correoTitular="a@b.es" />);
    expect(screen.getByText("Piloto: 40 días.")).toBeTruthy();
  });
  it("caducado avisa de que la carta no se ve y da el correo", () => {
    render(<BloqueAcceso acceso={acceso({ estado: "vencido", activo: false, diasRestantes: 0 })} correoTitular="hola@kartana.app" />);
    expect(screen.getByRole("alert").textContent).toContain("Tu carta no se ve");
    expect(screen.getByRole("link", { name: "hola@kartana.app" }).getAttribute("href")).toBe("mailto:hola@kartana.app");
  });
});

describe("ListaPasos", () => {
  it("marca hechos y pendientes con texto y enlaza al sitio donde se hace", () => {
    render(
      <ListaPasos
        localId="L1"
        pasos={[
          { clave: "seccionYPlato", hecho: true },
          { clave: "logo", hecho: false },
          { clave: "qr", hecho: false },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0].textContent).toContain("Hecho");
    expect(items[1].textContent).toContain("Pendiente");
    expect(screen.getByRole("link", { name: /Sube tu logo/ }).getAttribute("href")).toBe("/panel/L1/local");
    expect(screen.getByRole("link", { name: /Descarga tu QR/ }).getAttribute("href")).toBe("/panel/L1/qr");
  });
});

describe("BotonPublicar", () => {
  it("publica con un clic", async () => {
    const cambiar = vi.fn(async () => ({ ok: true as const, datos: undefined }));
    render(<BotonPublicar publicado={false} cambiar={cambiar} />);
    fireEvent.click(screen.getByRole("button", { name: "Publicar mi carta" }));
    await waitFor(() => expect(cambiar).toHaveBeenCalledWith(true));
  });

  it("despublicar pide confirmación", async () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
    const cambiar = vi.fn(async () => ({ ok: true as const, datos: undefined }));
    render(<BotonPublicar publicado cambiar={cambiar} />);
    fireEvent.click(screen.getByRole("button", { name: "Despublicar" }));
    expect(cambiar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Sí, despublicar" }));
    await waitFor(() => expect(cambiar).toHaveBeenCalledWith(false));
  });

  it("enseña el error en español, no el técnico", async () => {
    const cambiar = vi.fn(async () => ({ ok: false as const, error: "error_servidor" as const }));
    render(<BotonPublicar publicado={false} cambiar={cambiar} />);
    fireEvent.click(screen.getByRole("button", { name: "Publicar mi carta" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Algo ha fallado");
  });
});
