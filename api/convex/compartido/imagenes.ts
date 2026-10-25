/*
 * Imágenes del banco. El editor puede elegir varios formatos, pero el CMS los
 * convierte a WebP antes de subirlos: lo guardado siempre es WebP y liviano.
 * El servidor hace cumplir lo guardado; el CMS usa lo de origen para avisar antes.
 */

/** Lo que el editor puede elegir. */
export const TIPOS_ORIGEN = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const TAMANO_MAXIMO_ORIGEN = 25 * 1024 * 1024; // 25 MB: fotos de cámara o celular
export const MENSAJE_ORIGEN_INVALIDO = "Solo se aceptan imágenes JPG, PNG, WebP, AVIF o GIF de hasta 25 MB.";

export function esOrigenValido(tipo: string | undefined, tamano: number): boolean {
  return TIPOS_ORIGEN.includes(tipo ?? "") && tamano <= TAMANO_MAXIMO_ORIGEN;
}

/** Cómo se guarda: WebP con el lado mayor reducido a 1920 px. */
export const TIPO_IMAGEN = "image/webp";
export const LADO_MAXIMO_IMAGEN = 1920;
export const CALIDAD_WEBP = 80; // 0-100
export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024; // 5 MB
export const MENSAJE_IMAGEN_INVALIDA = "La imagen debe guardarse en WebP de hasta 5 MB.";

export function esImagenValida(tipo: string | undefined, tamano: number): boolean {
  return tipo === TIPO_IMAGEN && tamano <= TAMANO_MAXIMO_IMAGEN;
}
