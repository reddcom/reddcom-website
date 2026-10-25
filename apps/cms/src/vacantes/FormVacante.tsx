import { api } from "@reddcom/convex/api";
import type { Id } from "@reddcom/convex/modelo";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useVistaPrevia } from "../layout/contextoVistaPrevia";
import { aSlug, epochAFecha, fechaAEpoch, JORNADAS, type Jornada } from "../lib/formato";
import { useAccion } from "../lib/useAccion";
import { Boton } from "../ui/Boton";
import { CampoSelect, CampoTexto } from "../ui/Campo";
import { ConfirmarEliminar } from "../ui/ConfirmarEliminar";
import { Desplegable } from "../ui/Desplegable";
import { Cargando, EncabezadoVista, MensajeError } from "../ui/Estados";
import { ListaTextos } from "../ui/ListaTextos";

type EstadoFormulario = {
  areaId: Id<"areas"> | "";
  puestoId: Id<"puestos"> | "";
  paisId: Id<"paises"> | "";
  departamentoId: Id<"departamentos"> | "";
  ciudadId: Id<"ciudades"> | "";
  slug: string;
  jornada: Jornada;
  resumen: string;
  activa: boolean;
  fecha: string; // yyyy-mm-dd
  requisitos: string[];
};

const nuevo = (): EstadoFormulario => ({
  areaId: "",
  puestoId: "",
  paisId: "",
  departamentoId: "",
  ciudadId: "",
  slug: "",
  jornada: "tiempo_completo",
  resumen: "",
  activa: true,
  fecha: epochAFecha(Date.now()),
  requisitos: [],
});

const opciones = <T extends string>(lista: { _id: T; nombre: string }[] | undefined) =>
  lista?.map((item) => ({ valor: item._id, etiqueta: item.nombre }));

/** /vacantes/nueva o /vacantes/:id. La edición espera los datos antes de montar el formulario. */
export function FormVacante() {
  const { id } = useParams();
  const vacanteId = id === "nueva" ? undefined : (id as Id<"vacantes">);
  const datos = useQuery(api.vacantes.obtenerParaEdicion, vacanteId ? { id: vacanteId } : "skip");

  if (!vacanteId) return <Formulario inicial={nuevo()} />;
  if (datos === undefined) return <Cargando />;

  const { vacante } = datos;
  return (
    <Formulario
      key={vacanteId}
      vacanteId={vacanteId}
      inicial={{
        areaId: datos.areaId,
        puestoId: vacante.puestoId,
        paisId: datos.paisId,
        departamentoId: datos.departamentoId,
        ciudadId: vacante.ciudadId,
        slug: vacante.slug,
        jornada: vacante.jornada,
        resumen: vacante.resumen,
        activa: vacante.activa,
        fecha: epochAFecha(vacante.fechaPublicacion),
        requisitos: datos.requisitos,
      }}
    />
  );
}

function Formulario({ vacanteId, inicial }: { vacanteId?: Id<"vacantes">; inicial: EstadoFormulario }) {
  const navegar = useNavigate();
  const [form, setForm] = useState(inicial);
  const cambiar = (cambios: Partial<EstadoFormulario>) => setForm((actual) => ({ ...actual, ...cambios }));

  // Selects en cascada: cada nivel se consulta solo cuando su padre está elegido.
  const areas = useQuery(api.areas.listar);
  const puestos = useQuery(api.puestos.listarPorArea, form.areaId ? { areaId: form.areaId } : "skip");
  const paises = useQuery(api.paises.listar);
  const departamentos = useQuery(api.departamentos.listarPorPais, form.paisId ? { paisId: form.paisId } : "skip");
  const ciudades = useQuery(
    api.ciudades.listarPorDepartamento,
    form.departamentoId ? { departamentoId: form.departamentoId } : "skip",
  );
  const responsabilidades = useQuery(
    api.puestos.listarResponsabilidades,
    form.puestoId ? { puestoId: form.puestoId } : "skip",
  );

  const crear = useMutation(api.vacantes.crear);
  const actualizar = useMutation(api.vacantes.actualizar);
  const eliminar = useMutation(api.vacantes.eliminar);
  const { recargar } = useVistaPrevia({
    ruta: vacanteId && inicial.slug ? `/oportunidades/${inicial.slug}` : "/Oportunidades-Laborales",
  });

  const puesto = puestos?.find((p) => p._id === form.puestoId);
  const ciudad = ciudades?.find((c) => c._id === form.ciudadId);
  const listo = Boolean(form.puestoId && form.ciudadId);

  const guardar = useAccion(async () => {
    if (!form.puestoId || !form.ciudadId) return;
    const datos = {
      puestoId: form.puestoId,
      ciudadId: form.ciudadId,
      slug: form.slug || aSlug(`${puesto?.nombre ?? ""} ${ciudad?.nombre ?? ""}`),
      jornada: form.jornada,
      resumen: form.resumen,
      activa: form.activa,
      fechaPublicacion: fechaAEpoch(form.fecha),
      requisitos: form.requisitos,
    };
    if (vacanteId) {
      await actualizar({ id: vacanteId, ...datos });
      recargar();
    } else {
      navegar(`/vacantes/${await crear(datos)}`, { replace: true });
    }
  });

  const borrar = useAccion(async () => {
    if (!vacanteId) return;
    await eliminar({ id: vacanteId });
    navegar("/vacantes", { replace: true });
  });

  return (
    <div className="space-y-6">
      <EncabezadoVista
        grupo="Empleo · Vacantes"
        titulo={vacanteId ? (puesto?.nombre ?? "Vacante") : "Nueva vacante"}
        acciones={
          <>
            <Link to="/vacantes" className="mr-2 text-xs font-semibold text-primary-700 hover:underline">
              ← Todas las vacantes
            </Link>
            <Boton variante="primario" disabled={!listo || guardar.ocupado} onClick={() => guardar.ejecutar()}>
              {guardar.ocupado ? "Guardando…" : vacanteId ? "Guardar cambios" : "Crear vacante"}
            </Boton>
          </>
        }
        error={guardar.error}
      />

      <Desplegable titulo="Puesto y ubicación" abierto>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelect
            etiqueta="Área"
            valor={form.areaId}
            opciones={opciones(areas)}
            onChange={(areaId) => cambiar({ areaId, puestoId: "" })}
          />
          <CampoSelect
            etiqueta="Puesto"
            valor={form.puestoId}
            opciones={form.areaId ? opciones(puestos) : []}
            deshabilitado={!form.areaId}
            vacio={form.areaId ? "Selecciona…" : "Elige un área primero"}
            onChange={(puestoId) => cambiar({ puestoId })}
          />
          <CampoSelect
            etiqueta="País"
            valor={form.paisId}
            opciones={opciones(paises)}
            onChange={(paisId) => cambiar({ paisId, departamentoId: "", ciudadId: "" })}
          />
          <CampoSelect
            etiqueta="Departamento"
            valor={form.departamentoId}
            opciones={form.paisId ? opciones(departamentos) : []}
            deshabilitado={!form.paisId}
            vacio={form.paisId ? "Selecciona…" : "Elige un país primero"}
            onChange={(departamentoId) => cambiar({ departamentoId, ciudadId: "" })}
          />
          <CampoSelect
            etiqueta="Ciudad"
            valor={form.ciudadId}
            opciones={form.departamentoId ? opciones(ciudades) : []}
            deshabilitado={!form.departamentoId}
            vacio={form.departamentoId ? "Selecciona…" : "Elige un departamento primero"}
            onChange={(ciudadId) => cambiar({ ciudadId })}
          />
        </div>
        <p className="mt-4 text-xs text-body-soft">
          ¿Falta un puesto o una ciudad? Agrégalos en{" "}
          <Link className="text-primary-700 underline" to="/puestos">
            Áreas y puestos
          </Link>{" "}
          o en{" "}
          <Link className="text-primary-700 underline" to="/ubicaciones">
            Ubicaciones
          </Link>
          .
        </p>
      </Desplegable>

      <Desplegable titulo="Publicación" abierto>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelect
              etiqueta="Jornada"
              valor={form.jornada}
              opciones={Object.entries(JORNADAS).map(([valor, etiqueta]) => ({ valor: valor as Jornada, etiqueta }))}
              onChange={(jornada) => cambiar({ jornada })}
            />
            <label className="flex items-center gap-3 self-end rounded-sm border border-linea bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary-600"
                checked={form.activa}
                onChange={(e) => cambiar({ activa: e.target.checked })}
              />
              Visible en el sitio
            </label>
          </div>
          <CampoTexto
            etiqueta="Resumen"
            multilinea
            ayuda="Aparece en la tarjeta del listado y al inicio del detalle."
            valor={form.resumen}
            onChange={(resumen) => cambiar({ resumen })}
          />
          <Desplegable variante="mas" titulo="Dirección y fecha">
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoTexto
                etiqueta="Slug (URL)"
                placeholder={aSlug(`${puesto?.nombre ?? "tecnico-fo"} ${ciudad?.nombre ?? ""}`)}
                ayuda="Si lo dejas vacío se genera con el puesto y la ciudad."
                valor={form.slug}
                onChange={(slug) => cambiar({ slug })}
              />
              <CampoTexto
                etiqueta="Fecha de publicación"
                tipo="date"
                valor={form.fecha}
                onChange={(fecha) => cambiar({ fecha })}
              />
            </div>
          </Desplegable>
        </div>
      </Desplegable>

      <Desplegable titulo="Requisitos" detalle={`${form.requisitos.length}`}>
        <ListaTextos
          etiqueta="Requisitos de esta vacante"
          singular="Requisito"
          valor={form.requisitos}
          onChange={(requisitos) => cambiar({ requisitos })}
        />
      </Desplegable>

      <Desplegable titulo="Responsabilidades del puesto" detalle={responsabilidades ? `${responsabilidades.length}` : undefined}>
        {!form.puestoId ? (
          <p className="text-xs text-body-soft">Elige un puesto para verlas.</p>
        ) : responsabilidades === undefined ? (
          <Cargando />
        ) : (
          <>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {responsabilidades.map((r) => (
                <li key={r._id}>{r.responsabilidad}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-body-soft">
              Son del puesto y se comparten entre sus vacantes; se editan en{" "}
              <Link className="text-primary-700 underline" to="/puestos">
                Áreas y puestos
              </Link>
              .
            </p>
          </>
        )}
      </Desplegable>

      {vacanteId && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-linea pt-5">
          <div className="mr-auto min-w-0 space-y-2">
            <MensajeError mensaje={borrar.error} />
          </div>
          <ConfirmarEliminar etiqueta="Eliminar vacante" onConfirmar={() => borrar.ejecutar()} />
        </div>
      )}
    </div>
  );
}
