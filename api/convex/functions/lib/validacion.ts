import { conflicto, invalido, noEncontrado } from "./errores";

/** Recorta y colapsa espacios (respeta saltos de línea). */
function limpiar(valor: string): string {
  return valor.trim().replace(/[ \t]+/g, " ");
}

/** Texto limpio; falla si queda vacío. */
export function textoRequerido(valor: string, campo: string): string {
  const limpio = limpiar(valor);
  if (limpio === "") invalido(`${campo} no puede estar vacío.`);
  return limpio;
}

/** Texto limpio, o `undefined` si queda vacío (el campo no se guarda). */
export function textoOpcional(valor: string | undefined): string | undefined {
  const limpio = valor === undefined ? "" : limpiar(valor);
  return limpio === "" ? undefined : limpio;
}

/** Ruta interna, ancla, http(s), mailto o tel. */
export function urlValida(valor: string, campo: string): string {
  const url = textoRequerido(valor, campo);
  if (!/^(\/|#|https?:\/\/|mailto:|tel:)/.test(url)) {
    invalido(`${campo} debe empezar con /, #, https://, mailto: o tel:.`);
  }
  return url;
}

/** Devuelve el documento o falla con NO_ENCONTRADO. */
export function existente<T>(doc: T | null, entidad: string): T {
  if (doc === null) noEncontrado(entidad);
  return doc;
}

/**
 * Convex no tiene restricciones UNIQUE: se verifican en el servicio.
 * `idActual` permite que un documento conserve su propio valor al actualizarse.
 */
export function asegurarUnico(
  encontrado: { _id: string } | null,
  idActual: string | undefined,
  mensaje: string,
): void {
  if (encontrado !== null && encontrado._id !== idActual) conflicto(mensaje);
}

/** Integridad referencial ON DELETE RESTRICT. */
export function asegurarSinDependientes(dependiente: unknown | null, mensaje: string): void {
  if (dependiente !== null) conflicto(mensaje);
}
