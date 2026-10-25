/* Servicio al que pertenece un proyecto: lo usan el sitio (etiquetas
   y filtros), Convex (validación) y el CMS (opciones del formulario). */
export const serviciosProyecto = {
  fibra: "Fibra óptica",
  hfc: "Redes HFC",
  rf: "Proyectos RF",
  energia: "Energía solar",
  software: "Software",
} as const;

export type ServicioProyecto = keyof typeof serviciosProyecto;
