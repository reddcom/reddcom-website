import { ConvexError } from "convex/values";

/** Error del propio CMS con un mensaje apto para mostrar. */
export class ErrorCms extends Error {}

/**
 * Mensaje para la interfaz. Solo se muestran los mensajes que escribimos
 * nosotros (ConvexError del servidor o ErrorCms); cualquier otro error es
 * técnico y se resume en uno genérico.
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ConvexError && typeof error.data?.mensaje === "string") {
    return error.data.mensaje;
  }
  if (error instanceof ErrorCms) return error.message;
  console.error(error);
  return "Algo salió mal. Intenta de nuevo.";
}
