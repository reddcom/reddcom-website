import { z } from "zod";

/* =========================================================
   POSTULACIONES A VACANTES
   Reglas compartidas: el formulario del sitio las usa para
   validar en tiempo real y Convex para validar en el servidor
   (nunca se confía solo en el navegador).
========================================================= */

export const TAMANO_MAXIMO_CV = 5 * 1024 * 1024; // 5 MB
export const TIPO_CV = "application/pdf";
// Todo PDF empieza con estos bytes: "%PDF-". El tipo MIME lo declara el
// navegador y se puede falsear; la firma se comprueba leyendo el archivo.
export const FIRMA_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];

const digitos = (valor: string) => valor.replace(/\D/g, "").length;
// Campo opcional del formulario: el texto vacío cuenta como "sin dato".
const opcional = <T extends z.ZodType>(esquema: T) =>
  z.union([z.literal("").transform(() => undefined), esquema]).optional();

export const esquemaPostulacion = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "Escribe tu nombre completo.")
    .max(100, "El nombre admite hasta 100 caracteres.")
    .regex(/^[\p{L}\s'.-]+$/u, "Usa solo letras y espacios."),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "El correo admite hasta 120 caracteres.")
    .pipe(z.email("Escribe un correo válido, como nombre@dominio.com.")),
  telefono: z
    .string()
    .trim()
    .min(1, "Escribe tu teléfono.")
    .regex(/^\+?[\d\s()-]+$/, "Usa solo números; puedes empezar con +.")
    .refine((valor) => digitos(valor) >= 8 && digitos(valor) <= 15, "El teléfono debe tener entre 8 y 15 dígitos."),
  enlace: opcional(
    z
      .string()
      .trim()
      .max(200, "El enlace admite hasta 200 caracteres.")
      .pipe(z.url({ protocol: /^https?$/, error: "Pega un enlace completo, que empiece con https://." })),
  ),
  mensaje: opcional(z.string().trim().max(1000, "El mensaje admite hasta 1000 caracteres.")),
  consentimiento: z.literal(true, { error: "Necesitamos tu autorización para revisar tu postulación." }),
});

export type DatosPostulacion = z.infer<typeof esquemaPostulacion>;
export type CampoPostulacion = keyof DatosPostulacion;

/** Problema del archivo de CV por tipo y tamaño, o `null` si es válido. */
export function problemaConCv(tipo: string, tamano: number): string | null {
  if (tipo !== TIPO_CV) return "El CV debe ser un archivo PDF.";
  if (tamano === 0) return "El archivo está vacío.";
  if (tamano > TAMANO_MAXIMO_CV) return "El CV pesa más de 5 MB. Reduce su tamaño y vuelve a intentarlo.";
  return null;
}

/** ¿Los primeros bytes del archivo son la firma de un PDF? */
export const tieneFirmaPdf = (inicio: Uint8Array) => FIRMA_PDF.every((byte, i) => inicio[i] === byte);
