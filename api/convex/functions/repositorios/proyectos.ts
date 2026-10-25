import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { repositorioBase } from "../lib/repositorio";

export const proyectos = {
  ...repositorioBase("proyectos"),

  // Más recientes primero.
  listarActivos: (ctx: QueryCtx) =>
    ctx.db
      .query("proyectos")
      .withIndex("by_activo_anio", (q) => q.eq("activo", true))
      .order("desc")
      .collect(),

  // Activos primero y luego por año.
  listarTodos: (ctx: QueryCtx) => ctx.db.query("proyectos").withIndex("by_activo_anio").order("desc").collect(),

  buscarPorSlug: (ctx: QueryCtx, slug: string) =>
    ctx.db
      .query("proyectos")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique(),

  primeroDeCiudad: (ctx: QueryCtx, ciudadId: Id<"ciudades">) =>
    ctx.db
      .query("proyectos")
      .withIndex("by_ciudad", (q) => q.eq("ciudadId", ciudadId))
      .first(),

  primeroConImagen: (ctx: QueryCtx, imagenId: Id<"imagenes">) =>
    ctx.db
      .query("proyectos")
      .withIndex("by_imagen", (q) => q.eq("imagenId", imagenId))
      .first(),
};

// Listas hijas: se leen por proyecto y en orden.

export const proyectoCifras = {
  ...repositorioBase("proyectoCifras"),
  listarPorProyecto: (ctx: QueryCtx, proyectoId: Id<"proyectos">) =>
    ctx.db
      .query("proyectoCifras")
      .withIndex("by_proyecto_orden", (q) => q.eq("proyectoId", proyectoId))
      .collect(),
};

export const proyectoAlcance = {
  ...repositorioBase("proyectoAlcance"),
  listarPorProyecto: (ctx: QueryCtx, proyectoId: Id<"proyectos">) =>
    ctx.db
      .query("proyectoAlcance")
      .withIndex("by_proyecto_orden", (q) => q.eq("proyectoId", proyectoId))
      .collect(),
};

export const proyectoGaleria = {
  ...repositorioBase("proyectoGaleria"),
  listarPorProyecto: (ctx: QueryCtx, proyectoId: Id<"proyectos">) =>
    ctx.db
      .query("proyectoGaleria")
      .withIndex("by_proyecto_orden", (q) => q.eq("proyectoId", proyectoId))
      .collect(),

  primeraConImagen: (ctx: QueryCtx, imagenId: Id<"imagenes">) =>
    ctx.db
      .query("proyectoGaleria")
      .withIndex("by_imagen", (q) => q.eq("imagenId", imagenId))
      .first(),
};
