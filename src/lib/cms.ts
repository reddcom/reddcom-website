import { ConvexHttpClient } from "convex/browser";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../api/convex/functions/_generated/api.js";
import type { BloqueDe, TipoBloque } from "../../api/convex/compartido/bloques";
import { tiposHero, type ClavePagina, type TipoHero } from "../../api/convex/compartido/registro";
import type { Dato, DatosHero, Diapositiva, Encabezado, Enlace, Imagen } from "../components/hero/tipos";

/* =========================================================
   CONTENIDO DEL CMS
   El sitio es SSR: lee Convex en cada petición. Cada lector
   devuelve `undefined` si el campo está vacío, para que la
   página use su respaldo (los datos de prueba) con `??`.
========================================================= */

const url = import.meta.env.PUBLIC_CONVEX_URL;
export const convex = url ? new ConvexHttpClient(url) : undefined;

type ContenidoPagina = FunctionReturnType<typeof api.contenido.obtenerPagina>;
type BloqueResuelto = ContenidoPagina[string][string][number];
type Resuelto<T extends TipoBloque> = BloqueDe<T> & { imagen?: { url: string | null; alt: string } | null };

/**
 * Consulta pública a Convex. Si no hay URL o la red falla, avisa en consola y
 * devuelve `respaldo`: un CMS caído no debe tumbar el sitio.
 */
export async function consultar<T>(nombre: string, consulta: (cliente: ConvexHttpClient) => Promise<T>, respaldo: T) {
  if (!convex) {
    console.warn(`[cms] Falta PUBLIC_CONVEX_URL; ${nombre} usa datos de prueba.`);
    return respaldo;
  }
  try {
    return await consulta(convex);
  } catch (error) {
    console.warn(`[cms] No se pudo leer ${nombre}; se usan datos de prueba.`, error);
    return respaldo;
  }
}

/**
 * Contenido de una página, leído en cada petición (el sitio es SSR). No se
 * guarda en memoria: en el servidor este módulo sobrevive entre visitas y
 * mostraría contenido viejo. La caché corta la pone el CDN (middleware.ts).
 */
export function obtenerPagina(pagina: ClavePagina) {
  return consultar(`la página ${pagina}`, (c) => c.query(api.contenido.obtenerPagina, { pagina }), {});
}

/* ---------- Conversión de bloques a los tipos del sitio ---------- */

const aImagen = (bloque: { imagen?: { url: string | null; alt: string } | null }): Imagen | undefined =>
  bloque.imagen?.url ? { src: bloque.imagen.url, alt: bloque.imagen.alt } : undefined;

export interface Tarjeta {
  titulo: string;
  texto?: string;
  url?: string;
  imagen?: Imagen;
}

export interface ElementoMenu {
  texto: string;
  url?: string;
  hijos: Enlace[];
}

export interface Hito {
  anio: number;
  lugar: string;
  titulo: string;
  texto: string;
  imagen?: Imagen;
}

const conversores = {
  texto: (b: Resuelto<"texto">) => b.texto,
  opcion: (b: Resuelto<"opcion">) => b.valor,
  encabezado: ({ tipo: _, ...resto }: Resuelto<"encabezado">): Encabezado => resto,
  imagen: (b: Resuelto<"imagen">) => aImagen(b),
  enlace: (b: Resuelto<"enlace">): Enlace => ({ texto: b.texto, url: b.url }),
  dato: (b: Resuelto<"dato">): Dato => ({ valor: b.valor, etiqueta: b.etiqueta }),
  hito: (b: Resuelto<"hito">): Hito => ({ anio: b.anio, lugar: b.lugar, titulo: b.titulo, texto: b.texto, imagen: aImagen(b) }),
  tarjeta: (b: Resuelto<"tarjeta">): Tarjeta => ({ titulo: b.titulo, texto: b.texto, url: b.url, imagen: aImagen(b) }),
  menu: (b: Resuelto<"menu">): ElementoMenu => ({ texto: b.texto, url: b.url, hijos: b.hijos }),
};

type Convertido<T extends TipoBloque> = NonNullable<ReturnType<(typeof conversores)[T]>>;

/** Lectores tipados de los campos de una sección. */
export function seccion(contenido: ContenidoPagina, nombre: string) {
  const campos = contenido[nombre] ?? {};

  const bloques = <T extends TipoBloque>(campo: string, tipo: T) =>
    (campos[campo] ?? []).filter((b: BloqueResuelto) => b.tipo === tipo) as Resuelto<T>[];

  const convertir = <T extends TipoBloque>(tipo: T, bloque: Resuelto<T>) =>
    (conversores[tipo] as (b: Resuelto<T>) => Convertido<T> | undefined)(bloque);

  return {
    /** Primer bloque del campo, convertido; `undefined` si está vacío. */
    uno<T extends TipoBloque>(campo: string, tipo: T): Convertido<T> | undefined {
      const [primero] = bloques(campo, tipo);
      return primero && convertir(tipo, primero);
    },
    /** Todos los bloques del campo; `undefined` si no hay ninguno. */
    lista<T extends TipoBloque>(campo: string, tipo: T): Convertido<T>[] | undefined {
      const lista = bloques(campo, tipo)
        .map((bloque) => convertir(tipo, bloque))
        .filter((valor): valor is Convertido<T> => valor !== undefined);
      return lista.length > 0 ? lista : undefined;
    },
  };
}

/* ---------- Hero común (sección `hero` del registro) ---------- */

const esTipoHero = (valor: string | undefined): valor is TipoHero =>
  valor !== undefined && Object.hasOwn(tiposHero, valor);

/** Hero de la página: cada campo del CMS reemplaza al de `respaldo` solo si tiene contenido. */
export function heroDe(contenido: ContenidoPagina, respaldo: DatosHero): DatosHero {
  const hero = seccion(contenido, "hero");
  const tipo = hero.uno("tipo", "opcion");

  const diapositivas = hero
    .lista("diapositivas", "tarjeta")
    ?.filter((tarjeta): tarjeta is Tarjeta & { imagen: Imagen } => tarjeta.imagen !== undefined)
    .map((tarjeta): Diapositiva => tarjeta);

  return {
    tipo: esTipoHero(tipo) ? tipo : respaldo.tipo,
    encabezado: hero.uno("encabezado", "encabezado") ?? respaldo.encabezado,
    imagen: hero.uno("imagen", "imagen") ?? respaldo.imagen,
    boton: hero.uno("boton", "enlace") ?? respaldo.boton,
    datos: hero.lista("datos", "dato") ?? respaldo.datos,
    diapositivas: diapositivas?.length ? diapositivas : respaldo.diapositivas,
    franja: hero.lista("franja", "texto") ?? respaldo.franja,
  };
}

/* ---------- Cierre común (sección `cierre` del registro) ---------- */

export interface DatosCierre {
  titulo?: string;
  destacado?: string;
  texto?: string;
  boton?: Enlace;
  imagen?: Imagen;
}

/** Cierre de la página con respaldo por campo. */
export function cierreDe(contenido: ContenidoPagina, respaldo: DatosCierre = {}, nombre = "cierre"): DatosCierre {
  const cierre = seccion(contenido, nombre);
  const encabezado = cierre.uno("encabezado", "encabezado");
  // El encabezado del CMS es un bloque completo: no se mezcla con el respaldo.
  const textos = encabezado
    ? { titulo: encabezado.titulo, destacado: encabezado.destacado, texto: encabezado.descripcion }
    : { titulo: respaldo.titulo, destacado: respaldo.destacado, texto: respaldo.texto };
  return {
    ...textos,
    boton: cierre.uno("boton", "enlace") ?? respaldo.boton,
    imagen: cierre.uno("imagen", "imagen") ?? respaldo.imagen,
  };
}
