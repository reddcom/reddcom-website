import type { ContenidoBloque } from "@reddcom/convex/bloques";
import type { DefinicionCampo } from "@reddcom/convex/registro";
import { Plus } from "lucide-react";
import { useListaOrdenable } from "../lib/useListaOrdenable";
import { AccionesOrden } from "../ui/AccionesOrden";
import { Boton } from "../ui/Boton";
import { claseEtiqueta } from "../ui/Campo";
import { Desplegable } from "../ui/Desplegable";
import { editorDe } from "./bloques";

type Props = {
  definicion: DefinicionCampo;
  valor: ContenidoBloque[];
  onChange: (valor: ContenidoBloque[]) => void;
};

/** Un campo de la sección: un bloque, o una lista ordenable si el registro marca `lista`. */
export function EditorCampo(props: Props) {
  return props.definicion.lista ? <ListaBloques {...props} /> : <BloqueUnico {...props} />;
}

function BloqueUnico({ definicion, valor, onChange }: Props) {
  const { Editor, vacio } = editorDe(definicion.tipo);
  return (
    <fieldset className="min-w-0">
      <legend className={`${claseEtiqueta} text-navy-900`}>{definicion.etiqueta}</legend>
      <Editor
        valor={valor[0] ?? vacio()}
        multilinea={definicion.multilinea}
        opciones={definicion.opciones}
        onChange={(b) => onChange([b])}
      />
    </fieldset>
  );
}

function ListaBloques({ definicion, valor, onChange }: Props) {
  const { Editor, vacio, resumen } = editorDe(definicion.tipo);
  const lista = useListaOrdenable(valor, onChange);
  // El elemento recién agregado aparece abierto.
  const ultimaClave = lista.claves.at(-1);

  return (
    <fieldset className="min-w-0">
      <legend className={`${claseEtiqueta} text-navy-900`}>
        {definicion.etiqueta} <span className="font-normal text-body-soft">({valor.length})</span>
      </legend>
      <ol className="space-y-2">
        {valor.map((bloque, indice) => (
          <li key={lista.claves[indice]}>
            <Desplegable
              variante="item"
              abierto={lista.claves[indice] === ultimaClave && resumen(bloque) === ""}
              titulo={
                <>
                  <span className="mr-2 tabular-nums text-body-soft">{String(indice + 1).padStart(2, "0")}</span>
                  {resumen(bloque) || <span className="text-body-soft">Sin completar</span>}
                </>
              }
              acciones={
                <AccionesOrden
                  indice={indice}
                  total={valor.length}
                  onMover={(d) => lista.mover(indice, d)}
                  onQuitar={() => lista.quitar(indice)}
                />
              }
            >
              <Editor
                valor={bloque}
                multilinea={definicion.multilinea}
                opciones={definicion.opciones}
                onChange={(b) => lista.cambiar(indice, b)}
              />
            </Desplegable>
          </li>
        ))}
      </ol>
      <Boton tamano="sm" className="mt-3" onClick={() => lista.agregar(vacio())}>
        <Plus className="size-3.5" /> Agregar
      </Boton>
    </fieldset>
  );
}
