import { api } from "@reddcom/convex/api";
import type { Id } from "@reddcom/convex/modelo";
import { serviciosProyecto, type ServicioProyecto } from "@reddcom/convex/proyectos";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { SelectorCiudad, type Ubicacion } from "../catalogos/SelectorCiudad";
import { SelectorImagen } from "../imagenes/SelectorImagen";
import { useVistaPrevia } from "../layout/contextoVistaPrevia";
import { aSlug } from "../lib/formato";
import { useAccion } from "../lib/useAccion";
import { useListaOrdenable } from "../lib/useListaOrdenable";
import { AccionesOrden } from "../ui/AccionesOrden";
import { Boton } from "../ui/Boton";
import { Campo, CampoSelect, CampoTexto, claseEntrada, claseEtiqueta } from "../ui/Campo";
import { ConfirmarEliminar } from "../ui/ConfirmarEliminar";
import { Desplegable } from "../ui/Desplegable";
import { Cargando, EncabezadoVista, MensajeError } from "../ui/Estados";
import { ListaTextos } from "../ui/ListaTextos";

type Cifra = { valor: string; etiqueta: string };

type EstadoFormulario = Ubicacion & {
  titulo: string;
  slug: string;
  resumen: string;
  descripcion: string;
  anio: number;
  servicio: ServicioProyecto;
  imagenId: Id<"imagenes"> | undefined;
  activo: boolean;
  cifras: Cifra[];
  alcance: string[];
  galeria: (Id<"imagenes"> | undefined)[];
};

const nuevo = (): EstadoFormulario => ({
  paisId: "",
  departamentoId: "",
  ciudadId: "",
  titulo: "",
  slug: "",
  resumen: "",
  descripcion: "",
  anio: new Date().getFullYear(),
  servicio: "fibra",
  imagenId: undefined,
  activo: true,
  cifras: [],
  alcance: [],
  galeria: [],
});

/** /proyectos/nuevo o /proyectos/:id. La edición espera los datos antes de montar el formulario. */
export function FormProyecto() {
  const { id } = useParams();
  const proyectoId = id === "nuevo" ? undefined : (id as Id<"proyectos">);
  const datos = useQuery(api.proyectos.obtenerParaEdicion, proyectoId ? { id: proyectoId } : "skip");

  if (!proyectoId) return <Formulario inicial={nuevo()} />;
  if (datos === undefined) return <Cargando />;

  const { proyecto } = datos;
  return (
    <Formulario
      key={proyectoId}
      proyectoId={proyectoId}
      inicial={{
        paisId: datos.paisId,
        departamentoId: datos.departamentoId,
        ciudadId: proyecto.ciudadId,
        titulo: proyecto.titulo,
        slug: proyecto.slug,
        resumen: proyecto.resumen,
        descripcion: proyecto.descripcion,
        anio: proyecto.anio,
        servicio: proyecto.servicio,
        imagenId: proyecto.imagenId,
        activo: proyecto.activo,
        cifras: datos.cifras,
        alcance: datos.alcance,
        galeria: datos.galeria,
      }}
    />
  );
}

function Formulario({ proyectoId, inicial }: { proyectoId?: Id<"proyectos">; inicial: EstadoFormulario }) {
  const navegar = useNavigate();
  const [form, setForm] = useState(inicial);
  const cambiar = (cambios: Partial<EstadoFormulario>) => setForm((actual) => ({ ...actual, ...cambios }));

  const crear = useMutation(api.proyectos.crear);
  const actualizar = useMutation(api.proyectos.actualizar);
  const eliminar = useMutation(api.proyectos.eliminar);
  const { recargar } = useVistaPrevia({
    ruta: proyectoId && inicial.slug ? `/proyectos/${inicial.slug}` : "/proyectos/Reddcom-Honduras",
  });

  const listo = Boolean(form.ciudadId && form.imagenId && form.titulo.trim());

  const guardar = useAccion(async () => {
    if (!form.ciudadId || !form.imagenId) return;
    const datos = {
      ciudadId: form.ciudadId,
      titulo: form.titulo,
      slug: form.slug || aSlug(form.titulo),
      resumen: form.resumen,
      descripcion: form.descripcion,
      anio: form.anio,
      servicio: form.servicio,
      imagenId: form.imagenId,
      activo: form.activo,
      cifras: form.cifras,
      alcance: form.alcance,
      galeria: form.galeria.filter((imagen): imagen is Id<"imagenes"> => imagen !== undefined),
    };
    if (proyectoId) {
      await actualizar({ id: proyectoId, ...datos });
      recargar();
    } else {
      navegar(`/proyectos/${await crear(datos)}`, { replace: true });
    }
  });

  const borrar = useAccion(async () => {
    if (!proyectoId) return;
    await eliminar({ id: proyectoId });
    navegar("/proyectos", { replace: true });
  });

  return (
    <div className="space-y-6">
      <EncabezadoVista
        grupo="Proyectos"
        titulo={proyectoId ? form.titulo || "Proyecto" : "Nuevo proyecto"}
        acciones={
          <>
            <Link to="/proyectos" className="mr-2 text-xs font-semibold text-primary-700 hover:underline">
              ← Todos los proyectos
            </Link>
            <Boton variante="primario" disabled={!listo || guardar.ocupado} onClick={() => guardar.ejecutar()}>
              {guardar.ocupado ? "Guardando…" : proyectoId ? "Guardar cambios" : "Crear proyecto"}
            </Boton>
          </>
        }
        error={guardar.error}
      />

      <Desplegable titulo="Proyecto" abierto>
        <div className="space-y-4">
          <CampoTexto etiqueta="Título" valor={form.titulo} onChange={(titulo) => cambiar({ titulo })} />
          <CampoTexto
            etiqueta="Resumen"
            multilinea
            ayuda="Aparece en las tarjetas y bajo el título del detalle."
            valor={form.resumen}
            onChange={(resumen) => cambiar({ resumen })}
          />
          <CampoTexto
            etiqueta="Descripción"
            multilinea
            ayuda="Separa los párrafos con una línea en blanco."
            valor={form.descripcion}
            onChange={(descripcion) => cambiar({ descripcion })}
          />
          <SelectorImagen
            etiqueta="Foto principal"
            valor={form.imagenId}
            onChange={(imagenId) => cambiar({ imagenId })}
          />
        </div>
      </Desplegable>

      <Desplegable titulo="Ubicación y clasificación" abierto>
        <div className="space-y-4">
          <SelectorCiudad valor={form} onChange={cambiar} />
          <div className="grid gap-4 sm:grid-cols-3">
            <CampoSelect
              etiqueta="Servicio"
              valor={form.servicio}
              opciones={Object.entries(serviciosProyecto).map(([valor, etiqueta]) => ({
                valor: valor as ServicioProyecto,
                etiqueta,
              }))}
              onChange={(servicio) => cambiar({ servicio })}
            />
            <Campo etiqueta="Año">
              <input
                className={claseEntrada}
                type="number"
                min={1990}
                max={2100}
                value={form.anio}
                onChange={(e) => cambiar({ anio: e.target.valueAsNumber || 0 })}
              />
            </Campo>
            <label className="flex items-center gap-3 self-end rounded-sm border border-linea bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary-600"
                checked={form.activo}
                onChange={(e) => cambiar({ activo: e.target.checked })}
              />
              Visible en el sitio
            </label>
          </div>
          <Desplegable variante="mas" titulo="Dirección">
            <CampoTexto
              etiqueta="Slug (URL)"
              placeholder={aSlug(form.titulo) || "ftth-san-pedro-sula"}
              ayuda="Si lo dejas vacío se genera con el título."
              valor={form.slug}
              onChange={(slug) => cambiar({ slug })}
            />
          </Desplegable>
        </div>
      </Desplegable>

      <Desplegable titulo="Cifras" detalle={`${form.cifras.length}`}>
        <ListaCifras valor={form.cifras} onChange={(cifras) => cambiar({ cifras })} />
      </Desplegable>

      <Desplegable titulo="Alcance" detalle={`${form.alcance.length}`}>
        <ListaTextos
          etiqueta="Trabajos incluidos"
          singular="Punto"
          valor={form.alcance}
          onChange={(alcance) => cambiar({ alcance })}
        />
      </Desplegable>

      <Desplegable titulo="Galería" detalle={`${form.galeria.length}`}>
        <ListaGaleria valor={form.galeria} onChange={(galeria) => cambiar({ galeria })} />
      </Desplegable>

      {proyectoId && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-linea pt-5">
          <div className="mr-auto min-w-0 space-y-2">
            <MensajeError mensaje={borrar.error} />
          </div>
          <ConfirmarEliminar etiqueta="Eliminar proyecto" onConfirmar={() => borrar.ejecutar()} />
        </div>
      )}
    </div>
  );
}

/** Cifras del proyecto: valor grande + etiqueta, en orden. */
function ListaCifras({ valor, onChange }: { valor: Cifra[]; onChange: (valor: Cifra[]) => void }) {
  const lista = useListaOrdenable(valor, onChange);
  return (
    <fieldset>
      <legend className={claseEtiqueta}>Se muestran en la fila de cifras del detalle</legend>
      <ol className="space-y-2">
        {valor.map((cifra, indice) => (
          <li key={lista.claves[indice]} className="flex items-center gap-2">
            <input
              className={`${claseEntrada} w-28`}
              placeholder="18k"
              aria-label="Valor"
              value={cifra.valor}
              onChange={(e) => lista.cambiar(indice, { ...cifra, valor: e.target.value })}
            />
            <input
              className={claseEntrada}
              placeholder="hogares pasados"
              aria-label="Etiqueta"
              value={cifra.etiqueta}
              onChange={(e) => lista.cambiar(indice, { ...cifra, etiqueta: e.target.value })}
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
      <Boton tamano="sm" className="mt-3" onClick={() => lista.agregar({ valor: "", etiqueta: "" })}>
        <Plus className="size-3.5" /> Agregar cifra
      </Boton>
    </fieldset>
  );
}

/** Fotos de la galería, en orden (la del centro se muestra más alta). */
function ListaGaleria({
  valor,
  onChange,
}: {
  valor: (Id<"imagenes"> | undefined)[];
  onChange: (valor: (Id<"imagenes"> | undefined)[]) => void;
}) {
  const lista = useListaOrdenable(valor, onChange);
  return (
    <div>
      <ol className="space-y-3">
        {valor.map((imagenId, indice) => (
          <li key={lista.claves[indice]} className="flex items-end gap-2">
            <div className="flex-1">
              <SelectorImagen
                etiqueta={`Foto ${indice + 1}`}
                valor={imagenId}
                onChange={(nueva) => lista.cambiar(indice, nueva)}
              />
            </div>
            <AccionesOrden
              indice={indice}
              total={valor.length}
              onMover={(d) => lista.mover(indice, d)}
              onQuitar={() => lista.quitar(indice)}
            />
          </li>
        ))}
      </ol>
      <Boton tamano="sm" className="mt-3" onClick={() => lista.agregar(undefined)}>
        <Plus className="size-3.5" /> Agregar foto
      </Boton>
    </div>
  );
}
