import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { invalido } from "../lib/errores";
import type { Datos } from "../lib/repositorio";
import {
  asegurarSinDependientes,
  asegurarUnico,
  existente,
  textoRequerido,
} from "../lib/validacion";
import { ciudadDetalles, ciudades, departamentos, paises } from "../repositorios/ubicacion";
import { vacantes } from "../repositorios/vacantes";
import { proyectos } from "../repositorios/proyectos";

/*
 * Cada entidad tiene un `normalizar*` que valida el registro completo.
 * Crear = normalizar + insertar. Actualizar = fusionar con lo guardado,
 * normalizar y aplicar. Así las reglas viven en un solo lugar.
 */

/* =========================================================
   PAÍSES
========================================================= */

async function normalizarPais(
  ctx: QueryCtx,
  datos: Datos<"paises">,
  idActual?: Id<"paises">,
): Promise<Datos<"paises">> {
  const nombre = textoRequerido(datos.nombre, "El nombre del país");
  const codigoIso = datos.codigoIso.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(codigoIso)) invalido("El código ISO debe tener 2 letras (ej. HN).");

  asegurarUnico(await paises.buscarPorNombre(ctx, nombre), idActual, `Ya existe el país ${nombre}.`);
  asegurarUnico(
    await paises.buscarPorCodigoIso(ctx, codigoIso),
    idActual,
    `Ya existe un país con el código ${codigoIso}.`,
  );
  return { nombre, codigoIso };
}

export const listarPaises = (ctx: QueryCtx) => paises.listar(ctx);

export async function crearPais(ctx: MutationCtx, datos: Datos<"paises">) {
  return paises.insertar(ctx, await normalizarPais(ctx, datos));
}

export async function actualizarPais(
  ctx: MutationCtx,
  id: Id<"paises">,
  cambios: Partial<Datos<"paises">>,
) {
  const actual = existente(await paises.obtener(ctx, id), "El país");
  await paises.actualizar(ctx, id, await normalizarPais(ctx, { ...actual, ...cambios }, id));
}

export async function eliminarPais(ctx: MutationCtx, id: Id<"paises">) {
  existente(await paises.obtener(ctx, id), "El país");
  asegurarSinDependientes(
    await departamentos.primeroDePais(ctx, id),
    "El país tiene departamentos; elimínalos primero.",
  );
  await paises.eliminar(ctx, id);
}

/* =========================================================
   DEPARTAMENTOS
========================================================= */

async function normalizarDepartamento(
  ctx: QueryCtx,
  datos: Datos<"departamentos">,
  idActual?: Id<"departamentos">,
): Promise<Datos<"departamentos">> {
  existente(await paises.obtener(ctx, datos.paisId), "El país");
  const nombre = textoRequerido(datos.nombre, "El nombre del departamento");

  asegurarUnico(
    await departamentos.buscarPorNombre(ctx, datos.paisId, nombre),
    idActual,
    `Ya existe el departamento ${nombre} en ese país.`,
  );
  return { paisId: datos.paisId, nombre };
}

export async function listarDepartamentos(ctx: QueryCtx, paisId: Id<"paises">) {
  return departamentos.listarPorPais(ctx, paisId);
}

export async function crearDepartamento(ctx: MutationCtx, datos: Datos<"departamentos">) {
  return departamentos.insertar(ctx, await normalizarDepartamento(ctx, datos));
}

export async function actualizarDepartamento(
  ctx: MutationCtx,
  id: Id<"departamentos">,
  cambios: Partial<Datos<"departamentos">>,
) {
  const actual = existente(await departamentos.obtener(ctx, id), "El departamento");
  await departamentos.actualizar(
    ctx,
    id,
    await normalizarDepartamento(ctx, { ...actual, ...cambios }, id),
  );
}

export async function eliminarDepartamento(ctx: MutationCtx, id: Id<"departamentos">) {
  existente(await departamentos.obtener(ctx, id), "El departamento");
  asegurarSinDependientes(
    await ciudades.primeraDeDepartamento(ctx, id),
    "El departamento tiene ciudades; elimínalas primero.",
  );
  await departamentos.eliminar(ctx, id);
}

/* =========================================================
   CIUDADES (+ detalle 1:1)
========================================================= */

async function normalizarCiudad(
  ctx: QueryCtx,
  datos: Datos<"ciudades">,
  idActual?: Id<"ciudades">,
): Promise<Datos<"ciudades">> {
  existente(await departamentos.obtener(ctx, datos.departamentoId), "El departamento");
  const nombre = textoRequerido(datos.nombre, "El nombre de la ciudad");

  asegurarUnico(
    await ciudades.buscarPorNombre(ctx, datos.departamentoId, nombre),
    idActual,
    `Ya existe la ciudad ${nombre} en ese departamento.`,
  );
  return { departamentoId: datos.departamentoId, nombre };
}

export async function listarCiudades(ctx: QueryCtx, departamentoId: Id<"departamentos">) {
  return ciudades.listarPorDepartamento(ctx, departamentoId);
}

export async function crearCiudad(ctx: MutationCtx, datos: Datos<"ciudades">) {
  return ciudades.insertar(ctx, await normalizarCiudad(ctx, datos));
}

export async function actualizarCiudad(
  ctx: MutationCtx,
  id: Id<"ciudades">,
  cambios: Partial<Datos<"ciudades">>,
) {
  const actual = existente(await ciudades.obtener(ctx, id), "La ciudad");
  await ciudades.actualizar(ctx, id, await normalizarCiudad(ctx, { ...actual, ...cambios }, id));
}

/** RESTRICT si hay vacantes o proyectos en la ciudad; CASCADE sobre su detalle. */
export async function eliminarCiudad(ctx: MutationCtx, id: Id<"ciudades">) {
  existente(await ciudades.obtener(ctx, id), "La ciudad");
  asegurarSinDependientes(
    await vacantes.primeraDeCiudad(ctx, id),
    "La ciudad tiene vacantes; reasígnalas o elimínalas primero.",
  );
  asegurarSinDependientes(
    await proyectos.primeroDeCiudad(ctx, id),
    "La ciudad tiene proyectos; reasígnalos o elimínalos primero.",
  );

  const detalle = await ciudadDetalles.buscarPorCiudad(ctx, id);
  if (detalle !== null) await ciudadDetalles.eliminar(ctx, detalle._id);
  await ciudades.eliminar(ctx, id);
}

export async function obtenerDetalleCiudad(ctx: QueryCtx, ciudadId: Id<"ciudades">) {
  return ciudadDetalles.buscarPorCiudad(ctx, ciudadId);
}

/** Crea o reemplaza el detalle. Un campo omitido queda vacío. */
export async function guardarDetalleCiudad(
  ctx: MutationCtx,
  ciudadId: Id<"ciudades">,
  datos: Omit<Datos<"ciudadDetalles">, "ciudadId">,
) {
  existente(await ciudades.obtener(ctx, ciudadId), "La ciudad");
  const { latitud, longitud } = datos;
  // isFinite también descarta NaN, que Convex sí aceptaría como número.
  const fueraDeRango = (valor: number | undefined, limite: number) =>
    valor !== undefined && (!Number.isFinite(valor) || Math.abs(valor) > limite);
  if (fueraDeRango(latitud, 90)) invalido("La latitud debe ser un número entre -90 y 90.");
  if (fueraDeRango(longitud, 180)) invalido("La longitud debe ser un número entre -180 y 180.");

  const detalle: Datos<"ciudadDetalles"> = {
    ciudadId,
    codigoPostal: datos.codigoPostal?.trim() || undefined,
    latitud,
    longitud,
  };
  const actual = await ciudadDetalles.buscarPorCiudad(ctx, ciudadId);
  if (actual === null) return ciudadDetalles.insertar(ctx, detalle);
  await ciudadDetalles.actualizar(ctx, actual._id, detalle);
  return actual._id;
}

/* =========================================================
   LECTURA COMPUESTA (la usan otros dominios)
========================================================= */

export type Ubicacion = {
  ciudad: Doc<"ciudades">;
  departamento: Doc<"departamentos">;
  pais: Doc<"paises">;
};

/** Recorre ciudad → departamento → país. */
export async function obtenerUbicacion(
  ctx: QueryCtx,
  ciudadId: Id<"ciudades">,
): Promise<Ubicacion> {
  const ciudad = existente(await ciudades.obtener(ctx, ciudadId), "La ciudad");
  const departamento = existente(
    await departamentos.obtener(ctx, ciudad.departamentoId),
    "El departamento",
  );
  const pais = existente(await paises.obtener(ctx, departamento.paisId), "El país");
  return { ciudad, departamento, pais };
}
