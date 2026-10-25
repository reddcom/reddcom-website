import { createContext, useContext, useEffect } from "react";

export type DestinoVistaPrevia = { ruta: string; ancla?: string };

/** Campo a señalar en la vista previa; `ancla` es la sección, por si el campo no está marcado. */
export type CampoEnPagina = { seccion: string; campo: string; ancla: string };

type ContextoVistaPrevia = {
  mostrar: (destino: DestinoVistaPrevia | null) => void;
  recargar: () => void;
  resaltar: (campo: CampoEnPagina) => void;
  resaltarAlEscribir: boolean;
};

export const VistaPreviaContexto = createContext<ContextoVistaPrevia | null>(null);

function useContexto() {
  const contexto = useContext(VistaPreviaContexto);
  if (!contexto) throw new Error("useVistaPrevia debe usarse dentro de <Shell>.");
  return contexto;
}

/**
 * Indica qué ruta del sitio muestra el panel de vista previa mientras la
 * vista está abierta, y devuelve `recargar` para llamarlo tras guardar.
 */
export function useVistaPrevia(destino: DestinoVistaPrevia | null) {
  const { mostrar, recargar } = useContexto();
  const ruta = destino?.ruta;
  const ancla = destino?.ancla;

  useEffect(() => {
    mostrar(ruta ? { ruta, ancla } : null);
  }, [mostrar, ruta, ancla]);

  useEffect(() => () => mostrar(null), [mostrar]);

  return { recargar };
}

/** Solo recargar, para componentes internos que no eligen la ruta. */
export function useRecargarVistaPrevia() {
  return useContexto().recargar;
}

/** Señalar en la vista previa dónde se pinta un campo. */
export function useResaltarCampo() {
  const { resaltar, resaltarAlEscribir } = useContexto();
  return { resaltar, resaltarAlEscribir };
}
