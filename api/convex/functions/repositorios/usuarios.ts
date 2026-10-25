import type { Rol } from "../../compartido/roles";
import type { QueryCtx } from "../_generated/server";
import { repositorioBase } from "../lib/repositorio";

export const usuarios = {
  ...repositorioBase("usuarios"),

  buscarPorCorreo: (ctx: QueryCtx, correo: string) =>
    ctx.db
      .query("usuarios")
      .withIndex("by_correo", (q) => q.eq("correo", correo))
      .unique(),

  listar: (ctx: QueryCtx) => ctx.db.query("usuarios").collect(),

  contarConRol: async (ctx: QueryCtx, rol: Rol) =>
    (await ctx.db.query("usuarios").withIndex("by_rol", (q) => q.eq("rol", rol)).collect()).length,

  hayAlguno: async (ctx: QueryCtx) => (await ctx.db.query("usuarios").first()) !== null,
};
