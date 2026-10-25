import { v } from "convex/values";
import { conPermiso } from "./lib/autorizacion";
import * as servicio from "./servicios/imagenes";

const { consulta: consultaEditor, mutacion: mutacionEditor } = conPermiso("imagenes");

export const listar = consultaEditor({
  args: {},
  handler: (ctx) => servicio.listarImagenes(ctx),
});

export const generarUrlSubida = mutacionEditor({
  args: {},
  handler: (ctx) => servicio.generarUrlSubida(ctx),
});

export const registrar = mutacionEditor({
  args: { storageId: v.id("_storage"), nombre: v.string(), alt: v.string() },
  handler: (ctx, datos) => servicio.registrarImagen(ctx, datos),
});

export const actualizarAlt = mutacionEditor({
  args: { id: v.id("imagenes"), alt: v.string() },
  handler: (ctx, { id, alt }) => servicio.actualizarAlt(ctx, id, alt),
});

export const eliminar = mutacionEditor({
  args: { id: v.id("imagenes") },
  handler: (ctx, { id }) => servicio.eliminarImagen(ctx, id),
});
