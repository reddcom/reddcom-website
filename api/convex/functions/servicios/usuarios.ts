import { puede, type Rol } from "../../compartido/roles";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { conflicto, invalido } from "../lib/errores";
import { asegurarUnico, existente, textoRequerido } from "../lib/validacion";
import { usuarios } from "../repositorios/usuarios";

/* =========================================================
   ACCESO AL CMS
========================================================= */

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizarCorreo = (correo: string) => correo.trim().toLowerCase();

/** Rol del correo, o `null` si no tiene acceso al CMS. */
export async function rolDe(ctx: QueryCtx, correo: string): Promise<Rol | null> {
  return (await usuarios.buscarPorCorreo(ctx, normalizarCorreo(correo)))?.rol ?? null;
}

/** Siempre debe quedar al menos un usuario que pueda gestionar usuarios. */
async function asegurarOtroAdministrador(ctx: QueryCtx, rolSaliente: Rol) {
  if (puede(rolSaliente, "usuarios") && (await usuarios.contarConRol(ctx, rolSaliente)) <= 1) {
    conflicto("Debe quedar al menos un super administrador.");
  }
}

/* =========================================================
   GESTIÓN (CMS)
========================================================= */

export async function agregarUsuario(ctx: MutationCtx, correo: string, rol: Rol, agregadoPor: string) {
  const limpio = normalizarCorreo(textoRequerido(correo, "El correo"));
  if (!FORMATO_CORREO.test(limpio)) invalido("Escribe un correo válido.");
  asegurarUnico(await usuarios.buscarPorCorreo(ctx, limpio), undefined, `${limpio} ya tiene acceso.`);
  return usuarios.insertar(ctx, { correo: limpio, rol, fechaAlta: Date.now(), agregadoPor });
}

export async function cambiarRol(ctx: MutationCtx, id: Id<"usuarios">, rol: Rol, editor: string) {
  const usuario = existente(await usuarios.obtener(ctx, id), "El usuario");
  if (usuario.rol === rol) return;
  if (usuario.correo === normalizarCorreo(editor)) conflicto("No puedes cambiar tu propio rol.");
  await asegurarOtroAdministrador(ctx, usuario.rol);
  await usuarios.actualizar(ctx, id, { rol });
}

/** Quita el acceso y devuelve el correo, para borrar también su cuenta. */
export async function quitarUsuario(ctx: MutationCtx, id: Id<"usuarios">, editor: string) {
  const usuario = existente(await usuarios.obtener(ctx, id), "El usuario");
  if (usuario.correo === normalizarCorreo(editor)) conflicto("No puedes quitarte el acceso a ti misma.");
  await asegurarOtroAdministrador(ctx, usuario.rol);
  await usuarios.eliminar(ctx, id);
  return usuario.correo;
}

export async function correoDe(ctx: QueryCtx, id: Id<"usuarios">) {
  return existente(await usuarios.obtener(ctx, id), "El usuario").correo;
}

export async function listarUsuarios(ctx: QueryCtx) {
  const lista = await usuarios.listar(ctx);
  return lista.sort((a, b) => a.correo.localeCompare(b.correo));
}

/**
 * Primer acceso del sistema: deja ese correo como super administrador si la
 * tabla está vacía (o si ya lo es). Después, todo se gestiona desde el CMS.
 */
export async function asegurarSuperAdminInicial(ctx: MutationCtx, correo: string) {
  const limpio = normalizarCorreo(correo);
  if (!FORMATO_CORREO.test(limpio)) invalido("Escribe un correo válido.");
  const existenteUsuario = await usuarios.buscarPorCorreo(ctx, limpio);
  if (existenteUsuario?.rol === "superAdmin") return limpio;
  if (await usuarios.hayAlguno(ctx)) conflicto("Ya hay usuarios; agrega los demás desde el CMS.");
  await usuarios.insertar(ctx, { correo: limpio, rol: "superAdmin", fechaAlta: Date.now() });
  return limpio;
}
