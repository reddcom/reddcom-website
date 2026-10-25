import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { crearCuenta, eliminarCuenta, restablecerContrasena } from "./auth";
import { conPermiso, requerirEditor } from "./lib/autorizacion";
import { noAutorizado } from "./lib/errores";
import { puede } from "../compartido/roles";
import { rol } from "./schema";
import * as servicio from "./servicios/usuarios";

const { consulta, mutacion } = conPermiso("usuarios");

/*
 * Crear y borrar cuentas necesita acciones (Better Auth hace el hash de la
 * contraseña y escribe en su componente). Las acciones no leen la base: cada
 * paso pasa por una consulta o mutación interna, que sí verifica permisos.
 */

/* ---------- CMS: Configuración → Usuarios ---------- */

export const listar = consulta({
  args: {},
  handler: (ctx) => servicio.listarUsuarios(ctx),
});

export const cambiarRol = mutacion({
  args: { id: v.id("usuarios"), rol },
  handler: (ctx, { id, rol }) => servicio.cambiarRol(ctx, id, rol, ctx.editor.email),
});

/** Da acceso y crea la cuenta con la contraseña que define el super administrador. */
export const agregar = action({
  args: { correo: v.string(), nombre: v.string(), contrasena: v.string(), rol },
  handler: async (ctx, { correo, nombre, contrasena, rol }): Promise<string> => {
    const gestor = await ctx.runQuery(internal.usuarios.gestorActual, {});
    const { id, correo: limpio } = await ctx.runMutation(internal.usuarios.registrarAcceso, {
      correo,
      rol,
      agregadoPor: gestor,
    });
    try {
      await crearCuenta(ctx, { correo: limpio, nombre: nombre.trim() || limpio, contrasena });
    } catch (error) {
      // Sin cuenta no tiene sentido el acceso: se deshace el alta.
      await ctx.runMutation(internal.usuarios.borrarAcceso, { id });
      throw error;
    }
    return limpio;
  },
});

/** Quita el acceso y borra la cuenta con sus sesiones. */
export const quitar = action({
  args: { id: v.id("usuarios") },
  handler: async (ctx, { id }) => {
    const gestor = await ctx.runQuery(internal.usuarios.gestorActual, {});
    const correo = await ctx.runMutation(internal.usuarios.quitarAcceso, { id, editor: gestor });
    await eliminarCuenta(ctx, correo);
  },
});

export const restablecer = action({
  args: { id: v.id("usuarios"), contrasena: v.string() },
  handler: async (ctx, { id, contrasena }): Promise<boolean> => {
    await ctx.runQuery(internal.usuarios.gestorActual, {});
    const correo = await ctx.runQuery(internal.usuarios.correo, { id });
    await restablecerContrasena(ctx, correo, contrasena);
    return true;
  },
});

/* ---------- Internas ---------- */

/** Correo del usuario en sesión si puede gestionar usuarios; si no, falla. */
export const gestorActual = internalQuery({
  args: {},
  handler: async (ctx) => {
    const editor = await requerirEditor(ctx);
    if (!puede(editor.rol, "usuarios")) noAutorizado();
    return editor.email;
  },
});

export const registrarAcceso = internalMutation({
  args: { correo: v.string(), rol, agregadoPor: v.string() },
  handler: async (ctx, { correo, rol, agregadoPor }) => {
    const id = await servicio.agregarUsuario(ctx, correo, rol, agregadoPor);
    return { id, correo: servicio.normalizarCorreo(correo) };
  },
});

export const borrarAcceso = internalMutation({
  args: { id: v.id("usuarios") },
  handler: (ctx, { id }) => ctx.db.delete(id),
});

export const quitarAcceso = internalMutation({
  args: { id: v.id("usuarios"), editor: v.string() },
  handler: (ctx, { id, editor }) => servicio.quitarUsuario(ctx, id, editor),
});

export const correo = internalQuery({
  args: { id: v.id("usuarios") },
  handler: (ctx, { id }) => servicio.correoDe(ctx, id),
});

/** Para la defensa del registro en Better Auth, que corre en una acción. */
export const tieneAcceso = internalQuery({
  args: { correo: v.string() },
  handler: async (ctx, { correo }) => (await servicio.rolDe(ctx, correo)) !== null,
});

export const asegurarSuperAdminInicial = internalMutation({
  args: { correo: v.string() },
  handler: (ctx, { correo }) => servicio.asegurarSuperAdminInicial(ctx, correo),
});

/**
 * Primer super administrador con su cuenta (solo desde la terminal):
 *   npx convex run usuarios:inicializar '{"correo": "…", "nombre": "…", "contrasena": "…"}'
 */
export const inicializar = internalAction({
  args: { correo: v.string(), nombre: v.string(), contrasena: v.string() },
  handler: async (ctx, { correo, nombre, contrasena }) => {
    const limpio = await ctx.runMutation(internal.usuarios.asegurarSuperAdminInicial, { correo });
    await crearCuenta(ctx, { correo: limpio, nombre, contrasena });
  },
});

/**
 * Contraseña nueva sin entrar al CMS (solo desde la terminal), para cuando un
 * super administrador queda fuera:
 *   npx convex run usuarios:restablecerDesdeTerminal '{"correo": "…", "contrasena": "…"}'
 */
export const restablecerDesdeTerminal = internalAction({
  args: { correo: v.string(), contrasena: v.string() },
  handler: async (ctx, { correo, contrasena }) => {
    await restablecerContrasena(ctx, servicio.normalizarCorreo(correo), contrasena);
    return "Contraseña actualizada.";
  },
});
