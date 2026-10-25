import { defineSchema, defineTable } from "convex/server";
import { v, type Infer } from "convex/values";
import { contenidoBloque } from "../compartido/bloques";
import { motivosMensaje } from "../compartido/mensajes";
import { serviciosProyecto } from "../compartido/proyectos";
import { roles } from "../compartido/roles";
import { etiquetasJornada } from "../compartido/vacantes";

/* =========================================================
   VALORES DE DOMINIO
   Conjuntos pequeños y estables: se validan como literales
   en lugar de una tabla catálogo.
========================================================= */

// Motivo elegido en el formulario de contacto.
export const motivoMensaje = v.union(
  v.literal("cotizacion"),
  v.literal("soporte"),
  v.literal("alianza"),
  v.literal("otro"),
);

// Las etiquetas compartidas deben cubrir exactamente los mismos motivos.
motivosMensaje satisfies Record<Infer<typeof motivoMensaje>, string>;

const jornada = v.union(
  v.literal("tiempo_completo"),
  v.literal("medio_tiempo"),
  v.literal("por_proyecto"),
);

etiquetasJornada satisfies Record<Infer<typeof jornada>, string>;

export const servicioProyecto = v.union(
  v.literal("fibra"),
  v.literal("hfc"),
  v.literal("rf"),
  v.literal("energia"),
  v.literal("software"),
);

serviciosProyecto satisfies Record<Infer<typeof servicioProyecto>, string>;

export const rol = v.union(v.literal("superAdmin"));

roles satisfies Record<Infer<typeof rol>, unknown>;

export default defineSchema({
  /* =========================================================
     CONTENIDO DEL SITIO
     Páginas y secciones viven en compartido/registro (código);
     aquí solo se guardan los bloques de cada campo.
  ========================================================= */

  // Metadatos propios de la imagen. Tipo y tamaño ya los guarda
  // Convex en _storage: no se copian (3FN).
  imagenes: defineTable({
    storageId: v.id("_storage"),
    nombre: v.string(),
    alt: v.string(),
  }).index("by_storage", ["storageId"]),

  // Un bloque por fila (1FN). La llave natural es
  // (pagina, seccion, campo, orden).
  // Desnormalización consciente: `contenido.tipo` se deduce del
  // registro, pero se guarda porque Convex lo necesita para validar
  // la forma de la unión. El servicio verifica que coincidan.
  bloques: defineTable({
    pagina: v.string(),
    seccion: v.string(),
    campo: v.string(),
    orden: v.number(),
    contenido: contenidoBloque,
  })
    .index("by_ubicacion", ["pagina", "seccion", "campo", "orden"])
    .index("by_imagen", ["contenido.imagenId"]),

  /* =========================================================
     UBICACIÓN: país → departamento → ciudad → detalle
     Cada nivel guarda solo la FK a su padre inmediato (3FN):
     el país de una ciudad se deriva por su departamento.
  ========================================================= */

  paises: defineTable({
    nombre: v.string(),
    codigoIso: v.string(), // ISO 3166-1 alfa-2, ej. "HN"
  })
    .index("by_nombre", ["nombre"])
    .index("by_codigoIso", ["codigoIso"]),

  departamentos: defineTable({
    paisId: v.id("paises"),
    nombre: v.string(),
  }).index("by_pais_nombre", ["paisId", "nombre"]),

  ciudades: defineTable({
    departamentoId: v.id("departamentos"),
    nombre: v.string(),
  }).index("by_departamento_nombre", ["departamentoId", "nombre"]),

  // 1:1 con ciudades; datos opcionales que no se leen en listados.
  ciudadDetalles: defineTable({
    ciudadId: v.id("ciudades"),
    codigoPostal: v.optional(v.string()),
    latitud: v.optional(v.number()),
    longitud: v.optional(v.number()),
  }).index("by_ciudad", ["ciudadId"]),

  /* =========================================================
     ORGANIZACIÓN: área → puesto → responsabilidades
  ========================================================= */

  areas: defineTable({
    nombre: v.string(),
  }).index("by_nombre", ["nombre"]),

  puestos: defineTable({
    areaId: v.id("areas"),
    nombre: v.string(),
  }).index("by_area_nombre", ["areaId", "nombre"]),

  // 1:N; una fila por responsabilidad (1FN: nada de listas en una celda).
  puestoDetalles: defineTable({
    puestoId: v.id("puestos"),
    responsabilidad: v.string(),
    orden: v.number(),
  }).index("by_puesto_orden", ["puestoId", "orden"]),

  /* =========================================================
     VACANTES
     El título y el área salen del puesto; el departamento y
     el país, de la ciudad. No se copian aquí (3FN).
  ========================================================= */

  vacantes: defineTable({
    puestoId: v.id("puestos"),
    ciudadId: v.id("ciudades"),
    slug: v.string(),
    jornada,
    resumen: v.string(),
    fechaPublicacion: v.number(), // epoch en ms
    activa: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_activa_fecha", ["activa", "fechaPublicacion"])
    .index("by_puesto", ["puestoId"])
    .index("by_ciudad", ["ciudadId"]),

  // 1:N; requisitos propios de esta vacante, una fila por requisito.
  vacanteDetalles: defineTable({
    vacanteId: v.id("vacantes"),
    requisito: v.string(),
    orden: v.number(),
  }).index("by_vacante_orden", ["vacanteId", "orden"]),

  /* =========================================================
     POSTULACIONES
     Llegan desde el formulario de cada vacante y se leen en el
     CMS. El puesto y la ciudad salen de la vacante (3FN); el CV
     es un PDF en _storage, que ya guarda su tipo y tamaño.
  ========================================================= */

  postulaciones: defineTable({
    vacanteId: v.id("vacantes"),
    nombre: v.string(),
    correo: v.string(),
    telefono: v.string(),
    enlace: v.optional(v.string()), // LinkedIn o portafolio
    mensaje: v.optional(v.string()),
    cvId: v.id("_storage"),
    fecha: v.number(), // epoch en ms; el consentimiento se exige al enviar
  })
    .index("by_fecha", ["fecha"])
    .index("by_vacante_fecha", ["vacanteId", "fecha"])
    .index("by_correo_vacante", ["correo", "vacanteId"])
    .index("by_cv", ["cvId"]),

  /* =========================================================
     MENSAJES DE CONTACTO
     Llegan desde el formulario público del sitio y se leen en
     la bandeja del CMS. País y motivo son valores cerrados.
  ========================================================= */

  mensajes: defineTable({
    nombre: v.string(),
    correo: v.string(),
    telefono: v.optional(v.string()),
    empresa: v.optional(v.string()),
    pais: v.optional(v.string()),
    motivo: motivoMensaje,
    mensaje: v.string(),
    fecha: v.number(), // epoch en ms
    leido: v.boolean(),
  })
    .index("by_leido_fecha", ["leido", "fecha"])
    .index("by_fecha", ["fecha"])
    .index("by_correo_fecha", ["correo", "fecha"]),

  /* =========================================================
     PROYECTOS
     El país sale de la ciudad (3FN). Cifras, alcance y galería
     son listas ordenadas: una fila por elemento (1FN).
  ========================================================= */

  proyectos: defineTable({
    slug: v.string(),
    titulo: v.string(),
    resumen: v.string(),
    descripcion: v.string(), // párrafos separados por una línea en blanco
    ciudadId: v.id("ciudades"),
    anio: v.number(),
    servicio: servicioProyecto,
    imagenId: v.id("imagenes"),
    activo: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_activo_anio", ["activo", "anio"])
    .index("by_ciudad", ["ciudadId"])
    .index("by_imagen", ["imagenId"]),

  proyectoCifras: defineTable({
    proyectoId: v.id("proyectos"),
    valor: v.string(),
    etiqueta: v.string(),
    orden: v.number(),
  }).index("by_proyecto_orden", ["proyectoId", "orden"]),

  proyectoAlcance: defineTable({
    proyectoId: v.id("proyectos"),
    texto: v.string(),
    orden: v.number(),
  }).index("by_proyecto_orden", ["proyectoId", "orden"]),

  proyectoGaleria: defineTable({
    proyectoId: v.id("proyectos"),
    imagenId: v.id("imagenes"),
    orden: v.number(),
  })
    .index("by_proyecto_orden", ["proyectoId", "orden"])
    .index("by_imagen", ["imagenId"]),

  /* =========================================================
     USUARIOS DEL CMS
     Quién puede entrar y con qué rol. La cuenta (contraseña,
     sesión) la guarda Better Auth; aquí solo el acceso, unido
     por el correo, que es la llave natural.
  ========================================================= */

  usuarios: defineTable({
    correo: v.string(), // en minúsculas
    rol,
    fechaAlta: v.number(), // epoch en ms
    agregadoPor: v.optional(v.string()), // correo de quien lo dio de alta
  })
    .index("by_correo", ["correo"])
    .index("by_rol", ["rol"]),
});
