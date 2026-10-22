-- Semilla de la carta de demostración «Cafetería La Guagua» (slug demo).
-- GENERADA con: node --experimental-strip-types src/lib/demo/generar-semilla.ts > supabase/semillas/demo.sql
-- No la edites a mano: cambia src/lib/demo/carta-demo.ts y vuelve a generarla.
-- La ejecuta el director como `postgres` (salta la RLS) DESPUÉS de aplicar las migraciones.
-- Es idempotente: borra el local demo (la cascada borra secciones, platos, menús y acceso) y lo recrea.
-- Precios de la carta real leídos de una foto; descripciones y alérgenos ORIENTATIVOS; sin fotos.

do $$
declare
  v_dueno uuid;
  v_local uuid;
  v_seccion uuid;
begin
  select id into v_dueno from public.perfiles where correo = 'rubenpd66@gmail.com';
  if v_dueno is null then
    raise exception 'El administrador (rubenpd66@gmail.com) debe haber entrado una vez en la web antes de ejecutar esta semilla.';
  end if;

  delete from public.locales where slug = 'demo';

  insert into public.locales
    (dueno_id, slug, nombre, descripcion, direccion, telefono, color_marca, horarios, publicado, permitir_indexar)
  values
    (v_dueno, 'demo', 'Cafetería La Guagua', 'Carta de ejemplo de Kartana con los platos de una cafetería de verdad', null, null, '#a63d12', '[{"dia":1,"abre":"08:00","cierra":"16:30"},{"dia":1,"abre":"19:30","cierra":"23:30"},{"dia":2,"abre":"08:00","cierra":"16:30"},{"dia":2,"abre":"19:30","cierra":"23:30"},{"dia":3,"abre":"08:00","cierra":"16:30"},{"dia":3,"abre":"19:30","cierra":"23:30"},{"dia":4,"abre":"08:00","cierra":"16:30"},{"dia":4,"abre":"19:30","cierra":"23:30"},{"dia":5,"abre":"08:00","cierra":"16:30"},{"dia":5,"abre":"19:30","cierra":"23:30"},{"dia":6,"abre":"08:00","cierra":"16:30"},{"dia":6,"abre":"19:30","cierra":"23:30"}]'::jsonb, true, false)
  returning id into v_local;

  insert into public.secciones (local_id, nombre, descripcion, orden) values (v_local, 'Mariscos', null, 0) returning id into v_seccion;
  insert into public.platos
    (local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas, orden)
  values
    (v_local, v_seccion, 'Parrillada de marisco', 'Surtido de marisco a la plancha, para compartir.', '[{"id":"v001","formato":"racion","texto":null,"centimos":1800}]'::jsonb, array['crustaceos', 'moluscos']::text[], '{}'::text[], true, '{}'::text[], 0),
    (v_local, v_seccion, 'Gamba roja a la plancha', 'Gambas rojas enteras, hechas a la plancha. Se piden por docena o por media docena.', '[{"id":"v001","formato":"media_docena","texto":null,"centimos":700},{"id":"v002","formato":"docena","texto":null,"centimos":1400}]'::jsonb, array['crustaceos']::text[], '{}'::text[], true, '{}'::text[], 1),
    (v_local, v_seccion, 'Gamba blanca', 'Gambas blancas enteras. Se piden por docena o por media docena.', '[{"id":"v001","formato":"media_docena","texto":null,"centimos":550},{"id":"v002","formato":"docena","texto":null,"centimos":1100}]'::jsonb, array['crustaceos']::text[], '{}'::text[], true, '{}'::text[], 2),
    (v_local, v_seccion, 'Langostino a la plancha', 'Langostinos enteros, hechos a la plancha. Se piden por docena o por media docena.', '[{"id":"v001","formato":"media_docena","texto":null,"centimos":400},{"id":"v002","formato":"docena","texto":null,"centimos":800}]'::jsonb, array['crustaceos']::text[], '{}'::text[], true, '{}'::text[], 3),
    (v_local, v_seccion, 'Gamba rebozada', 'Gambas rebozadas y fritas. Se piden por docena o por media docena.', '[{"id":"v001","formato":"media_docena","texto":null,"centimos":250},{"id":"v002","formato":"docena","texto":null,"centimos":500}]'::jsonb, array['crustaceos', 'gluten', 'huevos']::text[], '{}'::text[], true, '{}'::text[], 4),
    (v_local, v_seccion, 'Crujiente de patata y langostino', 'Langostino con patata crujiente. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":125}]'::jsonb, array['crustaceos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 5),
    (v_local, v_seccion, 'Mejillones al vapor', 'Mejillones cocidos al vapor.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":250},{"id":"v002","formato":"racion","texto":null,"centimos":500}]'::jsonb, array['moluscos', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 6),
    (v_local, v_seccion, 'Tellinas', 'Almejas pequeñas de arena, servidas calientes.', '[{"id":"v001","formato":"racion","texto":null,"centimos":700}]'::jsonb, array['moluscos']::text[], '{}'::text[], true, '{}'::text[], 7),
    (v_local, v_seccion, 'Almejas fritas', 'Almejas enharinadas y fritas.', '[{"id":"v001","formato":"racion","texto":null,"centimos":700}]'::jsonb, array['moluscos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 8),
    (v_local, v_seccion, 'Berberechos al vapor', 'Berberechos cocidos al vapor.', '[{"id":"v001","formato":"racion","texto":null,"centimos":650}]'::jsonb, array['moluscos', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 9),
    (v_local, v_seccion, 'Navajas a la plancha', 'Navajas hechas a la plancha. Se piden por docena o por media docena.', '[{"id":"v001","formato":"media_docena","texto":null,"centimos":375},{"id":"v002","formato":"docena","texto":null,"centimos":750}]'::jsonb, array['moluscos']::text[], '{}'::text[], true, '{}'::text[], 10),
    (v_local, v_seccion, 'Vieira', 'Vieira servida en su concha. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":400}]'::jsonb, array['moluscos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 11),
    (v_local, v_seccion, 'Zamburiñas', 'Molusco parecido a la vieira, pero más pequeño. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":150}]'::jsonb, array['moluscos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 12),
    (v_local, v_seccion, 'Tigres', 'Mejillón relleno, rebozado y frito. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":150}]'::jsonb, array['moluscos', 'gluten', 'huevos', 'lacteos']::text[], '{}'::text[], true, '{}'::text[], 13),
    (v_local, v_seccion, 'Salpicón de marisco', 'Marisco troceado con verduras, aliñado y servido frío.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":300},{"id":"v002","formato":"racion","texto":null,"centimos":450}]'::jsonb, array['crustaceos', 'moluscos', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 14),
    (v_local, v_seccion, 'Cangrejo en salsa rosa', 'Cangrejo con salsa rosa, servido frío.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":250},{"id":"v002","formato":"racion","texto":null,"centimos":425}]'::jsonb, array['crustaceos', 'pescado', 'huevos']::text[], '{}'::text[], true, '{}'::text[], 15);

  insert into public.secciones (local_id, nombre, descripcion, orden) values (v_local, 'Pescados y cefalópodos', null, 1) returning id into v_seccion;
  insert into public.platos
    (local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas, orden)
  values
    (v_local, v_seccion, 'Fritura de pescado', 'Pescado variado enharinado y frito.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":700},{"id":"v002","formato":"racion","texto":null,"centimos":950}]'::jsonb, array['pescado', 'gluten', 'moluscos']::text[], '{}'::text[], true, '{}'::text[], 0),
    (v_local, v_seccion, 'Sepia a la plancha', 'Sepia hecha a la plancha.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":600},{"id":"v002","formato":"racion","texto":null,"centimos":900}]'::jsonb, array['moluscos']::text[], '{}'::text[], true, '{}'::text[], 1),
    (v_local, v_seccion, 'Sepia a la andaluza', 'Sepia enharinada y frita, al estilo andaluz.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":600},{"id":"v002","formato":"racion","texto":null,"centimos":900}]'::jsonb, array['moluscos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 2),
    (v_local, v_seccion, 'Calamar a la andaluza o a la plancha', 'Calamar enharinado y frito, o hecho a la plancha. Se elige al pedir.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":475},{"id":"v002","formato":"racion","texto":null,"centimos":725}]'::jsonb, array['moluscos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 3),
    (v_local, v_seccion, 'Calamar en salsa', 'Calamar guisado en salsa.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":275},{"id":"v002","formato":"racion","texto":null,"centimos":475}]'::jsonb, array['moluscos', 'gluten', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 4),
    (v_local, v_seccion, 'Calamares a la romana', 'Calamar rebozado y frito. Se pide por docena o por media docena.', '[{"id":"v001","formato":"media_docena","texto":null,"centimos":240},{"id":"v002","formato":"docena","texto":null,"centimos":475}]'::jsonb, array['moluscos', 'gluten', 'huevos']::text[], '{}'::text[], true, '{}'::text[], 5),
    (v_local, v_seccion, 'Chopitos fritos', 'Chopitos enharinados y fritos.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":400},{"id":"v002","formato":"racion","texto":null,"centimos":650}]'::jsonb, array['moluscos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 6),
    (v_local, v_seccion, 'Habas fritas con chopitos', 'Habas y chopitos fritos.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":325},{"id":"v002","formato":"racion","texto":null,"centimos":475}]'::jsonb, array['moluscos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 7),
    (v_local, v_seccion, 'Pulpo a la gallega', 'Pulpo cocido sobre patata, con aceite y pimentón. En ración mediana o grande.', '[{"id":"v001","formato":"racion_mediana","texto":null,"centimos":1000},{"id":"v002","formato":"racion_grande","texto":null,"centimos":1200}]'::jsonb, array['moluscos']::text[], '{}'::text[], true, '{}'::text[], 8),
    (v_local, v_seccion, 'Bacalao rebozado', 'Bacalao rebozado y frito. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":375}]'::jsonb, array['pescado', 'gluten', 'huevos']::text[], '{}'::text[], true, '{}'::text[], 9),
    (v_local, v_seccion, 'Boquerones en vinagre', 'Boquerones aliñados en vinagre, servidos fríos.', '[{"id":"v001","formato":"racion","texto":null,"centimos":300}]'::jsonb, array['pescado', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 10),
    (v_local, v_seccion, 'Chipirones a la plancha', 'Chipirones a la plancha, con alioli.', '[{"id":"v001","formato":"racion","texto":null,"centimos":850}]'::jsonb, array['moluscos', 'huevos']::text[], '{}'::text[], true, '{}'::text[], 11);

  insert into public.secciones (local_id, nombre, descripcion, orden) values (v_local, 'Cazuelas', null, 2) returning id into v_seccion;
  insert into public.platos
    (local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas, orden)
  values
    (v_local, v_seccion, 'Cazuela de gambas', 'Gambas en cazuela, servidas calientes.', '[{"id":"v001","formato":"racion","texto":null,"centimos":500}]'::jsonb, array['crustaceos', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 0),
    (v_local, v_seccion, 'Cazuela de chopitos', 'Chopitos en cazuela, servidos calientes.', '[{"id":"v001","formato":"racion","texto":null,"centimos":500}]'::jsonb, array['moluscos', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 1),
    (v_local, v_seccion, 'Cazuela de gambas y chopitos', 'Gambas y chopitos en cazuela, servidos calientes.', '[{"id":"v001","formato":"racion","texto":null,"centimos":600}]'::jsonb, array['crustaceos', 'moluscos', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 2),
    (v_local, v_seccion, 'Cazuela de sesos', 'Sesos en cazuela, servidos calientes.', '[{"id":"v001","formato":"racion","texto":null,"centimos":450}]'::jsonb, array['gluten', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 3),
    (v_local, v_seccion, 'Cazuela de gulas y gambas', 'Gulas (hechas con pescado) y gambas en cazuela, servidas calientes.', '[{"id":"v001","formato":"racion","texto":null,"centimos":500}]'::jsonb, array['crustaceos', 'pescado', 'huevos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 4),
    (v_local, v_seccion, 'Cazuela de setas y gambas', 'Setas y gambas en cazuela, servidas calientes.', '[{"id":"v001","formato":"racion","texto":null,"centimos":500}]'::jsonb, array['crustaceos', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 5);

  insert into public.secciones (local_id, nombre, descripcion, orden) values (v_local, 'Carnes y embutidos', null, 3) returning id into v_seccion;
  insert into public.platos
    (local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas, orden)
  values
    (v_local, v_seccion, 'Lacón a la gallega', 'Lacón cocido con aceite y pimentón. En ración mediana o grande.', '[{"id":"v001","formato":"racion_mediana","texto":null,"centimos":550},{"id":"v002","formato":"racion_grande","texto":null,"centimos":600}]'::jsonb, '{}'::text[], '{}'::text[], true, '{}'::text[], 0),
    (v_local, v_seccion, 'Lacón', 'Lacón de cerdo cocido, en lonchas.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":250},{"id":"v002","formato":"racion","texto":null,"centimos":550}]'::jsonb, '{}'::text[], '{}'::text[], true, '{}'::text[], 1),
    (v_local, v_seccion, 'Lomo de orza', 'Lomo de cerdo adobado y conservado en aceite.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":450},{"id":"v002","formato":"racion","texto":null,"centimos":650}]'::jsonb, array['sulfitos']::text[], '{}'::text[], true, '{}'::text[], 2),
    (v_local, v_seccion, 'Magra con tomate', 'Magra de cerdo en salsa de tomate.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":250},{"id":"v002","formato":"racion","texto":null,"centimos":425}]'::jsonb, array['sulfitos']::text[], '{}'::text[], true, '{}'::text[], 3),
    (v_local, v_seccion, 'Albóndigas', 'Albóndigas de carne en salsa. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":125}]'::jsonb, array['gluten', 'huevos', 'lacteos']::text[], '{}'::text[], true, '{}'::text[], 4),
    (v_local, v_seccion, 'Alas de pollo', 'Alas de pollo. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":125}]'::jsonb, array['gluten']::text[], '{}'::text[], true, '{}'::text[], 5),
    (v_local, v_seccion, 'Rollito de lomo relleno', 'Rollito de lomo relleno. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":275}]'::jsonb, array['gluten', 'huevos', 'lacteos']::text[], '{}'::text[], true, '{}'::text[], 6),
    (v_local, v_seccion, 'Rollito de ternera, york, calabacín y crema de queso', 'Rollito de ternera con jamón york, calabacín y crema de queso.', '[{"id":"v001","formato":"racion","texto":null,"centimos":450}]'::jsonb, array['lacteos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 7),
    (v_local, v_seccion, 'Jamón y queso', 'Plato de jamón y queso.', '[{"id":"v001","formato":"racion","texto":null,"centimos":750}]'::jsonb, array['lacteos']::text[], '{}'::text[], true, '{}'::text[], 8),
    (v_local, v_seccion, 'Chorizo y morcilla', 'Chorizo y morcilla. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":150}]'::jsonb, array['gluten']::text[], '{}'::text[], true, '{}'::text[], 9),
    (v_local, v_seccion, 'Ferrero de morcilla', 'Bolita de morcilla con cobertura crujiente. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":150}]'::jsonb, array['gluten', 'huevos', 'frutos_cascara']::text[], '{}'::text[], true, '{}'::text[], 10),
    (v_local, v_seccion, 'Oreja a la plancha', 'Oreja de cerdo a la plancha.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":375},{"id":"v002","formato":"racion","texto":null,"centimos":550}]'::jsonb, '{}'::text[], '{}'::text[], true, '{}'::text[], 11),
    (v_local, v_seccion, 'Rabo frito', 'Rabo de cerdo frito.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":400},{"id":"v002","formato":"racion","texto":null,"centimos":650}]'::jsonb, array['gluten']::text[], '{}'::text[], true, '{}'::text[], 12),
    (v_local, v_seccion, 'Morro frito', 'Morro de cerdo frito.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":350},{"id":"v002","formato":"racion","texto":null,"centimos":600}]'::jsonb, array['gluten']::text[], '{}'::text[], true, '{}'::text[], 13),
    (v_local, v_seccion, 'Landrecillas fritas', 'Landrecillas de cerdo fritas. Son glándulas: un plato de casquería.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":350},{"id":"v002","formato":"racion","texto":null,"centimos":550}]'::jsonb, array['gluten']::text[], '{}'::text[], true, '{}'::text[], 14),
    (v_local, v_seccion, 'Suspiros de jamón con pimientos de Padrón', 'Suspiros de jamón fritos, con pimientos de Padrón.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":375},{"id":"v002","formato":"racion","texto":null,"centimos":600}]'::jsonb, array['gluten', 'lacteos', 'huevos']::text[], '{}'::text[], true, '{}'::text[], 15),
    (v_local, v_seccion, 'Setas con jamón', 'Setas salteadas con jamón.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":250},{"id":"v002","formato":"racion","texto":null,"centimos":475}]'::jsonb, '{}'::text[], '{}'::text[], true, '{}'::text[], 16),
    (v_local, v_seccion, 'Champiñones rellenos de jamón y queso', 'Champiñones rellenos de jamón y queso.', '[{"id":"v001","formato":"racion","texto":null,"centimos":475}]'::jsonb, array['lacteos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 17),
    (v_local, v_seccion, 'Foie de pato con rulo de cabra', 'Foie de pato con queso de cabra.', '[{"id":"v001","formato":"racion","texto":null,"centimos":675}]'::jsonb, array['lacteos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 18);

  insert into public.secciones (local_id, nombre, descripcion, orden) values (v_local, 'Tapas y raciones', null, 4) returning id into v_seccion;
  insert into public.platos
    (local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas, orden)
  values
    (v_local, v_seccion, 'Patatas bravas', 'Patatas fritas con salsa brava y alioli.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":225},{"id":"v002","formato":"racion","texto":null,"centimos":375}]'::jsonb, array['huevos']::text[], array['gluten']::text[], true, '{}'::text[], 0),
    (v_local, v_seccion, 'Patatas con ajo', 'Patatas con salsa de ajo.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":225},{"id":"v002","formato":"racion","texto":null,"centimos":375}]'::jsonb, array['huevos']::text[], '{}'::text[], true, '{}'::text[], 1),
    (v_local, v_seccion, 'Casco de patatas', 'Patata asada con alioli por encima.', '[{"id":"v001","formato":"racion","texto":null,"centimos":125}]'::jsonb, array['huevos']::text[], '{}'::text[], true, '{}'::text[], 2),
    (v_local, v_seccion, 'Ensaladilla rusa', 'Ensaladilla de patata y atún con mayonesa.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":280},{"id":"v002","formato":"racion","texto":null,"centimos":425}]'::jsonb, array['huevos', 'pescado']::text[], '{}'::text[], true, '{}'::text[], 3),
    (v_local, v_seccion, 'Pastel de puerros', 'Pastel de puerros, servido en porción.', '[{"id":"v001","formato":"racion","texto":null,"centimos":500}]'::jsonb, array['huevos', 'lacteos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 4),
    (v_local, v_seccion, 'Berenjena de york y queso', 'Berenjena rellena de jamón york y queso.', '[{"id":"v001","formato":"racion","texto":null,"centimos":275}]'::jsonb, array['gluten', 'huevos', 'lacteos']::text[], '{}'::text[], true, '{}'::text[], 5),
    (v_local, v_seccion, 'Pimientos del piquillo rellenos', 'Pimientos del piquillo rellenos.', '[{"id":"v001","formato":"racion","texto":null,"centimos":225}]'::jsonb, array['gluten', 'lacteos']::text[], '{}'::text[], true, '{}'::text[], 6),
    (v_local, v_seccion, 'Queso frito', 'Dados de queso empanados y fritos, con salsa.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":400},{"id":"v002","formato":"racion","texto":null,"centimos":650}]'::jsonb, array['lacteos', 'gluten', 'huevos']::text[], '{}'::text[], true, '{}'::text[], 7),
    (v_local, v_seccion, 'Chupa-chups de queso de cabra', 'Queso de cabra con forma de piruleta. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":150}]'::jsonb, array['lacteos', 'gluten', 'huevos']::text[], '{}'::text[], true, '{}'::text[], 8),
    (v_local, v_seccion, 'Rollito de salmón y crema de queso', 'Rollito de salmón relleno de crema de queso.', '[{"id":"v001","formato":"racion","texto":null,"centimos":350}]'::jsonb, array['pescado', 'lacteos']::text[], '{}'::text[], true, '{}'::text[], 9),
    (v_local, v_seccion, 'Huevos a la flamenca', 'Huevos con tomate, verduras y embutido.', '[{"id":"v001","formato":"racion","texto":null,"centimos":425}]'::jsonb, array['huevos']::text[], '{}'::text[], true, '{}'::text[], 10),
    (v_local, v_seccion, 'Parrillada de verduras', 'Verduras variadas a la plancha.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":475},{"id":"v002","formato":"racion","texto":null,"centimos":700}]'::jsonb, '{}'::text[], '{}'::text[], true, array['vegetariano']::text[], 11),
    (v_local, v_seccion, 'Espárragos a la plancha', 'Espárragos a la plancha. Se piden por docena.', '[{"id":"v001","formato":"docena","texto":null,"centimos":400}]'::jsonb, '{}'::text[], '{}'::text[], true, array['vegetariano']::text[], 12),
    (v_local, v_seccion, 'Croqueta de jamón y cocido', 'Croqueta de jamón y cocido. Precio por unidad.', '[{"id":"v001","formato":"unidad","texto":null,"centimos":120}]'::jsonb, array['gluten', 'lacteos', 'huevos']::text[], '{}'::text[], true, '{}'::text[], 13);

  insert into public.secciones (local_id, nombre, descripcion, orden) values (v_local, 'Especialidades de la tierra', null, 5) returning id into v_seccion;
  insert into public.platos
    (local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas, orden)
  values
    (v_local, v_seccion, 'Ajo mataero', 'Guiso manchego de hígado de cerdo y pan, típico de la matanza.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":250},{"id":"v002","formato":"racion","texto":null,"centimos":425}]'::jsonb, array['gluten']::text[], '{}'::text[], true, '{}'::text[], 0),
    (v_local, v_seccion, 'Bienmesabe', 'Cazón en adobo: trozos de pescado rebozados y fritos, con limón. No es el postre canario.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":350},{"id":"v002","formato":"racion","texto":null,"centimos":550}]'::jsonb, array['pescado', 'gluten', 'sulfitos']::text[], '{}'::text[], true, '{}'::text[], 1),
    (v_local, v_seccion, 'Atascaburras', 'Puré manchego de bacalao y patata, con ajo y aceite.', '[{"id":"v001","formato":"media_racion","texto":null,"centimos":250},{"id":"v002","formato":"racion","texto":null,"centimos":425}]'::jsonb, array['pescado', 'huevos', 'frutos_cascara']::text[], '{}'::text[], true, '{}'::text[], 2);

  insert into public.secciones (local_id, nombre, descripcion, orden) values (v_local, 'Postres', null, 6) returning id into v_seccion;
  insert into public.platos
    (local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas, orden)
  values
    (v_local, v_seccion, 'Pan de Calatrava', 'Postre de pan, leche y huevo, parecido a un flan.', '[{"id":"v001","formato":"unico","texto":null,"centimos":350}]'::jsonb, array['gluten', 'huevos', 'lacteos']::text[], '{}'::text[], true, '{}'::text[], 0),
    (v_local, v_seccion, 'Tarta de chocolates', 'Tarta con varias capas de chocolate.', '[{"id":"v001","formato":"unico","texto":null,"centimos":400}]'::jsonb, array['gluten', 'huevos', 'lacteos', 'soja']::text[], '{}'::text[], true, '{}'::text[], 1),
    (v_local, v_seccion, 'Flan de huevo', 'Flan de huevo con caramelo.', '[{"id":"v001","formato":"unico","texto":null,"centimos":300}]'::jsonb, array['huevos', 'lacteos']::text[], '{}'::text[], true, '{}'::text[], 2),
    (v_local, v_seccion, 'Tarta de queso', 'Tarta de queso al horno.', '[{"id":"v001","formato":"unico","texto":null,"centimos":400}]'::jsonb, array['lacteos', 'huevos', 'gluten']::text[], '{}'::text[], true, '{}'::text[], 3);

  insert into public.secciones (local_id, nombre, descripcion, orden) values (v_local, 'Cafés y bebidas', null, 7) returning id into v_seccion;
  insert into public.platos
    (local_id, seccion_id, nombre, descripcion, precios, alergenos, trazas, alergenos_confirmados, etiquetas, orden)
  values
    (v_local, v_seccion, 'Café solo', 'Café solo.', '[{"id":"v001","formato":"unico","texto":null,"centimos":130}]'::jsonb, '{}'::text[], '{}'::text[], true, '{}'::text[], 0),
    (v_local, v_seccion, 'Café con leche', 'Café con leche.', '[{"id":"v001","formato":"unico","texto":null,"centimos":160}]'::jsonb, array['lacteos']::text[], '{}'::text[], true, '{}'::text[], 1),
    (v_local, v_seccion, 'Cortado', 'Café con un poco de leche.', '[{"id":"v001","formato":"unico","texto":null,"centimos":140}]'::jsonb, array['lacteos']::text[], '{}'::text[], true, '{}'::text[], 2),
    (v_local, v_seccion, 'Carajillo quemao', 'Café con licor, flambeado.', '[{"id":"v001","formato":"unico","texto":null,"centimos":250}]'::jsonb, '{}'::text[], '{}'::text[], true, '{}'::text[], 3),
    (v_local, v_seccion, 'Cerveza', 'Cerveza de barril, en caña o en jarra.', '[{"id":"v001","formato":"otro","texto":"Caña","centimos":180},{"id":"v002","formato":"jarra","texto":null,"centimos":350}]'::jsonb, array['gluten']::text[], '{}'::text[], true, '{}'::text[], 4),
    (v_local, v_seccion, 'Vino tinto de la casa', 'Vino tinto, por copa o por botella.', '[{"id":"v001","formato":"copa","texto":null,"centimos":220},{"id":"v002","formato":"botella","texto":null,"centimos":1200}]'::jsonb, array['sulfitos']::text[], '{}'::text[], true, '{}'::text[], 5),
    (v_local, v_seccion, 'Agua mineral', 'Agua mineral sin gas.', '[{"id":"v001","formato":"unico","texto":null,"centimos":150}]'::jsonb, '{}'::text[], '{}'::text[], true, '{}'::text[], 6),
    (v_local, v_seccion, 'Refresco', 'Refresco de lata o botella.', '[{"id":"v001","formato":"unico","texto":null,"centimos":200}]'::jsonb, '{}'::text[], '{}'::text[], true, '{}'::text[], 7);

  insert into public.menus
    (local_id, nombre, precio_centimos, dias, hora_inicio, hora_fin, contenido, notas, orden)
  values
    (v_local, 'Menú del día', 1250, array[1,2,3,4,5]::smallint[], '13:00'::time, '16:00'::time, '{"grupos":[{"id":"grp1","titulo":"Primeros","items":[{"id":"grp1i1","nombre":"Ensaladilla rusa","alergenos":["huevos","pescado"],"alergenos_confirmados":true},{"id":"grp1i2","nombre":"Mejillones al vapor","alergenos":["moluscos","sulfitos"],"alergenos_confirmados":true},{"id":"grp1i3","nombre":"Pastel de puerros","alergenos":["huevos","lacteos","gluten"],"alergenos_confirmados":true}]},{"id":"grp2","titulo":"Segundos","items":[{"id":"grp2i1","nombre":"Sepia a la plancha","alergenos":["moluscos"],"alergenos_confirmados":true},{"id":"grp2i2","nombre":"Albóndigas","alergenos":["gluten","huevos","lacteos"],"alergenos_confirmados":true},{"id":"grp2i3","nombre":"Bienmesabe","alergenos":["pescado","gluten","sulfitos"],"alergenos_confirmados":true}]},{"id":"grp3","titulo":"Postres","items":[{"id":"grp3i1","nombre":"Pan de Calatrava","alergenos":["gluten","huevos","lacteos"],"alergenos_confirmados":true},{"id":"grp3i2","nombre":"Tarta de chocolates","alergenos":["gluten","huevos","lacteos","soja"],"alergenos_confirmados":true},{"id":"grp3i3","nombre":"Flan de huevo","alergenos":["huevos","lacteos"],"alergenos_confirmados":true}]}]}'::jsonb, 'Incluye pan, bebida y postre o café', 0);

  -- El disparador crea el acceso inicial (prueba o vencido): la demo no caduca nunca.
  update public.accesos set estado = 'cortesia', vigente_hasta = null where local_id = v_local;
end
$$;
