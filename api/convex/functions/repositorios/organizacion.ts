import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { repositorioBase } from "../lib/repositorio";

export const areas = {
  ...repositorioBase("areas"),

  listar: (ctx: QueryCtx) => ctx.db.query("areas").withIndex("by_nombre").collect(),

  buscarPorNombre: (ctx: QueryCtx, nombre: string) =>
    ctx.db
      .query("areas")
      .withIndex("by_nombre", (q) => q.eq("nombre", nombre))
      .unique(),
};

export const puestos = {
  ...repositorioBase("puestos"),

  listarPorArea: (ctx: QueryCtx, areaId: Id<"areas">) =>
    ctx.db
      .query("puestos")
      .withIndex("by_area_nombre", (q) => q.eq("areaId", areaId))
      .collect(),

  buscarPorNombre: (ctx: QueryCtx, areaId: Id<"areas">, nombre: string) =>
    ctx.db
      .query("puestos")
      .withIndex("by_area_nombre", (q) => q.eq("areaId", areaId).eq("nombre", nombre))
      .unique(),

  primeroDeArea: (ctx: QueryCtx, areaId: Id<"areas">) =>
    ctx.db
      .query("puestos")
      .withIndex("by_area_nombre", (q) => q.eq("areaId", areaId))
      .first(),
};

export const puestoDetalles = {
  ...repositorioBase("puestoDetalles"),

  listarPorPuesto: (ctx: QueryCtx, puestoId: Id<"puestos">) =>
    ctx.db
      .query("puestoDetalles")
      .withIndex("by_puesto_orden", (q) => q.eq("puestoId", puestoId))
      .collect(),
};
