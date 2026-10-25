import { ChevronRight } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

const variantes = {
  // Sección de una página: tarjeta blanca con borde.
  seccion: {
    caja: "rounded-sm border border-linea bg-white",
    boton: "px-5 py-4 text-sm font-semibold",
    cuerpo: "border-t border-linea p-5",
    // Sección abierta: borde y encabezado navy para marcar dónde se trabaja.
    abierta: { caja: "border-navy-900", encabezado: "bg-navy-900 text-white", tenue: "text-white/70" },
  },
  // Elemento de una lista de bloques.
  item: {
    caja: "rounded-sm border border-linea bg-surface",
    boton: "px-3 py-2.5 text-[13px] font-medium",
    cuerpo: "border-t border-linea bg-white p-4",
    abierta: null,
  },
  // Campos poco usados dentro de un formulario.
  mas: {
    caja: "border-t border-dashed border-linea",
    boton: "py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700",
    cuerpo: "pb-2 pt-1",
    abierta: null,
  },
};

/**
 * Bloque que se abre y se cierra. El contenido cerrado queda montado pero
 * oculto (`hidden`), así no pierde lo que el usuario ya escribió.
 */
export function Desplegable({
  titulo,
  detalle,
  acciones,
  abierto: abiertoInicial = false,
  onAbrir,
  variante = "seccion",
  id,
  children,
}: {
  titulo: ReactNode;
  detalle?: ReactNode;
  acciones?: ReactNode;
  abierto?: boolean;
  onAbrir?: () => void;
  variante?: keyof typeof variantes;
  id?: string;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const idCuerpo = useId();
  const estilo = variantes[variante];
  const marca = abierto ? estilo.abierta : null;

  // Permite abrirlo desde fuera (p. ej. al elegir la sección en el sidebar).
  useEffect(() => {
    if (abiertoInicial) setAbierto(true);
  }, [abiertoInicial]);

  function alternar() {
    if (!abierto) onAbrir?.();
    setAbierto(!abierto);
  }

  return (
    <section id={id} className={`scroll-mt-44 ${estilo.caja} ${marca?.caja ?? ""}`}>
      <div className={`flex items-center gap-2 pr-3 transition-colors ${marca?.encabezado ?? ""}`}>
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={idCuerpo}
          onClick={alternar}
          className={`flex min-w-0 flex-1 items-center gap-2 text-left ${estilo.boton}`}
        >
          <ChevronRight
            aria-hidden
            className={`size-4 shrink-0 transition-transform ${marca?.tenue ?? "text-body-soft"} ${abierto ? "rotate-90" : ""}`}
          />
          <span className="truncate">{titulo}</span>
          {detalle && (
            <span className={`ml-auto shrink-0 text-[11px] font-normal ${marca?.tenue ?? "text-body-soft"}`}>{detalle}</span>
          )}
        </button>
        {acciones}
      </div>
      <div id={idCuerpo} hidden={!abierto} className={estilo.cuerpo}>
        {children}
      </div>
    </section>
  );
}
