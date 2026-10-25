import type { WithoutSystemFields } from "convex/server";
import type { Doc, Id, TableNames } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type Datos<T extends TableNames> = WithoutSystemFields<Doc<T>>;

/**
 * Operaciones por id que comparten todas las tablas. Cada repositorio
 * las extiende con sus consultas por índice.
 */
export function repositorioBase<T extends TableNames>(tabla: T) {
  return {
    obtener: (ctx: QueryCtx, id: Id<T>) => ctx.db.get(tabla, id),
    insertar: (ctx: MutationCtx, datos: Datos<T>) => ctx.db.insert(tabla, datos),
    actualizar: (ctx: MutationCtx, id: Id<T>, cambios: Partial<Doc<T>>) =>
      ctx.db.patch(tabla, id, cambios),
    eliminar: (ctx: MutationCtx, id: Id<T>) => ctx.db.delete(tabla, id),
  };
}
