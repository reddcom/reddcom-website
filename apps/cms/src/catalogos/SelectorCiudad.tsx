import { api } from "@reddcom/convex/api";
import type { Id } from "@reddcom/convex/modelo";
import { useQuery } from "convex/react";
import { Link } from "react-router";
import { CampoSelect } from "../ui/Campo";

export type Ubicacion = {
  paisId: Id<"paises"> | "";
  departamentoId: Id<"departamentos"> | "";
  ciudadId: Id<"ciudades"> | "";
};

const opciones = <T extends string>(lista: { _id: T; nombre: string }[] | undefined) =>
  lista?.map((item) => ({ valor: item._id, etiqueta: item.nombre }));

/** País → departamento → ciudad: cada nivel se consulta solo cuando su padre está elegido. */
export function SelectorCiudad({ valor, onChange }: { valor: Ubicacion; onChange: (cambios: Partial<Ubicacion>) => void }) {
  const paises = useQuery(api.paises.listar);
  const departamentos = useQuery(api.departamentos.listarPorPais, valor.paisId ? { paisId: valor.paisId } : "skip");
  const ciudades = useQuery(
    api.ciudades.listarPorDepartamento,
    valor.departamentoId ? { departamentoId: valor.departamentoId } : "skip",
  );

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <CampoSelect
          etiqueta="País"
          valor={valor.paisId}
          opciones={opciones(paises)}
          onChange={(paisId) => onChange({ paisId, departamentoId: "", ciudadId: "" })}
        />
        <CampoSelect
          etiqueta="Departamento"
          valor={valor.departamentoId}
          opciones={valor.paisId ? opciones(departamentos) : []}
          deshabilitado={!valor.paisId}
          vacio={valor.paisId ? "Selecciona…" : "Elige un país primero"}
          onChange={(departamentoId) => onChange({ departamentoId, ciudadId: "" })}
        />
        <CampoSelect
          etiqueta="Ciudad"
          valor={valor.ciudadId}
          opciones={valor.departamentoId ? opciones(ciudades) : []}
          deshabilitado={!valor.departamentoId}
          vacio={valor.departamentoId ? "Selecciona…" : "Elige un departamento primero"}
          onChange={(ciudadId) => onChange({ ciudadId })}
        />
      </div>
      <p className="mt-3 text-xs text-body-soft">
        ¿Falta una ciudad? Agrégala en{" "}
        <Link className="text-primary-700 underline" to="/ubicaciones">
          Ubicaciones
        </Link>
        .
      </p>
    </div>
  );
}
