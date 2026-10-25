import { v } from "convex/values";
import { query } from "./_generated/server";
import { conPermiso } from "./lib/autorizacion";
import schema from "./schema";
import * as organizacion from "./servicios/organizacion";

const { mutacion: mutacionEditor } = conPermiso("catalogos");

const puesto = schema.tables.puestos.validator;
const responsabilidades = v.array(v.string());

export const listarPorArea = query({
  args: { areaId: v.id("areas") },
  handler: (ctx, { areaId }) => organizacion.listarPuestos(ctx, areaId),
});

export const listarResponsabilidades = query({
  args: { puestoId: v.id("puestos") },
  handler: (ctx, { puestoId }) => organizacion.listarResponsabilidades(ctx, puestoId),
});

export const crear = mutacionEditor({
  args: puesto.extend({ responsabilidades }),
  handler: (ctx, { responsabilidades, ...datos }) =>
    organizacion.crearPuesto(ctx, datos, responsabilidades),
});

export const actualizar = mutacionEditor({
  args: puesto
    .partial()
    .extend({ id: v.id("puestos"), responsabilidades: v.optional(responsabilidades) }),
  handler: (ctx, { id, responsabilidades, ...cambios }) =>
    organizacion.actualizarPuesto(ctx, id, cambios, responsabilidades),
});

export const eliminar = mutacionEditor({
  args: { id: v.id("puestos") },
  handler: (ctx, { id }) => organizacion.eliminarPuesto(ctx, id),
});
