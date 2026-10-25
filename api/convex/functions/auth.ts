import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { APIError } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { roles } from "../compartido/roles";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query, type ActionCtx } from "./_generated/server";
import { conflicto, invalido } from "./lib/errores";
import authConfig from "./auth.config";
import { rolDe } from "./servicios/usuarios";

// URL del CMS (SITE_URL en el deployment): el origen principal que puede iniciar sesión.
const siteUrl = process.env.SITE_URL!;
// Orígenes extra separados por coma (p. ej. un túnel para compartir el CMS local).
const origenesExtra = (process.env.CMS_ORIGENES_EXTRA ?? "").split(",").map((o) => o.trim()).filter(Boolean);

export const authComponent = createClient<DataModel>(components.betterAuth);

/* El registro corre en una acción HTTP (sin ctx.db): pregunta con una consulta interna. */
const tieneAcceso = (ctx: GenericCtx<DataModel>, correo: string) =>
  "db" in ctx
    ? rolDe(ctx, correo).then((rol) => rol !== null)
    : ctx.runQuery(internal.usuarios.tieneAcceso, { correo });

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    trustedOrigins: [siteUrl, ...origenesExtra],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      // Nadie se registra solo: las cuentas las crea un super administrador (crearCuenta).
      disableSignUp: true,
    },
    databaseHooks: {
      user: {
        create: {
          // Defensa extra: solo se crean cuentas para correos dados de alta en Configuración → Usuarios.
          before: async (usuario) => {
            if (!(await tieneAcceso(ctx, usuario.email))) {
              throw new APIError("FORBIDDEN", { message: "Este correo no tiene acceso al CMS." });
            }
            return { data: usuario };
          },
        },
      },
    },
    plugins: [crossDomain({ siteUrl }), convex({ authConfig })],
  });

/** Sesión actual para el CMS; `null` si no hay sesión. `rol` es `null` si no tiene acceso. */
export const usuarioActual = query({
  args: {},
  handler: async (ctx) => {
    const usuario = await authComponent.safeGetAuthUser(ctx);
    if (!usuario) return null;
    const rol = await rolDe(ctx, usuario.email);
    return { nombre: usuario.name, email: usuario.email, rol, permisos: rol ? roles[rol].permisos : [] };
  },
});

/* =========================================================
   CUENTAS GESTIONADAS POR EL SUPER ADMINISTRADOR
   Con el registro público desactivado, las cuentas se crean y
   borran desde el servidor con el adaptador de Better Auth, el
   mismo camino que usa su registro por correo y contraseña.
========================================================= */

async function contextoAuth(ctx: ActionCtx) {
  return createAuth(ctx).$context;
}

async function hashValido(ctx: ActionCtx, contrasena: string) {
  const contexto = await contextoAuth(ctx);
  const { minPasswordLength, maxPasswordLength } = contexto.password.config;
  if (contrasena.length < minPasswordLength) invalido(`La contraseña debe tener al menos ${minPasswordLength} caracteres.`);
  if (contrasena.length > maxPasswordLength) invalido(`La contraseña admite hasta ${maxPasswordLength} caracteres.`);
  return contexto.password.hash(contrasena);
}

export async function crearCuenta(ctx: ActionCtx, datos: { correo: string; nombre: string; contrasena: string }) {
  const contexto = await contextoAuth(ctx);
  if (await contexto.internalAdapter.findUserByEmail(datos.correo)) {
    conflicto("Ya existe una cuenta con ese correo.");
  }
  const hash = await hashValido(ctx, datos.contrasena);
  const usuario = await contexto.internalAdapter.createUser({
    email: datos.correo,
    name: datos.nombre,
    emailVerified: true,
  });
  await contexto.internalAdapter.linkAccount({
    userId: usuario.id,
    providerId: "credential",
    accountId: usuario.id,
    password: hash,
  });
}

/** Borra la cuenta con sus sesiones y credenciales; no falla si no existe. */
export async function eliminarCuenta(ctx: ActionCtx, correo: string) {
  const contexto = await contextoAuth(ctx);
  const encontrado = await contexto.internalAdapter.findUserByEmail(correo);
  if (encontrado) await contexto.internalAdapter.deleteUser(encontrado.user.id);
}

/** Nueva contraseña; cierra las sesiones abiertas de esa cuenta. */
export async function restablecerContrasena(ctx: ActionCtx, correo: string, contrasena: string) {
  const contexto = await contextoAuth(ctx);
  const encontrado = await contexto.internalAdapter.findUserByEmail(correo);
  if (!encontrado) conflicto("Ese usuario todavía no tiene cuenta.");
  await contexto.internalAdapter.updatePassword(encontrado.user.id, await hashValido(ctx, contrasena));
  await contexto.internalAdapter.deleteUserSessions(encontrado.user.id);
}
