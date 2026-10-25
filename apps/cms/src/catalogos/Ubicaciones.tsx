import { api } from "@reddcom/convex/api";
import type { Doc, Id } from "@reddcom/convex/modelo";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useAccion } from "../lib/useAccion";
import { Boton } from "../ui/Boton";
import { CampoTexto } from "../ui/Campo";
import { Desplegable } from "../ui/Desplegable";
import { EncabezadoVista, MensajeError } from "../ui/Estados";
import { ColumnaCatalogo } from "./ColumnaCatalogo";

export function Ubicaciones() {
  const [paisId, setPaisId] = useState<Id<"paises">>();
  const [departamentoId, setDepartamentoId] = useState<Id<"departamentos">>();
  const [ciudadId, setCiudadId] = useState<Id<"ciudades">>();

  const paises = useQuery(api.paises.listar);
  const departamentos = useQuery(api.departamentos.listarPorPais, paisId ? { paisId } : "skip");
  const ciudades = useQuery(api.ciudades.listarPorDepartamento, departamentoId ? { departamentoId } : "skip");

  const pais = {
    crear: useMutation(api.paises.crear),
    actualizar: useMutation(api.paises.actualizar),
    eliminar: useMutation(api.paises.eliminar),
  };
  const departamento = {
    crear: useMutation(api.departamentos.crear),
    actualizar: useMutation(api.departamentos.actualizar),
    eliminar: useMutation(api.departamentos.eliminar),
  };
  const ciudad = {
    crear: useMutation(api.ciudades.crear),
    actualizar: useMutation(api.ciudades.actualizar),
    eliminar: useMutation(api.ciudades.eliminar),
  };

  const ciudadElegida = ciudades?.find((c) => c._id === ciudadId);

  return (
    <div className="space-y-6">
      <EncabezadoVista
        grupo="Catálogos"
        titulo="Ubicaciones"
        detalle="País → departamento → ciudad. Las vacantes se asignan a una ciudad."
      />
      <div className="grid gap-3 md:grid-cols-3">
        <ColumnaCatalogo
          titulo="Países"
          conCodigo
          items={paises?.map((p) => ({ id: p._id, nombre: p.nombre, detalle: p.codigoIso }))}
          seleccionado={paisId}
          onSeleccionar={(id) => {
            setPaisId(id as Id<"paises">);
            setDepartamentoId(undefined);
            setCiudadId(undefined);
          }}
          onCrear={(nombre, codigoIso) => pais.crear({ nombre, codigoIso })}
          onRenombrar={(id, nombre) => pais.actualizar({ id: id as Id<"paises">, nombre })}
          onEliminar={(id) => pais.eliminar({ id: id as Id<"paises"> })}
        />
        <ColumnaCatalogo
          titulo="Departamentos"
          sinPadre={paisId ? undefined : "Elige un país."}
          items={departamentos?.map((d) => ({ id: d._id, nombre: d.nombre }))}
          seleccionado={departamentoId}
          onSeleccionar={(id) => {
            setDepartamentoId(id as Id<"departamentos">);
            setCiudadId(undefined);
          }}
          onCrear={(nombre) => departamento.crear({ paisId: paisId!, nombre })}
          onRenombrar={(id, nombre) => departamento.actualizar({ id: id as Id<"departamentos">, nombre })}
          onEliminar={(id) => departamento.eliminar({ id: id as Id<"departamentos"> })}
        />
        <ColumnaCatalogo
          titulo="Ciudades"
          sinPadre={departamentoId ? undefined : "Elige un departamento."}
          items={ciudades?.map((c) => ({ id: c._id, nombre: c.nombre }))}
          seleccionado={ciudadId}
          onSeleccionar={(id) => setCiudadId(id as Id<"ciudades">)}
          onCrear={(nombre) => ciudad.crear({ departamentoId: departamentoId!, nombre })}
          onRenombrar={(id, nombre) => ciudad.actualizar({ id: id as Id<"ciudades">, nombre })}
          onEliminar={(id) => ciudad.eliminar({ id: id as Id<"ciudades"> })}
        />
      </div>

      {ciudadElegida && <DetalleCiudad key={ciudadElegida._id} ciudad={ciudadElegida} />}
    </div>
  );
}

function DetalleCiudad({ ciudad }: { ciudad: Doc<"ciudades"> }) {
  const detalle = useQuery(api.ciudades.obtenerDetalle, { ciudadId: ciudad._id });
  return (
    <Desplegable titulo={`Detalle de ${ciudad.nombre}`} detalle="Opcional">
      {detalle !== undefined && <FormDetalle ciudadId={ciudad._id} detalle={detalle} />}
    </Desplegable>
  );
}

const numeroOpcional = (texto: string) => (texto.trim() === "" ? undefined : Number(texto));

function FormDetalle({ ciudadId, detalle }: { ciudadId: Id<"ciudades">; detalle: Doc<"ciudadDetalles"> | null }) {
  const guardar = useMutation(api.ciudades.guardarDetalle);
  const [codigoPostal, setCodigoPostal] = useState(detalle?.codigoPostal ?? "");
  const [latitud, setLatitud] = useState(detalle?.latitud?.toString() ?? "");
  const [longitud, setLongitud] = useState(detalle?.longitud?.toString() ?? "");
  const accion = useAccion(() =>
    guardar({
      ciudadId,
      codigoPostal: codigoPostal || undefined,
      latitud: numeroOpcional(latitud),
      longitud: numeroOpcional(longitud),
    }),
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <CampoTexto etiqueta="Código postal" valor={codigoPostal} onChange={setCodigoPostal} />
        <CampoTexto etiqueta="Latitud" placeholder="15.5042" valor={latitud} onChange={setLatitud} />
        <CampoTexto etiqueta="Longitud" placeholder="-88.0250" valor={longitud} onChange={setLongitud} />
      </div>
      <MensajeError mensaje={accion.error} />
      <div className="flex justify-end">
        <Boton variante="primario" disabled={accion.ocupado} onClick={() => accion.ejecutar()}>
          Guardar detalle
        </Boton>
      </div>
    </div>
  );
}
