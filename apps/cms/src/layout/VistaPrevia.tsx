import { Crosshair, ExternalLink, PanelRightClose, RotateCw } from "lucide-react";
import type { Ref } from "react";
import { entorno } from "../lib/entorno";
import { Boton } from "../ui/Boton";
import type { DestinoVistaPrevia } from "./contextoVistaPrevia";

/** `version` va en la URL para saltarse la caché de 60 s del sitio y ver lo recién guardado. */
export function urlDelSitio({ ruta, ancla }: DestinoVistaPrevia, version?: number) {
  return `${entorno.websiteUrl}${ruta}${version === undefined ? "" : `?v=${version}`}${ancla ? `#${ancla}` : ""}`;
}

/**
 * La página real del sitio dentro de un iframe, centrada en la sección
 * que se edita. `version` (una marca de tiempo) cambia al guardar para forzar la recarga.
 */
export function VistaPrevia({
  destino,
  version,
  marco,
  resaltarAlEscribir,
  onAlternarResaltado,
  onRecargar,
  onOcultar,
}: {
  destino: DestinoVistaPrevia;
  version: number;
  marco: Ref<HTMLIFrameElement>;
  resaltarAlEscribir: boolean;
  onAlternarResaltado: () => void;
  onRecargar: () => void;
  onOcultar: () => void;
}) {
  const url = urlDelSitio(destino);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-linea bg-white px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-body">Vista previa</p>
          <p className="truncate text-[11px] text-body-soft" title={url}>
            {destino.ruta}
            {destino.ancla && <span className="text-primary-700">#{destino.ancla}</span>}
          </p>
        </div>
        <Boton
          variante="fantasma"
          tamano="icono"
          aria-pressed={resaltarAlEscribir}
          aria-label="Señalar el campo al escribir"
          title={resaltarAlEscribir ? "Señalar al escribir: activado" : "Señalar al escribir: desactivado"}
          className={resaltarAlEscribir ? "bg-primary-600/10 text-primary-700" : ""}
          onClick={onAlternarResaltado}
        >
          <Crosshair className="size-3.5" />
        </Boton>
        <Boton variante="fantasma" tamano="icono" aria-label="Recargar" title="Recargar" onClick={onRecargar}>
          <RotateCw className="size-3.5" />
        </Boton>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir en otra pestaña"
          title="Abrir en otra pestaña"
          className="inline-flex size-7 items-center justify-center rounded-sm text-body hover:bg-navy-900/5 hover:text-navy-900"
        >
          <ExternalLink className="size-3.5" />
        </a>
        <Boton variante="fantasma" tamano="icono" aria-label="Ocultar vista previa" title="Ocultar" onClick={onOcultar}>
          <PanelRightClose className="size-3.5" />
        </Boton>
      </div>
      <iframe
        ref={marco}
        key={version}
        src={urlDelSitio(destino, version)}
        title="Vista previa del sitio"
        className="min-h-0 flex-1 bg-white"
      />
      <p className="border-t border-linea bg-white px-3 py-2 text-[11px] leading-4 text-body-soft">
        Muestra el sitio publicado y se recarga al guardar. Con <Crosshair className="inline size-3" /> activado, al
        escribir en un campo se señala dónde aparece.
      </p>
    </div>
  );
}
