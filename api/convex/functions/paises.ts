import { v } from "convex/values";
import { query } from "./_generated/server";
import { conPermiso } from "./lib/autorizacion";
import schema from "./schema";
import * as ubicacion from "./servicios/ubicacion";

const { mutacion: mutacionEditor } = conPermiso("catalogos");

const pais = schema.tables.paises.validator;

export const listar = query({
  args: {},
  handler: (ctx) => ubicacion.listarPaises(ctx),
});

export const crear = mutacionEditor({
  args: pais,
  handler: (ctx, datos) => ubicacion.crearPais(ctx, datos),
});

export const actualizar = mutacionEditor({
  args: pais.partial().extend({ id: v.id("paises") }),
  handler: (ctx, { id, ...cambios }) => ubicacion.actualizarPais(ctx, id, cambios),
});

export const eliminar = mutacionEditor({
  args: { id: v.id("paises") },
  handler: (ctx, { id }) => ubicacion.eliminarPais(ctx, id),
});
