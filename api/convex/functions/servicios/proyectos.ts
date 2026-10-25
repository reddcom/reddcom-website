import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { invalido } from "../lib/errores";
import type { Datos } from "../lib/repositorio";
import { asegurarUnico, existente, textoRequerido } from "../lib/validacion";
import { proyectoAlcance, proyectoCifras, proyectoGaleria, proyectos } from "../repositorios/proyectos";
import { asegurarImagen, resolverImagen } from "./imagenes";
import { obtenerUbicacion } from "./ubicacion";

/* =========================================================
   ESCRITURA
========================================================= */

const FORMATO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ListasProyecto = {
  cifras: { valor: string; etiqueta: string }[];
  alcance: string[];
  galeria: Id<"imagenes">[];
};

async function normalizarProyecto(
  ctx: QueryCtx,
  datos: Datos<"proyectos">,
  idActual?: Id<"proyectos">,
): Promise<Datos<"proyectos">> {
  // Validan que las FK apunten a documentos existentes.
  await obtenerUbicacion(ctx, datos.ciudadId);
  await asegurarImagen(ctx, datos.imagenId);

  const slug = datos.slug.trim().toLowerCase();
  if (!FORMATO_SLUG.test(slug)) invalido("El slug solo admite minúsculas, números y guiones.");
  asegurarUnico(await proyectos.buscarPorSlug(ctx, slug), idActual, `El slug ${slug} ya está en uso.`);

  if (!Number.isInteger(datos.anio) || datos.anio < 1990 || datos.anio > 2100) {
    invalido("El año del proyecto debe estar entre 1990 y 2100.");
  }

  return {
    slug,
    titulo: textoRequerido(datos.titulo, "El título"),
    resumen: textoRequerido(datos.resumen, "El resumen"),
    descripcion: textoRequerido(datos.descripcion, "La descripción"),
    ciudadId: datos.ciudadId,
    anio: datos.anio,
    servicio: datos.servicio,
    imagenId: datos.imagenId,
    activo: datos.activo,
  };
}

/** Reemplaza las tres listas completas; el orden es el de cada arreglo. */
async function reemplazarListas(ctx: MutationCtx, proyectoId: Id<"proyectos">, listas: ListasProyecto) {
  const cifras = listas.cifras.map((cifra) => ({
    valor: textoRequerido(cifra.valor, "El valor de la cifra"),
    etiqueta: textoRequerido(cifra.etiqueta, "La etiqueta de la cifra"),
  }));
  const alcance = listas.alcance.map((texto) => textoRequerido(texto, "El punto de alcance"));
  for (const imagenId of listas.galeria) await asegurarImagen(ctx, imagenId);

  for (const fila of await proyectoCifras.listarPorProyecto(ctx, proyectoId)) await proyectoCifras.eliminar(ctx, fila._id);
  for (const fila of await proyectoAlcance.listarPorProyecto(ctx, proyectoId)) await proyectoAlcance.eliminar(ctx, fila._id);
  for (const fila of await proyectoGaleria.listarPorProyecto(ctx, proyectoId)) await proyectoGaleria.eliminar(ctx, fila._id);

  for (const [indice, cifra] of cifras.entries()) {
    await proyectoCifras.insertar(ctx, { proyectoId, ...cifra, orden: indice + 1 });
  }
  for (const [indice, texto] of alcance.entries()) {
    await proyectoAlcance.insertar(ctx, { proyectoId, texto, orden: indice + 1 });
  }
  for (const [indice, imagenId] of listas.galeria.entries()) {
    await proyectoGaleria.insertar(ctx, { proyectoId, imagenId, orden: indice + 1 });
  }
}

export async function crearProyecto(ctx: MutationCtx, datos: Datos<"proyectos">, listas: ListasProyecto) {
  const id = await proyectos.insertar(ctx, await normalizarProyecto(ctx, datos));
  await reemplazarListas(ctx, id, listas);
  return id;
}

/** `listas` omitido = no se tocan. */
export async function actualizarProyecto(
  ctx: MutationCtx,
  id: Id<"proyectos">,
  cambios: Partial<Datos<"proyectos">>,
  listas?: ListasProyecto,
) {
  const actual = existente(await proyectos.obtener(ctx, id), "El proyecto");
  await proyectos.actualizar(ctx, id, await normalizarProyecto(ctx, { ...actual, ...cambios }, id));
  if (listas !== undefined) await reemplazarListas(ctx, id, listas);
}

/** CASCADE sobre sus listas. */
export async function eliminarProyecto(ctx: MutationCtx, id: Id<"proyectos">) {
  existente(await proyectos.obtener(ctx, id), "El proyecto");
  await reemplazarListas(ctx, id, { cifras: [], alcance: [], galeria: [] });
  await proyectos.eliminar(ctx, id);
}

/* =========================================================
   LECTURA
   Las vistas reconstruyen con joins lo que la tabla no copia.
========================================================= */

async function aResumen(ctx: QueryCtx, proyecto: Doc<"proyectos">) {
  const [{ ciudad, departamento, pais }, imagen] = await Promise.all([
    obtenerUbicacion(ctx, proyecto.ciudadId),
    resolverImagen(ctx, proyecto.imagenId),
  ]);
  return {
    id: proyecto._id,
    slug: proyecto.slug,
    titulo: proyecto.titulo,
    resumen: proyecto.resumen,
    anio: proyecto.anio,
    servicio: proyecto.servicio,
    ciudad: ciudad.nombre,
    departamento: departamento.nombre,
    pais: pais.nombre,
    imagen,
    activo: proyecto.activo,
  };
}

async function listasDe(ctx: QueryCtx, proyectoId: Id<"proyectos">) {
  const [cifras, alcance, galeria] = await Promise.all([
    proyectoCifras.listarPorProyecto(ctx, proyectoId),
    proyectoAlcance.listarPorProyecto(ctx, proyectoId),
    proyectoGaleria.listarPorProyecto(ctx, proyectoId),
  ]);
  return { cifras, alcance, galeria };
}

export async function listarProyectosActivos(ctx: QueryCtx) {
  const activos = await proyectos.listarActivos(ctx);
  return Promise.all(activos.map((proyecto) => aResumen(ctx, proyecto)));
}

/** `null` si no existe o no está activo: la página no se genera. */
export async function obtenerProyectoPublico(ctx: QueryCtx, slug: string) {
  const proyecto = await proyectos.buscarPorSlug(ctx, slug);
  if (proyecto === null || !proyecto.activo) return null;

  const [resumen, listas] = await Promise.all([aResumen(ctx, proyecto), listasDe(ctx, proyecto._id)]);
  const galeria = await Promise.all(listas.galeria.map((fila) => resolverImagen(ctx, fila.imagenId)));
  return {
    ...resumen,
    descripcion: proyecto.descripcion,
    cifras: listas.cifras.map(({ valor, etiqueta }) => ({ valor, etiqueta })),
    alcance: listas.alcance.map((fila) => fila.texto),
    galeria: galeria.filter((imagen) => imagen !== null),
  };
}

/** CMS: todos, activos primero y luego por año descendente. */
export async function listarTodos(ctx: QueryCtx) {
  const todos = await proyectos.listarTodos(ctx);
  return Promise.all(todos.map((proyecto) => aResumen(ctx, proyecto)));
}

/** CMS: el proyecto tal como se guarda, más los padres de la ciudad para los selects en cascada. */
export async function obtenerParaEdicion(ctx: QueryCtx, id: Id<"proyectos">) {
  const proyecto = existente(await proyectos.obtener(ctx, id), "El proyecto");
  const [{ departamento }, listas] = await Promise.all([
    obtenerUbicacion(ctx, proyecto.ciudadId),
    listasDe(ctx, id),
  ]);
  return {
    proyecto,
    paisId: departamento.paisId,
    departamentoId: departamento._id,
    cifras: listas.cifras.map(({ valor, etiqueta }) => ({ valor, etiqueta })),
    alcance: listas.alcance.map((fila) => fila.texto),
    galeria: listas.galeria.map((fila) => fila.imagenId),
  };
}
