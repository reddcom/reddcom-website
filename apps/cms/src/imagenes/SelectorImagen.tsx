import { api } from "@reddcom/convex/api";
import { esOrigenValido, MENSAJE_ORIGEN_INVALIDO, TIPOS_ORIGEN } from "@reddcom/convex/imagenes";
import type { Id } from "@reddcom/convex/modelo";
import { useQuery } from "convex/react";
import { Upload } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Boton } from "../ui/Boton";
import { CampoTexto, claseEtiqueta } from "../ui/Campo";
import { Cargando, MensajeError } from "../ui/Estados";
import { useSubidaImagen } from "./useSubidaImagen";

/**
 * Campo de imagen: muestra en grande la imagen guardada y permite subir
 * una nueva ahí mismo (clic o arrastrar) o elegir una del banco. Lo que
 * se sube aquí también queda en el banco de imágenes.
 */
export function SelectorImagen({
  etiqueta = "Imagen",
  valor,
  onChange,
  opcional = false,
}: {
  etiqueta?: string;
  valor: Id<"imagenes"> | undefined;
  onChange: (id: Id<"imagenes"> | undefined) => void;
  opcional?: boolean;
}) {
  // Una sola suscripción compartida: Convex deduplica la misma consulta.
  const imagenes = useQuery(api.imagenes.listar);
  const actual = valor ? imagenes?.find((imagen) => imagen.id === valor) : undefined;

  const entrada = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [enBanco, setEnBanco] = useState(false);
  const subida = useSubidaImagen();

  // La vista previa local se libera al cambiarla o al desmontar el campo.
  useEffect(() => () => {
    if (previa) URL.revokeObjectURL(previa);
  }, [previa]);

  function prepararArchivo(nuevo: File | undefined) {
    if (!nuevo) return;
    if (!esOrigenValido(nuevo.type, nuevo.size)) {
      setErrorArchivo(MENSAJE_ORIGEN_INVALIDO);
      return;
    }
    setErrorArchivo(null);
    setArchivo(nuevo);
    setPrevia(URL.createObjectURL(nuevo));
    setEnBanco(false);
  }

  function cancelar() {
    setArchivo(null);
    setPrevia(null);
    setAlt("");
    if (entrada.current) entrada.current.value = "";
  }

  async function subir() {
    if (!archivo) return;
    const id = await subida.ejecutar(archivo, alt);
    if (id === undefined) return;
    onChange(id);
    cancelar();
  }

  function elegirDelBanco(id: Id<"imagenes">) {
    onChange(id);
    setEnBanco(false);
  }

  function soltar(evento: DragEvent) {
    evento.preventDefault();
    setArrastrando(false);
    prepararArchivo(evento.dataTransfer.files[0]);
  }

  const imagenVisible = previa ?? actual?.url ?? null;

  return (
    <div>
      <span className={claseEtiqueta}>{etiqueta}</span>

      <div
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={soltar}
        className={`relative aspect-video w-full max-w-sm overflow-hidden rounded-sm border bg-surface ${
          arrastrando ? "border-primary-600 ring-1 ring-primary-600" : imagenVisible ? "border-linea" : "border-dashed border-linea"
        }`}
      >
        {imagenVisible ? (
          <img src={imagenVisible} alt={previa ? alt : (actual?.alt ?? "")} className="size-full object-contain" />
        ) : (
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center hover:bg-white"
          >
            <Upload aria-hidden className="size-5 text-body-soft" />
            <span className="text-xs font-medium">Arrastra una imagen aquí o haz clic para subirla</span>
            <span className="text-[11px] text-body-soft">JPG, PNG, WebP, AVIF o GIF · máximo 25 MB · se guarda en WebP</span>
          </button>
        )}
        {previa && (
          <span className="absolute left-2 top-2 rounded-sm bg-navy-950/80 px-2 py-0.5 text-[10px] font-semibold text-white">
            Sin subir
          </span>
        )}
      </div>

      <input
        ref={entrada}
        type="file"
        accept={TIPOS_ORIGEN.join(",")}
        onChange={(evento) => prepararArchivo(evento.target.files?.[0])}
        className="hidden"
      />

      <div className="mt-2 max-w-sm space-y-2">
        <MensajeError mensaje={errorArchivo ?? subida.error} />

        {archivo ? (
          <>
            <CampoTexto
              etiqueta="Texto alternativo"
              valor={alt}
              onChange={setAlt}
              placeholder="Qué se ve en la imagen"
              ayuda="Lo leen los buscadores y los lectores de pantalla."
            />
            <div className="flex gap-1.5">
              <Boton tamano="sm" variante="primario" disabled={!alt.trim() || subida.ocupado} onClick={subir}>
                {subida.ocupado ? "Subiendo…" : "Subir y usar"}
              </Boton>
              <Boton tamano="sm" variante="fantasma" disabled={subida.ocupado} onClick={cancelar}>
                Cancelar
              </Boton>
            </div>
          </>
        ) : (
          <>
            {actual && (
              <p className="truncate text-[11px] text-body-soft" title={actual.alt}>
                {actual.nombre} · {actual.alt}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              <Boton tamano="sm" onClick={() => entrada.current?.click()}>
                <Upload className="size-3" /> {actual ? "Subir otra" : "Subir imagen"}
              </Boton>
              <Boton tamano="sm" variante="fantasma" onClick={() => setEnBanco(!enBanco)}>
                {enBanco ? "Cerrar banco" : "Elegir del banco"}
              </Boton>
              {opcional && valor && (
                <Boton tamano="sm" variante="fantasma" onClick={() => onChange(undefined)}>
                  Quitar
                </Boton>
              )}
            </div>
          </>
        )}
      </div>

      {enBanco && (
        <div className="mt-3 rounded-sm border border-linea bg-surface p-3">
          {imagenes === undefined ? (
            <Cargando />
          ) : imagenes.length === 0 ? (
            <p className="py-4 text-center text-xs text-body-soft">El banco está vacío. Sube la primera imagen.</p>
          ) : (
            <ul className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {imagenes.map((imagen) => (
                <li key={imagen.id}>
                  <button
                    type="button"
                    onClick={() => elegirDelBanco(imagen.id)}
                    aria-pressed={imagen.id === valor}
                    title={imagen.nombre}
                    className={`block aspect-square w-full overflow-hidden rounded-sm border bg-white ${imagen.id === valor ? "border-primary-600 ring-1 ring-primary-600" : "border-linea hover:border-primary-600"}`}
                  >
                    {imagen.url && <img src={imagen.url} alt={imagen.alt} className="size-full object-cover" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
