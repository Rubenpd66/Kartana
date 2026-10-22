import { connection } from "next/server";
import { crearClientePublico } from "@/lib/supabase/servidor";

// Comprobación de salud: la web responde y la base de datos también.
// La llama el cron diario de Vercel (vercel.json) para que Supabase gratis no se pause.
export async function GET() {
  await connection();
  const inicio = performance.now();
  const { data, error } = await crearClientePublico().rpc("salud");
  const bd = !error && data === "ok" ? "ok" : "error";
  return Response.json(
    { estado: bd === "ok" ? "ok" : "degradado", bd, ms: Math.round(performance.now() - inicio) },
    { status: bd === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
