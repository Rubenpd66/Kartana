import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComprobarDireccion } from "./CampoDireccion";
import { FormularioCrearLocal } from "./FormularioCrearLocal";
import { PasoCondiciones } from "./PasoCondiciones";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PasoCondiciones", () => {
  it("no deja continuar sin la casilla y enlaza a los textos legales en pestaña nueva", () => {
    const aceptar = vi.fn(async () => null);
    render(<PasoCondiciones aceptar={aceptar} />);
    const boton = screen.getByRole("button", { name: "Continuar" }) as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    const enlace = screen.getByRole("link", { name: /condiciones del servicio/ });
    expect(enlace.getAttribute("href")).toBe("/legal/condiciones");
    expect(enlace.getAttribute("target")).toBe("_blank");
    expect(screen.getByRole("link", { name: /política de privacidad/ }).getAttribute("href")).toBe("/legal/privacidad");

    fireEvent.click(screen.getByRole("checkbox"));
    expect(boton.disabled).toBe(false);
  });
});

describe("FormularioCrearLocal", () => {
  beforeEach(() => vi.useFakeTimers());

  function montar(comprobar = vi.fn<ComprobarDireccion>(async () => "libre")) {
    render(<FormularioCrearLocal crear={vi.fn(async () => null)} comprobar={comprobar} urlBase="https://kartana-six.vercel.app" />);
    return comprobar;
  }
  const boton = () => screen.getByRole("button", { name: "Crear mi carta" }) as HTMLButtonElement;

  it("sugiere la dirección al escribir el nombre y enseña la dirección final", () => {
    montar();
    fireEvent.change(screen.getByLabelText("Nombre del bar"), { target: { value: "Bar Casa Pepe's" } });
    expect((screen.getByLabelText(/Dirección de tu carta/) as HTMLInputElement).value).toBe("bar-casa-pepes");
    expect(screen.getByText("kartana-six.vercel.app/c/bar-casa-pepes")).toBeTruthy();
  });

  it("comprueba con antirrebote y habilita el botón si está libre", async () => {
    const comprobar = montar();
    fireEvent.change(screen.getByLabelText("Nombre del bar"), { target: { value: "Mi Bar" } });
    expect(boton().disabled).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(399);
    });
    expect(comprobar).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5);
    });
    expect(comprobar).toHaveBeenCalledTimes(1);
    expect(comprobar).toHaveBeenCalledWith("mi-bar");
    expect(screen.getByText("Está libre.")).toBeTruthy();
    expect(boton().disabled).toBe(false);
  });

  it("enseña «ocupado» y no deja crear", async () => {
    montar(vi.fn<ComprobarDireccion>(async () => "ocupado"));
    fireEvent.change(screen.getByLabelText("Nombre del bar"), { target: { value: "Mi Bar" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(screen.getByText("Esa dirección ya la usa otro bar.")).toBeTruthy();
    expect(boton().disabled).toBe(true);
  });

  it("una dirección reservada se rechaza sin preguntar al servidor", async () => {
    const comprobar = montar();
    fireEvent.change(screen.getByLabelText("Nombre del bar"), { target: { value: "Panel" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(comprobar).not.toHaveBeenCalled();
    expect(screen.getByText("Esa dirección no está disponible.")).toBeTruthy();
    expect(boton().disabled).toBe(true);
  });

  it("si el dueño edita la dirección, deja de seguir al nombre", () => {
    montar();
    fireEvent.change(screen.getByLabelText("Nombre del bar"), { target: { value: "Mi Bar" } });
    fireEvent.change(screen.getByLabelText(/Dirección de tu carta/), { target: { value: "otro" } });
    fireEvent.change(screen.getByLabelText("Nombre del bar"), { target: { value: "Mi Bar 2" } });
    expect((screen.getByLabelText(/Dirección de tu carta/) as HTMLInputElement).value).toBe("otro");
  });
});
