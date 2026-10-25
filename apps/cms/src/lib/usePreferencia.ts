import { useState } from "react";

/* Preferencia de interfaz por navegador (sí/no). Si el almacenamiento
   falla (modo privado, bloqueado), se usa el valor por defecto y el
   cambio simplemente no persiste. */

function leer(clave: string, porDefecto: boolean): boolean {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado === null ? porDefecto : guardado === "true";
  } catch {
    return porDefecto;
  }
}

export function usePreferencia(clave: string, porDefecto: boolean) {
  const [valor, setValor] = useState(() => leer(clave, porDefecto));

  function cambiar(nuevo: boolean) {
    setValor(nuevo);
    try {
      localStorage.setItem(clave, String(nuevo));
    } catch {
      // Sin almacenamiento la preferencia dura solo esta sesión.
    }
  }

  return [valor, cambiar] as const;
}
