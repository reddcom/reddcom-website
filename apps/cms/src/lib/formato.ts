import { etiquetasJornada } from "@reddcom/convex/vacantes";

export type { Jornada } from "@reddcom/convex/vacantes";

export const JORNADAS = etiquetasJornada;

/** "Técnico FO San Pedro Sula" → "tecnico-fo-san-pedro-sula" (mismo formato que valida el servidor). */
export function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* Fechas como día calendario: se guardan al mediodía UTC para que
   ninguna zona horaria las corra al día anterior o siguiente. */

export function fechaAEpoch(fecha: string): number {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return Date.UTC(anio, mes - 1, dia, 12);
}

export function epochAFecha(epoch: number): string {
  return new Date(epoch).toISOString().slice(0, 10);
}

export function fechaLegible(epoch: number): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeZone: "UTC" }).format(epoch);
}

export function tamanoLegible(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
