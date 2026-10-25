import type { ReactNode } from "react";

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return <p className="py-10 text-center text-sm text-body-soft">{texto}</p>;
}

export function MensajeError({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
      {mensaje}
    </p>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-linea px-6 py-10 text-center">
      <p className="text-sm font-semibold">{titulo}</p>
      {children && <div className="mt-2 text-xs leading-5 text-body">{children}</div>}
    </div>
  );
}

/**
 * Cabecera de cada vista: ruta de migas, título y acciones. Queda fija
 * arriba al desplazarse para tener guardar y descartar siempre a mano;
 * los márgenes negativos cubren el relleno del contenedor de Shell.
 */
export function EncabezadoVista({
  grupo,
  titulo,
  detalle,
  acciones,
  error = null,
}: {
  grupo: string;
  titulo: string;
  detalle?: ReactNode;
  acciones?: ReactNode;
  error?: string | null;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 -mt-6 border-b border-linea bg-surface px-4 pb-5 pt-6 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {/* Si el grupo se llama igual que la vista (Inicio, Contacto…), basta el título. */}
          {grupo.toLowerCase() !== titulo.toLowerCase() && (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-700">{grupo}</p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          {detalle && <div className="mt-1 text-xs text-body">{detalle}</div>}
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
      {error && (
        <div className="mt-3">
          <MensajeError mensaje={error} />
        </div>
      )}
    </header>
  );
}
