import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { conPermiso } from "./lib/autorizacion";
import schema from "./schema";
import * as servicio from "./servicios/mensajes";

const { consulta: consultaEditor, mutacion: mutacionEditor } = conPermiso("mensajes");

const mensaje = schema.tables.mensajes.validator;

/* ---------- Formulario público (sitio) ---------- */

export const enviar = mutation({
  // `sitioWeb` es una trampa para bots: el campo está oculto en el formulario
  // y una persona lo deja vacío. Si llega con texto, se descarta en silencio.
  args: mensaje.omit("fecha", "leido").extend({ sitioWeb: v.optional(v.string()) }),
  handler: async (ctx, { sitioWeb, ...entrada }) => {
    if (sitioWeb) return;
    await servicio.enviarMensaje(ctx, entrada);
  },
});

/* ---------- CMS ---------- */

export const listar = consultaEditor({
  args: {},
  handler: (ctx) => servicio.listarBandeja(ctx),
});

/** Contador del sidebar: no carga la bandeja completa. */
export const contarSinLeer = consultaEditor({
  args: {},
  handler: (ctx) => servicio.contarSinLeer(ctx),
});

export const marcarLeido = mutacionEditor({
  args: { id: v.id("mensajes"), leido: v.boolean() },
  handler: (ctx, { id, leido }) => servicio.marcarLeido(ctx, id, leido),
});

export const eliminar = mutacionEditor({
  args: { id: v.id("mensajes") },
  handler: (ctx, { id }) => servicio.eliminarMensaje(ctx, id),
});
