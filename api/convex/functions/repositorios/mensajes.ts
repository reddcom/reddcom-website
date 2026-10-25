import type { QueryCtx } from "../_generated/server";
import { repositorioBase } from "../lib/repositorio";

export const mensajes = {
  ...repositorioBase("mensajes"),

  // Más recientes primero.
  listar: (ctx: QueryCtx) => ctx.db.query("mensajes").withIndex("by_fecha").order("desc").collect(),

  contarSinLeer: async (ctx: QueryCtx) =>
    (await ctx.db.query("mensajes").withIndex("by_leido_fecha", (q) => q.eq("leido", false)).collect()).length,

  // Mensajes del mismo correo desde `desde` (para limitar el envío repetido).
  recientesDe: (ctx: QueryCtx, correo: string, desde: number) =>
    ctx.db
      .query("mensajes")
      .withIndex("by_correo_fecha", (q) => q.eq("correo", correo).gte("fecha", desde))
      .collect(),
};
