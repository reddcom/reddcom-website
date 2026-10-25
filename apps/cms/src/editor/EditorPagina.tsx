import { api } from "@reddcom/convex/api";
import type { ContenidoBloque } from "@reddcom/convex/bloques";
import { buscarPagina, type DefinicionPagina, type DefinicionSeccion } from "@reddcom/convex/registro";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "react-router";
import { useRecargarVistaPrevia, useVistaPrevia } from "../layout/contextoVistaPrevia";
import { useAccion } from "../lib/useAccion";
import { Boton } from "../ui/Boton";
import { Cargando, EncabezadoVista, Vacio } from "../ui/Estados";
import { EditorSeccion, sinVacios, type CamposSeccion } from "./EditorSeccion";

type ContenidoPagina = FunctionReturnType<typeof api.contenido.obtenerPagina>;
type Secciones = Record<string, CamposSeccion>;

/** El servidor agrega `imagen` (url + alt) para mostrarla; no forma parte del bloque. */
function soloContenido(bloque: ContenidoBloque & { imagen?: unknown }): ContenidoBloque {
  const contenido = { ...bloque };
  delete contenido.imagen;
  return contenido;
}

function camposIniciales(
  definicion: DefinicionSeccion,
  guardados: Record<string, (ContenidoBloque & { imagen?: unknown })[]> | undefined,
): CamposSeccion {
  return Object.fromEntries(
    Object.keys(definicion.campos).map((campo) => [campo, (guardados?.[campo] ?? []).map(soloContenido)]),
  );
}

const limpiar = (secciones: Secciones): Secciones =>
  Object.fromEntries(Object.entries(secciones).map(([clave, campos]) => [clave, sinVacios(campos)]));

export function EditorPagina() {
  const { pagina = "" } = useParams();
  const [params] = useSearchParams();
  const definicion = buscarPagina(pagina);
  const contenido = useQuery(api.contenido.obtenerPagina, definicion ? { pagina } : "skip");

  const seccionElegida = params.get("seccion");
  const [ancla, setAncla] = useState<string | undefined>();
  useVistaPrevia(definicion ? { ruta: definicion.ruta, ancla } : null);

  // Al elegir una sección en el sidebar: se abre, se centra y la vista previa la sigue.
  useEffect(() => {
    if (!definicion || !seccionElegida || !Object.hasOwn(definicion.secciones, seccionElegida)) return;
    setAncla(definicion.secciones[seccionElegida].ancla);
    document.getElementById(`seccion-${seccionElegida}`)?.scrollIntoView({ behavior: "smooth" });
  }, [definicion, seccionElegida, contenido === undefined]);

  if (!definicion) {
    return <Vacio titulo="Esta página no existe en el registro." />;
  }

  const encabezado = (acciones?: ReactNode, error?: string | null) => (
    <EncabezadoVista
      grupo={definicion.grupo}
      titulo={definicion.nombre}
      detalle={<span className="font-mono">{definicion.ruta}</span>}
      acciones={acciones}
      error={error}
    />
  );

  if (contenido === undefined) {
    return (
      <div className="space-y-6">
        {encabezado()}
        <Cargando />
      </div>
    );
  }

  // La `key` reinicia el borrador al cambiar de página.
  return (
    <FormularioPagina
      key={pagina}
      pagina={pagina}
      definicion={definicion}
      contenido={contenido}
      seccionElegida={seccionElegida}
      onAbrir={setAncla}
      encabezado={encabezado}
    />
  );
}

/**
 * Borrador de todas las secciones de la página. "Guardar cambios" envía
 * solo las secciones modificadas, en una sola transacción; "Descartar"
 * vuelve todas a lo último guardado.
 */
function FormularioPagina({
  pagina,
  definicion,
  contenido,
  seccionElegida,
  onAbrir,
  encabezado,
}: {
  pagina: string;
  definicion: DefinicionPagina;
  contenido: ContenidoPagina;
  seccionElegida: string | null;
  onAbrir: (ancla: string) => void;
  encabezado: (acciones: ReactNode, error: string | null) => ReactNode;
}) {
  const [campos, setCampos] = useState<Secciones>(() =>
    Object.fromEntries(
      Object.entries(definicion.secciones).map(([clave, seccion]) => [clave, camposIniciales(seccion, contenido[clave])]),
    ),
  );
  const [guardados, setGuardados] = useState(() => limpiar(campos));
  const guardarPagina = useMutation(api.contenido.guardarPagina);
  const recargar = useRecargarVistaPrevia();

  const limpios = limpiar(campos);
  const cambiadas = Object.keys(limpios).filter(
    (clave) => JSON.stringify(limpios[clave]) !== JSON.stringify(guardados[clave]),
  );
  const hayCambios = cambiadas.length > 0;

  const guardar = useAccion(async () => {
    await guardarPagina({ pagina, secciones: Object.fromEntries(cambiadas.map((clave) => [clave, limpios[clave]])) });
    setGuardados(limpios);
    recargar();
  });

  const acciones = (
    <>
      {hayCambios && (
        <span className="text-[11px] font-semibold text-accent">
          {cambiadas.length === 1 ? "1 sección sin guardar" : `${cambiadas.length} secciones sin guardar`}
        </span>
      )}
      <Boton variante="fantasma" disabled={!hayCambios || guardar.ocupado} onClick={() => setCampos(guardados)}>
        Descartar
      </Boton>
      <Boton variante="primario" disabled={!hayCambios || guardar.ocupado} onClick={() => guardar.ejecutar()}>
        {guardar.ocupado ? "Guardando…" : "Guardar cambios"}
      </Boton>
    </>
  );

  return (
    <div className="space-y-6">
      {encabezado(acciones, guardar.error)}
      <div className="space-y-3">
        {Object.entries(definicion.secciones).map(([clave, seccion]) => (
          <EditorSeccion
            key={clave}
            clave={clave}
            definicion={seccion}
            campos={campos[clave]}
            onChange={(campo, valor) =>
              setCampos((actual) => ({ ...actual, [clave]: { ...actual[clave], [campo]: valor } }))
            }
            hayCambios={cambiadas.includes(clave)}
            abierto={clave === seccionElegida}
            onAbrir={() => onAbrir(seccion.ancla)}
          />
        ))}
      </div>
    </div>
  );
}
