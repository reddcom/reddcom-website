import { CALIDAD_WEBP, LADO_MAXIMO_IMAGEN, TIPO_IMAGEN } from "@reddcom/convex/imagenes";

/**
 * Convierte la imagen a WebP en el navegador antes de subirla, reduciendo
 * el lado mayor a LADO_MAXIMO_IMAGEN. Codifica con libwebp (WASM) y no con
 * canvas.toBlob porque Safari no sabe exportar WebP. De un GIF animado
 * queda solo el primer cuadro.
 */
export async function aWebp(archivo: File): Promise<File> {
  const mapa = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO_IMAGEN / Math.max(mapa.width, mapa.height));
  const lienzo = new OffscreenCanvas(Math.round(mapa.width * escala), Math.round(mapa.height * escala));
  const contexto = lienzo.getContext("2d")!;
  contexto.drawImage(mapa, 0, 0, lienzo.width, lienzo.height);
  mapa.close();

  // El codificador (~300 KB) se descarga solo la primera vez que se sube algo.
  const { default: codificar } = await import("@jsquash/webp/encode");
  const datos = await codificar(contexto.getImageData(0, 0, lienzo.width, lienzo.height), { quality: CALIDAD_WEBP });

  const nombre = archivo.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([datos], nombre, { type: TIPO_IMAGEN });
}
