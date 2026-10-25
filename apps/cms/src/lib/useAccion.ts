import { useState } from "react";
import { mensajeDeError } from "./errores";

/**
 * Envuelve una acción async (guardar, eliminar…) con su estado de
 * "ocupado" y su mensaje de error, para no repetirlo en cada formulario.
 * `ejecutar` devuelve `undefined` si la acción falló.
 */
export function useAccion<A extends unknown[], R>(accion: (...args: A) => Promise<R>) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(...args: A): Promise<R | undefined> {
    setOcupado(true);
    setError(null);
    try {
      return await accion(...args);
    } catch (e) {
      setError(mensajeDeError(e));
      return undefined;
    } finally {
      setOcupado(false);
    }
  }

  return { ejecutar, ocupado, error };
}
