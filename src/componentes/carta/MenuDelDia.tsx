import { Insignia } from "@/componentes/ui/Insignia";
import { textoEn, textoHorarioMenu } from "@/lib/carta/textos";
import { formatearPrecio } from "@/lib/dominio/precios";
import type { IdiomaCarta } from "@/lib/i18n/idiomas";
import type { MenuPublico } from "@/lib/tipos/carta";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { ListaAlergenos } from "./ListaAlergenos";

/** Ancla del menú en la navegación de secciones. */
export const anclaMenu = (id: string) => `menu-${id}`;

/** Un menú del día: nombre, precio, días y horas (en texto, sin calcular «hoy»), grupos y notas. */
export function MenuDelDia({
  menu,
  diccionario,
  idioma = "es",
}: {
  menu: MenuPublico;
  diccionario: DiccionarioCarta;
  idioma?: IdiomaCarta;
}) {
  const idTitulo = `titulo-${anclaMenu(menu.id)}`;
  const t = menu.traducciones;
  const nombre = textoEn(menu.nombre, t, "nombre", idioma);
  const notas = menu.notas ? textoEn(menu.notas, t, "notas", idioma) : null;
  return (
    <section id={anclaMenu(menu.id)} aria-labelledby={idTitulo} className="seccion mt-6">
      <div className="menu-dia rounded-2xl bg-superficie p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id={idTitulo} lang={nombre.lang} className="text-[1.375rem] font-semibold">
            {nombre.texto}
          </h2>
          {menu.precioCentimos !== null ? (
            <p className="font-titulo text-2xl font-semibold">{formatearPrecio(menu.precioCentimos, diccionario.locale)}</p>
          ) : null}
        </div>
        <p className="text-[0.9375rem] text-texto-suave">{textoHorarioMenu(menu, diccionario)}</p>

        {menu.grupos.map((grupo) => {
          const titulo = textoEn(grupo.titulo, t, `grupo.${grupo.id}.titulo`, idioma);
          return (
            <div key={grupo.id} className="mt-3">
              <h3 lang={titulo.lang} className="text-[0.8125rem] font-semibold tracking-wider text-texto-suave uppercase">
                {titulo.texto}
              </h3>
              <ul className="mt-1 space-y-2">
                {grupo.items.map((item) => {
                  const nombreItem = textoEn(item.nombre, t, `item.${item.id}.nombre`, idioma);
                  return (
                    <li key={item.id}>
                      <span lang={nombreItem.lang} className="font-medium">
                        {nombreItem.texto}
                      </span>
                      {item.alergenos.length > 0 ? (
                        <ListaAlergenos alergenos={item.alergenos} diccionario={diccionario} tamano={16} />
                      ) : null}
                      {!item.alergenosConfirmados ? (
                        <Insignia variante="aviso" className="ml-2">
                          {diccionario.textos.avisoAlergenos}
                        </Insignia>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {notas ? (
          <p lang={notas.lang} className="mt-3 text-[0.9375rem] text-texto-suave">
            {notas.texto}
          </p>
        ) : null}
      </div>
    </section>
  );
}
