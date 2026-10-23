import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BotonTraducir } from "./BotonTraducir";
import { CampoTraduccion } from "./CampoTraduccion";
import { EstadoIdioma } from "./EstadoIdioma";
import { SelectorIdiomas } from "./SelectorIdiomas";

afterEach(cleanup);

describe("SelectorIdiomas", () => {
  it("el español no se puede desactivar y se envía siempre", () => {
    render(<SelectorIdiomas activos={["es", "en"]} guardar={vi.fn()} />);
    const es = screen.getByRole("switch", { name: "Español" });
    expect(es.getAttribute("aria-checked")).toBe("true");
    expect((es as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(es);
    expect(es.getAttribute("aria-checked")).toBe("true");
    const enviados = [...document.querySelectorAll<HTMLInputElement>('input[name="idiomas"]')].map((i) => i.value);
    expect(enviados).toEqual(["es", "en"]);
  });

  it("activar un idioma lo añade al envío", () => {
    render(<SelectorIdiomas activos={["es"]} guardar={vi.fn()} />);
    fireEvent.click(screen.getByRole("switch", { name: "Français" }));
    const enviados = [...document.querySelectorAll<HTMLInputElement>('input[name="idiomas"]')].map((i) => i.value);
    expect(enviados).toEqual(["es", "fr"]);
  });
});

describe("EstadoIdioma", () => {
  it("cuenta traducidos, avisa de correcciones y enlaza", () => {
    render(
      <EstadoIdioma
        resumen={{ idioma: "en", total: 34, faltan: 2, desactualizadasManual: 2 }}
        localId="L1"
        slug="bar"
        publicado
      />,
    );
    expect(screen.getByText("32 de 34 textos traducidos")).toBeTruthy();
    expect(screen.getByText("2 correcciones tuyas para revisar")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Revisar textos/ }).getAttribute("href")).toBe("/panel/L1/idiomas/en");
    expect(screen.getByRole("link", { name: /Ver la carta/ }).getAttribute("href")).toBe("/c/bar/en");
  });
});

describe("BotonTraducir", () => {
  it("apagado: texto claro y botón desactivado", () => {
    render(<BotonTraducir traducir={vi.fn()} servicioApagado hayIdiomas />);
    expect(screen.getByText(/traducción automática aún no está disponible/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Traducir lo que falta" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("corte por cuota", async () => {
    const traducir = vi.fn().mockResolvedValue({ ok: true, datos: { traducidos: 5, caracteres: 9, cortadoPorCuota: true } });
    render(<BotonTraducir traducir={traducir} servicioApagado={false} hayIdiomas />);
    fireEvent.click(screen.getByRole("button", { name: "Traducir lo que falta" }));
    await waitFor(() => expect(screen.getByText("Hemos traducido una parte; mañana seguimos con el resto.")).toBeTruthy());
  });

  it("si la acción dice servicio_apagado, se apaga", async () => {
    const traducir = vi.fn().mockResolvedValue({ ok: false, error: "servicio_apagado" });
    render(<BotonTraducir traducir={traducir} servicioApagado={false} hayIdiomas />);
    fireEvent.click(screen.getByRole("button", { name: "Traducir lo que falta" }));
    await waitFor(() => expect(screen.getByText(/aún no está disponible/)).toBeTruthy());
    expect((screen.getByRole("button", { name: "Traducir lo que falta" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("CampoTraduccion", () => {
  const base = {
    localId: "L1",
    tabla: "platos" as const,
    filaId: "P1",
    campo: "nombre",
    idioma: "en" as const,
    rotulo: "Nombre en English",
    original: "Patatas bravas",
  };

  it("guardar cambia la insignia a «Corregida por ti» y ofrece volver a la automática", async () => {
    const guardar = vi.fn().mockResolvedValue({ ok: true, datos: undefined });
    render(
      <CampoTraduccion {...base} traduccion="Potatoes" estado="al_dia_auto" guardar={guardar} descartar={vi.fn()} />,
    );
    expect(screen.getByText("Automática")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Volver a la automática" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Nombre en English"), { target: { value: "Spicy potatoes" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByText("Corregida por ti")).toBeTruthy());
    expect(guardar).toHaveBeenCalledTimes(1);
    const datos = guardar.mock.calls[0]![1] as FormData;
    expect(datos.get("texto")).toBe("Spicy potatoes");
    expect(datos.get("idioma")).toBe("en");
    expect(screen.getByRole("button", { name: "Volver a la automática" })).toBeTruthy();
  });

  it("«Volver a la automática» quita la corrección", async () => {
    const descartar = vi.fn().mockResolvedValue({ ok: true, datos: undefined });
    render(
      <CampoTraduccion {...base} traduccion="Mi texto" estado="al_dia_manual" guardar={vi.fn()} descartar={descartar} />,
    );
    expect(screen.getByText("Corregida por ti")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Volver a la automática" }));
    await waitFor(() => expect(screen.getByText("Falta")).toBeTruthy());
    expect(descartar).toHaveBeenCalledTimes(1);
  });

  it("enseña «Revisa: el español cambió» y conserva el texto del dueño", () => {
    render(
      <CampoTraduccion {...base} traduccion="Mi texto" estado="desactualizada_manual" guardar={vi.fn()} descartar={vi.fn()} />,
    );
    expect(screen.getByText("Revisa: el español cambió")).toBeTruthy();
    expect((screen.getByLabelText("Nombre en English") as HTMLTextAreaElement).value).toBe("Mi texto");
  });

  it("un error del servidor se enseña en español", async () => {
    const guardar = vi.fn().mockResolvedValue({ ok: false, error: "datos_invalidos" });
    render(<CampoTraduccion {...base} traduccion="x" estado="falta" guardar={guardar} descartar={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("no puede estar vacío"));
    expect(screen.getByText("Falta")).toBeTruthy();
  });
});
