# Tests SQL

No hay base de datos local (sin Docker): estos tests se ejecutan contra el proyecto remoto **después** de aplicar las migraciones, y **siempre dentro de una transacción que acaba en `rollback`**, para no dejar datos de prueba.

| Archivo | Prueba | Necesita |
|---|---|---|
| `01_rls_v01.sql` | RLS, permisos por columna, triggers, CHECK y funciones (`activar_piloto`, prueba gratis, límites, borrado de cuenta) | `*_modelo_v01.sql` |
| `02_storage_v01.sql` | Políticas del bucket `imagenes` (carpeta propia sí, carpeta ajena no, `svg` no) | `*_modelo_v01.sql` y `*_imagenes_v01.sql` |

## Cómo ejecutarlos (director)

Con `execute_sql` del MCP de Supabase, envolviendo el archivo entero:

```sql
begin;
-- …contenido del archivo…
rollback;
```

- Si todo va bien, el último `select` devuelve `OK: <archivo> sin fallos`.
- Si algo falla, se lanza `FALLO: …` y la transacción se aborta (el `rollback` lo deshace todo igual).
- Los tests crean usuarios falsos en `auth.users` con ids fijos (`11111111-…`, `22222222-…`…) y correos `@test.kartana`; el `rollback` los quita.

## Comprobaciones tras aplicar las migraciones

1. `get_advisors` de **seguridad**: cero avisos (RLS activa con políticas en todas las tablas; funciones con `search_path` fijo).
2. `get_advisors` de **rendimiento**: cero avisos. En especial, que cada clave foránea tenga índice (`locales.dueno_id`, `slugs_anteriores.local_id`, `accesos.actualizado_por`, `secciones.local_id`, `platos.local_id`, `platos.seccion_id`, `menus.local_id`…) y que las políticas usen `(select auth.uid())`.
3. El bucket `imagenes` existe, es público para leer y limita tipos y tamaño.
4. Generar los tipos (`generate_typescript_types`) en `src/lib/datos/database.types.ts`.
