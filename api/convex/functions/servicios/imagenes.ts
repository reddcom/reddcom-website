import { esImagenValida, MENSAJE_IMAGEN_INVALIDA } from "../../compartido/imagenes";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { invalido } from "../lib/errores";
import {
  asegurarSinDependientes,
  asegurarUnico,
  existente,
  textoRequerido,
} from "../lib/validacion";
import { archivos, bloques, imagenes } from "../repositorios/contenido";
import { proyectoGaleria, proyectos } from "../repositorios/proyectos";

/*
 * Subida en tres pasos (patrón de Convex File Storage):
 * 1. el CMS pide una URL de subida, 2. sube el archivo con POST,
 * 3. registra el storageId devuelto junto con su texto alternativo.
 */

export const generarUrlSubida = (ctx: MutationCtx) => archivos.urlDeSubida(ctx);

export async function registrarImagen(
  ctx: MutationCtx,
  datos: { storageId: Id<"_storage">; nombre: string; alt: string },
) {
  const archivo = existente(await archivos.metadatos(ctx, datos.storageId), "El archivo");

  // Validación en servidor: el navegador no es de fiar.
  if (!esImagenValida(archivo.contentType, archivo.size)) {
    await archivos.eliminar(ctx, datos.storageId);
    invalido(MENSAJE_IMAGEN_INVALIDA);
  }
  asegurarUnico(
    await imagenes.buscarPorStorage(ctx, datos.storageId),
    undefined,
    "Ese archivo ya está registrado.",
  );

  return imagenes.insertar(ctx, {
    storageId: datos.storageId,
    nombre: textoRequerido(datos.nombre, "El nombre"),
    alt: textoRequerido(datos.alt, "El texto alternativo"),
  });
}

async function aVista(ctx: QueryCtx, imagen: Doc<"imagenes">) {
  const [url, archivo] = await Promise.all([
    archivos.url(ctx, imagen.storageId),
    archivos.metadatos(ctx, imagen.storageId),
  ]);
  return {
    id: imagen._id,
    nombre: imagen.nombre,
    alt: imagen.alt,
    url,
    tipo: archivo?.contentType ?? null,
    tamano: archivo?.size ?? null,
  };
}

export async function listarImagenes(ctx: QueryCtx) {
  return Promise.all((await imagenes.listar(ctx)).map((imagen) => aVista(ctx, imagen)));
}

/** URL y alt para mostrar la imagen; `null` si ya no existe. */
export async function resolverImagen(ctx: QueryCtx, id: Id<"imagenes">) {
  const imagen = await imagenes.obtener(ctx, id);
  if (imagen === null) return null;
  return { url: await archivos.url(ctx, imagen.storageId), alt: imagen.alt };
}

export async function actualizarAlt(ctx: MutationCtx, id: Id<"imagenes">, alt: string) {
  existente(await imagenes.obtener(ctx, id), "La imagen");
  await imagenes.actualizar(ctx, id, { alt: textoRequerido(alt, "El texto alternativo") });
}

/** RESTRICT si algún bloque o proyecto la usa; borra también el archivo. */
export async function eliminarImagen(ctx: MutationCtx, id: Id<"imagenes">) {
  const imagen = existente(await imagenes.obtener(ctx, id), "La imagen");
  asegurarSinDependientes(
    await bloques.primeroConImagen(ctx, id),
    "La imagen se usa en una página; quítala de ahí primero.",
  );
  asegurarSinDependientes(
    (await proyectos.primeroConImagen(ctx, id)) ?? (await proyectoGaleria.primeraConImagen(ctx, id)),
    "La imagen se usa en un proyecto; quítala de ahí primero.",
  );
  await imagenes.eliminar(ctx, id);
  await archivos.eliminar(ctx, imagen.storageId);
}

export async function asegurarImagen(ctx: QueryCtx, id: Id<"imagenes">) {
  existente(await imagenes.obtener(ctx, id), "La imagen");
}
