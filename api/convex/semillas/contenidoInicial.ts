import type { ContenidoBloque } from "../compartido/bloques";

/* =========================================================
   CONTENIDO INICIAL DEL CMS
   Copia del contenido con el que se diseñó el sitio (los
   respaldos de cada página), para que el CMS no arranque
   vacío. Lo carga semillas/cargar.ts y solo llena campos
   vacíos: lo que ya se editó en el CMS no se toca.
   Las fotos se indican por archivo; el cargador las sube al
   banco de imágenes y pone su id.
   Quedan fuera los campos calculados en vivo (cantidad de
   vacantes, proyectos por país): siguen saliendo del código.
========================================================= */

export type Foto = { archivo: string; alt: string };

// Cada bloque con imagen lleva `foto` en lugar de `imagenId`.
type ConFoto<T> = T extends { imagenId: unknown }
  ? Omit<T, "imagenId"> & { foto: Foto }
  : T extends { imagenId?: unknown }
    ? Omit<T, "imagenId"> & { foto?: Foto }
    : T;
export type BloqueSemilla = ConFoto<ContenidoBloque>;
export type ContenidoSemilla = Record<string, Record<string, Record<string, BloqueSemilla[]>>>;

/* ---------- Constructores ---------- */

const pexels = (nombre: string, alt = ""): Foto => ({ archivo: `src/assets/pexels/${nombre}`, alt });
const foto = (archivo: string, alt = ""): Foto => ({ archivo, alt });

const enc = (titulo: string, opciones: { etiqueta?: string; destacado?: string; descripcion?: string } = {}): BloqueSemilla[] => [
  { tipo: "encabezado", titulo, ...opciones },
];
const img = (f: Foto): BloqueSemilla[] => [{ tipo: "imagen", foto: f }];
const enlace = (texto: string, url: string): BloqueSemilla[] => [{ tipo: "enlace", texto, url }];
const opcion = (valor: string): BloqueSemilla[] => [{ tipo: "opcion", valor }];
const textos = (...lista: string[]): BloqueSemilla[] => lista.map((texto) => ({ tipo: "texto", texto }));
const datos = (...lista: [valor: string, etiqueta: string][]): BloqueSemilla[] =>
  lista.map(([valor, etiqueta]) => ({ tipo: "dato", valor, etiqueta }));
const dato = (valor: string, etiqueta: string) => datos([valor, etiqueta]);
const tarjeta = (titulo: string, extra: { texto?: string; foto?: Foto; url?: string } = {}): BloqueSemilla => ({
  tipo: "tarjeta",
  titulo,
  ...extra,
});

/** Cierre común (BannerCta): texto, botón y foto por defecto del diseño. */
const cierre = (titulo: string, destacado: string, extra: { texto?: string; boton?: [string, string]; foto?: Foto } = {}) => ({
  encabezado: enc(titulo, {
    destacado,
    descripcion:
      extra.texto ?? "Cuéntanos qué necesitas y un especialista de nuestro equipo te contactará en menos de 48 horas.",
  }),
  boton: enlace(...(extra.boton ?? ["Contactar al equipo", "/contacto"])),
  imagen: img(extra.foto ?? pexels("torre-nubes.jpg")),
});

/* ---------- Páginas ---------- */

export const contenidoInicial: ContenidoSemilla = {
  navegacion: {
    menu: {
      elementos: [
        { tipo: "menu", texto: "INICIO", url: "/", hijos: [] },
        {
          tipo: "menu",
          texto: "NOSOTROS",
          hijos: [
            { texto: "Misión y Visión", url: "/nosotros/mision-vision" },
            { texto: "Nuestra Empresa", url: "/nosotros/nuestra-empresa" },
          ],
        },
        {
          tipo: "menu",
          texto: "SERVICIOS",
          hijos: [
            { texto: "Redes HFC", url: "/Servicios/redes-hfc" },
            { texto: "Fibra Óptica", url: "/Servicios/redes-fo" },
            { texto: "Proyectos RF", url: "/Servicios/Proyectos-RF" },
          ],
        },
        {
          tipo: "menu",
          texto: "PROYECTOS",
          hijos: [
            { texto: "Reddcom Honduras", url: "/proyectos/Reddcom-Honduras" },
            { texto: "Reddcom Guatemala", url: "/proyectos/Reddcom-Guatemala" },
          ],
        },
        { tipo: "menu", texto: "OPORTUNIDADES LABORALES", url: "/Oportunidades-Laborales", hijos: [] },
        { tipo: "menu", texto: "CONTACTO", url: "/contacto", hijos: [] },
      ],
      boton: enlace("Contáctanos", "/contacto"),
      logo: img(foto("public/logo/reddcom-logo.webp", "Reddcom")),
    },
  },

  inicio: {
    hero: {
      encabezado: enc("Infraestructura para un mejor", {
        etiqueta: "TELECOMUNICACIONES QUE CONECTAN",
        destacado: "mañana.",
        descripcion:
          "Diseño, construcción y mantenimiento de redes telefónicas y soluciones de telecomunicaciones que conectan personas, empresas y comunidades.",
      }),
      imagen: img(foto("src/assets/Landing/reddcom-hero.png", "Técnico de Reddcom en una torre de telecomunicaciones")),
      botonPrincipal: enlace("Conoce nuestros servicios", "#servicios"),
      botonSecundario: enlace("Conoce Reddcom", "/nosotros/nuestra-empresa"),
      textoLateral: textos("MÁS CONEXIONES", "MÁS OPORTUNIDADES"),
    },
    servicios: {
      encabezado: enc("Soluciones para cada", {
        etiqueta: "NUESTROS SERVICIOS",
        destacado: "conexión.",
        descripcion:
          "Diseñamos, construimos y mantenemos infraestructura de telecomunicaciones adaptada a las necesidades de cada proyecto.",
      }),
      servicios: [
        tarjeta("Proyectos RF", {
          texto: "Diseño, implementación y optimización de soluciones de radiofrecuencia para redes de telecomunicaciones.",
          foto: foto("src/assets/Servicios/01-construccion.png", "Proyectos RF"),
          url: "/Servicios/Proyectos-RF",
        }),
        tarjeta("Redes HFC", {
          texto: "Planificación y diseño de soluciones de telecomunicaciones.",
          foto: foto("src/assets/Servicios/02-HFC.png", "Redes HFC"),
          url: "/Servicios/redes-hfc",
        }),
        tarjeta("Redes Fibra Óptica", {
          texto: "Soluciones en fibra óptica y redes de alta capacidad.",
          foto: foto("src/assets/Servicios/03-fibra.png", "Redes de fibra óptica"),
          url: "/Servicios/redes-fo",
        }),
      ],
      enlaceTodos: enlace("Ver todos los servicios", "/Servicios/redes-hfc"),
    },
  },

  nuestraEmpresa: {
    hero: {
      tipo: opcion("dividido"),
      encabezado: enc("Nuestra", {
        etiqueta: "Conoce Reddcom",
        destacado: "empresa.",
        descripcion:
          "Conectamos Centroamérica con infraestructura de telecomunicaciones confiable, innovadora y sostenible desde 2005.",
      }),
      imagen: img(pexels("tecnico-escalando-torre.jpg", "Técnico escalando una torre de telecomunicaciones")),
      boton: enlace("Ver servicios", "/Servicios/redes-hfc"),
      datos: datos(
        ["ISO 9001:2015", "Gestión de calidad certificada"],
        ["6 países", "con operación y equipos locales"],
        ["+20", "años de experiencia en la región"],
        ["2005", "año de fundación en El Salvador"],
        ["3", "líneas de negocio en el grupo"],
      ),
    },
    introduccion: {
      encabezado: enc("Una trayectoria construida", {
        etiqueta: "Nuestra historia",
        destacado: "con experiencia y equipo propio.",
      }),
      parrafos: textos(
        "Iniciamos operaciones en 2005 en El Salvador con la instalación y mantenimiento de redes de cobre y HFC. Desde entonces hemos incorporado nuevas tecnologías y ampliado nuestra presencia.",
        "Hoy somos un referente regional en infraestructura de telecomunicaciones, energía y soluciones digitales.",
      ),
      imagen: img(foto("src/assets/Landing/reddcom-hero.png", "Técnico de Reddcom en lo alto de una torre, con montañas al fondo")),
      datoDestacado: dato("2005", "El inicio de nuestra historia en El Salvador"),
      lineas: textos("Telecomunicaciones", "Energía solar", "Software"),
      datos: dato("6", "Países con operación"),
    },
    lineaTiempo: {
      encabezado: enc("De El Salvador a una", {
        etiqueta: "Línea de tiempo",
        destacado: "operación regional.",
        descripcion: "Una historia de crecimiento continuo, impulsada por la confianza de nuestros clientes.",
      }),
      hitos: [
        { tipo: "hito", anio: 2005, lugar: "El Salvador", titulo: "El comienzo", texto: "Instalación y mantenimiento de redes de cobre y HFC.", foto: pexels("cables-ethernet.jpg") },
        { tipo: "hito", anio: 2011, lugar: "El Salvador", titulo: "Nuevas capacidades", texto: "Expansión a GPON, fibra óptica, MSAN y DSLAM.", foto: pexels("fibra-panel.jpg") },
        { tipo: "hito", anio: 2013, lugar: "Honduras", titulo: "Expansión regional", texto: "Fibra óptica, site survey y enlaces de microonda.", foto: pexels("tegucigalpa-panorama.jpg") },
        { tipo: "hito", anio: 2015, lugar: "Guatemala", titulo: "Contrato regional", texto: "Contrato CA4: site survey, 3G/LTE, MSAN, DSLAM y microonda.", foto: pexels("guatemala-volcan.jpg") },
        { tipo: "hito", anio: 2018, lugar: "Panamá y Costa Rica", titulo: "Mayor cobertura", texto: "Nuevas operaciones de site survey y contrato CA6.", foto: pexels("torre-contrapicado.jpg") },
        { tipo: "hito", anio: 2026, lugar: "Actualidad", titulo: "Grupo diversificado", texto: "Telecomunicaciones, energía solar y software en toda la región.", foto: pexels("equipo-oficina.jpg") },
      ],
    },
    presencia: {
      encabezado: enc("Conectando Centroamérica.", {
        etiqueta: "Presencia regional",
        descripcion:
          "Operamos en seis países, con equipos locales y un profundo conocimiento de cada mercado, para ofrecer soluciones integrales y un acompañamiento cercano.",
      }),
      imagen: img(pexels("tegucigalpa-estadio.jpg", "Vista de Tegucigalpa entre montañas")),
      mapa: img(foto("src/assets/nuestra-empresa/mapa-centroamerica-azul.png", "Mapa de Centroamérica con los países donde opera Reddcom")),
      paises: textos("El Salvador", "Guatemala", "Honduras", "Nicaragua", "Costa Rica", "Panamá"),
    },
    pilares: {
      encabezado: enc("La forma en que hacemos", {
        etiqueta: "Nuestro enfoque",
        destacado: "nuestro trabajo.",
        descripcion: "Tres principios que sostienen cada proyecto, desde el diseño hasta el mantenimiento.",
      }),
      pilares: [
        tarjeta("Calidad", { texto: "Altos estándares técnicos y de seguridad para operaciones confiables y de largo plazo.", foto: pexels("ingeniero-rack.jpg"), url: "/Servicios/redes-fo" }),
        tarjeta("Experiencia", { texto: "Más de dos décadas de proyectos en condiciones reales en toda la región.", foto: pexels("tecnicos-azotea.jpg"), url: "/proyectos/Reddcom-Honduras" }),
        tarjeta("Cumplimiento", { texto: "Integridad, compromisos cumplidos y las mejores prácticas de la industria.", foto: pexels("ingenieros-reunion.jpg"), url: "/nosotros/mision-vision" }),
      ],
      lema: enc("Calidad que conecta", { destacado: "a toda la región" }),
    },
    cierre: cierre("Hablemos de", "tu próximo proyecto"),
  },

  misionVision: {
    hero: {
      encabezado: enc("Misión y", {
        etiqueta: "Nuestro propósito",
        destacado: "Visión",
        descripcion: "Nuestros principios nos guían y nos impulsan a seguir construyendo conexiones que generan un mejor futuro.",
      }),
      imagen: img(foto("public/images/mision-vision/reddcom-honduras.webp", "Visión y desarrollo de Reddcom")),
    },
    misionVision: {
      mision: [
        tarjeta("Construimos conexiones para el desarrollo regional", {
          texto:
            "Ser una empresa multidisciplinaria dispuesta a brindar Servicios de Construcción, Adecuación, expansión, enlaces y Mantenimiento de sitios en el Área de telefonía móvil remota a nivel regional centroamericano.",
          foto: foto("src/assets/mision-vision/temporal-fibra-switch.jpg", "Cables de fibra óptica conectados a un equipo de red"),
        }),
      ],
      vision: [
        tarjeta("Ser líderes a nivel regional", {
          texto:
            "Ser una empresa líder a nivel regional manteniendo la excelencia, y establecernos como la principal opción de nuestros clientes.",
          foto: foto("src/assets/mision-vision/temporal-ciudad-noche.jpg"),
        }),
      ],
      imagen: img(foto("src/assets/Servicios/01-construccion.png", "Técnico de Reddcom trabajando en una torre de telecomunicaciones")),
      lema: textos("Construimos conexiones"),
      datos: datos(["+20", "años de experiencia en la región"], ["6", "países con presencia regional"]),
    },
    valores: {
      encabezado: enc("Lo que nos define", {
        etiqueta: "Nuestros valores",
        descripcion: "Valores que guían nuestro trabajo y reflejan el compromiso de nuestro equipo.",
      }),
      valores: ["Responsabilidad", "Ética", "Disciplina", "Dedicación", "Compromiso", "Objetividad", "Motivación"].map((valor) =>
        tarjeta(valor, {
          foto: foto(`src/assets/mision-vision/temporal-valor-${valor.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}.jpg`),
        }),
      ),
      boton: enlace("Únete al equipo", "/Oportunidades-Laborales"),
      datos: datos(["2005", "Fundación"], ["ISO 9001:2015", "Gestión de calidad"]),
      textura: img(foto("src/assets/mision-vision/temporal-torre-nubes.jpg")),
    },
  },

  redesHfc: {
    hero: {
      tipo: opcion("fotoClara"),
      encabezado: enc("Redes HFC que", {
        etiqueta: "Servicios · Redes HFC",
        destacado: "llegan más lejos.",
        descripcion:
          "Diseño, construcción y mantenimiento de redes híbridas de fibra y coaxial para operadores de cable en Centroamérica.",
      }),
      imagen: img(pexels("torre-cielo-azul.jpg", "Torre de telecomunicaciones con antenas bajo un cielo azul")),
      boton: enlace("Solicitar cotización", "/contacto"),
      diapositivas: [
        tarjeta("Ver proyectos", { texto: "Nodos HFC construidos en la región", foto: pexels("tecnicos-azotea.jpg"), url: "/proyectos/Reddcom-Honduras" }),
        tarjeta("Cableado", { foto: pexels("cables-ethernet.jpg") }),
        tarjeta("Equipos", { foto: pexels("ingeniero-rack.jpg") }),
      ],
      franja: textos("DOCSIS 3.1", "Nodos ópticos", "Coaxial troncal", "Amplificadores", "Acometidas"),
    },
    introduccion: {
      lineas: textos("Redes híbridas", "que conectan", "más hogares"),
      parrafos: textos(
        "Combinamos fibra óptica hasta el nodo y coaxial hasta el hogar para llevar internet, televisión y telefonía con la capacidad que exigen los operadores.",
        "Nuestro equipo cubre todo el ciclo: diseño, construcción, balanceo y mantenimiento preventivo y correctivo.",
      ),
      imagen: img(pexels("ingeniero-rack.jpg", "Ingeniero conectando cables en un rack de telecomunicaciones")),
      dato: dato("99%", "de disponibilidad objetivo en contratos de mantenimiento"),
    },
    servicios: {
      encabezado: enc("Del diseño al mantenimiento,", {
        etiqueta: "Qué hacemos",
        destacado: "sin intermediarios.",
        descripcion: "Un solo equipo responsable de la red en cada etapa del proyecto.",
      }),
      tarjetas: [
        tarjeta("Diseño de red", { texto: "Planos, cálculo de niveles y presupuesto de materiales." }),
        tarjeta("Construcción y tendido", {
          texto: "Tendido aéreo y subterráneo de fibra y coaxial troncal, instalación de nodos, amplificadores y acometidas.",
          foto: pexels("tecnicos-azotea.jpg"),
        }),
        tarjeta("Mantenimiento", { texto: "Planes preventivos y atención de fallas con cuadrillas propias." }),
      ],
    },
    capacidad: {
      encabezado: enc("Capacidad", {
        etiqueta: "Capacidad",
        destacado: "en cifras.",
        descripcion: "Volumen de red construida y mantenida por nuestras cuadrillas.",
      }),
      imagen: img(pexels("racks-servidores.jpg", "Pasillo de racks en un centro de datos")),
      cifras: datos(["120k+", "Hogares pasados"], ["2400", "Km de red coaxial"], ["300+", "Nodos ópticos"]),
    },
    proceso: {
      encabezado: enc("Cómo construimos", { etiqueta: "Proceso", destacado: "una red HFC." }),
      etapas: [
        tarjeta("Levantamiento y diseño", { texto: "Visita de campo, censo de postes y diseño de la red." }),
        tarjeta("Construcción", { texto: "Tendido, fusiones e instalación de equipos activos." }),
        tarjeta("Balanceo y certificación", { texto: "Ajuste de niveles y pruebas de retorno y DOCSIS." }),
        tarjeta("Operación", { texto: "Monitoreo y mantenimiento con tiempos de respuesta acordados." }),
      ],
      imagen: img(pexels("torre-contrapicado.jpg", "Torre de telecomunicaciones vista desde abajo")),
    },
    cierre: cierre("¿Tu red necesita", "crecer?", { foto: pexels("centro-datos.jpg") }),
  },

  redesFo: {
    hero: {
      tipo: opcion("tipografico"),
      encabezado: enc("Redes de fibra que", {
        etiqueta: "Servicios · Fibra óptica",
        destacado: "conectan",
        descripcion:
          "Diseñamos, construimos y mantenemos redes FTTH, backbone y última milla con certificación de cada enlace.",
      }),
      imagen: img(pexels("fibra-conectores.jpg", "Conectores de fibra óptica en un panel de distribución")),
      boton: enlace("Hablar con un ingeniero", "/contacto"),
      franja: textos("FTTH", "GPON", "Backbone", "Empalmes por fusión", "Certificación OTDR", "Mantenimiento 24/7"),
    },
    reto: {
      encabezado: enc("Más tráfico, más usuarios", { etiqueta: "El reto", destacado: "y la misma red." }),
      parrafos: textos(
        "Los operadores necesitan crecer sin interrumpir el servicio. Planificamos la red para soportar la demanda de los próximos años y la construimos por etapas, con ventanas de trabajo acordadas.",
        "Cada enlace se entrega medido con OTDR y documentado, para que el mantenimiento sea rápido y predecible.",
      ),
      imagenPrincipal: img(pexels("ingeniero-rack.jpg", "Ingeniero conectando cables en un rack")),
      imagenSecundaria: img(pexels("fibra-turquesa.jpg", "Cables de fibra conectados a un equipo de red")),
    },
    servicios: {
      encabezado: enc("Todo lo que tu red", {
        etiqueta: "Servicios",
        destacado: "de fibra necesita.",
        descripcion: "Equipos propios de diseño, construcción y certificación en cada país donde operamos.",
      }),
      // En el CMS los puntos de cada servicio van uno por línea en el texto.
      tarjetas: [
        tarjeta("FTTH / FTTx", { texto: "Diseño de red GPON\nInstalación de splitters\nAcometidas al hogar" }),
        tarjeta("Backbone y última milla", { texto: "Tendido aéreo y canalizado\nCruces y derechos de vía\nRedes metropolitanas" }),
        tarjeta("Empalmes y certificación", { texto: "Fusión de fibras\nPruebas OTDR\nMemoria técnica" }),
        tarjeta("Mantenimiento", { texto: "Atención de cortes\nPlanes preventivos\nMonitoreo de enlaces" }),
      ],
    },
    resultados: {
      encabezado: enc("Redes que rinden", { etiqueta: "Resultados", destacado: "desde el primer día" }),
      textura: img(pexels("fibra-panel.jpg")),
      datos: datos(
        ["100%", "de enlaces entregados con certificación OTDR"],
        ["70%", "menos tiempo de reparación con monitoreo"],
        ["80%", "de la red diseñada para crecer sin obra nueva"],
        ["4", "semanas promedio de despliegue por zona"],
      ),
    },
    cierre: cierre("Llevemos fibra", "a tu próximo proyecto"),
  },

  proyectosRf: {
    hero: {
      tipo: opcion("carrusel"),
      encabezado: enc("Radiofrecuencia para", {
        etiqueta: "Servicios · Proyectos RF",
        destacado: "redes que no se detienen.",
        descripcion:
          "Diseño, implementación y optimización de soluciones de radiofrecuencia para operadores móviles en toda Centroamérica.",
      }),
      boton: enlace("Cotizar un proyecto", "/contacto"),
      diapositivas: [
        tarjeta("Site survey", { texto: "Levantamiento técnico de sitios", foto: pexels("torre-nubes.jpg", "Antena de telefonía móvil entre nubes") }),
        tarjeta("Instalación", { texto: "Antenas y equipos en azotea", foto: pexels("tecnicos-azotea.jpg", "Técnicos instalando antenas en una azotea") }),
        tarjeta("Microonda", { texto: "Enlaces punto a punto", foto: pexels("torre-contrapicado.jpg", "Torre de telecomunicaciones vista desde abajo") }),
        tarjeta("Optimización", { texto: "Cobertura 4G / LTE", foto: pexels("poste-cielo.jpg", "Poste de telecomunicaciones bajo un cielo azul") }),
      ],
      franja: textos("Site survey", "Microonda", "3G / LTE", "5G", "Drive test", "Optimización"),
    },
    capacidades: {
      encabezado: enc("Ingeniería RF de punta a punta", {
        etiqueta: "Soluciones",
        descripcion: "Acompañamos cada fase del proyecto, desde el estudio de cobertura hasta la operación de la red.",
      }),
      servicios: [
        tarjeta("Diseño RF", { texto: "Soluciones adaptadas a la cobertura, capacidad y desempeño de cada proyecto." }),
        tarjeta("Implementación", { texto: "Infraestructura RF ejecutada bajo criterios técnicos, operativos y de seguridad." }),
        tarjeta("Optimización", { texto: "Análisis de desempeño para mejorar cobertura, calidad y capacidad." }),
        tarjeta("Soporte técnico", { texto: "Acompañamiento durante la implementación y la operación de la red.", foto: pexels("ingenieros-reunion.jpg") }),
      ],
    },
    proceso: {
      encabezado: enc("Nuestro proceso", {
        destacado: "de trabajo",
        descripcion: "Cuatro etapas con entregables claros y un responsable técnico en cada una.",
      }),
      etapas: [
        tarjeta("Planificación", { texto: "Evaluamos los requerimientos técnicos y definimos el alcance." }),
        tarjeta("Diseño", { texto: "Propuesta RF según cobertura, capacidad e infraestructura disponible." }),
        tarjeta("Implementación", { texto: "Ejecución de acuerdo con los parámetros técnicos establecidos." }),
        tarjeta("Optimización", { texto: "Verificamos el desempeño y ajustamos para mejorar la red." }),
      ],
    },
    ventajas: {
      encabezado: enc("Por qué los operadores", {
        destacado: "trabajan con nosotros",
        descripcion: "Cuadrillas certificadas para trabajo en altura y experiencia en contratos regionales.",
      }),
      imagen: img(pexels("torre-roja.jpg", "Técnico escalando una torre roja y blanca")),
      tarjetas: [
        tarjeta("Personal certificado", { texto: "Trabajo en altura con equipo y protocolos de seguridad." }),
        tarjeta("Tiempos cumplidos", { texto: "Planificación por sitio y reportes de avance semanales." }),
        tarjeta("Medición continua", { texto: "Drive test y KPIs antes y después de cada intervención." }),
      ],
    },
    cierre: cierre("Diseñemos la cobertura", "de tu red"),
  },

  // Las diapositivas del hero y las cifras de logros salen de los proyectos del país (en vivo).
  reddcomHonduras: {
    hero: {
      tipo: opcion("fotoClara"),
      encabezado: enc("Reddcom", {
        etiqueta: "Nuestros proyectos",
        destacado: "Honduras.",
        descripcion: "Infraestructura de fibra, HFC y radiofrecuencia construida con equipos locales en todo el país.",
      }),
      imagen: img(pexels("tegucigalpa-panorama.jpg", "Vista panorámica de Tegucigalpa entre montañas")),
      boton: enlace("Ver proyectos", "#proyectos"),
      franja: textos("Fibra óptica", "Redes HFC", "Proyectos RF", "Site survey", "Microonda"),
    },
    logros: {
      encabezado: enc("Logros de Reddcom en Honduras"),
      imagen: img(pexels("tecnicos-azotea.jpg")),
    },
    cierre: cierre("Construyamos juntos", "en Honduras"),
  },

  reddcomGuatemala: {
    hero: {
      tipo: opcion("fotoClara"),
      encabezado: enc("Reddcom", {
        etiqueta: "Nuestros proyectos",
        destacado: "Guatemala.",
        descripcion: "Backbone de fibra, enlaces de microonda y proyectos regionales de radiofrecuencia desde 2015.",
      }),
      imagen: img(pexels("guatemala-volcan.jpg", "Volcán rodeado de nubes en Guatemala")),
      boton: enlace("Ver proyectos", "#proyectos"),
      franja: textos("Backbone", "Microonda", "Site survey", "3G / LTE", "Fibra óptica"),
    },
    logros: {
      encabezado: enc("Logros de Reddcom en Guatemala"),
      imagen: img(pexels("torre-contrapicado.jpg")),
    },
    cierre: cierre("Construyamos juntos", "en Guatemala"),
  },

  // Los datos del hero (plazas abiertas, áreas) se calculan con las vacantes activas.
  oportunidades: {
    hero: {
      tipo: opcion("dividido"),
      encabezado: enc("Tu talento puede ser parte", {
        etiqueta: "Únete a nuestro equipo",
        destacado: "de lo que construimos.",
        descripcion:
          "Buscamos personas comprometidas, responsables y con ganas de crecer junto a un equipo que conecta personas, empresas y comunidades.",
      }),
      imagen: img(pexels("equipo-taller.jpg", "Equipo de ingenieros trabajando en un taller")),
      boton: enlace("Ver vacantes", "#vacantes"),
    },
    beneficios: {
      encabezado: enc("Construyamos tu carrera", { destacado: "juntos" }),
      tarjetas: [
        tarjeta("Capacitación continua", { texto: "Formación técnica y certificaciones de trabajo en altura.", foto: pexels("ingenieros-reunion.jpg") }),
        tarjeta("Crecimiento regional", { texto: "Proyectos en seis países para ampliar tu experiencia.", foto: pexels("tecnicos-azotea.jpg") }),
        tarjeta("Seguridad primero", { texto: "Equipo de protección y protocolos en cada obra.", foto: pexels("equipo-oficina.jpg") }),
      ],
    },
    listado: {
      encabezado: enc("Posiciones", {
        etiqueta: "Empleos",
        destacado: "abiertas.",
        descripcion: "Conoce nuestras posiciones abiertas y encuentra la oportunidad que mejor se adapte a tu experiencia.",
      }),
      sinVacantes: enc("No hay vacantes disponibles", {
        descripcion: "En este momento no tenemos posiciones abiertas. Vuelve pronto o envíanos tu currículum.",
      }),
    },
    envioCv: cierre("¿No encontraste", "tu vacante?", {
      texto: "Envíanos tu currículum y te tendremos en cuenta para futuras oportunidades.",
      boton: ["Enviar mi CV", "mailto:rrhh.auxiliart2@reddcomca.com?subject=Curr%C3%ADculum%20-%20Oportunidades%20laborales"],
      foto: pexels("torre-cielo-azul.jpg"),
    }),
  },

  detalleVacante: {
    postulacion: {
      encabezado: enc("Postúlate a esta vacante.", { etiqueta: "¿Te interesa?" }),
      correo: textos("rrhh.auxiliart2@reddcomca.com"),
      imagen: img(pexels("equipo-oficina.jpg")),
    },
  },

  contacto: {
    hero: {
      tipo: opcion("fotoClara"),
      encabezado: enc("Hablemos de", {
        etiqueta: "Contacto",
        destacado: "tu proyecto.",
        descripcion: "Cuéntanos qué necesitas y un especialista te responderá en menos de 48 horas hábiles.",
      }),
      imagen: img(pexels("atencion-cliente.jpg", "Asesora de atención al cliente con audífonos en una oficina")),
      boton: enlace("Escribir mensaje", "#formulario"),
      diapositivas: [
        tarjeta("Ver oficinas", { texto: "Equipos locales en 6 países", foto: pexels("tegucigalpa-panorama.jpg"), url: "#oficinas" }),
        tarjeta("Guatemala", { foto: pexels("guatemala-volcan.jpg") }),
        tarjeta("Ciudad", { foto: pexels("edificio-ciudad.jpg") }),
      ],
    },
    formulario: {
      encabezado: enc("Una red", { etiqueta: "Escríbenos", destacado: "segura, a tiempo y bien documentada." }),
      canales: [
        tarjeta("Correo", { texto: "info@reddcom.hn", url: "mailto:info@reddcom.hn" }),
        tarjeta("Teléfono", { texto: "+504 2550-XXXX", url: "tel:+50425500000" }),
        tarjeta("WhatsApp", { texto: "Escríbenos", url: "https://wa.me/50425500000" }),
      ],
    },
    oficinas: {
      encabezado: enc("Equipos locales", {
        etiqueta: "Oficinas",
        destacado: "en seis países.",
        descripcion: "Escribe a la oficina más cercana o usa el formulario y te asignamos al equipo correcto.",
      }),
      oficinas: [
        tarjeta("Honduras", { texto: "San Pedro Sula, Cortés", url: "mailto:info@reddcom.hn" }),
        tarjeta("El Salvador", { texto: "San Salvador", url: "mailto:info@reddcomca.com" }),
        tarjeta("Guatemala", { texto: "Ciudad de Guatemala", url: "mailto:info@reddcomca.com" }),
        tarjeta("Nicaragua", { texto: "Managua", url: "mailto:info@reddcomca.com" }),
        tarjeta("Costa Rica", { texto: "San José", url: "mailto:info@reddcomca.com" }),
        tarjeta("Panamá", { texto: "Ciudad de Panamá", url: "mailto:info@reddcomca.com" }),
      ],
    },
    franja: {
      palabras: textos("Fibra óptica", "Redes HFC", "Proyectos RF", "Energía solar", "Software"),
    },
  },
};
