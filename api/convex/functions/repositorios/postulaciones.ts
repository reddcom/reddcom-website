import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { repositorioBase } from "../lib/repositorio";

export const postulaciones = {
  ...repositorioBase("postulaciones"),

  // Más recientes primero.
  listar: (ctx: QueryCtx) => ctx.db.query("postulaciones").withIndex("by_fecha").order("desc").collect(),

  deCorreoEnVacante: (ctx: QueryCtx, correo: string, vacanteId: Id<"vacantes">) =>
    ctx.db
      .query("postulaciones")
      .withIndex("by_correo_vacante", (q) => q.eq("correo", correo).eq("vacanteId", vacanteId))
      .first(),

  primeraDeVacante: (ctx: QueryCtx, vacanteId: Id<"vacantes">) =>
    ctx.db
      .query("postulaciones")
      .withIndex("by_vacante_fecha", (q) => q.eq("vacanteId", vacanteId))
      .first(),

  conCv: (ctx: QueryCtx, cvId: Id<"_storage">) =>
    ctx.db
      .query("postulaciones")
      .withIndex("by_cv", (q) => q.eq("cvId", cvId))
      .first(),
};
