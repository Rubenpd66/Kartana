import { afterEach, describe, expect, it, vi } from "vitest";
import { esRutaFotoDe, esRutaLogoDe, rutaNuevaFotoPlato, rutaNuevoLogo, urlPublicaImagen } from "./imagenes";

const LOCAL = "3f6c1b2a-8d4e-4f1a-9b2c-0d1e2f3a4b5c";
const PLATO = "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("urlPublicaImagen", () => {
  it("monta la URL pública del bucket imagenes", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co/");
    expect(urlPublicaImagen(`${LOCAL}/logo/ab12cd34.png`)).toBe(
      `https://abc.supabase.co/storage/v1/object/public/imagenes/${LOCAL}/logo/ab12cd34.png`,
    );
  });
});

describe("rutas nuevas", () => {
  it("logo: <localId>/logo/<aleatorio>.png", () => {
    const ruta = rutaNuevoLogo(LOCAL);
    expect(ruta).toMatch(new RegExp(`^${LOCAL}/logo/[a-z0-9]{16}\\.png$`));
    expect(rutaNuevoLogo(LOCAL)).not.toBe(ruta);
    expect(esRutaLogoDe(LOCAL, ruta)).toBe(true);
  });

  it("foto: <localId>/platos/<platoId>/<aleatorio>.webp", () => {
    const ruta = rutaNuevaFotoPlato(LOCAL, PLATO);
    expect(ruta).toMatch(new RegExp(`^${LOCAL}/platos/${PLATO}/[a-z0-9]{16}\\.webp$`));
    expect(esRutaFotoDe(LOCAL, PLATO, ruta)).toBe(true);
  });
});

describe("comprobación de rutas", () => {
  it("rechaza rutas de otro local, otra carpeta o con trucos", () => {
    const otro = "00000000-0000-4000-8000-000000000000";
    expect(esRutaLogoDe(LOCAL, `${otro}/logo/a.png`)).toBe(false);
    expect(esRutaLogoDe(LOCAL, `${LOCAL}/platos/a.png`)).toBe(false);
    expect(esRutaLogoDe(LOCAL, `${LOCAL}/logo/../x/a.png`)).toBe(false);
    expect(esRutaLogoDe(LOCAL, `${LOCAL}/logo/a.svg`)).toBe(false);
    expect(esRutaLogoDe(LOCAL, `${LOCAL}/logo/`)).toBe(false);
    expect(esRutaFotoDe(LOCAL, PLATO, `${LOCAL}/platos/${otro}/a.webp`)).toBe(false);
    expect(esRutaFotoDe(LOCAL, PLATO, `${LOCAL}/platos/${PLATO}/sub/a.webp`)).toBe(false);
    expect(esRutaFotoDe(LOCAL, PLATO, `${LOCAL}/platos/${PLATO}/a.jpg`)).toBe(true);
    expect(esRutaFotoDe(LOCAL, PLATO, `${LOCAL}/platos/${PLATO}/${"a".repeat(300)}.webp`)).toBe(false);
  });
});
