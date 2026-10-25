import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { repositorioBase } from "../lib/repositorio";

export const bloques = {
  ...repositorioBase("bloques"),

  // Ordenados por sección, campo y orden gracias al índice.
  listarPorPagina: (ctx: QueryCtx, pagina: string) =>
    ctx.db
      .query("bloques")
      .withIndex("by_ubicacion", (q) => q.eq("pagina", pagina))
      .collect(),

  listarPorSeccion: (ctx: QueryCtx, pagina: string, seccion: string) =>
    ctx.db
      .query("bloques")
      .withIndex("by_ubicacion", (q) => q.eq("pagina", pagina).eq("seccion", seccion))
      .collect(),

  primeroConImagen: (ctx: QueryCtx, imagenId: Id<"imagenes">) =>
    ctx.db
      .query("bloques")
      .withIndex("by_imagen", (q) => q.eq("contenido.imagenId", imagenId))
      .first(),
};

export const imagenes = {
  ...repositorioBase("imagenes"),

  listar: (ctx: QueryCtx) => ctx.db.query("imagenes").order("desc").collect(),

  buscarPorStorage: (ctx: QueryCtx, storageId: Id<"_storage">) =>
    ctx.db
      .query("imagenes")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .unique(),
};

/** Archivos en Convex File Storage (tabla de sistema _storage). */
export const archivos = {
  metadatos: (ctx: QueryCtx, storageId: Id<"_storage">) => ctx.db.system.get("_storage", storageId),
  url: (ctx: QueryCtx, storageId: Id<"_storage">) => ctx.storage.getUrl(storageId),
  urlDeSubida: (ctx: MutationCtx) => ctx.storage.generateUploadUrl(),
  eliminar: (ctx: MutationCtx, storageId: Id<"_storage">) => ctx.storage.delete(storageId),
};
