import type { BloqueDe, TipoBloque } from "@reddcom/convex/bloques";
import type { Id } from "@reddcom/convex/modelo";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { SelectorImagen } from "../imagenes/SelectorImagen";
import { useListaOrdenable } from "../lib/useListaOrdenable";
import { AccionesOrden } from "../ui/AccionesOrden";
import { Boton } from "../ui/Boton";
import { Campo, CampoTexto, claseEntrada, claseEtiqueta } from "../ui/Campo";
import { Desplegable } from "../ui/Desplegable";

/* =========================================================
   EDITORES POR TIPO DE BLOQUE
   Cada tipo declara: su valor vacío, cuándo cuenta como vacío
   (no se guarda), un resumen para las listas y su formulario.
   Agregar un tipo = sumar una entrada; el resto no cambia.
========================================================= */

export type PropsEditor<T extends TipoBloque> = {
  valor: BloqueDe<T>;
  onChange: (valor: BloqueDe<T>) => void;
  multilinea?: boolean;
  opciones?: Record<string, string>;
};

export type DefinicionEditor<T extends TipoBloque> = {
  vacio: () => BloqueDe<T>;
  estaVacio: (bloque: BloqueDe<T>) => boolean;
  resumen: (bloque: BloqueDe<T>) => string;
  Editor: (props: PropsEditor<T>) => ReactNode;
};

const sinTexto = (...valores: (string | undefined)[]) => valores.every((valor) => !valor?.trim());

// Los opcionales vacíos se envían como `undefined`: el campo no se guarda.
const opcional = (valor: string) => (valor === "" ? undefined : valor);

const Grilla = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-4 sm:grid-cols-2">{children}</div>
);

export const editores: { [T in TipoBloque]: DefinicionEditor<T> } = {
  texto: {
    vacio: () => ({ tipo: "texto", texto: "" }),
    estaVacio: (b) => sinTexto(b.texto),
    resumen: (b) => b.texto,
    Editor: ({ valor, onChange, multilinea }) => (
      <CampoTexto
        etiqueta="Texto"
        multilinea={multilinea}
        valor={valor.texto}
        onChange={(texto) => onChange({ ...valor, texto })}
      />
    ),
  },

  opcion: {
    vacio: () => ({ tipo: "opcion", valor: "" }),
    estaVacio: (b) => sinTexto(b.valor),
    resumen: (b) => b.valor,
    Editor: ({ valor, onChange, opciones = {} }) => (
      <Campo etiqueta="Opción">
        <select className={claseEntrada} value={valor.valor} onChange={(e) => onChange({ ...valor, valor: e.target.value })}>
          <option value="">Elegir…</option>
          {Object.entries(opciones).map(([clave, etiqueta]) => (
            <option key={clave} value={clave}>
              {etiqueta}
            </option>
          ))}
        </select>
      </Campo>
    ),
  },

  encabezado: {
    vacio: () => ({ tipo: "encabezado", titulo: "" }),
    estaVacio: (b) => sinTexto(b.etiqueta, b.titulo, b.destacado, b.descripcion),
    resumen: (b) => [b.titulo, b.destacado].filter(Boolean).join(" "),
    Editor: ({ valor, onChange }) => (
      <div className="space-y-4">
        <CampoTexto
          etiqueta="Etiqueta"
          ayuda="Texto pequeño en mayúsculas sobre el título."
          valor={valor.etiqueta ?? ""}
          onChange={(etiqueta) => onChange({ ...valor, etiqueta: opcional(etiqueta) })}
        />
        <Grilla>
          <CampoTexto etiqueta="Título" valor={valor.titulo} onChange={(titulo) => onChange({ ...valor, titulo })} />
          <CampoTexto
            etiqueta="Título destacado"
            ayuda="Segunda línea, en color de acento."
            valor={valor.destacado ?? ""}
            onChange={(destacado) => onChange({ ...valor, destacado: opcional(destacado) })}
          />
        </Grilla>
        <CampoTexto
          etiqueta="Descripción"
          multilinea
          valor={valor.descripcion ?? ""}
          onChange={(descripcion) => onChange({ ...valor, descripcion: opcional(descripcion) })}
        />
      </div>
    ),
  },

  imagen: {
    // Borrador sin imagen elegida: `estaVacio` lo descarta antes de guardar.
    vacio: () => ({ tipo: "imagen", imagenId: "" as Id<"imagenes"> }),
    estaVacio: (b) => !b.imagenId,
    resumen: () => "Imagen",
    Editor: ({ valor, onChange }) => (
      <SelectorImagen
        valor={valor.imagenId || undefined}
        opcional
        onChange={(imagenId) => onChange({ ...valor, imagenId: imagenId ?? ("" as Id<"imagenes">) })}
      />
    ),
  },

  enlace: {
    vacio: () => ({ tipo: "enlace", texto: "", url: "" }),
    estaVacio: (b) => sinTexto(b.texto, b.url),
    resumen: (b) => b.texto,
    Editor: ({ valor, onChange }) => (
      <Grilla>
        <CampoTexto etiqueta="Texto del botón" valor={valor.texto} onChange={(texto) => onChange({ ...valor, texto })} />
        <CampoTexto
          etiqueta="URL"
          placeholder="/nosotros/nuestra-empresa"
          ayuda="Ruta interna (/…), https://, mailto: o tel:"
          valor={valor.url}
          onChange={(url) => onChange({ ...valor, url })}
        />
      </Grilla>
    ),
  },

  dato: {
    vacio: () => ({ tipo: "dato", valor: "", etiqueta: "" }),
    estaVacio: (b) => sinTexto(b.valor, b.etiqueta) && !b.imagenId,
    resumen: (b) => [b.valor, b.etiqueta].filter(Boolean).join(" · "),
    Editor: ({ valor, onChange }) => (
      <div className="space-y-4">
        <Grilla>
          <CampoTexto
            etiqueta="Valor"
            placeholder="+20"
            valor={valor.valor}
            onChange={(v) => onChange({ ...valor, valor: v })}
          />
          <CampoTexto
            etiqueta="Etiqueta"
            placeholder="Años de experiencia"
            valor={valor.etiqueta}
            onChange={(etiqueta) => onChange({ ...valor, etiqueta })}
          />
        </Grilla>
        <Desplegable variante="mas" titulo="Ícono">
          <SelectorImagen
            etiqueta="Ícono"
            opcional
            valor={valor.imagenId}
            onChange={(imagenId) => onChange({ ...valor, imagenId })}
          />
        </Desplegable>
      </div>
    ),
  },

  hito: {
    vacio: () => ({ tipo: "hito", anio: new Date().getFullYear(), lugar: "", titulo: "", texto: "" }),
    estaVacio: (b) => sinTexto(b.lugar, b.titulo, b.texto),
    resumen: (b) => [b.anio, b.titulo].filter(Boolean).join(" · "),
    Editor: ({ valor, onChange }) => (
      <div className="space-y-4">
        <Grilla>
          <Campo etiqueta="Año">
            <input
              className={claseEntrada}
              type="number"
              min={1900}
              max={2100}
              value={valor.anio}
              onChange={(e) => onChange({ ...valor, anio: e.target.valueAsNumber || 0 })}
            />
          </Campo>
          <CampoTexto
            etiqueta="Lugar"
            placeholder="El Salvador"
            valor={valor.lugar}
            onChange={(lugar) => onChange({ ...valor, lugar })}
          />
        </Grilla>
        <CampoTexto etiqueta="Título" valor={valor.titulo} onChange={(titulo) => onChange({ ...valor, titulo })} />
        <CampoTexto etiqueta="Texto" multilinea valor={valor.texto} onChange={(texto) => onChange({ ...valor, texto })} />
        <Desplegable variante="mas" titulo="Foto">
          <SelectorImagen opcional valor={valor.imagenId} onChange={(imagenId) => onChange({ ...valor, imagenId })} />
        </Desplegable>
      </div>
    ),
  },

  tarjeta: {
    vacio: () => ({ tipo: "tarjeta", titulo: "" }),
    estaVacio: (b) => sinTexto(b.titulo, b.texto, b.url) && !b.imagenId,
    resumen: (b) => b.titulo,
    Editor: ({ valor, onChange }) => (
      <div className="space-y-4">
        <CampoTexto etiqueta="Título" valor={valor.titulo} onChange={(titulo) => onChange({ ...valor, titulo })} />
        <CampoTexto
          etiqueta="Texto"
          multilinea
          valor={valor.texto ?? ""}
          onChange={(texto) => onChange({ ...valor, texto: opcional(texto) })}
        />
        <Desplegable variante="mas" titulo="Imagen y enlace">
          <div className="space-y-4">
            <SelectorImagen
              opcional
              valor={valor.imagenId}
              onChange={(imagenId) => onChange({ ...valor, imagenId })}
            />
            <CampoTexto
              etiqueta="Enlace"
              placeholder="/Servicios/redes-fo"
              valor={valor.url ?? ""}
              onChange={(url) => onChange({ ...valor, url: opcional(url) })}
            />
          </div>
        </Desplegable>
      </div>
    ),
  },

  menu: {
    vacio: () => ({ tipo: "menu", texto: "", hijos: [] }),
    estaVacio: (b) => sinTexto(b.texto, b.url) && b.hijos.every((hijo) => sinTexto(hijo.texto, hijo.url)),
    resumen: (b) => (b.hijos.length > 0 ? `${b.texto} · ${b.hijos.length} opciones` : b.texto),
    Editor: EditorMenu,
  },
};

/** Elemento del menú: texto, URL y, si tiene opciones, se vuelve desplegable. */
function EditorMenu({ valor, onChange }: PropsEditor<"menu">) {
  const hijos = useListaOrdenable(valor.hijos, (lista) => onChange({ ...valor, hijos: lista }));

  return (
    <div className="space-y-4">
      <Grilla>
        <CampoTexto etiqueta="Texto" placeholder="Nosotros" valor={valor.texto} onChange={(texto) => onChange({ ...valor, texto })} />
        <CampoTexto
          etiqueta="URL"
          placeholder="/contacto"
          ayuda={valor.hijos.length > 0 ? "No se usa: con opciones es un desplegable." : "Ruta interna (/…) o https://"}
          valor={valor.url ?? ""}
          onChange={(url) => onChange({ ...valor, url: opcional(url) })}
        />
      </Grilla>

      <fieldset className="min-w-0">
        <legend className={claseEtiqueta}>Opciones del desplegable ({valor.hijos.length})</legend>
        <ol className="space-y-2">
          {valor.hijos.map((hijo, indice) => (
            <li key={hijos.claves[indice]} className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <CampoTexto
                  etiqueta="Texto"
                  valor={hijo.texto}
                  onChange={(texto) => hijos.cambiar(indice, { ...hijo, texto })}
                />
                <CampoTexto
                  etiqueta="URL"
                  placeholder="/nosotros/nuestra-empresa"
                  valor={hijo.url}
                  onChange={(url) => hijos.cambiar(indice, { ...hijo, url })}
                />
              </div>
              <div className="pt-6">
                <AccionesOrden
                  indice={indice}
                  total={valor.hijos.length}
                  onMover={(d) => hijos.mover(indice, d)}
                  onQuitar={() => hijos.quitar(indice)}
                />
              </div>
            </li>
          ))}
        </ol>
        <Boton tamano="sm" className="mt-2" onClick={() => hijos.agregar({ texto: "", url: "" })}>
          <Plus className="size-3.5" /> Agregar opción
        </Boton>
      </fieldset>
    </div>
  );
}

/** Acceso genérico al editor de un tipo (TypeScript no puede correlacionar la unión por sí solo). */
export function editorDe(tipo: TipoBloque) {
  return editores[tipo] as unknown as DefinicionEditor<TipoBloque>;
}
