import { api } from "@reddcom/convex/api";
import type { Doc, Id } from "@reddcom/convex/modelo";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAccion } from "../lib/useAccion";
import { Boton } from "../ui/Boton";
import { claseEntrada, CampoTexto } from "../ui/Campo";
import { ConfirmarEliminar } from "../ui/ConfirmarEliminar";
import { Desplegable } from "../ui/Desplegable";
import { Cargando, EncabezadoVista, MensajeError, Vacio } from "../ui/Estados";
import { ListaTextos } from "../ui/ListaTextos";
import { ColumnaCatalogo } from "./ColumnaCatalogo";

export function Puestos() {
  const [areaId, setAreaId] = useState<Id<"areas">>();
  const areas = useQuery(api.areas.listar);
  const crearArea = useMutation(api.areas.crear);
  const actualizarArea = useMutation(api.areas.actualizar);
  const eliminarArea = useMutation(api.areas.eliminar);
  const area = areas?.find((a) => a._id === areaId);

  return (
    <div className="space-y-6">
      <EncabezadoVista
        grupo="Catálogos"
        titulo="Áreas y puestos"
        detalle="El área y las responsabilidades pertenecen al puesto; todas sus vacantes las heredan."
      />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <ColumnaCatalogo
          titulo="Áreas"
          items={areas?.map((a) => ({ id: a._id, nombre: a.nombre }))}
          seleccionado={areaId}
          onSeleccionar={(id) => setAreaId(id as Id<"areas">)}
          onCrear={(nombre) => crearArea({ nombre })}
          onRenombrar={(id, nombre) => actualizarArea({ id: id as Id<"areas">, nombre })}
          onEliminar={async (id) => {
            await eliminarArea({ id: id as Id<"areas"> });
            if (id === areaId) setAreaId(undefined);
          }}
        />
        {area ? (
          <PuestosDeArea key={area._id} area={area} />
        ) : (
          <Vacio titulo="Elige un área">Sus puestos aparecerán aquí.</Vacio>
        )}
      </div>
    </div>
  );
}

function PuestosDeArea({ area }: { area: Doc<"areas"> }) {
  const puestos = useQuery(api.puestos.listarPorArea, { areaId: area._id });
  const crear = useMutation(api.puestos.crear);
  const [nombre, setNombre] = useState("");
  const accion = useAccion(async () => {
    await crear({ areaId: area._id, nombre, responsabilidades: [] });
    setNombre("");
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    accion.ejecutar();
  }

  return (
    <section className="space-y-2">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-body">Puestos de {area.nombre}</h2>
      {puestos === undefined ? (
        <Cargando />
      ) : (
        puestos.map((puesto) => <EditorPuesto key={puesto._id} puesto={puesto} />)
      )}
      <form onSubmit={enviar} className="flex gap-2 pt-2">
        <input
          className={claseEntrada}
          placeholder="Nuevo puesto…"
          aria-label="Nombre del nuevo puesto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <Boton type="submit" disabled={!nombre.trim() || accion.ocupado}>
          <Plus className="size-3.5" /> Agregar
        </Boton>
      </form>
      <MensajeError mensaje={accion.error} />
    </section>
  );
}

function EditorPuesto({ puesto }: { puesto: Doc<"puestos"> }) {
  const responsabilidades = useQuery(api.puestos.listarResponsabilidades, { puestoId: puesto._id });
  return (
    <Desplegable variante="item" titulo={puesto.nombre} detalle={responsabilidades && `${responsabilidades.length} resp.`}>
      {responsabilidades === undefined ? (
        <Cargando />
      ) : (
        <FormPuesto puesto={puesto} inicial={responsabilidades.map((r) => r.responsabilidad)} />
      )}
    </Desplegable>
  );
}

function FormPuesto({ puesto, inicial }: { puesto: Doc<"puestos">; inicial: string[] }) {
  const actualizar = useMutation(api.puestos.actualizar);
  const eliminar = useMutation(api.puestos.eliminar);
  const [nombre, setNombre] = useState(puesto.nombre);
  const [responsabilidades, setResponsabilidades] = useState(inicial);
  const guardar = useAccion(() => actualizar({ id: puesto._id, nombre, responsabilidades }));
  const borrar = useAccion(() => eliminar({ id: puesto._id }));

  return (
    <div className="space-y-5">
      <CampoTexto etiqueta="Nombre del puesto" valor={nombre} onChange={setNombre} />
      <ListaTextos
        etiqueta="Responsabilidades"
        singular="Responsabilidad"
        valor={responsabilidades}
        onChange={setResponsabilidades}
      />
      <MensajeError mensaje={guardar.error ?? borrar.error} />
      <div className="flex items-center justify-end gap-3 border-t border-linea pt-4">
        <ConfirmarEliminar etiqueta="Eliminar puesto" onConfirmar={() => borrar.ejecutar()} />
        <Boton variante="primario" disabled={guardar.ocupado} onClick={() => guardar.ejecutar()}>
          Guardar puesto
        </Boton>
      </div>
    </div>
  );
}
