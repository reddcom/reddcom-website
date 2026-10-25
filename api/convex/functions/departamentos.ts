import { v } from "convex/values";
import { query } from "./_generated/server";
import { conPermiso } from "./lib/autorizacion";
import schema from "./schema";
import * as ubicacion from "./servicios/ubicacion";

const { mutacion: mutacionEditor } = conPermiso("catalogos");

const departamento = schema.tables.departamentos.validator;

export const listarPorPais = query({
  args: { paisId: v.id("paises") },
  handler: (ctx, { paisId }) => ubicacion.listarDepartamentos(ctx, paisId),
});

export const crear = mutacionEditor({
  args: departamento,
  handler: (ctx, datos) => ubicacion.crearDepartamento(ctx, datos),
});

export const actualizar = mutacionEditor({
  args: departamento.partial().extend({ id: v.id("departamentos") }),
  handler: (ctx, { id, ...cambios }) => ubicacion.actualizarDepartamento(ctx, id, cambios),
});

export const eliminar = mutacionEditor({
  args: { id: v.id("departamentos") },
  handler: (ctx, { id }) => ubicacion.eliminarDepartamento(ctx, id),
});
