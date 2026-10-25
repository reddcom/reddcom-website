import { TIPOS_ORIGEN } from "@reddcom/convex/imagenes";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Boton } from "../ui/Boton";
import { CampoTexto, claseEtiqueta } from "../ui/Campo";
import { MensajeError } from "../ui/Estados";
import { useSubidaImagen } from "./useSubidaImagen";

/** Formulario del banco de imágenes para subir una imagen nueva. */
export function SubidaImagen() {
  const entrada = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const subida = useSubidaImagen();

  async function subir(archivo: File) {
    if ((await subida.ejecutar(archivo, alt)) === undefined) return;
    setArchivo(null);
    setAlt("");
    if (entrada.current) entrada.current.value = "";
  }

  return (
    <div className="space-y-3 rounded-sm border border-dashed border-linea bg-white p-4">
      <label className="block">
        <span className={claseEtiqueta}>Archivo</span>
        <input
          ref={entrada}
          type="file"
          accept={TIPOS_ORIGEN.join(",")}
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-body file:mr-3 file:rounded-sm file:border-0 file:bg-navy-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
        />
        <span className="mt-1 block text-xs text-body-soft">JPG, PNG, WebP, AVIF o GIF · máximo 25 MB. Se guarda en WebP.</span>
      </label>
      <CampoTexto
        etiqueta="Texto alternativo"
        valor={alt}
        onChange={setAlt}
        placeholder="Qué se ve en la imagen"
        ayuda="Lo leen los buscadores y los lectores de pantalla. Describe la imagen, no la repitas como título."
      />
      <MensajeError mensaje={subida.error} />
      <Boton
        variante="primario"
        disabled={!archivo || !alt.trim() || subida.ocupado}
        onClick={() => archivo && subir(archivo)}
      >
        <Upload className="size-3.5" /> {subida.ocupado ? "Subiendo…" : "Subir imagen"}
      </Boton>
    </div>
  );
}
