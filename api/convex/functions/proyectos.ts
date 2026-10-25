import { v } from "convex/values";
import { query } from "./_generated/server";
import { conPermiso } from "./lib/autorizacion";
import schema from "./schema";
import * as servicio from "./servicios/proyectos";

const { consulta: consultaEditor, mutacion: mutacionEditor } = conPermiso("proyectos");

const proyecto = schema.tables.proyectos.validator;
const listas = {
  cifras: v.array(v.object({ valor: v.string(), etiqueta: v.string() })),
  alcance: v.array(v.string()),
  galeria: v.array(v.id("imagenes")),
};

/* ---------- Lectura pública (sitio) ---------- */

export const listarActivos = query({
  args: {},
  handler: (ctx) => servicio.listarProyectosActivos(ctx),
});

export const obtenerPorSlug = query({
  args: { slug: v.string() },
  handler: (ctx, { slug }) => servicio.obtenerProyectoPublico(ctx, slug),
});

/* ---------- CMS ---------- */

export const listarTodos = consultaEditor({
  args: {},
  handler: (ctx) => servicio.listarTodos(ctx),
});

export const obtenerParaEdicion = consultaEditor({
  args: { id: v.id("proyectos") },
  handler: (ctx, { id }) => servicio.obtenerParaEdicion(ctx, id),
});

export const crear = mutacionEditor({
  args: proyecto.extend(listas),
  handler: (ctx, { cifras, alcance, galeria, ...datos }) =>
    servicio.crearProyecto(ctx, datos, { cifras, alcance, galeria }),
});

export const actualizar = mutacionEditor({
  args: proyecto.partial().extend({ id: v.id("proyectos"), ...listas }),
  handler: (ctx, { id, cifras, alcance, galeria, ...cambios }) =>
    servicio.actualizarProyecto(ctx, id, cambios, { cifras, alcance, galeria }),
});

export const eliminar = mutacionEditor({
  args: { id: v.id("proyectos") },
  handler: (ctx, { id }) => servicio.eliminarProyecto(ctx, id),
});
