import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, mutation } from "./_generated/server";
import { conPermiso } from "./lib/autorizacion";
import * as servicio from "./servicios/postulaciones";

const { consulta: consultaEditor } = conPermiso("postulaciones");

/* ---------- Formulario público (detalle de vacante en el sitio) ---------- */

// Paso 1: URL para subir el CV directo a Convex File Storage.
export const generarUrlSubida = mutation({
  args: {},
  handler: (ctx) => servicio.urlDeSubidaCv(ctx),
});

/*
 * Paso 2: valida los datos (Zod) y el PDF, y guarda la postulación. Es una
 * acción porque leer el archivo solo se puede aquí. Si algo falla, el CV
 * subido se borra para no dejarlo suelto.
 */
export const enviar = action({
  args: {
    vacanteId: v.id("vacantes"),
    cvId: v.id("_storage"),
    nombre: v.string(),
    correo: v.string(),
    telefono: v.string(),
    enlace: v.optional(v.string()),
    mensaje: v.optional(v.string()),
    consentimiento: v.boolean(),
    // Trampa para bots: el campo está oculto y una persona lo deja vacío.
    sitioWeb: v.optional(v.string()),
  },
  handler: async (ctx, { vacanteId, cvId, sitioWeb, ...entrada }) => {
    try {
      if (sitioWeb) throw new ConvexError({ codigo: "DESCARTADO", mensaje: "" });
      const datos = servicio.validarEntrada(entrada);
      await servicio.validarCv(ctx, cvId);
      await ctx.runMutation(internal.postulaciones.registrar, { vacanteId, cvId, ...datos });
    } catch (error) {
      await ctx.runMutation(internal.postulaciones.descartarCv, { cvId });
      // Al bot se le responde como si todo hubiera salido bien.
      if (error instanceof ConvexError && error.data?.codigo === "DESCARTADO") return;
      throw error;
    }
  },
});

export const registrar = internalMutation({
  args: {
    vacanteId: v.id("vacantes"),
    cvId: v.id("_storage"),
    nombre: v.string(),
    correo: v.string(),
    telefono: v.string(),
    enlace: v.optional(v.string()),
    mensaje: v.optional(v.string()),
  },
  handler: (ctx, { vacanteId, cvId, ...datos }) => servicio.registrarPostulacion(ctx, vacanteId, datos, cvId),
});

export const descartarCv = internalMutation({
  args: { cvId: v.id("_storage") },
  handler: (ctx, { cvId }) => servicio.descartarCv(ctx, cvId),
});

export const limpiarArchivosHuerfanos = internalMutation({
  args: {},
  handler: (ctx) => servicio.limpiarArchivosHuerfanos(ctx),
});

/* ---------- CMS (solo lectura) ---------- */

export const listar = consultaEditor({
  args: {},
  handler: (ctx) => servicio.listarPostulaciones(ctx),
});
