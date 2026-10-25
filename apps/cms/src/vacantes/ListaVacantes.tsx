import { api } from "@reddcom/convex/api";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { Link } from "react-router";
import { useVistaPrevia } from "../layout/contextoVistaPrevia";
import { fechaLegible, JORNADAS } from "../lib/formato";
import { Cargando, EncabezadoVista, Vacio } from "../ui/Estados";

export function ListaVacantes() {
  const vacantes = useQuery(api.vacantes.listarTodas);
  useVistaPrevia({ ruta: "/Oportunidades-Laborales" });

  return (
    <div className="space-y-6">
      <EncabezadoVista
        grupo="Empleo"
        titulo="Vacantes"
        detalle="Las activas aparecen en Oportunidades laborales, de la más reciente a la más antigua."
        acciones={
          <Link
            to="/vacantes/nueva"
            className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-navy-900 px-4 text-xs font-semibold tracking-wide text-white hover:bg-navy-800"
          >
            <Plus className="size-3.5" /> Nueva vacante
          </Link>
        }
      />

      {vacantes === undefined ? (
        <Cargando />
      ) : vacantes.length === 0 ? (
        <Vacio titulo="Aún no hay vacantes">
          Para crear una necesitas al menos un puesto (en <Link className="underline" to="/puestos">Áreas y puestos</Link>) y
          una ciudad (en <Link className="underline" to="/ubicaciones">Ubicaciones</Link>).
        </Vacio>
      ) : (
        <ul className="divide-y divide-linea rounded-sm border border-linea bg-white">
          {vacantes.map((vacante) => (
            <li key={vacante.id}>
              <Link
                to={`/vacantes/${vacante.id}`}
                className="grid gap-1 px-4 py-3 hover:bg-surface sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{vacante.titulo}</p>
                  <p className="truncate text-xs text-body">
                    {vacante.area} · {vacante.ciudad}, {vacante.pais} · {JORNADAS[vacante.jornada]}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-body-soft">
                  <span>{fechaLegible(vacante.fechaPublicacion)}</span>
                  <span
                    className={`rounded-sm px-2 py-0.5 font-semibold uppercase tracking-wider ${
                      vacante.activa ? "bg-surface-tint text-primary-700" : "bg-surface text-body-soft"
                    }`}
                  >
                    {vacante.activa ? "Activa" : "Oculta"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
