import type { ImageMetadata } from "astro";
import type { TipoHero } from "../../../api/convex/compartido/registro";

/* =========================================================
   DATOS DEL HERO
   Misma forma que la sección `hero` del registro del CMS,
   para que conectar Convex solo cambie de dónde salen.
========================================================= */

export type { TipoHero };

export interface Encabezado {
  etiqueta?: string;
  titulo: string;
  destacado?: string;
  descripcion?: string;
}

export interface Enlace {
  texto: string;
  url: string;
}

export interface Dato {
  valor: string;
  etiqueta: string;
}

// Local (import de src/assets) o remota (URL de Convex File Storage).
export interface Imagen {
  src: ImageMetadata | string;
  alt: string;
}

export interface Diapositiva {
  titulo: string;
  texto?: string;
  imagen: Imagen;
  url?: string;
}

export interface DatosHero {
  tipo: TipoHero;
  encabezado: Encabezado;
  imagen?: Imagen;
  boton?: Enlace;
  datos?: Dato[];
  diapositivas?: Diapositiva[];
  franja?: string[];
}
