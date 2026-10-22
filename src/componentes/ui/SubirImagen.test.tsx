import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const upload = vi.fn();
const from = vi.fn(() => ({ upload }));
vi.mock("@/lib/supabase/cliente", () => ({ crearClienteNavegador: () => ({ storage: { from } }) }));

const reducirImagen = vi.fn();
vi.mock("@/lib/imagenes/reducir", () => ({ reducirImagen: (...a: unknown[]) => reducirImagen(...a) }));

const { SubirImagen } = await import("./SubirImagen");

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => "blob:vista");
  URL.revokeObjectURL = vi.fn();
  reducirImagen.mockResolvedValue(new Blob(["x"], { type: "image/webp" }));
  upload.mockResolvedValue({ data: { path: "l1/platos/p1/abc.webp" }, error: null });
});
afterEach(cleanup);

function pintar(extra: Partial<Parameters<typeof SubirImagen>[0]> = {}) {
  const onSubida = vi.fn();
  render(
    <SubirImagen
      generarRuta={() => "l1/platos/p1/abc.webp"}
      tipo="foto"
      rutaActual={null}
      urlActual={null}
      etiqueta="Foto del plato"
      onSubida={onSubida}
      {...extra}
    />,
  );
  return onSubida;
}

function elegir(archivo: File) {
  const entrada = screen.getByLabelText("Foto del plato") as HTMLInputElement;
  fireEvent.change(entrada, { target: { files: [archivo] } });
}

describe("SubirImagen", () => {
  it("acepta imágenes y deja usar la cámara del móvil", () => {
    pintar();
    const entrada = screen.getByLabelText("Foto del plato") as HTMLInputElement;
    expect(entrada.type).toBe("file");
    expect(entrada.accept).toBe("image/*");
  });

  it("reduce la foto a WebP 1200, la sube sin sobrescribir y avisa con la ruta", async () => {
    const onSubida = pintar();
    elegir(new File(["foto"], "foto.jpg", { type: "image/jpeg" }));
    await waitFor(() => expect(onSubida).toHaveBeenCalledWith("l1/platos/p1/abc.webp"));
    expect(reducirImagen).toHaveBeenCalledWith(expect.any(File), { ladoMax: 1200, tipo: "image/webp", calidad: 0.8 });
    expect(from).toHaveBeenCalledWith("imagenes");
    expect(upload).toHaveBeenCalledWith("l1/platos/p1/abc.webp", expect.any(Blob), {
      contentType: "image/webp",
      upsert: false,
    });
    expect(screen.getByRole("status").textContent).toContain("Imagen subida");
    expect(screen.getByRole("img", { name: "Vista previa de la imagen" })).toBeTruthy();
  });

  it("los logos se reducen a PNG 512", async () => {
    reducirImagen.mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    const onSubida = pintar({ tipo: "logo", generarRuta: () => "l1/logo/abc.png" });
    elegir(new File(["logo"], "logo.png", { type: "image/png" }));
    await waitFor(() => expect(onSubida).toHaveBeenCalledWith("l1/logo/abc.png"));
    expect(reducirImagen).toHaveBeenCalledWith(expect.any(File), { ladoMax: 512, tipo: "image/png" });
  });

  it("rechaza imágenes de más de 2 MB tras reducir, sin subir", async () => {
    reducirImagen.mockResolvedValue(new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: "image/webp" }));
    const onSubida = pintar();
    elegir(new File(["foto"], "foto.jpg", { type: "image/jpeg" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("2 MB"));
    expect(upload).not.toHaveBeenCalled();
    expect(onSubida).not.toHaveBeenCalled();
  });

  it("si no es una imagen, lo dice", async () => {
    reducirImagen.mockRejectedValue(new Error("no_es_imagen"));
    pintar();
    elegir(new File(["x"], "x.pdf", { type: "application/pdf" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("no es una imagen"));
  });

  it("si falla la subida, lo dice y no avisa", async () => {
    upload.mockResolvedValue({ data: null, error: { message: "403" } });
    const onSubida = pintar();
    elegir(new File(["foto"], "foto.jpg", { type: "image/jpeg" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("No se ha podido subir"));
    expect(onSubida).not.toHaveBeenCalled();
  });

  it("enseña la imagen actual y permite quitarla", () => {
    const onQuitar = vi.fn();
    pintar({ rutaActual: "l1/logo/viejo.png", urlActual: "https://x.supabase.co/viejo.png", onQuitar });
    expect(screen.getByRole("img", { name: "Vista previa de la imagen" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Quitar imagen" }));
    expect(onQuitar).toHaveBeenCalled();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
