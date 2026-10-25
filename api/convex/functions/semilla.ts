import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { contenidoBloque, type ContenidoBloque } from "../compartido/bloques";
import type { ServicioProyecto } from "../compartido/proyectos";
import { esImagenValida, MENSAJE_IMAGEN_INVALIDA, TIPO_IMAGEN } from "../compartido/imagenes";
import { invalido } from "./lib/errores";
import { existente } from "./lib/validacion";
import { archivos, bloques, imagenes } from "./repositorios/contenido";
import { guardarPagina } from "./servicios/contenido";
import { registrarImagen as registrarImagenServicio } from "./servicios/imagenes";
import type { Jornada } from "../compartido/vacantes";

/* =========================================================
   SEMILLA DE DATOS DE PRUEBA
   Carga vacantes de ejemplo (con sus áreas, puestos y
   ubicaciones) para ver el flujo CMS → sitio en desarrollo.
   Reutiliza lo que ya exista por nombre y no duplica vacantes.

   npx convex run semilla:vacantesDePrueba
   npx convex run semilla:proyectosDePrueba
   npx convex run semilla:eliminarProyectos '{"slugs": ["..."]}'
========================================================= */

async function area(ctx: MutationCtx, nombre: string) {
  const existente = await ctx.db.query("areas").withIndex("by_nombre", (q) => q.eq("nombre", nombre)).unique();
  return existente?._id ?? (await ctx.db.insert("areas", { nombre }));
}

async function puesto(ctx: MutationCtx, areaId: Id<"areas">, nombre: string, responsabilidades: string[]) {
  const existente = await ctx.db
    .query("puestos")
    .withIndex("by_area_nombre", (q) => q.eq("areaId", areaId).eq("nombre", nombre))
    .unique();
  if (existente) return existente._id;

  const id = await ctx.db.insert("puestos", { areaId, nombre });
  for (const [indice, responsabilidad] of responsabilidades.entries()) {
    await ctx.db.insert("puestoDetalles", { puestoId: id, responsabilidad, orden: indice + 1 });
  }
  return id;
}

async function ciudad(ctx: MutationCtx, pais: [string, string], departamento: string, nombre: string) {
  const [nombrePais, codigoIso] = pais;
  const paisId =
    (await ctx.db.query("paises").withIndex("by_codigoIso", (q) => q.eq("codigoIso", codigoIso)).unique())?._id ??
    (await ctx.db.insert("paises", { nombre: nombrePais, codigoIso }));

  const departamentoId =
    (
      await ctx.db
        .query("departamentos")
        .withIndex("by_pais_nombre", (q) => q.eq("paisId", paisId).eq("nombre", departamento))
        .unique()
    )?._id ?? (await ctx.db.insert("departamentos", { paisId, nombre: departamento }));

  const existente = await ctx.db
    .query("ciudades")
    .withIndex("by_departamento_nombre", (q) => q.eq("departamentoId", departamentoId).eq("nombre", nombre))
    .unique();
  return existente?._id ?? (await ctx.db.insert("ciudades", { departamentoId, nombre }));
}

const HONDURAS: [string, string] = ["Honduras", "HN"];
const GUATEMALA: [string, string] = ["Guatemala", "GT"];
const EL_SALVADOR: [string, string] = ["El Salvador", "SV"];

export const vacantesDePrueba = internalMutation({
  args: {},
  handler: async (ctx) => {
    const operaciones = await area(ctx, "Operaciones");
    const ingenieria = await area(ctx, "Ingeniería");
    const administracion = await area(ctx, "Administración");

    const sanPedroSula = await ciudad(ctx, HONDURAS, "Cortés", "San Pedro Sula");
    const tegucigalpa = await ciudad(ctx, HONDURAS, "Francisco Morazán", "Tegucigalpa");
    const ciudadGuatemala = await ciudad(ctx, GUATEMALA, "Guatemala", "Ciudad de Guatemala");
    const sanSalvador = await ciudad(ctx, EL_SALVADOR, "San Salvador", "San Salvador");

    const vacantes: {
      slug: string;
      puestoId: Id<"puestos">;
      ciudadId: Id<"ciudades">;
      jornada: Jornada;
      resumen: string;
      fecha: string;
      requisitos: string[];
    }[] = [
      {
        slug: "tecnico-fo-san-pedro-sula",
        puestoId: await puesto(ctx, operaciones, "Técnico FO", [
          "Instalar y empalmar fibra óptica en campo.",
          "Medir enlaces con OTDR y documentar resultados.",
        ]),
        ciudadId: sanPedroSula,
        jornada: "tiempo_completo",
        resumen: "Instalación y mantenimiento de redes de fibra óptica.",
        fecha: "2026-09-19",
        requisitos: ["Experiencia en redes FO.", "Disponibilidad de horario.", "Trabajo en equipo."],
      },
      {
        slug: "tecnico-hfc-san-pedro-sula",
        puestoId: await puesto(ctx, operaciones, "Técnico HFC", [
          "Instalar acometidas y equipos de red HFC.",
          "Atender fallas y balancear niveles de señal.",
        ]),
        ciudadId: sanPedroSula,
        jornada: "tiempo_completo",
        resumen: "Instalación y mantenimiento de redes HFC.",
        fecha: "2026-09-19",
        requisitos: ["Experiencia en redes HFC.", "Disponibilidad de horario.", "Responsabilidad."],
      },
      {
        slug: "ingeniero-rf-tegucigalpa",
        puestoId: await puesto(ctx, ingenieria, "Ingeniero RF", [
          "Diseñar y optimizar sitios 4G/LTE.",
          "Planificar enlaces de microonda.",
        ]),
        ciudadId: tegucigalpa,
        jornada: "tiempo_completo",
        resumen: "Diseño y optimización de sitios 4G/LTE y enlaces de microonda para operadores móviles.",
        fecha: "2026-10-10",
        requisitos: [
          "Ingeniería en Telecomunicaciones o Electrónica.",
          "Experiencia en drive test y herramientas de planificación RF.",
          "Disponibilidad para viajar dentro del país.",
        ],
      },
      {
        slug: "supervisor-obra-fo-guatemala",
        puestoId: await puesto(ctx, operaciones, "Supervisor de obra FO", [
          "Coordinar cuadrillas de tendido y empalme.",
          "Reportar avance y control de materiales al cliente.",
        ]),
        ciudadId: ciudadGuatemala,
        jornada: "por_proyecto",
        resumen: "Coordinación de cuadrillas de tendido y empalme de fibra óptica en proyectos metropolitanos.",
        fecha: "2026-10-02",
        requisitos: [
          "Experiencia mínima de 3 años en construcción de redes de fibra.",
          "Manejo de reportes de avance y control de materiales.",
          "Licencia de conducir vigente.",
        ],
      },
      {
        slug: "asistente-proyectos-san-salvador",
        puestoId: await puesto(ctx, administracion, "Asistente de proyectos", [
          "Dar seguimiento a cronogramas y compras.",
          "Preparar documentación para clientes.",
        ]),
        ciudadId: sanSalvador,
        jornada: "tiempo_completo",
        resumen: "Seguimiento administrativo de proyectos: cronogramas, compras y documentación para clientes.",
        fecha: "2026-09-28",
        requisitos: [
          "Estudios en Administración, Ingeniería Industrial o afines.",
          "Manejo avanzado de hojas de cálculo.",
          "Organización y atención al detalle.",
        ],
      },
    ];

    let creadas = 0;
    for (const { fecha, requisitos, ...vacante } of vacantes) {
      const repetida = await ctx.db.query("vacantes").withIndex("by_slug", (q) => q.eq("slug", vacante.slug)).unique();
      if (repetida) continue;

      // Mediodía UTC, igual que el CMS, para que la fecha no cambie de día por zona horaria.
      const [anio, mes, dia] = fecha.split("-").map(Number);
      const id = await ctx.db.insert("vacantes", {
        ...vacante,
        fechaPublicacion: Date.UTC(anio, mes - 1, dia, 12),
        activa: true,
      });
      for (const [indice, requisito] of requisitos.entries()) {
        await ctx.db.insert("vacanteDetalles", { vacanteId: id, requisito, orden: indice + 1 });
      }
      creadas++;
    }
    return { creadas };
  },
});

/* =========================================================
   PROYECTO DE PRUEBA
   Uno solo, para ver el flujo CMS → sitio mientras no haya
   proyectos reales. La acción descarga las fotos de Pexels
   (licencia libre) y las guarda en File Storage; la mutación
   crea imágenes y proyecto. No es un proyecto real de Reddcom.
========================================================= */

const FOTOS = {
  conectores: [4497197, "Conectores de fibra óptica en un panel de distribución"],
  panel: [4486718, "Panel de fibra óptica con cables de conexión"],
  rack: [442150, "Ingeniero conectando cables en un rack"],
  turquesa: [1624895, "Cables de fibra conectados a un equipo de red"],
} as const satisfies Record<string, readonly [number, string]>;

type ClaveFoto = keyof typeof FOTOS;

const PROYECTOS: {
  slug: string;
  titulo: string;
  ciudad: [[string, string], string, string];
  anio: number;
  servicio: ServicioProyecto;
  resumen: string;
  descripcion: string[];
  imagen: ClaveFoto;
  galeria: ClaveFoto[];
  cifras: [string, string][];
  alcance: string[];
}[] = [
  {
    slug: "ftth-san-pedro-sula",
    titulo: "Despliegue FTTH en San Pedro Sula",
    ciudad: [HONDURAS, "Cortés", "San Pedro Sula"],
    anio: 2025,
    servicio: "fibra",
    resumen: "Red de fibra hasta el hogar para un operador de internet residencial en cinco colonias de la ciudad.",
    descripcion: [
      "El operador necesitaba llevar internet de alta velocidad a zonas residenciales servidas hasta entonces por cobre. Diseñamos una red GPON con splitters de dos niveles que permite crecer sin obra nueva.",
      "La construcción se ejecutó por etapas, con ventanas nocturnas en avenidas principales para no afectar el tránsito, y cada enlace se entregó certificado con OTDR.",
    ],
    imagen: "conectores",
    galeria: ["panel", "rack", "turquesa"],
    cifras: [["18k", "hogares pasados"], ["420", "km de fibra tendida"], ["9", "meses de ejecución"]],
    alcance: ["Diseño de red GPON", "Tendido aéreo y canalizado", "Empalmes por fusión", "Certificación OTDR", "Memoria técnica"],
  },
];

export const slugsDeProyectos = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query("proyectos").collect()).map((proyecto) => proyecto.slug),
});

export const proyectosDePrueba = internalAction({
  args: {},
  handler: async (ctx): Promise<{ creados: number }> => {
    const existentes = new Set(await ctx.runQuery(internal.semilla.slugsDeProyectos, {}));
    const pendientes = PROYECTOS.filter((proyecto) => !existentes.has(proyecto.slug));
    if (pendientes.length === 0) return { creados: 0 };

    // Cada foto se descarga una sola vez aunque la usen varios proyectos.
    const claves = [...new Set(pendientes.flatMap((proyecto) => [proyecto.imagen, ...proyecto.galeria]))];
    const fotos = await Promise.all(
      claves.map(async (clave) => {
        const [id] = FOTOS[clave];
        const respuesta = await fetch(`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp`);
        if (!respuesta.ok) throw new Error(`No se pudo descargar la foto ${clave} (${respuesta.status}).`);
        return { clave, storageId: await ctx.storage.store(await respuesta.blob()) };
      }),
    );

    return ctx.runMutation(internal.semilla.guardarProyectosDePrueba, { fotos });
  },
});

export const guardarProyectosDePrueba = internalMutation({
  args: { fotos: v.array(v.object({ clave: v.string(), storageId: v.id("_storage") })) },
  handler: async (ctx, { fotos }) => {
    const imagenes = new Map<string, Id<"imagenes">>();
    for (const { clave, storageId } of fotos) {
      const [, alt] = FOTOS[clave as ClaveFoto];
      imagenes.set(clave, await ctx.db.insert("imagenes", { storageId, nombre: `prueba-${clave}`, alt }));
    }
    const imagen = (clave: ClaveFoto) => imagenes.get(clave)!;

    let creados = 0;
    for (const proyecto of PROYECTOS) {
      const repetido = await ctx.db.query("proyectos").withIndex("by_slug", (q) => q.eq("slug", proyecto.slug)).unique();
      if (repetido) continue;

      const id = await ctx.db.insert("proyectos", {
        slug: proyecto.slug,
        titulo: proyecto.titulo,
        resumen: proyecto.resumen,
        descripcion: proyecto.descripcion.join("\n\n"),
        ciudadId: await ciudad(ctx, ...proyecto.ciudad),
        anio: proyecto.anio,
        servicio: proyecto.servicio,
        imagenId: imagen(proyecto.imagen),
        activo: true,
      });
      for (const [indice, [valor, etiqueta]] of proyecto.cifras.entries()) {
        await ctx.db.insert("proyectoCifras", { proyectoId: id, valor, etiqueta, orden: indice + 1 });
      }
      for (const [indice, texto] of proyecto.alcance.entries()) {
        await ctx.db.insert("proyectoAlcance", { proyectoId: id, texto, orden: indice + 1 });
      }
      for (const [indice, clave] of proyecto.galeria.entries()) {
        await ctx.db.insert("proyectoGaleria", { proyectoId: id, imagenId: imagen(clave), orden: indice + 1 });
      }
      creados++;
    }
    return { creados };
  },
});

/**
 * Borra proyectos por slug con sus listas, y las imágenes de prueba
 * ("prueba-…") que queden sin usar. Sirve para limpiar los datos de
 * prueba cuando se carguen los proyectos reales.
 */
export const eliminarProyectos = internalMutation({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, { slugs }) => {
    let eliminados = 0;
    for (const slug of slugs) {
      const proyecto = await ctx.db.query("proyectos").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
      if (!proyecto) continue;

      for (const tabla of ["proyectoCifras", "proyectoAlcance", "proyectoGaleria"] as const) {
        const filas = await ctx.db
          .query(tabla)
          .withIndex("by_proyecto_orden", (q) => q.eq("proyectoId", proyecto._id))
          .collect();
        for (const fila of filas) await ctx.db.delete(fila._id);
      }
      await ctx.db.delete(proyecto._id);
      eliminados++;
    }

    let imagenesBorradas = 0;
    for (const imagen of await ctx.db.query("imagenes").collect()) {
      if (!imagen.nombre.startsWith("prueba-")) continue;
      const enUso =
        (await ctx.db.query("proyectos").withIndex("by_imagen", (q) => q.eq("imagenId", imagen._id)).first()) ??
        (await ctx.db.query("proyectoGaleria").withIndex("by_imagen", (q) => q.eq("imagenId", imagen._id)).first()) ??
        (await ctx.db.query("bloques").withIndex("by_imagen", (q) => q.eq("contenido.imagenId", imagen._id)).first());
      if (enUso) continue;
      await ctx.db.delete(imagen._id);
      await ctx.storage.delete(imagen.storageId);
      imagenesBorradas++;
    }
    return { eliminados, imagenesBorradas };
  },
});

/* Borra las postulaciones de prueba (correo @ejemplo.com) y sus CV.
   npx convex run semilla:eliminarPostulacionesDePrueba */
export const eliminarPostulacionesDePrueba = internalMutation({
  args: {},
  handler: async (ctx) => {
    const deprueba = (await ctx.db.query("postulaciones").collect()).filter((p) => p.correo.endsWith("@ejemplo.com"));
    for (const postulacion of deprueba) {
      await ctx.storage.delete(postulacion.cvId);
      await ctx.db.delete(postulacion._id);
    }
    return deprueba.length;
  },
});

/* =========================================================
   CONTENIDO INICIAL DEL CMS (semillas/cargar.ts)
   El cargador sube las fotos al banco de imágenes y luego
   llena, página por página, solo los campos vacíos.
========================================================= */

export const imagenesPorNombre = internalQuery({
  args: {},
  handler: async (ctx) =>
    Object.fromEntries((await ctx.db.query("imagenes").collect()).map((imagen) => [imagen.nombre, imagen._id])),
});

export const urlDeSubida = internalMutation({
  args: {},
  handler: (ctx) => ctx.storage.generateUploadUrl(),
});

export const registrarImagen = internalMutation({
  args: { storageId: v.id("_storage"), nombre: v.string(), alt: v.string() },
  handler: (ctx, datos) => registrarImagenServicio(ctx, datos),
});

export const cargarContenido = internalMutation({
  args: { pagina: v.string(), secciones: v.record(v.string(), v.record(v.string(), v.array(contenidoBloque))) },
  handler: async (ctx, { pagina, secciones }) => {
    const completas: Record<string, Record<string, ContenidoBloque[]>> = {};
    let llenados = 0;
    for (const [seccion, campos] of Object.entries(secciones)) {
      // Lo ya guardado se conserva tal cual; la semilla solo entra en campos vacíos.
      const actuales: Record<string, ContenidoBloque[]> = {};
      for (const fila of await bloques.listarPorSeccion(ctx, pagina, seccion)) {
        (actuales[fila.campo] ??= [])[fila.orden] = fila.contenido;
      }
      const vacios = Object.entries(campos).filter(([campo]) => !actuales[campo]?.length);
      if (vacios.length === 0) continue;
      llenados += vacios.length;
      completas[seccion] = { ...actuales, ...Object.fromEntries(vacios) };
    }
    if (llenados > 0) await guardarPagina(ctx, pagina, completas);
    return llenados;
  },
});

/* =========================================================
   MIGRACIÓN A WEBP (semillas/aWebp.ts)
   Convierte las imágenes del banco subidas antes de que todo
   se guardara en WebP. La fila conserva su id, así que páginas
   y proyectos siguen apuntando a ella.
========================================================= */

export const imagenesSinWebp = internalQuery({
  args: {},
  handler: async (ctx) => {
    const pendientes = [];
    for (const imagen of await imagenes.listar(ctx)) {
      if ((await archivos.metadatos(ctx, imagen.storageId))?.contentType === TIPO_IMAGEN) continue;
      pendientes.push({ id: imagen._id, nombre: imagen.nombre, url: await archivos.url(ctx, imagen.storageId) });
    }
    return pendientes;
  },
});

export const reemplazarArchivo = internalMutation({
  args: { id: v.id("imagenes"), storageId: v.id("_storage"), nombre: v.string() },
  handler: async (ctx, { id, storageId, nombre }) => {
    const imagen = existente(await imagenes.obtener(ctx, id), "La imagen");
    const archivo = existente(await archivos.metadatos(ctx, storageId), "El archivo");
    if (!esImagenValida(archivo.contentType, archivo.size)) {
      await archivos.eliminar(ctx, storageId);
      invalido(MENSAJE_IMAGEN_INVALIDA);
    }
    await imagenes.actualizar(ctx, id, { storageId, nombre });
    await archivos.eliminar(ctx, imagen.storageId);
  },
});
