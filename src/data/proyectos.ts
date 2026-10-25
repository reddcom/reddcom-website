import type { FunctionReturnType } from "convex/server";
import { api } from "../../api/convex/functions/_generated/api.js";
import { serviciosProyecto } from "../../api/convex/compartido/proyectos";
import type { Imagen } from "../components/hero/tipos";
import { consultar } from "../lib/cms";

/* =========================================================
   PROYECTOS
   Salen del módulo Proyectos del CMS (tabla `proyectos` de
   Convex). Se adaptan aquí a la forma que usan las páginas.
========================================================= */

type ResumenConvex = FunctionReturnType<typeof api.proyectos.listarActivos>[number];
type DetalleConvex = NonNullable<FunctionReturnType<typeof api.proyectos.obtenerPorSlug>>;

export interface Proyecto {
  slug: string;
  titulo: string;
  resumen: string;
  ciudad: string;
  pais: string;
  anio: number;
  servicio: string;
  imagen?: Imagen;
}

export interface DetalleProyecto extends Proyecto {
  descripcion: string[];
  cifras: { valor: string; etiqueta: string }[];
  alcance: string[];
  galeria: Imagen[];
}

const aImagen = (imagen: { url: string | null; alt: string } | null): Imagen | undefined =>
  imagen?.url ? { src: imagen.url, alt: imagen.alt } : undefined;

const aProyecto = (proyecto: ResumenConvex): Proyecto => ({
  slug: proyecto.slug,
  titulo: proyecto.titulo,
  resumen: proyecto.resumen,
  ciudad: proyecto.ciudad,
  pais: proyecto.pais,
  anio: proyecto.anio,
  servicio: serviciosProyecto[proyecto.servicio],
  imagen: aImagen(proyecto.imagen),
});

const aDetalle = (proyecto: DetalleConvex): DetalleProyecto => ({
  ...aProyecto(proyecto),
  // En el CMS los párrafos se separan con una línea en blanco.
  descripcion: proyecto.descripcion.split(/\n\s*\n/).map((parrafo) => parrafo.trim()).filter(Boolean),
  cifras: proyecto.cifras,
  alcance: proyecto.alcance,
  galeria: proyecto.galeria.map(aImagen).filter((imagen): imagen is Imagen => imagen !== undefined),
});

/** Proyectos activos, del más reciente al más antiguo. */
export async function proyectosActivos(): Promise<Proyecto[]> {
  const lista = await consultar("los proyectos", (convex) => convex.query(api.proyectos.listarActivos, {}), []);
  return lista.map(aProyecto);
}

export async function proyectosDe(pais: string) {
  return (await proyectosActivos()).filter((proyecto) => proyecto.pais === pais);
}

export async function detalleProyecto(slug: string): Promise<DetalleProyecto | null> {
  const proyecto = await consultar(`el proyecto ${slug}`, (convex) => convex.query(api.proyectos.obtenerPorSlug, { slug }), null);
  return proyecto && aDetalle(proyecto);
}
