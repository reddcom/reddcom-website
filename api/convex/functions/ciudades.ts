import { v } from "convex/values";
import { query } from "./_generated/server";
import { conPermiso } from "./lib/autorizacion";
import schema from "./schema";
import * as ubicacion from "./servicios/ubicacion";

const { mutacion: mutacionEditor } = conPermiso("catalogos");

const ciudad = schema.tables.ciudades.validator;
const ciudadDetalle = schema.tables.ciudadDetalles.validator;

export const listarPorDepartamento = query({
  args: { departamentoId: v.id("departamentos") },
  handler: (ctx, { departamentoId }) => ubicacion.listarCiudades(ctx, departamentoId),
});

export const crear = mutacionEditor({
  args: ciudad,
  handler: (ctx, datos) => ubicacion.crearCiudad(ctx, datos),
});

export const actualizar = mutacionEditor({
  args: ciudad.partial().extend({ id: v.id("ciudades") }),
  handler: (ctx, { id, ...cambios }) => ubicacion.actualizarCiudad(ctx, id, cambios),
});

export const eliminar = mutacionEditor({
  args: { id: v.id("ciudades") },
  handler: (ctx, { id }) => ubicacion.eliminarCiudad(ctx, id),
});

/* ---------- Detalle 1:1 ---------- */

export const obtenerDetalle = query({
  args: { ciudadId: v.id("ciudades") },
  handler: (ctx, { ciudadId }) => ubicacion.obtenerDetalleCiudad(ctx, ciudadId),
});

export const guardarDetalle = mutacionEditor({
  args: ciudadDetalle,
  handler: (ctx, { ciudadId, ...datos }) => ubicacion.guardarDetalleCiudad(ctx, ciudadId, datos),
});
