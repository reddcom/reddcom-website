import type { ReactNode } from "react";

/* Clases compartidas por todos los controles de formulario. */
export const claseEtiqueta =
  "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-body";
export const claseEntrada =
  "w-full rounded-sm border border-navy-900/25 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-body-soft/60 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 disabled:bg-surface disabled:text-body-soft";

export function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={claseEtiqueta}>{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-body-soft">{ayuda}</span>}
    </label>
  );
}

export function CampoTexto({
  etiqueta,
  valor,
  onChange,
  multilinea = false,
  ayuda,
  placeholder,
  tipo = "text",
}: {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  multilinea?: boolean;
  ayuda?: string;
  placeholder?: string;
  tipo?: "text" | "email" | "password" | "url" | "date";
}) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda}>
      {multilinea ? (
        <textarea
          className={`${claseEntrada} min-h-24 resize-y leading-6`}
          value={valor}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={claseEntrada}
          type={tipo}
          value={valor}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Campo>
  );
}

export function CampoSelect<T extends string>({
  etiqueta,
  valor,
  onChange,
  opciones,
  vacio = "Selecciona…",
  deshabilitado = false,
}: {
  etiqueta: string;
  valor: T | "";
  onChange: (valor: T) => void;
  opciones: { valor: T; etiqueta: string }[] | undefined;
  vacio?: string;
  deshabilitado?: boolean;
}) {
  return (
    <Campo etiqueta={etiqueta}>
      <select
        className={claseEntrada}
        value={valor}
        disabled={deshabilitado || opciones === undefined}
        onChange={(e) => onChange(e.target.value as T)}
      >
        <option value="" disabled>
          {opciones === undefined ? "Cargando…" : vacio}
        </option>
        {opciones?.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </Campo>
  );
}
