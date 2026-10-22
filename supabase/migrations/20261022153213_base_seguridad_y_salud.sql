-- Fase 1 · Base de seguridad y comprobación de salud.

-- Esquema privado: no está expuesto en la API de datos. Aquí van funciones internas.
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

-- RLS automática en toda tabla nueva del esquema public (guía oficial de Supabase,
-- «Event Triggers»). Las tablas siguen necesitando sus políticas: sin políticas, nadie accede.
create or replace function privado.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name = 'public' then
      execute format('alter table if exists %s enable row level security', cmd.object_identity);
      raise log 'rls_auto_enable: RLS activada en %', cmd.object_identity;
    end if;
  end loop;
end;
$$;

revoke all on function privado.rls_auto_enable() from public, anon, authenticated;

create event trigger ensure_rls
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function privado.rls_auto_enable();

-- Salud: la usa /api/health (y el cron diario que evita que el proyecto gratis se pause).
-- No lee datos de nadie: solo confirma que la base de datos responde.
create or replace function public.salud()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select 'ok'::text;
$$;

revoke all on function public.salud() from public;
grant execute on function public.salud() to anon, authenticated;
