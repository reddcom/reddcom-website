import { api } from "@reddcom/convex/api";
import { motivosMensaje } from "@reddcom/convex/mensajes";
import type { Doc } from "@reddcom/convex/modelo";
import { useMutation, useQuery } from "convex/react";
import { Mail, MailOpen } from "lucide-react";
import { useVistaPrevia } from "../layout/contextoVistaPrevia";
import { useAccion } from "../lib/useAccion";
import { Boton } from "../ui/Boton";
import { ConfirmarEliminar } from "../ui/ConfirmarEliminar";
import { Desplegable } from "../ui/Desplegable";
import { Cargando, EncabezadoVista, MensajeError, Vacio } from "../ui/Estados";

const formatoFecha = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

/** Mensajes del formulario de contacto, del más reciente al más antiguo. */
export function Bandeja() {
  const bandeja = useQuery(api.mensajes.listar);
  useVistaPrevia({ ruta: "/contacto" });

  return (
    <div className="space-y-6">
      <EncabezadoVista
        grupo="Contacto"
        titulo="Mensajes"
        detalle={
          bandeja && bandeja.sinLeer > 0
            ? `${bandeja.sinLeer} sin leer. Llegan desde el formulario de la página Contacto.`
            : "Llegan desde el formulario de la página Contacto."
        }
      />

      {bandeja === undefined ? (
        <Cargando />
      ) : bandeja.mensajes.length === 0 ? (
        <Vacio titulo="Aún no hay mensajes" />
      ) : (
        <ol className="space-y-2">
          {bandeja.mensajes.map((mensaje) => (
            <li key={mensaje._id}>
              <ItemMensaje mensaje={mensaje} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ItemMensaje({ mensaje }: { mensaje: Doc<"mensajes"> }) {
  const marcarLeido = useAccion(useMutation(api.mensajes.marcarLeido));
  const eliminar = useAccion(useMutation(api.mensajes.eliminar));

  const contacto = [mensaje.correo, mensaje.telefono, mensaje.empresa, mensaje.pais].filter(Boolean).join(" · ");

  return (
    <Desplegable
      variante="item"
      // Abrir un mensaje lo da por leído.
      onAbrir={() => !mensaje.leido && marcarLeido.ejecutar({ id: mensaje._id, leido: true })}
      titulo={
        <span className="flex min-w-0 items-center gap-2">
          {!mensaje.leido && <span className="size-2 shrink-0 rounded-full bg-primary-600" aria-label="Sin leer" />}
          <span className={`truncate ${mensaje.leido ? "" : "font-semibold"}`}>{mensaje.nombre}</span>
          <span className="truncate text-body-soft">· {motivosMensaje[mensaje.motivo]}</span>
          <span className="ml-auto shrink-0 text-[11px] text-body-soft">{formatoFecha.format(mensaje.fecha)}</span>
        </span>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-body">{contacto}</p>
        <p className="whitespace-pre-line text-sm leading-6">{mensaje.mensaje}</p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`mailto:${mensaje.correo}?subject=${encodeURIComponent("Re: tu mensaje a Reddcom")}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-navy-900 px-4 text-xs font-semibold tracking-wide text-white hover:bg-navy-800"
          >
            <Mail className="size-3.5" /> Responder
          </a>
          <Boton disabled={marcarLeido.ocupado} onClick={() => marcarLeido.ejecutar({ id: mensaje._id, leido: !mensaje.leido })}>
            <MailOpen className="size-3.5" /> {mensaje.leido ? "Marcar sin leer" : "Marcar leído"}
          </Boton>
          <ConfirmarEliminar deshabilitado={eliminar.ocupado} onConfirmar={() => eliminar.ejecutar({ id: mensaje._id })} />
        </div>
        <MensajeError mensaje={marcarLeido.error ?? eliminar.error} />
      </div>
    </Desplegable>
  );
}
