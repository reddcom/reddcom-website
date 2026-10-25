import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { repositorioBase } from "../lib/repositorio";

export const vacantes = {
  ...repositorioBase("vacantes"),

  // Más recientes primero.
  listarActivas: (ctx: QueryCtx) =>
    ctx.db
      .query("vacantes")
      .withIndex("by_activa_fecha", (q) => q.eq("activa", true))
      .order("desc")
      .collect(),

  // Activas primero (true > false en orden descendente) y luego por fecha.
  listarTodas: (ctx: QueryCtx) =>
    ctx.db.query("vacantes").withIndex("by_activa_fecha").order("desc").collect(),

  buscarPorSlug: (ctx: QueryCtx, slug: string) =>
    ctx.db
      .query("vacantes")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique(),

  primeraDePuesto: (ctx: QueryCtx, puestoId: Id<"puestos">) =>
    ctx.db
      .query("vacantes")
      .withIndex("by_puesto", (q) => q.eq("puestoId", puestoId))
      .first(),

  primeraDeCiudad: (ctx: QueryCtx, ciudadId: Id<"ciudades">) =>
    ctx.db
      .query("vacantes")
      .withIndex("by_ciudad", (q) => q.eq("ciudadId", ciudadId))
      .first(),
};

export const vacanteDetalles = {
  ...repositorioBase("vacanteDetalles"),

  listarPorVacante: (ctx: QueryCtx, vacanteId: Id<"vacantes">) =>
    ctx.db
      .query("vacanteDetalles")
      .withIndex("by_vacante_orden", (q) => q.eq("vacanteId", vacanteId))
      .collect(),
};
