import type { ContenidoBloque } from "@reddcom/convex/bloques";
import type { DefinicionCampo, DefinicionSeccion } from "@reddcom/convex/registro";
import { LocateFixed } from "lucide-react";
import { useResaltarCampo } from "../layout/contextoVistaPrevia";
import { Desplegable } from "../ui/Desplegable";
import { editorDe } from "./bloques";
import { EditorCampo } from "./EditorCampo";

export type CamposSeccion = Record<string, ContenidoBloque[]>;

/** Quita los bloques vacíos: un campo sin contenido no se guarda. */
export function sinVacios(campos: CamposSeccion): CamposSeccion {
  return Object.fromEntries(
    Object.entries(campos).map(([campo, lista]) => [
      campo,
      lista.filter((bloque) => !editorDe(bloque.tipo).estaVacio(bloque)),
    ]),
  );
}

/**
 * Una sección como desplegable. El borrador vive en EditorPagina, que
 * guarda o descarta todas las secciones desde la cabecera. Los campos
 * `avanzado` van en "Más campos".
 */
export function EditorSeccion({
  clave,
  definicion,
  campos,
  onChange,
  hayCambios,
  abierto,
  onAbrir,
}: {
  clave: string;
  definicion: DefinicionSeccion;
  campos: CamposSeccion;
  onChange: (campo: string, valor: ContenidoBloque[]) => void;
  hayCambios: boolean;
  abierto: boolean;
  onAbrir: () => void;
}) {
  const entradas = Object.entries(definicion.campos);
  const basicos = entradas.filter(([, campo]) => !campo.avanzado);
  const avanzados = entradas.filter(([, campo]) => campo.avanzado);
  const completos = Object.values(sinVacios(campos)).filter((lista) => lista.length > 0).length;
  const { resaltar, resaltarAlEscribir } = useResaltarCampo();

  // Cada campo se puede señalar en la vista previa: con el botón o, si está
  // activado, al entrar a escribir en él.
  const renderCampo = ([nombre, campo]: [string, DefinicionCampo]) => {
    const objetivo = { seccion: clave, campo: nombre, ancla: definicion.ancla };
    return (
      <div key={nombre} className="relative" onFocus={resaltarAlEscribir ? () => resaltar(objetivo) : undefined}>
        <button
          type="button"
          onClick={() => resaltar(objetivo)}
          title="Ver dónde aparece en la página"
          aria-label={`Ver dónde aparece ${campo.etiqueta} en la página`}
          className="absolute right-0 top-0 z-10 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:underline"
        >
          <LocateFixed aria-hidden className="size-3.5" /> Ver en la página
        </button>
        <EditorCampo definicion={campo} valor={campos[nombre] ?? []} onChange={(valor) => onChange(nombre, valor)} />
      </div>
    );
  };

  return (
    <Desplegable
      id={`seccion-${clave}`}
      titulo={definicion.nombre}
      abierto={abierto}
      onAbrir={onAbrir}
      detalle={
        hayCambios ? (
          <span className="font-semibold text-accent">Sin guardar</span>
        ) : (
          `${completos} de ${entradas.length} campos`
        )
      }
    >
      <div className="space-y-6">{basicos.map(renderCampo)}</div>

      {avanzados.length > 0 && (
        <div className="mt-6">
          <Desplegable variante="mas" titulo={`Más campos (${avanzados.length})`}>
            <div className="space-y-6">{avanzados.map(renderCampo)}</div>
          </Desplegable>
        </div>
      )}
    </Desplegable>
  );
}
