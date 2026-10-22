import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

let ruta = "/";
vi.mock("next/navigation", () => ({ usePathname: () => ruta }));

const { NavegacionPanel } = await import("./NavegacionPanel");

const ID = "3f1c2d4e-0000-4000-8000-000000000001";
afterEach(cleanup);

describe("NavegacionPanel", () => {
  it("pinta las 5 pestañas con texto y enlace", () => {
    ruta = `/panel/${ID}`;
    render(<NavegacionPanel localId={ID} nombreLocal="La Guagua" />);
    const nav = screen.getByRole("navigation", { name: "Panel" });
    const enlaces = within(nav).getAllByRole("link");
    expect(enlaces.map((a) => a.textContent)).toEqual(["Inicio", "Carta", "Menú", "Local", "QR"]);
    expect(enlaces[1].getAttribute("href")).toBe(`/panel/${ID}/carta`);
  });

  it("marca la pestaña activa con aria-current=page", () => {
    ruta = `/panel/${ID}/carta/plato/nuevo`;
    render(<NavegacionPanel localId={ID} nombreLocal="La Guagua" />);
    const actual = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(actual.map((a) => a.textContent)).toEqual(["Carta"]);
  });

  it("ninguna marcada fuera de las pestañas", () => {
    ruta = `/panel/${ID}/vista-previa`;
    render(<NavegacionPanel localId={ID} nombreLocal="La Guagua" />);
    expect(screen.getAllByRole("link").some((a) => a.hasAttribute("aria-current"))).toBe(false);
  });

  it("enseña el nombre del local", () => {
    ruta = `/panel/${ID}`;
    render(<NavegacionPanel localId={ID} nombreLocal="La Guagua" />);
    expect(screen.getAllByText("La Guagua").length).toBeGreaterThan(0);
  });
});
