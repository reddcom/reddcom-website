import { v } from "convex/values";
import { query } from "./_generated/server";
import { conPermiso } from "./lib/autorizacion";
import schema from "./schema";
import * as servicio from "./servicios/vacantes";

const { consulta: consultaEditor, mutacion: mutacionEditor } = conPermiso("vacantes");

const vacante = schema.tables.vacantes.validator;
const requisitos = v.array(v.string());

/* ---------- Lectura pública (sitio) ---------- */

export const listarActivas = query({
  args: {},
  handler: (ctx) => servicio.listarVacantesActivas(ctx),
});

export const obtenerPorSlug = query({
  args: { slug: v.string() },
  handler: (ctx, { slug }) => servicio.obtenerVacantePublica(ctx, slug),
});

/* ---------- CMS ---------- */

export const listarTodas = consultaEditor({
  args: {},
  handler: (ctx) => servicio.listarTodas(ctx),
});

export const obtenerParaEdicion = consultaEditor({
  args: { id: v.id("vacantes") },
  handler: (ctx, { id }) => servicio.obtenerParaEdicion(ctx, id),
});

export const crear = mutacionEditor({
  // Si no llega fecha de publicación, el servicio usa la actual.
  args: vacante
    .omit("fechaPublicacion")
    .extend({ fechaPublicacion: v.optional(v.number()), requisitos }),
  handler: (ctx, { requisitos, ...datos }) => servicio.crearVacante(ctx, datos, requisitos),
});

export const actualizar = mutacionEditor({
  args: vacante
    .partial()
    .extend({ id: v.id("vacantes"), requisitos: v.optional(requisitos) }),
  handler: (ctx, { id, requisitos, ...cambios }) =>
    servicio.actualizarVacante(ctx, id, cambios, requisitos),
});

export const eliminar = mutacionEditor({
  args: { id: v.id("vacantes") },
  handler: (ctx, { id }) => servicio.eliminarVacante(ctx, id),
});
