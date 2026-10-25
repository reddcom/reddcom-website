import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { invalido } from "../lib/errores";
import type { Datos } from "../lib/repositorio";
import { asegurarUnico, existente, textoRequerido } from "../lib/validacion";
import { postulaciones } from "../repositorios/postulaciones";
import { vacanteDetalles, vacantes } from "../repositorios/vacantes";
import { listarResponsabilidades, obtenerPuestoConArea } from "./organizacion";
import { obtenerUbicacion } from "./ubicacion";

/* =========================================================
   ESCRITURA
========================================================= */

const FORMATO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function normalizarVacante(
  ctx: QueryCtx,
  datos: Datos<"vacantes">,
  idActual?: Id<"vacantes">,
): Promise<Datos<"vacantes">> {
  // Validan que las FK apunten a documentos existentes.
  await obtenerPuestoConArea(ctx, datos.puestoId);
  await obtenerUbicacion(ctx, datos.ciudadId);

  const slug = datos.slug.trim().toLowerCase();
  if (!FORMATO_SLUG.test(slug)) invalido("El slug solo admite minúsculas, números y guiones.");
  asegurarUnico(await vacantes.buscarPorSlug(ctx, slug), idActual, `El slug ${slug} ya está en uso.`);

  return {
    puestoId: datos.puestoId,
    ciudadId: datos.ciudadId,
    slug,
    jornada: datos.jornada,
    resumen: textoRequerido(datos.resumen, "El resumen"),
    fechaPublicacion: datos.fechaPublicacion,
    activa: datos.activa,
  };
}

/** Reemplaza la lista completa; el orden es el del arreglo. */
async function reemplazarRequisitos(ctx: MutationCtx, vacanteId: Id<"vacantes">, requisitos: string[]) {
  const nuevos = requisitos.map((texto) => textoRequerido(texto, "El requisito"));
  for (const anterior of await vacanteDetalles.listarPorVacante(ctx, vacanteId)) {
    await vacanteDetalles.eliminar(ctx, anterior._id);
  }
  for (const [indice, requisito] of nuevos.entries()) {
    await vacanteDetalles.insertar(ctx, { vacanteId, requisito, orden: indice + 1 });
  }
}

export type NuevaVacante = Omit<Datos<"vacantes">, "fechaPublicacion"> & {
  fechaPublicacion?: number;
};

export async function crearVacante(ctx: MutationCtx, datos: NuevaVacante, requisitos: string[]) {
  const completa = { ...datos, fechaPublicacion: datos.fechaPublicacion ?? Date.now() };
  const id = await vacantes.insertar(ctx, await normalizarVacante(ctx, completa));
  await reemplazarRequisitos(ctx, id, requisitos);
  return id;
}

/** `requisitos` omitido = no se tocan. */
export async function actualizarVacante(
  ctx: MutationCtx,
  id: Id<"vacantes">,
  cambios: Partial<Datos<"vacantes">>,
  requisitos?: string[],
) {
  const actual = existente(await vacantes.obtener(ctx, id), "La vacante");
  await vacantes.actualizar(ctx, id, await normalizarVacante(ctx, { ...actual, ...cambios }, id));
  if (requisitos !== undefined) await reemplazarRequisitos(ctx, id, requisitos);
}

/** CASCADE sobre sus requisitos. */
export async function eliminarVacante(ctx: MutationCtx, id: Id<"vacantes">) {
  existente(await vacantes.obtener(ctx, id), "La vacante");
  // Las postulaciones son registros de personas reales: no se borran en cascada.
  if (await postulaciones.primeraDeVacante(ctx, id)) {
    invalido("Esta vacante ya tiene postulaciones. Desactívala en lugar de eliminarla.");
  }
  await reemplazarRequisitos(ctx, id, []);
  await vacantes.eliminar(ctx, id);
}

/* =========================================================
   LECTURA
   Las vistas reconstruyen con joins lo que la tabla no copia.
========================================================= */

export async function aResumen(ctx: QueryCtx, vacante: Doc<"vacantes">) {
  const [{ puesto, area }, { ciudad, departamento, pais }] = await Promise.all([
    obtenerPuestoConArea(ctx, vacante.puestoId),
    obtenerUbicacion(ctx, vacante.ciudadId),
  ]);
  return {
    id: vacante._id,
    slug: vacante.slug,
    titulo: puesto.nombre,
    area: area.nombre,
    ciudad: ciudad.nombre,
    departamento: departamento.nombre,
    pais: pais.nombre,
    jornada: vacante.jornada,
    resumen: vacante.resumen,
    fechaPublicacion: vacante.fechaPublicacion,
    activa: vacante.activa,
  };
}

const requisitosDe = async (ctx: QueryCtx, vacanteId: Id<"vacantes">) =>
  (await vacanteDetalles.listarPorVacante(ctx, vacanteId)).map((r) => r.requisito);

export async function listarVacantesActivas(ctx: QueryCtx) {
  const activas = await vacantes.listarActivas(ctx);
  return Promise.all(activas.map((vacante) => aResumen(ctx, vacante)));
}

/** `null` si no existe o no está activa: la página responde 404. */
export async function obtenerVacantePublica(ctx: QueryCtx, slug: string) {
  const vacante = await vacantes.buscarPorSlug(ctx, slug);
  if (vacante === null || !vacante.activa) return null;

  const [resumen, responsabilidades, requisitos] = await Promise.all([
    aResumen(ctx, vacante),
    listarResponsabilidades(ctx, vacante.puestoId),
    requisitosDe(ctx, vacante._id),
  ]);
  return {
    ...resumen,
    responsabilidades: responsabilidades.map((r) => r.responsabilidad),
    requisitos,
  };
}

/** CMS: todas, activas primero y luego por fecha descendente. */
export async function listarTodas(ctx: QueryCtx) {
  const todas = await vacantes.listarTodas(ctx);
  return Promise.all(todas.map((vacante) => aResumen(ctx, vacante)));
}

/** CMS: la vacante tal como se guarda, más los padres para los selects en cascada. */
export async function obtenerParaEdicion(ctx: QueryCtx, id: Id<"vacantes">) {
  const vacante = existente(await vacantes.obtener(ctx, id), "La vacante");
  const [{ puesto }, { departamento }, requisitos] = await Promise.all([
    obtenerPuestoConArea(ctx, vacante.puestoId),
    obtenerUbicacion(ctx, vacante.ciudadId),
    requisitosDe(ctx, id),
  ]);
  return {
    vacante,
    areaId: puesto.areaId,
    paisId: departamento.paisId,
    departamentoId: departamento._id,
    requisitos,
  };
}
