import { api } from "@reddcom/convex/api";
import { useQuery } from "convex/react";
import { ExternalLink, FileDown, FileText, Link2, Mail, Phone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Boton } from "../ui/Boton";
import { claseEntrada } from "../ui/Campo";
import { Desplegable } from "../ui/Desplegable";
import { Cargando, EncabezadoVista, Vacio } from "../ui/Estados";
import { descargarFicha, type Postulacion } from "./fichaPdf";

const formatoFecha = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

/**
 * Postulaciones que llegan desde el formulario de cada vacante. Es solo de
 * consulta: el contenido de las vacantes se edita en su propio módulo.
 */
export function ListaPostulaciones() {
  const postulaciones = useQuery(api.postulaciones.listar);
  const [vacante, setVacante] = useState("");

  // Vacantes que tienen al menos una postulación, para el filtro.
  const vacantes = new Map(
    (postulaciones ?? []).flatMap((p) => (p.vacante ? [[p.vacante.id, `${p.vacante.titulo} · ${p.vacante.ubicacion}`] as const] : [])),
  );
  const visibles = (postulaciones ?? []).filter((p) => !vacante || p.vacante?.id === vacante);

  return (
    <div className="space-y-6">
      <EncabezadoVista
        grupo="Empleo"
        titulo="Postulaciones"
        detalle="Llegan desde el formulario de cada vacante en el sitio."
        acciones={
          vacantes.size > 1 && (
            <select
              aria-label="Filtrar por vacante"
              className={`${claseEntrada} w-auto`}
              value={vacante}
              onChange={(e) => setVacante(e.target.value)}
            >
              <option value="">Todas las vacantes ({postulaciones?.length})</option>
              {[...vacantes].map(([id, nombre]) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
          )
        }
      />

      {postulaciones === undefined ? (
        <Cargando />
      ) : postulaciones.length === 0 ? (
        <Vacio titulo="Aún no hay postulaciones">Aparecerán aquí cuando alguien se postule desde el sitio.</Vacio>
      ) : (
        <ol className="space-y-2">
          {visibles.map((postulacion) => (
            <li key={postulacion.id}>
              <ItemPostulacion postulacion={postulacion} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const claseEnlace =
  "inline-flex h-9 items-center gap-1.5 rounded-sm px-4 text-xs font-semibold tracking-wide";

function ItemPostulacion({ postulacion }: { postulacion: Postulacion }) {
  return (
    <Desplegable
      variante="item"
      titulo={
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold">{postulacion.nombre}</span>
          <span className="truncate text-body-soft">· {postulacion.vacante?.titulo ?? "Vacante eliminada"}</span>
          <span className="ml-auto shrink-0 text-[11px] text-body-soft">{formatoFecha.format(postulacion.fecha)}</span>
        </span>
      }
    >
      <div className="space-y-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Dato etiqueta="Vacante">
            {postulacion.vacante ? `${postulacion.vacante.titulo} · ${postulacion.vacante.ubicacion}` : "Vacante eliminada"}
          </Dato>
          <Dato etiqueta="Correo">
            <a className="inline-flex items-center gap-1.5 text-primary-700 hover:underline" href={`mailto:${postulacion.correo}`}>
              <Mail className="size-3.5" /> {postulacion.correo}
            </a>
          </Dato>
          <Dato etiqueta="Teléfono">
            <a className="inline-flex items-center gap-1.5 text-primary-700 hover:underline" href={`tel:${postulacion.telefono.replace(/[^\d+]/g, "")}`}>
              <Phone className="size-3.5" /> {postulacion.telefono}
            </a>
          </Dato>
          {postulacion.enlace && (
            <Dato etiqueta="LinkedIn o portafolio">
              <a
                className="inline-flex max-w-full items-center gap-1.5 truncate text-primary-700 hover:underline"
                href={postulacion.enlace}
                target="_blank"
                rel="noreferrer"
              >
                <Link2 className="size-3.5 shrink-0" /> <span className="truncate">{postulacion.enlace}</span>
              </a>
            </Dato>
          )}
        </dl>

        {postulacion.mensaje && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-body">Mensaje</p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-6">{postulacion.mensaje}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {postulacion.cvUrl && (
            <a
              href={postulacion.cvUrl}
              target="_blank"
              rel="noreferrer"
              className={`${claseEnlace} bg-navy-900 text-white hover:bg-navy-800`}
            >
              <FileText className="size-3.5" /> Ver CV <ExternalLink className="size-3" />
            </a>
          )}
          <Boton onClick={() => descargarFicha(postulacion)}>
            <FileDown className="size-3.5" /> Descargar ficha PDF
          </Boton>
        </div>
      </div>
    </Desplegable>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-body">{etiqueta}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
