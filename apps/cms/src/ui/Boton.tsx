import type { ButtonHTMLAttributes } from "react";

const variantes = {
  primario: "bg-navy-900 text-white hover:bg-navy-800 disabled:bg-navy-900/40",
  secundario:
    "border border-linea bg-white text-navy-900 hover:border-primary-600 hover:text-primary-700 disabled:text-body-soft",
  peligro: "border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:text-red-300",
  fantasma: "text-body hover:bg-navy-900/5 hover:text-navy-900 disabled:text-body-soft/50",
};

const tamanos = {
  md: "h-9 px-4 text-xs",
  sm: "h-7 px-2.5 text-[11px]",
  icono: "h-7 w-7 justify-center",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof variantes;
  tamano?: keyof typeof tamanos;
};

export function Boton({ variante = "secundario", tamano = "md", className = "", ...props }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed ${variantes[variante]} ${tamanos[tamano]} ${className}`}
      {...props}
    />
  );
}
