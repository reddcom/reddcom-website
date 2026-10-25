import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { repositorioBase } from "../lib/repositorio";

export const paises = {
  ...repositorioBase("paises"),

  listar: (ctx: QueryCtx) => ctx.db.query("paises").withIndex("by_nombre").collect(),

  buscarPorNombre: (ctx: QueryCtx, nombre: string) =>
    ctx.db
      .query("paises")
      .withIndex("by_nombre", (q) => q.eq("nombre", nombre))
      .unique(),

  buscarPorCodigoIso: (ctx: QueryCtx, codigoIso: string) =>
    ctx.db
      .query("paises")
      .withIndex("by_codigoIso", (q) => q.eq("codigoIso", codigoIso))
      .unique(),
};

export const departamentos = {
  ...repositorioBase("departamentos"),

  listarPorPais: (ctx: QueryCtx, paisId: Id<"paises">) =>
    ctx.db
      .query("departamentos")
      .withIndex("by_pais_nombre", (q) => q.eq("paisId", paisId))
      .collect(),

  buscarPorNombre: (ctx: QueryCtx, paisId: Id<"paises">, nombre: string) =>
    ctx.db
      .query("departamentos")
      .withIndex("by_pais_nombre", (q) => q.eq("paisId", paisId).eq("nombre", nombre))
      .unique(),

  primeroDePais: (ctx: QueryCtx, paisId: Id<"paises">) =>
    ctx.db
      .query("departamentos")
      .withIndex("by_pais_nombre", (q) => q.eq("paisId", paisId))
      .first(),
};

export const ciudades = {
  ...repositorioBase("ciudades"),

  listarPorDepartamento: (ctx: QueryCtx, departamentoId: Id<"departamentos">) =>
    ctx.db
      .query("ciudades")
      .withIndex("by_departamento_nombre", (q) => q.eq("departamentoId", departamentoId))
      .collect(),

  buscarPorNombre: (ctx: QueryCtx, departamentoId: Id<"departamentos">, nombre: string) =>
    ctx.db
      .query("ciudades")
      .withIndex("by_departamento_nombre", (q) =>
        q.eq("departamentoId", departamentoId).eq("nombre", nombre),
      )
      .unique(),

  primeraDeDepartamento: (ctx: QueryCtx, departamentoId: Id<"departamentos">) =>
    ctx.db
      .query("ciudades")
      .withIndex("by_departamento_nombre", (q) => q.eq("departamentoId", departamentoId))
      .first(),
};

export const ciudadDetalles = {
  ...repositorioBase("ciudadDetalles"),

  buscarPorCiudad: (ctx: QueryCtx, ciudadId: Id<"ciudades">) =>
    ctx.db
      .query("ciudadDetalles")
      .withIndex("by_ciudad", (q) => q.eq("ciudadId", ciudadId))
      .unique(),
};
