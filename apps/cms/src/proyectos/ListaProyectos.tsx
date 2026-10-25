import { api } from "@reddcom/convex/api";
import { serviciosProyecto } from "@reddcom/convex/proyectos";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { Link } from "react-router";
import { useVistaPrevia } from "../layout/contextoVistaPrevia";
import { Cargando, EncabezadoVista, Vacio } from "../ui/Estados";

export function ListaProyectos() {
  const proyectos = useQuery(api.proyectos.listarTodos);
  useVistaPrevia({ ruta: "/proyectos/Reddcom-Honduras" });

  return (
    <div className="space-y-6">
      <EncabezadoVista
        grupo="Proyectos"
        titulo="Proyectos"
        detalle="Los activos aparecen en la página de su país y tienen su propia página de detalle."
        acciones={
          <Link
            to="/proyectos/nuevo"
            className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-navy-900 px-4 text-xs font-semibold tracking-wide text-white hover:bg-navy-800"
          >
            <Plus className="size-3.5" /> Nuevo proyecto
          </Link>
        }
      />

      {proyectos === undefined ? (
        <Cargando />
      ) : proyectos.length === 0 ? (
        <Vacio titulo="Aún no hay proyectos">
          Para crear uno necesitas al menos una ciudad (en <Link className="underline" to="/ubicaciones">Ubicaciones</Link>).
        </Vacio>
      ) : (
        <ul className="divide-y divide-linea rounded-sm border border-linea bg-white">
          {proyectos.map((proyecto) => (
            <li key={proyecto.id}>
              <Link
                to={`/proyectos/${proyecto.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-surface"
              >
                <div className="size-12 shrink-0 overflow-hidden rounded-sm bg-surface">
                  {proyecto.imagen?.url && (
                    <img src={proyecto.imagen.url} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{proyecto.titulo}</p>
                  <p className="truncate text-xs text-body">
                    {serviciosProyecto[proyecto.servicio]} · {proyecto.ciudad}, {proyecto.pais} · {proyecto.anio}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                    proyecto.activo ? "bg-surface-tint text-primary-700" : "bg-surface text-body-soft"
                  }`}
                >
                  {proyecto.activo ? "Activo" : "Oculto"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
