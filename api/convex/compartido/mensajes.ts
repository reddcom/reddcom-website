/* Motivos del formulario de contacto: los usan el sitio (opciones del
   formulario), Convex (validación) y el CMS (etiquetas en la bandeja). */
export const motivosMensaje = {
  cotizacion: "Cotización de proyecto",
  soporte: "Soporte o mantenimiento",
  alianza: "Alianzas y proveedores",
  otro: "Otro",
} as const;

export type MotivoMensaje = keyof typeof motivosMensaje;
