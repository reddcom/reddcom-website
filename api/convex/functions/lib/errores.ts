import { ConvexError } from "convex/values";

/* Errores de dominio con un código estable para que el cliente los distinga. */

export function noEncontrado(entidad: string): never {
  throw new ConvexError({ codigo: "NO_ENCONTRADO", mensaje: `${entidad} no existe.` });
}

export function conflicto(mensaje: string): never {
  throw new ConvexError({ codigo: "CONFLICTO", mensaje });
}

export function invalido(mensaje: string): never {
  throw new ConvexError({ codigo: "INVALIDO", mensaje });
}

export function noAutenticado(): never {
  throw new ConvexError({ codigo: "NO_AUTENTICADO", mensaje: "Inicia sesión para continuar." });
}

export function noAutorizado(): never {
  throw new ConvexError({ codigo: "NO_AUTORIZADO", mensaje: "Tu cuenta no tiene acceso al CMS." });
}
