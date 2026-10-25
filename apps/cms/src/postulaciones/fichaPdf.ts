import type { FunctionReturnType } from "convex/server";
import { jsPDF } from "jspdf";
import type { api } from "@reddcom/convex/api";
import { aSlug } from "../lib/formato";

export type Postulacion = FunctionReturnType<typeof api.postulaciones.listar>[number];

const NAVY: [number, number, number] = [16, 47, 77];
const GRIS: [number, number, number] = [82, 101, 119];
const MARGEN = 56;

/**
 * Ficha de la postulación en PDF (jsPDF), para imprimirla o archivarla junto
 * al CV. Se genera en el navegador con los datos guardados: no se almacena.
 */
export function descargarFicha(postulacion: Postulacion) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ancho = doc.internal.pageSize.getWidth() - MARGEN * 2;
  const fecha = new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short" }).format(postulacion.fecha);

  // Encabezado
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(10).text("REDDCOM · POSTULACIÓN", MARGEN, 40);
  doc.setFontSize(20).text(postulacion.nombre, MARGEN, 68);

  let y = 136;
  const alto = doc.internal.pageSize.getHeight();
  const fila = (etiqueta: string, valor: string) => {
    doc.setFont("helvetica", "normal").setFontSize(12);
    const lineas = doc.splitTextToSize(valor, ancho) as string[];
    // Un mensaje largo puede no caber: pasa a la página siguiente.
    if (y + 16 + lineas.length * 15 > alto - MARGEN) {
      doc.addPage();
      y = MARGEN;
    }
    doc.setFontSize(9).setTextColor(...GRIS).text(etiqueta.toUpperCase(), MARGEN, y);
    doc.setFontSize(12).setTextColor(...NAVY).text(lineas, MARGEN, y + 16);
    y += 16 + lineas.length * 15 + 14;
  };

  fila("Vacante", postulacion.vacante ? `${postulacion.vacante.titulo} · ${postulacion.vacante.ubicacion}` : "Vacante eliminada");
  fila("Recibida", fecha);
  fila("Correo", postulacion.correo);
  fila("Teléfono", postulacion.telefono);
  if (postulacion.enlace) fila("LinkedIn o portafolio", postulacion.enlace);
  if (postulacion.mensaje) fila("Mensaje", postulacion.mensaje);
  fila("CV", "Adjunto por separado (PDF enviado por la persona).");

  doc.save(`postulacion-${aSlug(postulacion.nombre)}.pdf`);
}
