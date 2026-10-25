import { ConvexError } from "convex/values";
import type { BloqueDe, ContenidoBloque, TipoBloque } from "../../compartido/bloques";
import { buscarPagina, buscarSeccion } from "../../compartido/registro";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { invalido, noEncontrado } from "../lib/errores";
import { textoOpcional, textoRequerido, urlValida } from "../lib/validacion";
import { bloques } from "../repositorios/contenido";
import { asegurarImagen, resolverImagen } from "./imagenes";

/* =========================================================
   NORMALIZACIÓN POR TIPO
   Un normalizador por tipo de bloque: limpia textos, valida
   URLs y verifica que las imágenes referidas existan.
========================================================= */

type Normalizador<T extends TipoBloque> = (ctx: QueryCtx, bloque: BloqueDe<T>) => Promise<BloqueDe<T>>;

async function imagenOpcional(ctx: QueryCtx, id: BloqueDe<"dato">["imagenId"]) {
  if (id !== undefined) await asegurarImagen(ctx, id);
  return id;
}

const normalizadores: { [T in TipoBloque]: Normalizador<T> } = {
  texto: async (_ctx, b) => ({ tipo: "texto", texto: textoRequerido(b.texto, "El texto") }),

  // Que el valor sea una de las opciones del campo se valida en guardarSeccion.
  opcion: async (_ctx, b) => ({ tipo: "opcion", valor: textoRequerido(b.valor, "La opción") }),

  encabezado: async (_ctx, b) => ({
    tipo: "encabezado",
    etiqueta: textoOpcional(b.etiqueta),
    titulo: textoRequerido(b.titulo, "El título"),
    destacado: textoOpcional(b.destacado),
    descripcion: textoOpcional(b.descripcion),
  }),

  imagen: async (ctx, b) => {
    await asegurarImagen(ctx, b.imagenId);
    return { tipo: "imagen", imagenId: b.imagenId };
  },

  enlace: async (_ctx, b) => ({
    tipo: "enlace",
    texto: textoRequerido(b.texto, "El texto del botón"),
    url: urlValida(b.url, "La URL del botón"),
  }),

  dato: async (ctx, b) => ({
    tipo: "dato",
    valor: textoRequerido(b.valor, "El valor"),
    etiqueta: textoRequerido(b.etiqueta, "La etiqueta del dato"),
    imagenId: await imagenOpcional(ctx, b.imagenId),
  }),

  hito: async (ctx, b) => {
    if (!Number.isInteger(b.anio) || b.anio < 1900 || b.anio > 2100) {
      invalido("El año del hito debe estar entre 1900 y 2100.");
    }
    return {
      tipo: "hito",
      anio: b.anio,
      lugar: textoRequerido(b.lugar, "El lugar del hito"),
      titulo: textoRequerido(b.titulo, "El título del hito"),
      texto: textoRequerido(b.texto, "El texto del hito"),
      imagenId: await imagenOpcional(ctx, b.imagenId),
    };
  },

  tarjeta: async (ctx, b) => {
    const url = textoOpcional(b.url);
    return {
      tipo: "tarjeta",
      titulo: textoRequerido(b.titulo, "El título de la tarjeta"),
      texto: textoOpcional(b.texto),
      imagenId: await imagenOpcional(ctx, b.imagenId),
      url: url === undefined ? undefined : urlValida(url, "La URL de la tarjeta"),
    };
  },

  menu: async (_ctx, b) => {
    const texto = textoRequerido(b.texto, "El texto del menú");
    const hijos = b.hijos.map((hijo) => ({
      texto: textoRequerido(hijo.texto, `El texto de una opción de ${texto}`),
      url: urlValida(hijo.url, `La URL de "${hijo.texto}"`),
    }));
    const url = textoOpcional(b.url);
    if (hijos.length === 0 && url === undefined) invalido(`"${texto}" necesita una URL o al menos una opción.`);
    return { tipo: "menu", texto, url: url === undefined ? undefined : urlValida(url, `La URL de "${texto}"`), hijos };
  },
};

function normalizar(ctx: QueryCtx, bloque: ContenidoBloque): Promise<ContenidoBloque> {
  // TypeScript no puede relacionar `tipo` con su normalizador; el mapa lo garantiza.
  const normalizador = normalizadores[bloque.tipo] as Normalizador<TipoBloque>;
  return normalizador(ctx, bloque);
}

/* =========================================================
   ESCRITURA
========================================================= */

export type CamposSeccion = Record<string, ContenidoBloque[]>;

/**
 * Guarda la sección completa en una transacción: valida contra el
 * registro, borra sus bloques y escribe los nuevos con su orden.
 * Un campo ausente o con lista vacía queda sin contenido.
 */
async function guardarSeccion(
  ctx: MutationCtx,
  pagina: string,
  seccion: string,
  campos: CamposSeccion,
) {
  const definicion = buscarSeccion(pagina, seccion) ?? noEncontrado("La sección");

  const filas: { campo: string; orden: number; contenido: ContenidoBloque }[] = [];
  for (const [campo, lista] of Object.entries(campos)) {
    if (!Object.hasOwn(definicion.campos, campo)) invalido(`El campo ${campo} no existe.`);
    const campoDef = definicion.campos[campo];

    if (!campoDef.lista && lista.length > 1) invalido(`${campoDef.etiqueta} admite un solo bloque.`);
    for (const [orden, bloque] of lista.entries()) {
      if (bloque.tipo !== campoDef.tipo) {
        invalido(`${campoDef.etiqueta} espera un bloque de tipo ${campoDef.tipo}.`);
      }
      if (bloque.tipo === "opcion" && !Object.hasOwn(campoDef.opciones ?? {}, bloque.valor)) {
        invalido(`${campoDef.etiqueta} no admite la opción "${bloque.valor}".`);
      }
      filas.push({ campo, orden, contenido: await normalizar(ctx, bloque) });
    }
  }

  for (const anterior of await bloques.listarPorSeccion(ctx, pagina, seccion)) {
    await bloques.eliminar(ctx, anterior._id);
  }
  for (const fila of filas) {
    await bloques.insertar(ctx, { pagina, seccion, ...fila });
  }
}

/**
 * Guarda varias secciones de la página en la misma transacción: si una
 * no pasa la validación, no se guarda ninguna. El error lleva el nombre
 * de la sección para que el editor sepa dónde corregir.
 */
export async function guardarPagina(ctx: MutationCtx, pagina: string, secciones: Record<string, CamposSeccion>) {
  for (const [seccion, campos] of Object.entries(secciones)) {
    try {
      await guardarSeccion(ctx, pagina, seccion, campos);
    } catch (error) {
      const nombre = buscarSeccion(pagina, seccion)?.nombre;
      if (nombre && error instanceof ConvexError && typeof error.data?.mensaje === "string") {
        throw new ConvexError({ ...error.data, mensaje: `${nombre}: ${error.data.mensaje}` });
      }
      throw error;
    }
  }
}

/* =========================================================
   LECTURA
   Devuelve { seccion: { campo: bloques[] } } con las imágenes
   resueltas (url + alt). La usan el sitio y el CMS.
========================================================= */

type ImagenResuelta = Awaited<ReturnType<typeof resolverImagen>>;
export type BloqueResuelto = ContenidoBloque & { imagen?: ImagenResuelta };

async function resolver(ctx: QueryCtx, contenido: ContenidoBloque): Promise<BloqueResuelto> {
  if (!("imagenId" in contenido) || contenido.imagenId === undefined) return contenido;
  return { ...contenido, imagen: await resolverImagen(ctx, contenido.imagenId) };
}

export async function obtenerPagina(ctx: QueryCtx, pagina: string) {
  if (!buscarPagina(pagina)) noEncontrado("La página");

  const contenido: Record<string, Record<string, BloqueResuelto[]>> = {};
  for (const fila of await bloques.listarPorPagina(ctx, pagina)) {
    // Ignora filas de secciones o campos que ya no están en el registro.
    const seccion = buscarSeccion(pagina, fila.seccion);
    if (!seccion || !Object.hasOwn(seccion.campos, fila.campo)) continue;

    const campos = (contenido[fila.seccion] ??= {});
    (campos[fila.campo] ??= []).push(await resolver(ctx, fila.contenido));
  }
  return contenido;
}
