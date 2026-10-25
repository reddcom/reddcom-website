import {
  esquemaPostulacion,
  problemaConCv,
  tieneFirmaPdf,
  type DatosPostulacion,
} from "../../compartido/postulaciones";
import type { Doc, Id } from "../_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";
import { invalido } from "../lib/errores";
import { archivos, imagenes } from "../repositorios/contenido";
import { postulaciones } from "../repositorios/postulaciones";
import { vacantes } from "../repositorios/vacantes";
import { aResumen } from "./vacantes";

/* =========================================================
   ENVÍO PÚBLICO
   El formulario no exige sesión: los datos se validan otra vez
   con el mismo esquema de Zod que usa el sitio y el CV se lee
   para comprobar que de verdad es un PDF.
========================================================= */

export type EntradaPostulacion = Omit<DatosPostulacion, "consentimiento">;

/** Datos limpios según el esquema compartido; si algo falla, el primer mensaje. */
export function validarEntrada(entrada: unknown): EntradaPostulacion {
  const resultado = esquemaPostulacion.safeParse(entrada);
  if (!resultado.success) invalido(resultado.error.issues[0]?.message ?? "Revisa los datos del formulario.");
  const { consentimiento: _, ...datos } = resultado.data;
  return datos;
}

/** El archivo subido debe existir, pesar hasta 5 MB y empezar con la firma de un PDF. */
export async function validarCv(ctx: ActionCtx, cvId: Id<"_storage">) {
  const archivo = await ctx.storage.get(cvId);
  if (!archivo) invalido("No encontramos tu CV. Vuelve a adjuntarlo.");
  const problema = problemaConCv(archivo.type, archivo.size);
  if (problema) invalido(problema);
  if (!tieneFirmaPdf(new Uint8Array(await archivo.slice(0, 5).arrayBuffer()))) {
    invalido("El archivo no es un PDF válido.");
  }
}

export async function registrarPostulacion(
  ctx: MutationCtx,
  vacanteId: Id<"vacantes">,
  datos: EntradaPostulacion,
  cvId: Id<"_storage">,
) {
  const vacante = await vacantes.obtener(ctx, vacanteId);
  if (!vacante?.activa) invalido("Esta vacante ya no está disponible.");
  if (await postulaciones.deCorreoEnVacante(ctx, datos.correo, vacanteId)) {
    invalido("Ya recibimos una postulación con este correo para esta vacante.");
  }
  await postulaciones.insertar(ctx, { vacanteId, ...datos, cvId, fecha: Date.now() });
}

export const urlDeSubidaCv = (ctx: MutationCtx) => archivos.urlDeSubida(ctx);

export const descartarCv = (ctx: MutationCtx, cvId: Id<"_storage">) => archivos.eliminar(ctx, cvId);

/* =========================================================
   LECTURA (CMS)
   Solo consulta: el módulo muestra a los postulantes, no los edita.
========================================================= */

export async function listarPostulaciones(ctx: QueryCtx) {
  // Varias postulaciones comparten vacante: cada una se resuelve una vez.
  const vacantesResueltas = new Map<Id<"vacantes">, Promise<Awaited<ReturnType<typeof aResumen>> | null>>();
  const resumenDe = (id: Id<"vacantes">) => {
    if (!vacantesResueltas.has(id)) {
      vacantesResueltas.set(id, vacantes.obtener(ctx, id).then((v) => (v ? aResumen(ctx, v) : null)));
    }
    return vacantesResueltas.get(id)!;
  };

  const aVista = async (postulacion: Doc<"postulaciones">) => {
    const [vacante, cvUrl] = await Promise.all([resumenDe(postulacion.vacanteId), archivos.url(ctx, postulacion.cvId)]);
    return {
      id: postulacion._id,
      nombre: postulacion.nombre,
      correo: postulacion.correo,
      telefono: postulacion.telefono,
      enlace: postulacion.enlace,
      mensaje: postulacion.mensaje,
      fecha: postulacion.fecha,
      cvUrl,
      vacante: vacante && {
        id: vacante.id,
        slug: vacante.slug,
        titulo: vacante.titulo,
        area: vacante.area,
        ubicacion: `${vacante.ciudad}, ${vacante.pais}`,
      },
    };
  };

  return Promise.all((await postulaciones.listar(ctx)).map(aVista));
}

/* =========================================================
   LIMPIEZA
   Un CV se sube antes de enviar el formulario: si la persona
   no termina, el archivo queda suelto. Igual con imágenes que
   no se registraron. Se borran los que tienen más de un día y
   ninguna fila los usa.
========================================================= */

const UN_DIA_MS = 24 * 60 * 60 * 1000;

export async function limpiarArchivosHuerfanos(ctx: MutationCtx) {
  const antiguos = await ctx.db.system
    .query("_storage")
    .withIndex("by_creation_time", (q) => q.lt("_creationTime", Date.now() - UN_DIA_MS))
    .collect();

  let borrados = 0;
  for (const archivo of antiguos) {
    const enUso = (await postulaciones.conCv(ctx, archivo._id)) ?? (await imagenes.buscarPorStorage(ctx, archivo._id));
    if (enUso) continue;
    await archivos.eliminar(ctx, archivo._id);
    borrados++;
  }
  return borrados;
}
