import { v, type Infer } from "convex/values";

/* =========================================================
   TIPOS DE BLOQUE
   Vocabulario común de contenido. Cada bloque guarda campos
   atómicos (1FN); `tipo` es el discriminante de la unión.
   Agregar un tipo = sumar un miembro aquí y su validación en
   servicios/contenido (lo existente no se toca).
========================================================= */

const id = v.id("imagenes");

export const contenidoBloque = v.union(
  v.object({ tipo: v.literal("texto"), texto: v.string() }),
  // Valor elegido de una lista cerrada; las opciones válidas las fija el registro.
  v.object({ tipo: v.literal("opcion"), valor: v.string() }),
  v.object({
    tipo: v.literal("encabezado"),
    etiqueta: v.optional(v.string()),
    titulo: v.string(),
    destacado: v.optional(v.string()), // segunda línea del título, en color de acento
    descripcion: v.optional(v.string()),
  }),
  v.object({ tipo: v.literal("imagen"), imagenId: id }),
  v.object({ tipo: v.literal("enlace"), texto: v.string(), url: v.string() }),
  v.object({
    tipo: v.literal("dato"),
    valor: v.string(),
    etiqueta: v.string(),
    imagenId: v.optional(id),
  }),
  v.object({
    tipo: v.literal("hito"),
    anio: v.number(),
    lugar: v.string(),
    titulo: v.string(),
    texto: v.string(),
    imagenId: v.optional(id),
  }),
  v.object({
    tipo: v.literal("tarjeta"),
    titulo: v.string(),
    texto: v.optional(v.string()),
    imagenId: v.optional(id),
    url: v.optional(v.string()),
  }),
  /* Elemento del menú principal: con `hijos` es un desplegable; sin ellos,
     un enlace a `url`. Los hijos van dentro del elemento (desnormalización
     explícita): son pocos, solo existen con su padre y se leen y guardan
     siempre juntos. */
  v.object({
    tipo: v.literal("menu"),
    texto: v.string(),
    url: v.optional(v.string()),
    hijos: v.array(v.object({ texto: v.string(), url: v.string() })),
  }),
);

export type ContenidoBloque = Infer<typeof contenidoBloque>;
export type TipoBloque = ContenidoBloque["tipo"];
export type BloqueDe<T extends TipoBloque> = Extract<ContenidoBloque, { tipo: T }>;
