import { v } from "convex/values";
import { query } from "./_generated/server";
import { conPermiso } from "./lib/autorizacion";
import schema from "./schema";
import * as organizacion from "./servicios/organizacion";

const { mutacion: mutacionEditor } = conPermiso("catalogos");

const area = schema.tables.areas.validator;

export const listar = query({
  args: {},
  handler: (ctx) => organizacion.listarAreas(ctx),
});

export const crear = mutacionEditor({
  args: area,
  handler: (ctx, datos) => organizacion.crearArea(ctx, datos),
});

export const actualizar = mutacionEditor({
  args: area.partial().extend({ id: v.id("areas") }),
  handler: (ctx, { id, ...cambios }) => organizacion.actualizarArea(ctx, id, cambios),
});

export const eliminar = mutacionEditor({
  args: { id: v.id("areas") },
  handler: (ctx, { id }) => organizacion.eliminarArea(ctx, id),
});
