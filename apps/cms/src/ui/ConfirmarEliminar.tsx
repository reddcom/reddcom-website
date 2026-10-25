import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Boton } from "./Boton";

/**
 * Eliminar en dos pasos, sin ventanas del navegador: el primer clic
 * pide confirmación en el mismo lugar y el segundo ejecuta.
 */
export function ConfirmarEliminar({
  onConfirmar,
  etiqueta = "Eliminar",
  soloIcono = false,
  deshabilitado = false,
}: {
  onConfirmar: () => void;
  etiqueta?: string;
  soloIcono?: boolean;
  deshabilitado?: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (confirmando) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-[11px] text-body">¿Seguro?</span>
        <Boton
          variante="peligro"
          tamano="sm"
          onClick={() => {
            setConfirmando(false);
            onConfirmar();
          }}
        >
          Sí, eliminar
        </Boton>
        <Boton variante="fantasma" tamano="sm" onClick={() => setConfirmando(false)}>
          No
        </Boton>
      </span>
    );
  }

  return soloIcono ? (
    <Boton
      variante="fantasma"
      tamano="icono"
      aria-label={etiqueta}
      title={etiqueta}
      disabled={deshabilitado}
      onClick={() => setConfirmando(true)}
    >
      <Trash2 className="size-3.5" />
    </Boton>
  ) : (
    <Boton variante="peligro" disabled={deshabilitado} onClick={() => setConfirmando(true)}>
      <Trash2 className="size-3.5" /> {etiqueta}
    </Boton>
  );
}
