import { v } from "convex/values";
import { contenidoBloque } from "../compartido/bloques";
import { query } from "./_generated/server";
import { conPermiso } from "./lib/autorizacion";
import * as servicio from "./servicios/contenido";

const { mutacion: mutacionEditor } = conPermiso("contenido");

/** Contenido publicado de una página (sitio y CMS). */
export const obtenerPagina = query({
  args: { pagina: v.string() },
  handler: (ctx, { pagina }) => servicio.obtenerPagina(ctx, pagina),
});

/** Guarda en una sola transacción todas las secciones con cambios de una página. */
export const guardarPagina = mutacionEditor({
  args: {
    pagina: v.string(),
    secciones: v.record(v.string(), v.record(v.string(), v.array(contenidoBloque))),
  },
  handler: (ctx, { pagina, secciones }) => servicio.guardarPagina(ctx, pagina, secciones),
});
