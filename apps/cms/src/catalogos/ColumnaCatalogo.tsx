import { Check, Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAccion } from "../lib/useAccion";
import { Boton } from "../ui/Boton";
import { claseEntrada } from "../ui/Campo";
import { ConfirmarEliminar } from "../ui/ConfirmarEliminar";
import { Cargando, MensajeError } from "../ui/Estados";

export type ItemCatalogo = { id: string; nombre: string; detalle?: string };

/**
 * Columna de un catálogo jerárquico (país → departamento → ciudad,
 * área → puesto): lista seleccionable con alta, renombre y baja en línea.
 * Las reglas (nombres únicos, borrar con dependientes) las aplica el servidor.
 */
export function ColumnaCatalogo({
  titulo,
  items,
  seleccionado,
  onSeleccionar,
  onCrear,
  onRenombrar,
  onEliminar,
  conCodigo = false,
  sinPadre,
}: {
  titulo: string;
  items: ItemCatalogo[] | undefined;
  seleccionado?: string;
  onSeleccionar?: (id: string) => void;
  onCrear: (nombre: string, codigo: string) => Promise<unknown>;
  onRenombrar: (id: string, nombre: string) => Promise<unknown>;
  onEliminar: (id: string) => Promise<unknown>;
  conCodigo?: boolean; // país: pide también el código ISO
  sinPadre?: string; // mensaje cuando aún no se eligió el nivel superior
}) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [editando, setEditando] = useState<{ id: string; nombre: string } | null>(null);
  const accion = useAccion((tarea: () => Promise<unknown>) => tarea());

  async function crear(e: FormEvent) {
    e.preventDefault();
    const hecho = await accion.ejecutar(async () => {
      await onCrear(nombre, codigo);
      return true;
    });
    if (hecho) {
      setNombre("");
      setCodigo("");
    }
  }

  async function renombrar(e: FormEvent) {
    e.preventDefault();
    if (!editando) return;
    const hecho = await accion.ejecutar(async () => {
      await onRenombrar(editando.id, editando.nombre);
      return true;
    });
    if (hecho) setEditando(null);
  }

  return (
    <section className="flex min-h-80 flex-col rounded-sm border border-linea bg-white">
      <h2 className="border-b border-linea px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-body">
        {titulo} {items && <span className="font-normal text-body-soft">({items.length})</span>}
      </h2>

      {sinPadre ? (
        <p className="flex-1 px-4 py-6 text-xs text-body-soft">{sinPadre}</p>
      ) : items === undefined ? (
        <Cargando />
      ) : (
        <>
          <ul className="flex-1 divide-y divide-linea overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className={item.id === seleccionado ? "bg-surface-tint" : ""}>
                {editando?.id === item.id ? (
                  <form onSubmit={renombrar} className="flex items-center gap-1 px-2 py-1.5">
                    <input
                      autoFocus
                      className={claseEntrada}
                      value={editando.nombre}
                      aria-label="Nuevo nombre"
                      onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                      onKeyDown={(e) => e.key === "Escape" && setEditando(null)}
                    />
                    <Boton type="submit" variante="fantasma" tamano="icono" aria-label="Guardar nombre">
                      <Check className="size-3.5" />
                    </Boton>
                  </form>
                ) : (
                  <div className="flex items-center gap-1 pr-2">
                    <button
                      type="button"
                      onClick={() => onSeleccionar?.(item.id)}
                      disabled={!onSeleccionar}
                      aria-current={item.id === seleccionado}
                      className="min-w-0 flex-1 truncate px-4 py-2.5 text-left text-[13px] disabled:cursor-default"
                    >
                      {item.nombre}
                      {item.detalle && <span className="ml-2 text-[11px] text-body-soft">{item.detalle}</span>}
                    </button>
                    <Boton
                      variante="fantasma"
                      tamano="icono"
                      aria-label={`Renombrar ${item.nombre}`}
                      onClick={() => setEditando({ id: item.id, nombre: item.nombre })}
                    >
                      <Pencil className="size-3.5" />
                    </Boton>
                    <ConfirmarEliminar soloIcono onConfirmar={() => accion.ejecutar(() => onEliminar(item.id))} />
                  </div>
                )}
              </li>
            ))}
          </ul>

          <form onSubmit={crear} className="space-y-2 border-t border-linea p-3">
            <MensajeError mensaje={accion.error} />
            <div className="flex gap-2">
              <input
                className={claseEntrada}
                placeholder="Nuevo…"
                aria-label={`Nuevo en ${titulo}`}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              {conCodigo && (
                <input
                  className={`${claseEntrada} w-16 uppercase`}
                  placeholder="ISO"
                  aria-label="Código ISO"
                  maxLength={2}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              )}
              <Boton
                type="submit"
                aria-label="Agregar"
                tamano="icono"
                className="h-9 w-9"
                disabled={!nombre.trim() || (conCodigo && codigo.trim().length !== 2) || accion.ocupado}
              >
                <Plus className="size-4" />
              </Boton>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
