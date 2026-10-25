import { Plus } from "lucide-react";
import { useListaOrdenable } from "../lib/useListaOrdenable";
import { AccionesOrden } from "./AccionesOrden";
import { Boton } from "./Boton";
import { claseEntrada, claseEtiqueta } from "./Campo";

/** Lista ordenada de textos cortos (requisitos, responsabilidades…). */
export function ListaTextos({
  etiqueta,
  singular,
  valor,
  onChange,
}: {
  etiqueta: string;
  singular: string;
  valor: string[];
  onChange: (valor: string[]) => void;
}) {
  const lista = useListaOrdenable(valor, onChange);

  return (
    <fieldset>
      <legend className={claseEtiqueta}>{etiqueta}</legend>
      <ol className="space-y-2">
        {valor.map((texto, indice) => (
          <li key={lista.claves[indice]} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-body-soft">{indice + 1}</span>
            <input
              className={claseEntrada}
              value={texto}
              aria-label={`${singular} ${indice + 1}`}
              onChange={(e) => lista.cambiar(indice, e.target.value)}
            />
            <AccionesOrden
              indice={indice}
              total={valor.length}
              onMover={(d) => lista.mover(indice, d)}
              onQuitar={() => lista.quitar(indice)}
            />
          </li>
        ))}
      </ol>
      <Boton tamano="sm" className="mt-3" onClick={() => lista.agregar("")}>
        <Plus className="size-3.5" /> Agregar {singular.toLowerCase()}
      </Boton>
    </fieldset>
  );
}
