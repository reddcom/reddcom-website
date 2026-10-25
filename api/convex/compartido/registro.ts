import type { TipoBloque } from "./bloques";

/* =========================================================
   REGISTRO DE PÁGINAS
   Las páginas y sus secciones son fijas (las define el código
   del sitio). El CMS solo edita los bloques de cada campo.
   Lo usan Convex, para validar, y el CMS, para el sidebar y
   los formularios.
========================================================= */

export type DefinicionCampo = {
  etiqueta: string;
  tipo: TipoBloque;
  lista?: boolean; // admite varios bloques ordenados
  multilinea?: boolean; // solo para texto
  avanzado?: boolean; // va dentro del desplegable "Más campos"
  opciones?: Record<string, string>; // solo para opcion: valor → etiqueta visible
};

export type DefinicionSeccion = {
  nombre: string;
  ancla: string; // id de la sección en el sitio, para la vista previa
  campos: Record<string, DefinicionCampo>;
};

export type DefinicionPagina = {
  nombre: string;
  grupo: string;
  ruta: string;
  secciones: Record<string, DefinicionSeccion>;
};

const encabezado: DefinicionCampo = { etiqueta: "Encabezado", tipo: "encabezado" };
const imagen = (etiqueta: string): DefinicionCampo => ({ etiqueta, tipo: "imagen" });
const boton = (etiqueta: string): DefinicionCampo => ({ etiqueta, tipo: "enlace" });

/* Variantes del hero de las páginas internas. Agregar una = sumar
   su clave aquí y su componente en src/components/hero del sitio. */
export const tiposHero = {
  fotoClara: "Foto clara de fondo",
  dividido: "Dividido: texto y foto",
  carrusel: "Carrusel",
  tipografico: "Tipográfico con píldoras",
} as const;

export type TipoHero = keyof typeof tiposHero;

/** Hero común de las páginas internas; cada variante usa los campos que necesita. */
const seccionHero: DefinicionSeccion = {
  nombre: "Hero",
  ancla: "hero",
  campos: {
    tipo: { etiqueta: "Tipo de hero", tipo: "opcion", opciones: tiposHero },
    encabezado,
    imagen: imagen("Imagen (todos menos carrusel)"),
    boton: boton("Botón"),
    datos: {
      etiqueta: "Datos (dividido: los dos primeros flotan sobre la foto y el resto va en cifras)",
      tipo: "dato",
      lista: true,
    },
    diapositivas: {
      etiqueta: "Tarjetas (carrusel: diapositivas; foto clara: placa de la esquina)",
      tipo: "tarjeta",
      lista: true,
    },
    franja: {
      etiqueta: "Franja de palabras (tipográfico, foto clara y carrusel)",
      tipo: "texto",
      lista: true,
      avanzado: true,
    },
  },
};

/** Cierre de página: título gigante y barra con foto que lleva a contacto. */
const seccionCierre: DefinicionSeccion = {
  nombre: "Cierre",
  ancla: "cierre",
  campos: {
    encabezado: { ...encabezado, etiqueta: "Título (el destacado va en azul)" },
    boton: boton("Botón de la barra"),
    imagen: { ...imagen("Foto de la barra"), avanzado: true },
  },
};

const tarjetas = (etiqueta: string): DefinicionCampo => ({ etiqueta, tipo: "tarjeta", lista: true });
const datos = (etiqueta: string): DefinicionCampo => ({ etiqueta, tipo: "dato", lista: true });
const textos = (etiqueta: string, multilinea = false): DefinicionCampo => ({ etiqueta, tipo: "texto", lista: true, multilinea });

/** Página de proyectos de un país: los proyectos salen del módulo Proyectos. */
const paginaPais = (nombre: string, ruta: string): DefinicionPagina => ({
  nombre,
  grupo: "Proyectos",
  ruta,
  secciones: {
    hero: seccionHero,
    logros: {
      nombre: "Logros",
      ancla: "logros",
      campos: { encabezado, imagen: imagen("Foto con marco"), datos: datos("Datos (el primero va en gris, el segundo en azul)") },
    },
    cierre: seccionCierre,
  },
});

export const paginas = {
  // Barra de navegación común a todo el sitio (src/components/Header.astro).
  navegacion: {
    nombre: "Menú principal",
    grupo: "Sitio",
    ruta: "/",
    secciones: {
      menu: {
        nombre: "Barra de navegación",
        ancla: "menu",
        campos: {
          elementos: {
            etiqueta: "Elementos del menú (con opciones = desplegable)",
            tipo: "menu",
            lista: true,
          },
          boton: boton("Botón de la barra"),
          logo: { ...imagen("Logo"), avanzado: true },
        },
      },
    },
  },

  inicio: {
    nombre: "Inicio",
    grupo: "Inicio",
    ruta: "/",
    secciones: {
      hero: {
        nombre: "Hero",
        ancla: "hero",
        campos: {
          encabezado,
          imagen: imagen("Imagen de fondo"),
          botonPrincipal: boton("Botón principal"),
          botonSecundario: boton("Botón secundario"),
          textoLateral: { ...textos("Texto lateral"), avanzado: true },
        },
      },
      servicios: {
        nombre: "Servicios",
        ancla: "servicios",
        campos: {
          encabezado,
          servicios: tarjetas("Servicios"),
          enlaceTodos: { ...boton("Enlace a todos los servicios"), avanzado: true },
        },
      },
    },
  },

  nuestraEmpresa: {
    nombre: "Nuestra empresa",
    grupo: "Nosotros",
    ruta: "/nosotros/nuestra-empresa",
    secciones: {
      hero: seccionHero,
      introduccion: {
        nombre: "Introducción",
        ancla: "introduccion",
        campos: {
          encabezado,
          parrafos: textos("Párrafos", true),
          imagen: imagen("Foto"),
          datoDestacado: { etiqueta: "Dato sobre la foto", tipo: "dato" },
          lineas: textos("Líneas de negocio"),
          datos: { ...datos("Datos del mosaico"), avanzado: true },
        },
      },
      lineaTiempo: {
        nombre: "Línea de tiempo",
        ancla: "linea-tiempo",
        campos: { encabezado, hitos: { etiqueta: "Hitos", tipo: "hito", lista: true } },
      },
      presencia: {
        nombre: "Presencia regional",
        ancla: "presencia",
        campos: { encabezado, imagen: imagen("Foto"), mapa: imagen("Mapa"), paises: textos("Países") },
      },
      pilares: {
        nombre: "Pilares",
        ancla: "pilares",
        campos: {
          encabezado,
          pilares: tarjetas("Pilares"),
          lema: { ...encabezado, etiqueta: "Lema gigante", avanzado: true },
        },
      },
      cierre: seccionCierre,
    },
  },

  misionVision: {
    nombre: "Misión y visión",
    grupo: "Nosotros",
    ruta: "/nosotros/mision-vision",
    secciones: {
      hero: {
        nombre: "Hero",
        ancla: "hero",
        campos: { encabezado, imagen: imagen("Imagen de fondo") },
      },
      misionVision: {
        nombre: "Misión y visión",
        ancla: "mision-vision",
        campos: {
          mision: { etiqueta: "Misión", tipo: "tarjeta" },
          vision: { etiqueta: "Visión", tipo: "tarjeta" },
          imagen: imagen("Imagen central"),
          lema: { etiqueta: "Tipografía gigante", tipo: "texto", avanzado: true },
          datos: { ...datos("Datos"), avanzado: true },
        },
      },
      valores: {
        nombre: "Valores",
        ancla: "valores",
        campos: {
          encabezado,
          valores: tarjetas("Valores"),
          boton: boton("Botón"),
          datos: { ...datos("Datos"), avanzado: true },
          textura: { ...imagen("Foto de fondo"), avanzado: true },
        },
      },
    },
  },

  redesHfc: {
    nombre: "Redes HFC",
    grupo: "Servicios",
    ruta: "/Servicios/redes-hfc",
    secciones: {
      hero: seccionHero,
      introduccion: {
        nombre: "Introducción",
        ancla: "introduccion",
        campos: {
          lineas: textos("Líneas en mayúsculas (la última va en azul)"),
          parrafos: textos("Párrafos intercalados", true),
          imagen: imagen("Foto"),
          dato: { etiqueta: "Dato bajo la foto", tipo: "dato" },
        },
      },
      servicios: {
        nombre: "Servicios",
        ancla: "servicios",
        campos: { encabezado, tarjetas: tarjetas("Servicios (la del centro va resaltada)") },
      },
      capacidad: {
        nombre: "Capacidad",
        ancla: "capacidad",
        campos: { encabezado, imagen: imagen("Foto"), cifras: datos("Barras de cifras") },
      },
      proceso: {
        nombre: "Proceso",
        ancla: "proceso",
        campos: { encabezado, etapas: tarjetas("Etapas"), imagen: imagen("Foto") },
      },
      cierre: seccionCierre,
    },
  },

  redesFo: {
    nombre: "Redes de fibra óptica",
    grupo: "Servicios",
    ruta: "/Servicios/redes-fo",
    secciones: {
      hero: seccionHero,
      reto: {
        nombre: "El reto",
        ancla: "reto",
        campos: {
          encabezado,
          parrafos: textos("Párrafos", true),
          imagenPrincipal: imagen("Foto grande"),
          imagenSecundaria: imagen("Foto pequeña"),
        },
      },
      servicios: {
        nombre: "Servicios",
        ancla: "servicios",
        campos: {
          encabezado,
          tarjetas: { ...tarjetas("Servicios (en el texto, un punto por línea)"), multilinea: true },
        },
      },
      resultados: {
        nombre: "Resultados",
        ancla: "resultados",
        campos: {
          encabezado: { ...encabezado, etiqueta: "Encabezado (el destacado va resaltado)" },
          textura: imagen("Foto de textura"),
          datos: datos("Cifras (4)"),
        },
      },
      cierre: seccionCierre,
    },
  },

  proyectosRf: {
    nombre: "Proyectos RF",
    grupo: "Servicios",
    ruta: "/Servicios/Proyectos-RF",
    secciones: {
      hero: seccionHero,
      capacidades: {
        nombre: "Soluciones",
        ancla: "soluciones",
        campos: { encabezado, servicios: tarjetas("Servicios (la última puede llevar foto)") },
      },
      proceso: {
        nombre: "Proceso",
        ancla: "proceso",
        campos: { encabezado, etapas: tarjetas("Etapas") },
      },
      ventajas: {
        nombre: "Ventajas",
        ancla: "ventajas",
        campos: { encabezado, imagen: imagen("Foto de fondo"), tarjetas: tarjetas("Tarjetas") },
      },
      cierre: seccionCierre,
    },
  },

  reddcomHonduras: paginaPais("Reddcom Honduras", "/proyectos/Reddcom-Honduras"),
  reddcomGuatemala: paginaPais("Reddcom Guatemala", "/proyectos/Reddcom-Guatemala"),

  oportunidades: {
    nombre: "Oportunidades laborales",
    grupo: "Empleo",
    ruta: "/Oportunidades-Laborales",
    secciones: {
      hero: seccionHero,
      beneficios: {
        nombre: "Beneficios",
        ancla: "beneficios",
        campos: { encabezado, tarjetas: tarjetas("Beneficios (el último va en azul)") },
      },
      listado: {
        nombre: "Listado de vacantes",
        ancla: "vacantes",
        campos: {
          encabezado,
          sinVacantes: { ...encabezado, etiqueta: "Mensaje sin vacantes", avanzado: true },
        },
      },
      envioCv: { ...seccionCierre, nombre: "Envío de CV" },
    },
  },

  detalleVacante: {
    nombre: "Detalle de vacante",
    grupo: "Empleo",
    ruta: "/Oportunidades-Laborales",
    secciones: {
      postulacion: {
        nombre: "Postulación",
        ancla: "vacante",
        campos: {
          encabezado,
          correo: { etiqueta: "Correo de Recursos Humanos", tipo: "texto" },
          imagen: { ...imagen("Foto del encabezado"), avanzado: true },
        },
      },
    },
  },

  contacto: {
    nombre: "Contacto",
    grupo: "Contacto",
    ruta: "/contacto",
    secciones: {
      hero: seccionHero,
      formulario: {
        nombre: "Formulario",
        ancla: "formulario",
        campos: {
          encabezado: { ...encabezado, etiqueta: "Encabezado (el destacado va resaltado)" },
          canales: tarjetas("Canales (título = canal, texto = dato, enlace = mailto:, tel: o https://)"),
        },
      },
      oficinas: {
        nombre: "Oficinas",
        ancla: "oficinas",
        campos: { encabezado, oficinas: tarjetas("Oficinas (título = país, texto = ciudad, enlace = mailto:)") },
      },
      franja: {
        nombre: "Franja final",
        ancla: "franja",
        campos: { palabras: textos("Palabras") },
      },
    },
  },
} satisfies Record<string, DefinicionPagina>;

export type ClavePagina = keyof typeof paginas;

const registro: Record<string, DefinicionPagina> = paginas;

/** Búsqueda segura con claves que llegan como texto (no hereda del prototipo). */
export function buscarPagina(clave: string): DefinicionPagina | undefined {
  return Object.hasOwn(registro, clave) ? registro[clave] : undefined;
}

export function buscarSeccion(pagina: string, seccion: string): DefinicionSeccion | undefined {
  const definicion = buscarPagina(pagina);
  return definicion && Object.hasOwn(definicion.secciones, seccion)
    ? definicion.secciones[seccion]
    : undefined;
}
