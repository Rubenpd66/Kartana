# Carril `datos-v03` · v0.3 · Ola 1

> Agente recomendado: `kit-datos` · modelo **opus**, esfuerzo **medium**. Carril corto: en cuanto entregues, el director aplica tu migración (sin esperar al carril `resenas`, que trabaja a la vez).


> **Decisiones del usuario (23/10/2026), mandan sobre el resto de este documento:**
> - **D2: no se guarda el nombre de la ficha de Google.** No existe `google_place_nombre` ni `nombreFicha` (ni columna, ni CHECK, ni grant, ni campo en tipos, esquemas o límites). El panel enseña «Ficha de Google conectada» y un enlace «Comprobar en Google Maps» (`https://www.google.com/maps/place/?q=place_id:<placeId>`). El nombre de Place Details solo se muestra en el momento de elegir y no se guarda.
> - D1: se rechazan los enlaces cortos `maps.app.goo.gl`. D3: al conectar la ficha, el botón se enciende solo. D4: el QR de reseña se puede descargar antes de conectar la ficha. D5: sin mirar el plan contratado. D6: la carta `demo` no lleva botón de reseña. D7: Places en la política de privacidad sin subir versión.
> - D8: la navegación del panel pasa a **Inicio, Carta, Menú, QR y «Más»** (en «Más»: Idiomas, Reseñas, Visitas, Local). La hace el director en la integración 1.

## Objetivo

Preparar la base de datos y la capa de datos de las **reseñas en Google**: dónde se escribe la reseña de cada local (su `place_id` de Google o el enlace oficial «Pedir reseñas»), si el botón está encendido, un **freno de gasto** para el buscador de Google y las **reglas puras** que usan los demás carriles (construir el enlace de Google, entender un enlace pegado, detectar textos prohibidos). Todo con RLS, permisos por columna y validación Zod.

## Archivos propios

- `supabase/migrations/<timestamp>_resenas_v03.sql` (créalo con `npx supabase migration new resenas_v03`)
- `supabase/tests/05_resenas_v03.sql`
- `src/lib/dominio/resenas.ts` + `resenas.test.ts`
- `src/lib/validacion/resenas.ts` + `resenas.test.ts`
- `src/lib/datos/resenas.ts` + `resenas.test.ts`
- Cambios en `src/lib/datos/filas.ts` y `src/lib/datos/pruebas/**` si los necesitas (tipos de fila y clientes simulados).

## Contratos

**Usa**:
- El modelo de la v0.1 y la v0.2 ya aplicado (migraciones en `supabase/migrations/`). En particular `privado.es_dueno_de`, `privado.es_admin`, `privado.local_visible`, `privado.limpiar_estadisticas()` y la RPC `public.registrar_estadisticas(p_local, p_tipo, p_idioma, p_platos)`, que **ya acepta** `p_tipo = 'resena'` y suma `clics_resena + 1` (migración `20261023124551_idiomas_estadisticas_v02.sql`).
- `src/lib/tipos/resenas.ts` (todos los tipos de reseñas) y el bloque «v0.3 · Reseñas» de `src/lib/tipos/contratos.ts`.
- `etiquetaCarta`, `etiquetaLocal`, `trasGuardarCarta` de `src/lib/datos/cache.ts` (no lo cambies).
- Patrones ya hechos que debes imitar: `src/lib/datos/estadisticas.ts` (`registrarEvento`: cliente público, nunca lanza), `src/lib/datos/traducciones.ts` (`consumirCuotaTraduccion`), `src/lib/datos/publico.ts` (`'use cache'` + `cacheTag` + `buscarSlugActual`), `src/lib/datos/mutaciones.ts` (Zod + `getClaims` + RLS + `trasGuardarCarta`).

**Produce** (exactamente estos nombres y firmas; compruébalo con `export const x: Firma = …`):
- `src/lib/dominio/resenas.ts`: `LIMITES_RESENAS` (`satisfies LimitesResenas`), `rutaResena`, `urlEscribirResena`, `urlFichaEnMaps`, `interpretarEnlaceGoogle`, `contieneTextoProhibidoResena`.
- `src/lib/validacion/resenas.ts`: `esquemaBuscarLugares`, `esquemaElegirFicha`, `esquemaEnlaceManual`, `esquemaFichaGoogle`, `esquemaResenasActivas`, `esquemaSlugRuta` (cada uno `satisfies z.ZodType<EntradaX>` cuando hay tipo de entrada).
- `src/lib/datos/resenas.ts`: `obtenerConfigResenas`, `guardarFichaGoogle`, `cambiarResenasActivas`, `quitarFichaGoogle`, `obtenerDestinoResena`, `registrarClicResena`, `consumirCuotaLugares`.

Los usarán: `resenas` (ola 1, a la vez que tú, contra estas firmas), `carta-publica-v03` y `qr-resena` (ola 2).

## Migración (detalle en `docs/arquitectura.md` §3.7)

1. **Columnas en `locales`**: `google_place_id text null` (`~ '^[A-Za-z0-9_-]{10,300}$'`), `google_place_nombre text null` (1–120), `google_enlace_resena text null` (`~ '^https://g\.page/r/[A-Za-z0-9_-]{6,100}/review$'`), `resenas_activas boolean not null default false`.
2. **CHECKs de tabla**: `num_nonnulls(google_place_id, google_enlace_resena) <= 1`; `google_place_nombre is null or google_place_id is not null`; `not resenas_activas or num_nonnulls(google_place_id, google_enlace_resena) = 1`. Ponles nombre (`locales_resena_un_destino`, …) para que los tests puedan buscarlos.
3. **Permisos por columna** (la tabla usa `grant` por columna: sin esto nada funciona):
   - `grant select (google_place_id, google_enlace_resena, resenas_activas) on public.locales to anon;` (**no** `google_place_nombre`).
   - `grant update (google_place_id, google_place_nombre, google_enlace_resena, resenas_activas) on public.locales to authenticated;`
   - Las políticas RLS de `locales` no cambian.
4. **Tabla `uso_lugares`** (`local_id` FK con `on delete cascade`, `dia date`, `peticiones integer not null default 0 check (peticiones >= 0)`, PK `(local_id, dia)`), `enable row level security`, políticas SELECT dueño (`(select privado.es_dueno_de(local_id))`) y SELECT admin (`(select privado.es_admin())`), `to authenticated`. **Sin** INSERT/UPDATE/DELETE. `revoke all … from anon`; `grant select … to authenticated`.
5. **Cuota**: `privado.consumir_cuota_lugares_def(p_local uuid) returns boolean` (`security definer`, `set search_path = ''`, nombres calificados): `false` si `not privado.es_dueno_de(p_local)`; día en hora de Madrid; bloquea con `for update` (o `pg_advisory_xact_lock` fijo para el total mensual); si la fila del día ya tiene 50 o la suma del mes en curso de **todos** los locales llega a 4.000 → `false`; si no, `insert … on conflict do update set peticiones = peticiones + 1` y `true`. `public.consumir_cuota_lugares(p_local uuid) returns boolean` (`security invoker`) solo la llama. Permisos: `revoke all on function … from public, anon;` `grant execute … to authenticated;` para las dos (la definer está en `privado`, sin exponer por la API).
6. **Limpieza**: `create or replace function privado.limpiar_estadisticas()` con el mismo cuerpo de la v0.2 **más** el borrado de `uso_lugares` de más de 400 días. Copia el cuerpo actual de la migración de la v0.2 sin quitar nada.
7. Nada de `drop … if exists` innecesarios (el servidor pide una confirmación aparte que aquí se rechaza sola).

## Reglas puras (`src/lib/dominio/resenas.ts`)

- `LIMITES_RESENAS = { nombreFicha: 120, enlaceManual: 500, busquedaMin: 3, busquedaMax: 100, sugerencias: 5, peticionesLugaresDia: 50, peticionesLugaresMes: 4000 }`.
- `rutaResena("bar-pepe")` → `"/r/bar-pepe"`.
- `urlEscribirResena({ tipo: "place_id", placeId })` → `"https://search.google.com/local/writereview?placeid=" + encodeURIComponent(placeId)`; `{ tipo: "enlace", enlace }` → `enlace`.
- `urlFichaEnMaps(placeId)` → `"https://www.google.com/maps/place/?q=place_id:" + encodeURIComponent(placeId)`.
- `interpretarEnlaceGoogle(texto)` (recorta espacios; máximo `enlaceManual` caracteres; si no, null):
  - `https://g.page/r/<código>/review` (también `http://`, con `/` final, con `?…` o `#…`) → `{ tipo: "enlace", enlace: "https://g.page/r/<código>/review" }`. Código `[A-Za-z0-9_-]{6,100}`.
  - URL de `search.google.com` con ruta `/local/writereview` y parámetro `placeid` → `{ tipo: "place_id", placeId }`.
  - URL de `www.google.com`/`google.com`/`maps.google.com` (o `google.es`) con `place_id:<id>` en el parámetro `q` o `query_place_id=<id>` → `place_id`.
  - Texto sin espacios ni `/` que cumple `^[A-Za-z0-9_-]{10,300}$` → `place_id`.
  - Todo lo demás → null (`maps.app.goo.gl/…`, `goo.gl/maps/…`, otras webs, `javascript:`…). Usa `new URL()` dentro de `try`; compara el `hostname` exacto, nunca con `includes`.
- `contieneTextoProhibidoResena(texto)`: normaliza (minúsculas, sin tildes) y busca patrones de **incentivo** y de **filtro** en los 7 idiomas. Como mínimo: es `descuento, regalo, regalamos, sorteo, premio, gratis, invitamos, invitación, a cambio, 5 estrellas, cinco estrellas, si te ha gustado, si te gusto, si estas contento, si estas satisfecho, valoranos con`; en `discount, free, gift, giveaway, prize, in exchange, 5 stars, five stars, if you liked, if you enjoyed, if you are happy, if you're happy`; fr `reduction, remise, cadeau, gratuit, concours, en echange, 5 etoiles, si vous avez aime`; de `rabatt, geschenk, gratis, gewinnspiel, im austausch, 5 sterne, funf sterne, wenn es ihnen gefallen hat`; ca `descompte, regal, sorteig, gratuit, a canvi, 5 estrelles, si t'ha agradat`; eu `deskontu, opari, zozketa, doan, 5 izar`; gl `desconto, agasallo, sorteo, de balde, a cambio, 5 estrelas, se che gustou`; y el carácter `★`. Palabras completas (límites de palabra) para no dar falsos positivos.

## Tareas (en orden; cada una empieza por su test)

1. **Tests SQL** `supabase/tests/05_resenas_v03.sql` (mismo estilo que `03_…` y `04_…`, en `begin; … rollback;`): (a) `anon` lee `resenas_activas`, `google_place_id` y `google_enlace_resena` de una carta visible y **no** `google_place_nombre` (error de permiso); (b) el dueño A guarda un `place_id` y enciende; el dueño B no puede tocar el local de A; (c) los tres CHECK: dos destinos a la vez → error; nombre sin `place_id` → error; encender sin destino → error; formato de `place_id` y de `g.page` inválidos → error; (d) nadie (`anon` ni `authenticated`) puede `insert`/`update` en `uso_lugares`; (e) `consumir_cuota_lugares` como dueño: 50 veces `true`, la 51 `false`; como otro usuario → `false`; como `anon` → sin permiso; (f) `registrar_estadisticas(local, 'resena', 'es', '{}')` como `anon` suma 1 a `clics_resena` de un local visible y 0 a uno sin publicar. Ejecútalos con `execute_sql` en `begin; <migración>; <tests>; rollback;` (autorizado por el director); si no puedes, déjalos listos y dilo en el informe.
2. **Migración** (ver arriba).
3. **`src/lib/dominio/resenas.ts`**. Tests: cada forma aceptada de `interpretarEnlaceGoogle` (con espacios, con `?hl=es`, con barra final, `http`) y cada rechazo (`maps.app.goo.gl`, `https://evil.com/?q=place_id:ChIJ…`, `https://g.page.evil.com/r/x/review`, texto con espacios, 501 caracteres, cadena vacía); `urlEscribirResena` codifica; `contieneTextoProhibidoResena`: detecta cada patrón (con y sin tildes y mayúsculas) y **no** salta con la frase `botonResena` de los 7 diccionarios (`import { diccionarioCarta } from "@/lib/i18n/carta"` y recorre `IDIOMAS_CARTA`), ni con «¿Qué te ha parecido?», «Déjanos tu opinión en Google», «Escanea el código con la cámara».
4. **`src/lib/validacion/resenas.ts`**. Tests: `q` de 2 letras → error, de 101 → error, con espacios alrededor → recortado; `sesion` no uuid → error; `esquemaEnlaceManual` rechaza lo que `interpretarEnlaceGoogle` rechaza; `esquemaFichaGoogle` exige `nombreFicha` null con destino `enlace` y ≤ 120; `esquemaSlugRuta` acepta `demo` y `e2e-prueba`, rechaza `Bar Pepe`, `-x`, `a`, 41 caracteres.
5. **`src/lib/datos/resenas.ts`** (`import "server-only"`). Tests con el cliente simulado de `src/lib/datos/pruebas/`:
   - `obtenerConfigResenas(localId)`: `crearClienteServidor()`; si el id no es uuid o no hay fila → null; mapea a `ConfigResenas` (destino según la columna que tenga valor).
   - `guardarFichaGoogle`, `cambiarResenasActivas`, `quitarFichaGoogle`: Zod → `getClaims()` (sin usuario → `no_autenticado`) → `update` con la sesión (RLS) poniendo **siempre las cuatro columnas a la vez** (el destino nuevo, el otro a null, el nombre, `resenas_activas`) → 0 filas → `no_encontrado`; violación de CHECK → `datos_invalidos` → `trasGuardarCarta(localId)` (importado de `cache.ts`; si el slug no hace falta, pásale solo el id). Encender sin destino → `datos_invalidos` sin llamar a la base de datos si ya lo sabes.
   - `obtenerDestinoResena(slug)`: `'use cache'`, `cacheLife("hours")`, `cacheTag(etiquetaCarta(slug))`, `crearClientePublico()`; busca por `slug`; si no, `slugs_anteriores` → local por id; con fila: `cacheTag(etiquetaLocal(id))` y devuelve `{ localId, slugActual, destino }` (`destino` null si `resenas_activas` es false). Sin fila → null. Mira cómo lo hace `buscarSlugActual` en `publico.ts`.
   - `registrarClicResena(localId)`: si no es uuid, nada; `crearClientePublico().rpc("registrar_estadisticas", { p_local, p_tipo: "resena", p_idioma: "es", p_platos: [] })`; **nunca lanza** (como `registrarEvento`), y no registra nada del visitante.
   - `consumirCuotaLugares(localId)`: `crearClienteServidor().rpc("consumir_cuota_lugares", { p_local })`; cualquier error → `false`.
6. Si al acabar `database.types.ts` necesita las columnas nuevas para que compile, **no lo edites a mano**: usa tipos locales en `filas.ts` y pide al director que regenere los tipos en tu informe.

## Criterios de terminado

- Ninguna tabla nueva acepta escrituras directas; `anon` no ve `google_place_nombre`.
- No se puede encender el botón sin destino (CHECK en SQL y comprobación en TypeScript).
- `contieneTextoProhibidoResena` probado en los 7 idiomas y sin falsos positivos con las frases reales.
- Firmas del contrato implementadas; lint, tipos, tests y build en verde.

## No toques

`src/lib/datos/cache.ts`, `src/lib/datos/estadisticas.ts`, `src/lib/validacion/idiomas.ts` (el canal `/api/e` **no** debe aceptar `resena`), `src/lib/tipos/*`, `src/lib/i18n/*`, `src/app/**`, migraciones ya aplicadas.

## Reglas de reseñas (obligatorias)

Fuente: `docs/brief.md` → «Reglas de reseñas» (política de Google y ley española de competencia desleal y consumidores).
1. **Igual para todos**: el botón y el QR llevan directos a Google, sin preguntar antes «¿te ha gustado?», sin estrellas y sin mostrarse solo a algunos clientes (*review gating*, prohibido).
2. **Sin incentivos**: ningún texto ofrece ni sugiere descuentos, regalos, sorteos ni nada a cambio de una reseña (ni de cambiarla o borrarla).
3. **Sin guiones**: no se pide mencionar a un empleado ni un contenido concreto.
4. **Kartana nunca escribe ni publica reseñas** por nadie.
5. Ningún dato del cliente del bar: ni cookies, ni almacenamiento en su móvil, ni IP, ni identificadores. Los clics se cuentan solo como un número por día.

## Contexto del proyecto (para quien no ha leído nada más)

**Kartana** es un SaaS para bares y restaurantes pequeños de España: carta digital con QR siempre al día (14 alérgenos UE, 7 idiomas) y, en esta v0.3, un botón limpio para pedir reseñas en Google. El dueño usa el panel **desde el móvil, con prisa**; el cliente del bar abre la carta escaneando un QR, a veces con mala cobertura y a veces siendo turista.

- Repositorio: `C:\Users\RUBEN\carta-qr` (git, rama `main`). Web de pruebas: https://kartana-six.vercel.app
- Stack: **Next.js 16.4** (App Router, **Cache Components** y Partial Prefetching activados, `src/proxy.ts`), React 19.3, TypeScript estricto, Tailwind 4, **Zod 4**, Supabase (Postgres + Auth + Storage, proyecto `iewlsyvdkxzcncrbhpyx`, eu-central-1), Vercel. Versiones exactas en `package.json`.
- Documentos de referencia (léelos si necesitas más detalle, pero este encargo basta): `docs/arquitectura.md` (§3.7 y §5.7 son la v0.3), `docs/propiedad.md`, `src/lib/tipos/*.ts`.
- Ya existen y **no los modifiques**: clientes de Supabase en `src/lib/supabase/` — `crearClienteServidor()` (con la sesión por cookies; quien lo use debe estar dentro de `<Suspense>`), `crearClientePublico()` (anónimo, sin cookies, para `'use cache'`), `crearClienteNavegador()`, `crearClienteAdmin()` (**no usar**: no hay clave secreta). `leerInterruptores()` en `src/lib/config/interruptores.ts` (`resenasApi` = `RESENAS_API_ACTIVA`). Idiomas en `src/lib/i18n/idiomas.ts`. `urlSitio()` en `src/lib/config/sitio.ts`. `trasGuardarCarta`, `etiquetaCarta`, `etiquetaLocal` en `src/lib/datos/cache.ts`. `esBot()` en `src/lib/estadisticas/bots.ts`. `exigirUsuario()` en `src/lib/auth/sesion.ts`, `obtenerLocalActual()` en `src/lib/panel/local-actual.ts`. Componentes de interfaz en `src/componentes/ui/`. `diccionarioCarta(idioma)` en `src/lib/i18n/carta.ts` (incluye `textos.botonResena` en los 7 idiomas).

## Reglas técnicas obligatorias

1. **Lee la documentación instalada** de Next en `node_modules/next/dist/docs/` antes de usar una API de Next (esta versión cambia cosas). Para Supabase y librerías, documentación oficial (Context7). No inventes APIs.
2. **Cache Components**: leer `cookies()`, `headers()` o la sesión fuera de `<Suspense>` es error de build. Los datos públicos van con `'use cache'` + `cacheTag`; nunca leas cookies dentro de `'use cache'`.
3. **Sesión**: en servidor, siempre `supabase.auth.getClaims()`; **nunca** `getSession()`. El proxy no protege nada: cada página, acción y route handler comprueba al usuario cerca de los datos.
4. **Validación con Zod en el servidor** en cada acción de servidor y route handler. Errores al usuario como `CodigoError` (`src/lib/tipos/resultado.ts`) traducidos por el diccionario; nunca el mensaje técnico.
5. **Seguridad**: nada de scripts de terceros; nada de `dangerouslySetInnerHTML` (salvo JSON-LD con `<` escapado); ningún secreto en el navegador; nada de cookies ni `localStorage` en la carta pública ni en `/r/`.
6. **Textos**: todos en el diccionario de tu módulo (`src/lib/i18n/<modulo>.es.ts`, objeto `as const`). Español sencillo y cercano, de tú al dueño.
7. **Estilo** (si tocas interfaz): tokens de Tailwind (`bg-fondo`, `bg-superficie`, `bg-superficie-suave`, `text-texto`, `text-texto-suave`, `border-borde`, `bg-primario`, `hover:bg-primario-hover`, `text-sobre-primario`, `text-exito`, `text-aviso`, `text-peligro`, `font-titulo`). Ningún color suelto. Ancho de página solo con `<Contenedor>`. Móvil primero: zonas táctiles de al menos 48 px (`min-h-12`), letra base 17 px, foco visible, «reducir movimiento».
8. **TDD**: primero el test (Vitest, `*.test.ts(x)` junto al código; para módulos con `import "server-only"` usa `vi.mock("server-only", () => ({}))`), míralo fallar, implementa, míralo pasar.
9. **Accesibilidad**: etiquetas en todos los campos, `aria-live` para mensajes de estado, contraste AA, nada que dependa solo del color.

## Forma de trabajar

- Trabaja en tu rama o worktree (`carril/datos-v03`); en un worktree nuevo, `npm ci` primero. **Un commit por tarea**, mensaje en español claro. **No fusiones ni hagas `push` a `main`.**
- Toca **solo tus archivos**. Si necesitas cambiar otro (incluidos `package.json`, `src/lib/tipos/*`, `database.types.ts`), **no lo cambies**: escríbelo en tu informe.
- Si un contrato no te encaja, adapta tu código si puedes y pide el cambio en el informe.
- No apliques migraciones al proyecto remoto (`apply_migration` es del director); sí puedes probarlas en `begin; …; rollback;` con `execute_sql`.

## Comandos de verificación (todos en verde antes de terminar)

```
npm run lint
npm run typecheck
npm test
npm run build
```

## Informe final (tu última respuesta)

1. Qué has hecho, tarea por tarea, con sus commits.
2. Archivos creados o cambiados (todos deben ser tuyos).
3. Resultado de cada comando de verificación y de los tests SQL.
4. **Cambios compartidos pedidos**: archivo, cambio exacto y motivo (p. ej. regenerar `database.types.ts`).
5. Riesgos, dudas y lo que queda pendiente.
