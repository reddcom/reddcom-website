import { api } from "@reddcom/convex/api";
import { esImagenValida, esOrigenValido, MENSAJE_IMAGEN_INVALIDA, MENSAJE_ORIGEN_INVALIDO } from "@reddcom/convex/imagenes";
import type { Id } from "@reddcom/convex/modelo";
import { useMutation } from "convex/react";
import { ErrorCms } from "../lib/errores";
import { useAccion } from "../lib/useAccion";
import { aWebp } from "./aWebp";

/**
 * Sube una imagen en tres pasos (patrón de Convex File Storage), después
 * de convertirla a WebP: pide una URL de subida, envía el archivo con POST
 * y registra el storageId devuelto junto con su texto alternativo. La
 * imagen queda en el banco de imágenes y `subir` devuelve su id.
 */
export function useSubidaImagen() {
  const generarUrl = useMutation(api.imagenes.generarUrlSubida);
  const registrar = useMutation(api.imagenes.registrar);

  return useAccion(async (original: File, alt: string): Promise<Id<"imagenes">> => {
    if (!esOrigenValido(original.type, original.size)) throw new ErrorCms(MENSAJE_ORIGEN_INVALIDO);

    const archivo = await aWebp(original).catch(() => {
      throw new ErrorCms("No se pudo convertir la imagen a WebP. Prueba con otro archivo.");
    });
    if (!esImagenValida(archivo.type, archivo.size)) throw new ErrorCms(MENSAJE_IMAGEN_INVALIDA);

    const url = await generarUrl();
    const respuesta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": archivo.type },
      body: archivo,
    });
    if (!respuesta.ok) throw new ErrorCms("No se pudo subir el archivo. Revisa tu conexión.");
    const { storageId } = (await respuesta.json()) as { storageId: Id<"_storage"> };

    return registrar({ storageId, nombre: archivo.name, alt });
  });
}
