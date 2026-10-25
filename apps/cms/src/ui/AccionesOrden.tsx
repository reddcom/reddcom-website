import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Boton } from "./Boton";

/** Subir, bajar y quitar un elemento de una lista ordenada. */
export function AccionesOrden({
  indice,
  total,
  onMover,
  onQuitar,
}: {
  indice: number;
  total: number;
  onMover: (desplazamiento: -1 | 1) => void;
  onQuitar: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center">
      <Boton variante="fantasma" tamano="icono" aria-label="Subir" disabled={indice === 0} onClick={() => onMover(-1)}>
        <ArrowUp className="size-3.5" />
      </Boton>
      <Boton
        variante="fantasma"
        tamano="icono"
        aria-label="Bajar"
        disabled={indice === total - 1}
        onClick={() => onMover(1)}
      >
        <ArrowDown className="size-3.5" />
      </Boton>
      <Boton variante="fantasma" tamano="icono" aria-label="Quitar" onClick={onQuitar}>
        <X className="size-3.5" />
      </Boton>
    </span>
  );
}
