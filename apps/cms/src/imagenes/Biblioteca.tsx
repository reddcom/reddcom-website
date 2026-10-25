import { api } from "@reddcom/convex/api";
import type { Id } from "@reddcom/convex/modelo";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { tamanoLegible } from "../lib/formato";
import { useAccion } from "../lib/useAccion";
import { Boton } from "../ui/Boton";
import { claseEntrada } from "../ui/Campo";
import { ConfirmarEliminar } from "../ui/ConfirmarEliminar";
import { Desplegable } from "../ui/Desplegable";
import { Cargando, EncabezadoVista, MensajeError, Vacio } from "../ui/Estados";
import { SubidaImagen } from "./SubidaImagen";

export function Biblioteca() {
  const imagenes = useQuery(api.imagenes.listar);

  return (
    <div className="space-y-6">
      <EncabezadoVista
        grupo="Medios"
        titulo="Banco de imágenes"
        detalle="Se guardan en Convex. Una imagen que se usa en alguna página no se puede eliminar."
      />
      <Desplegable titulo="Subir imagen" abierto={imagenes?.length === 0}>
        <SubidaImagen />
      </Desplegable>

      {imagenes === undefined ? (
        <Cargando />
      ) : imagenes.length === 0 ? (
        <Vacio titulo="Aún no hay imágenes">Sube la primera desde el panel de arriba.</Vacio>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {imagenes.map((imagen) => (
            <TarjetaImagen key={imagen.id} imagen={imagen} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaImagen({
  imagen,
}: {
  imagen: { id: Id<"imagenes">; nombre: string; alt: string; url: string | null; tamano: number | null };
}) {
  const actualizarAlt = useMutation(api.imagenes.actualizarAlt);
  const eliminar = useMutation(api.imagenes.eliminar);
  const [alt, setAlt] = useState(imagen.alt);
  const accion = useAccion((tarea: () => Promise<unknown>) => tarea());

  return (
    <li className="overflow-hidden rounded-sm border border-linea bg-white">
      <div className="aspect-video bg-surface">
        {imagen.url && <img src={imagen.url} alt={imagen.alt} className="size-full object-cover" />}
      </div>
      <div className="space-y-2 p-3">
        <p className="truncate text-xs font-semibold" title={imagen.nombre}>
          {imagen.nombre}
          {imagen.tamano !== null && (
            <span className="ml-2 font-normal text-body-soft">{tamanoLegible(imagen.tamano)}</span>
          )}
        </p>
        <input
          className={claseEntrada}
          value={alt}
          aria-label="Texto alternativo"
          onChange={(e) => setAlt(e.target.value)}
        />
        <MensajeError mensaje={accion.error} />
        <div className="flex items-center justify-between gap-2">
          <Boton
            tamano="sm"
            disabled={alt === imagen.alt || accion.ocupado}
            onClick={() => accion.ejecutar(() => actualizarAlt({ id: imagen.id, alt }))}
          >
            Guardar texto
          </Boton>
          <ConfirmarEliminar soloIcono onConfirmar={() => accion.ejecutar(() => eliminar({ id: imagen.id }))} />
        </div>
      </div>
    </li>
  );
}
