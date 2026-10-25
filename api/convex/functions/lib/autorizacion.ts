import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { puede, type Permiso } from "../../compartido/roles";
import { mutation, query, type QueryCtx } from "../_generated/server";
import { authComponent } from "../auth";
import { rolDe } from "../servicios/usuarios";
import { noAutenticado, noAutorizado } from "./errores";

/** Usuario con sesión válida y acceso al CMS (fila en `usuarios`); si no, falla. */
export async function requerirEditor(ctx: QueryCtx) {
  const usuario = await authComponent.safeGetAuthUser(ctx);
  if (!usuario) noAutenticado();
  const rol = await rolDe(ctx, usuario.email);
  if (!rol) noAutorizado();
  return { ...usuario, rol };
}

/*
 * Constructores para las funciones del CMS: igual que query/mutation, pero
 * verifican que el editor tenga el permiso antes del handler y lo dejan en
 * ctx.editor. Cada módulo pide el suyo:
 *   const { consulta, mutacion } = conPermiso("vacantes");
 */
export function conPermiso(permiso: Permiso) {
  const verificar = customCtx(async (ctx: QueryCtx) => {
    const editor = await requerirEditor(ctx);
    if (!puede(editor.rol, permiso)) noAutorizado();
    return { editor };
  });
  return { consulta: customQuery(query, verificar), mutacion: customMutation(mutation, verificar) };
}
