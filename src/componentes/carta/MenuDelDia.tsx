import { Insignia } from "@/componentes/ui/Insignia";
import { textoHorarioMenu } from "@/lib/carta/textos";
import { formatearPrecio } from "@/lib/dominio/precios";
import type { MenuPublico } from "@/lib/tipos/carta";
import type { DiccionarioCarta } from "@/lib/tipos/i18n";
import { ListaAlergenos } from "./ListaAlergenos";

/** Ancla del menú en la navegación de secciones. */
export const anclaMenu = (id: string) => `menu-${id}`;

/** Un menú del día: nombre, precio, días y horas (en texto, sin calcular «hoy»), grupos y notas. */
export function MenuDelDia({ menu, diccionario }: { menu: MenuPublico; diccionario: DiccionarioCarta }) {
  const idTitulo = `titulo-${anclaMenu(menu.id)}`;
  return (
    <section id={anclaMenu(menu.id)} aria-labelledby={idTitulo} className="seccion mt-6">
      <div className="menu-dia rounded-2xl bg-superficie p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id={idTitulo} className="text-[1.375rem] font-semibold">
            {menu.nombre}
          </h2>
          {menu.precioCentimos !== null ? (
            <p className="font-titulo text-2xl font-semibold">{formatearPrecio(menu.precioCentimos, diccionario.locale)}</p>
          ) : null}
        </div>
        <p className="text-[0.9375rem] text-texto-suave">{textoHorarioMenu(menu, diccionario)}</p>

        {menu.grupos.map((grupo) => (
          <div key={grupo.id} className="mt-3">
            <h3 className="text-[0.8125rem] font-semibold tracking-wider text-texto-suave uppercase">{grupo.titulo}</h3>
            <ul className="mt-1 space-y-2">
              {grupo.items.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{item.nombre}</span>
                  {item.alergenos.length > 0 ? (
                    <ListaAlergenos alergenos={item.alergenos} diccionario={diccionario} tamano={16} />
                  ) : null}
                  {!item.alergenosConfirmados ? (
                    <Insignia variante="aviso" className="ml-2">
                      {diccionario.textos.avisoAlergenos}
                    </Insignia>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {menu.notas ? <p className="mt-3 text-[0.9375rem] text-texto-suave">{menu.notas}</p> : null}
      </div>
    </section>
  );
}
