import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Datos } from "../lib/repositorio";
import {
  asegurarSinDependientes,
  asegurarUnico,
  existente,
  textoRequerido,
} from "../lib/validacion";
import { areas, puestoDetalles, puestos } from "../repositorios/organizacion";
import { vacantes } from "../repositorios/vacantes";

/* Mismo patrón que servicios/ubicacion: normalizar valida el registro completo. */

/* =========================================================
   ÁREAS
========================================================= */

async function normalizarArea(
  ctx: QueryCtx,
  datos: Datos<"areas">,
  idActual?: Id<"areas">,
): Promise<Datos<"areas">> {
  const nombre = textoRequerido(datos.nombre, "El nombre del área");
  asegurarUnico(await areas.buscarPorNombre(ctx, nombre), idActual, `Ya existe el área ${nombre}.`);
  return { nombre };
}

export const listarAreas = (ctx: QueryCtx) => areas.listar(ctx);

export async function crearArea(ctx: MutationCtx, datos: Datos<"areas">) {
  return areas.insertar(ctx, await normalizarArea(ctx, datos));
}

export async function actualizarArea(
  ctx: MutationCtx,
  id: Id<"areas">,
  cambios: Partial<Datos<"areas">>,
) {
  const actual = existente(await areas.obtener(ctx, id), "El área");
  await areas.actualizar(ctx, id, await normalizarArea(ctx, { ...actual, ...cambios }, id));
}

export async function eliminarArea(ctx: MutationCtx, id: Id<"areas">) {
  existente(await areas.obtener(ctx, id), "El área");
  asegurarSinDependientes(
    await puestos.primeroDeArea(ctx, id),
    "El área tiene puestos; elimínalos o muévelos primero.",
  );
  await areas.eliminar(ctx, id);
}

/* =========================================================
   PUESTOS
========================================================= */

async function normalizarPuesto(
  ctx: QueryCtx,
  datos: Datos<"puestos">,
  idActual?: Id<"puestos">,
): Promise<Datos<"puestos">> {
  existente(await areas.obtener(ctx, datos.areaId), "El área");
  const nombre = textoRequerido(datos.nombre, "El nombre del puesto");
  asegurarUnico(
    await puestos.buscarPorNombre(ctx, datos.areaId, nombre),
    idActual,
    `Ya existe el puesto ${nombre} en esa área.`,
  );
  return { areaId: datos.areaId, nombre };
}

export async function listarPuestos(ctx: QueryCtx, areaId: Id<"areas">) {
  return puestos.listarPorArea(ctx, areaId);
}

/** Reemplaza la lista completa; el orden es el del arreglo. */
async function reemplazarResponsabilidades(
  ctx: MutationCtx,
  puestoId: Id<"puestos">,
  responsabilidades: string[],
) {
  const nuevas = responsabilidades.map((texto) => textoRequerido(texto, "La responsabilidad"));
  for (const anterior of await puestoDetalles.listarPorPuesto(ctx, puestoId)) {
    await puestoDetalles.eliminar(ctx, anterior._id);
  }
  for (const [indice, responsabilidad] of nuevas.entries()) {
    await puestoDetalles.insertar(ctx, { puestoId, responsabilidad, orden: indice + 1 });
  }
}

export async function crearPuesto(
  ctx: MutationCtx,
  datos: Datos<"puestos">,
  responsabilidades: string[],
) {
  const id = await puestos.insertar(ctx, await normalizarPuesto(ctx, datos));
  await reemplazarResponsabilidades(ctx, id, responsabilidades);
  return id;
}

/** `responsabilidades` omitido = no se tocan. */
export async function actualizarPuesto(
  ctx: MutationCtx,
  id: Id<"puestos">,
  cambios: Partial<Datos<"puestos">>,
  responsabilidades?: string[],
) {
  const actual = existente(await puestos.obtener(ctx, id), "El puesto");
  await puestos.actualizar(ctx, id, await normalizarPuesto(ctx, { ...actual, ...cambios }, id));
  if (responsabilidades !== undefined) await reemplazarResponsabilidades(ctx, id, responsabilidades);
}

/** RESTRICT si hay vacantes del puesto; CASCADE sobre sus responsabilidades. */
export async function eliminarPuesto(ctx: MutationCtx, id: Id<"puestos">) {
  existente(await puestos.obtener(ctx, id), "El puesto");
  asegurarSinDependientes(
    await vacantes.primeraDePuesto(ctx, id),
    "El puesto tiene vacantes; elimínalas primero.",
  );
  await reemplazarResponsabilidades(ctx, id, []);
  await puestos.eliminar(ctx, id);
}

export async function listarResponsabilidades(ctx: QueryCtx, puestoId: Id<"puestos">) {
  return puestoDetalles.listarPorPuesto(ctx, puestoId);
}

/* =========================================================
   LECTURA COMPUESTA (la usan otros dominios)
========================================================= */

export type PuestoConArea = { puesto: Doc<"puestos">; area: Doc<"areas"> };

export async function obtenerPuestoConArea(
  ctx: QueryCtx,
  puestoId: Id<"puestos">,
): Promise<PuestoConArea> {
  const puesto = existente(await puestos.obtener(ctx, puestoId), "El puesto");
  const area = existente(await areas.obtener(ctx, puesto.areaId), "El área");
  return { puesto, area };
}
