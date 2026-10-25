import { useState } from "react";

/**
 * Operaciones de una lista editable (agregar, quitar, mover, cambiar)
 * más una clave estable por elemento. React necesita esas claves para
 * no confundir elementos al reordenar: el índice cambia, la clave no.
 */
export function useListaOrdenable<T>(valor: T[], onChange: (valor: T[]) => void) {
  const [claves, setClaves] = useState<string[]>(() => valor.map(() => crypto.randomUUID()));
  // Si la lista cambió desde fuera (p. ej. al recargar), se regeneran.
  const clavesVigentes =
    claves.length === valor.length ? claves : valor.map((_, i) => claves[i] ?? crypto.randomUUID());

  function actualizar(nuevoValor: T[], nuevasClaves: string[]) {
    setClaves(nuevasClaves);
    onChange(nuevoValor);
  }

  return {
    claves: clavesVigentes,
    agregar: (item: T) => actualizar([...valor, item], [...clavesVigentes, crypto.randomUUID()]),
    quitar: (indice: number) =>
      actualizar(
        valor.filter((_, i) => i !== indice),
        clavesVigentes.filter((_, i) => i !== indice),
      ),
    mover: (indice: number, desplazamiento: -1 | 1) => {
      const destino = indice + desplazamiento;
      if (destino < 0 || destino >= valor.length) return;
      const intercambiar = <U,>(lista: U[]) => {
        const copia = [...lista];
        [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
        return copia;
      };
      actualizar(intercambiar(valor), intercambiar(clavesVigentes));
    },
    cambiar: (indice: number, item: T) => onChange(valor.map((actual, i) => (i === indice ? item : actual))),
  };
}
