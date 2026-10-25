/* Etiquetas de las jornadas de una vacante: las usan el sitio y el CMS. */
export const etiquetasJornada = {
  tiempo_completo: "Tiempo completo",
  medio_tiempo: "Medio tiempo",
  por_proyecto: "Por proyecto",
} as const;

export type Jornada = keyof typeof etiquetasJornada;
