import { api } from "@reddcom/convex/api";
import { paginas, type DefinicionPagina } from "@reddcom/convex/registro";
import type { Permiso } from "@reddcom/convex/roles";
import { useQuery } from "convex/react";
import {
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Cable,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FileUser,
  Flag,
  FolderKanban,
  House,
  Images,
  LogOut,
  Mail,
  Moon,
  MapPinned,
  PanelTop,
  Network,
  Phone,
  RadioTower,
  Sun,
  Target,
  UserRoundCheck,
  UsersRound,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, useLocation, useSearchParams } from "react-router";
import { authClient } from "../lib/auth-client";
import { usePreferencia } from "../lib/usePreferencia";

/* Páginas agrupadas como en el menú del sitio (el orden sale del registro). */
const grupos = Object.entries(paginas as Record<string, DefinicionPagina>).reduce<
  Record<string, [string, DefinicionPagina][]>
>((acumulado, [clave, pagina]) => {
  (acumulado[pagina.grupo] ??= []).push([clave, pagina]);
  return acumulado;
}, {});

/* Ícono de cada página por su clave del registro; una página nueva usa FileText. */
const iconosPagina: Record<string, LucideIcon> = {
  navegacion: PanelTop,
  inicio: House,
  nuestraEmpresa: Building2,
  misionVision: Target,
  redesHfc: Cable,
  redesFo: Waypoints,
  proyectosRf: RadioTower,
  reddcomHonduras: Flag,
  reddcomGuatemala: Flag,
  oportunidades: BriefcaseBusiness,
  detalleVacante: FileUser,
  contacto: Phone,
};

/* Módulos que no son páginas de bloques; se muestran bajo su grupo
   solo si el rol del usuario tiene el permiso del módulo. */
type Modulo = { ruta: string; nombre: string; icono: LucideIcon; permiso: Permiso };

const modulos: Record<string, Modulo[]> = {
  Proyectos: [{ ruta: "/proyectos", nombre: "Todos los proyectos", icono: FolderKanban, permiso: "proyectos" }],
  Empleo: [
    { ruta: "/vacantes", nombre: "Vacantes", icono: Briefcase, permiso: "vacantes" },
    { ruta: "/postulaciones", nombre: "Postulaciones", icono: UserRoundCheck, permiso: "postulaciones" },
  ],
  Contacto: [{ ruta: "/mensajes", nombre: "Mensajes", icono: Mail, permiso: "mensajes" }],
  Catálogos: [
    { ruta: "/puestos", nombre: "Áreas y puestos", icono: Network, permiso: "catalogos" },
    { ruta: "/ubicaciones", nombre: "Ubicaciones", icono: MapPinned, permiso: "catalogos" },
  ],
  Medios: [{ ruta: "/imagenes", nombre: "Banco de imágenes", icono: Images, permiso: "imagenes" }],
  Configuración: [{ ruta: "/usuarios", nombre: "Usuarios", icono: UsersRound, permiso: "usuarios" }],
};

/* Colores del menú en modo claro y oscuro (el navy de marca); la
   estructura es la misma en ambos. */
const temas = {
  claro: {
    nav: "bg-white text-navy-900",
    borde: "border-linea",
    marca: "text-primary-700",
    logo: "",
    botonPlegar: "border-linea bg-surface text-navy-900 hover:border-navy-900/30",
    grupo: "text-body-soft",
    hover: "hover:bg-surface",
    activo: "text-navy-950",
    inactivo: "text-navy-900/75 hover:text-navy-950",
    tenue: "text-body-soft",
    seccionActiva: "text-primary-700",
    seccion: "text-body hover:text-navy-950",
    contador: "border-linea text-body",
    punto: "bg-primary-600",
    avatar: "border-linea bg-surface text-navy-900",
  },
  oscuro: {
    nav: "bg-navy-950 text-white",
    borde: "border-white/10",
    marca: "text-white",
    logo: "rounded-full bg-white p-1",
    botonPlegar: "border-white/15 bg-white/5 text-white hover:border-white/30",
    grupo: "text-white/45",
    hover: "hover:bg-white/5",
    activo: "text-white",
    inactivo: "text-white/65 hover:text-white",
    tenue: "text-white/45",
    seccionActiva: "text-primary-300",
    seccion: "text-white/55 hover:text-white",
    contador: "border-white/20 text-white/70",
    punto: "bg-primary-300",
    avatar: "border-white/15 bg-white/10 text-white",
  },
};

/** Iniciales para el avatar: dos palabras del nombre o, si no hay, el correo. */
function iniciales(nombre: string, email: string) {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  const letras = palabras.length > 1 ? palabras[0][0] + palabras[1][0] : (palabras[0] ?? email).slice(0, 2);
  return letras.toUpperCase();
}

/**
 * Menú lateral claro. En escritorio se pliega a una columna de íconos
 * (la preferencia se recuerda); como cajón en móvil siempre va abierto.
 */
export function Sidebar({
  nombre,
  email,
  permisos,
  onNavegar,
}: {
  nombre: string;
  email: string;
  permisos: readonly Permiso[];
  onNavegar?: () => void;
}) {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [plegadoGuardado, setPlegado] = usePreferencia("cms:sidebar-plegado", false);
  const plegado = plegadoGuardado && !onNavegar;
  const [oscuro, setOscuro] = usePreferencia("cms:sidebar-oscuro", false);
  const t = temas[oscuro ? "oscuro" : "claro"];

  // Solo se muestran los grupos con algo visible para este rol.
  const paginasDe = (grupo: string) => (permisos.includes("contenido") ? (grupos[grupo] ?? []) : []);
  const modulosDe = (grupo: string) => (modulos[grupo] ?? []).filter((modulo) => permisos.includes(modulo.permiso));
  const nombresGrupos = [...new Set([...Object.keys(grupos), ...Object.keys(modulos)])].filter(
    (grupo) => paginasDe(grupo).length > 0 || modulosDe(grupo).length > 0,
  );

  // Las consultas de módulos exigen su permiso: sin él se omiten.
  const sinLeer = useQuery(api.mensajes.contarSinLeer, permisos.includes("mensajes") ? {} : "skip");
  const vacantes = useQuery(api.vacantes.listarActivas, permisos.includes("vacantes") ? {} : "skip");
  const contadores: Record<string, number | undefined> = { "/mensajes": sinLeer, "/vacantes": vacantes?.length };

  const enlace = (Icono: LucideIcon, texto: string, extra?: ReactNode) =>
    ({ isActive }: { isActive: boolean }) => (
      <>
        <Icono aria-hidden className="size-[18px] shrink-0" strokeWidth={isActive ? 2.4 : 1.75} />
        {!plegado && <span className="min-w-0 flex-1 truncate">{texto}</span>}
        {extra}
      </>
    );

  const claseEnlace = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center gap-3 rounded-md py-2 text-sm transition-colors ${t.hover} ${
      plegado ? "justify-center px-0" : "px-3"
    } ${isActive ? `font-semibold ${t.activo}` : t.inactivo}`;

  const contador = (valor: number | undefined) => {
    if (!valor) return null;
    return plegado ? (
      <span aria-label={`${valor}`} className={`absolute right-3 top-2 size-1.5 rounded-full ${t.punto}`} />
    ) : (
      <span className={`min-w-6 rounded-md border px-1.5 text-center text-xs font-medium tabular-nums ${t.contador}`}>
        {valor}
      </span>
    );
  };

  return (
    <nav
      aria-label="CMS"
      className={`flex h-full flex-col border-r transition-[width] ${t.nav} ${t.borde} ${
        plegado ? "w-[76px]" : "w-64"
      }`}
    >
      <div
        className={`flex items-center gap-2.5 border-b py-4 ${t.borde} ${
          plegado ? "flex-col px-2" : "px-4"
        }`}
      >
        <img src="/favicon.png" alt="" className={`size-8 shrink-0 ${t.logo}`} />
        {!plegado && <p className={`min-w-0 flex-1 truncate text-lg font-bold ${t.marca}`}>Reddcom</p>}
        {!onNavegar && (
          <button
            type="button"
            onClick={() => setPlegado(!plegado)}
            aria-label={plegado ? "Expandir menú" : "Plegar menú"}
            title={plegado ? "Expandir menú" : "Plegar menú"}
            className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${t.botonPlegar}`}
          >
            {plegado ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {nombresGrupos.map((grupo) => (
          <div key={grupo} className={`border-b px-3 py-3 last:border-b-0 ${t.borde}`}>
            {!plegado && <p className={`px-3 pb-1.5 text-[13px] ${t.grupo}`}>{grupo}</p>}
            <ul className="space-y-0.5">
              {paginasDe(grupo).map(([clave, pagina]) => {
                const ruta = `/paginas/${clave}`;
                const activa = pathname === ruta;
                const Icono = iconosPagina[clave] ?? FileText;
                return (
                  <li key={clave}>
                    <NavLink
                      to={ruta}
                      end
                      title={plegado ? pagina.nombre : undefined}
                      className={claseEnlace}
                      onClick={onNavegar}
                    >
                      {enlace(
                        Icono,
                        pagina.nombre,
                        !plegado && (
                          <ChevronDown
                            aria-hidden
                            className={`size-4 shrink-0 transition-transform ${t.tenue} ${activa ? "rotate-180" : ""}`}
                          />
                        ),
                      )}
                    </NavLink>
                    {activa && !plegado && (
                      <ul className={`mb-1 ml-[21px] mt-0.5 border-l ${t.borde}`}>
                        {Object.entries(pagina.secciones).map(([claveSeccion, seccion]) => (
                          <li key={claveSeccion}>
                            <NavLink
                              to={`${ruta}?seccion=${claveSeccion}`}
                              onClick={onNavegar}
                              className={`block py-1.5 pl-4 text-[13px] transition-colors ${
                                params.get("seccion") === claveSeccion ? `font-medium ${t.seccionActiva}` : t.seccion
                              }`}
                            >
                              {seccion.nombre}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
              {modulosDe(grupo).map((modulo) => (
                <li key={modulo.ruta}>
                  <NavLink
                    to={modulo.ruta}
                    title={plegado ? modulo.nombre : undefined}
                    className={claseEnlace}
                    onClick={onNavegar}
                  >
                    {enlace(modulo.icono, modulo.nombre, contador(contadores[modulo.ruta]))}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={`border-t px-3 py-3 ${t.borde}`}>
        <button
          type="button"
          onClick={() => setOscuro(!oscuro)}
          title={plegado ? (oscuro ? "Modo claro" : "Modo oscuro") : undefined}
          className={`w-full ${claseEnlace({ isActive: false })}`}
        >
          {oscuro ? (
            <Sun aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />
          ) : (
            <Moon aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />
          )}
          {!plegado && (oscuro ? "Modo claro" : "Modo oscuro")}
        </button>
        <button
          type="button"
          onClick={() => authClient.signOut()}
          title={plegado ? "Cerrar sesión" : undefined}
          className={`w-full ${claseEnlace({ isActive: false })}`}
        >
          <LogOut aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />
          {!plegado && "Cerrar sesión"}
        </button>
      </div>

      <div className={`flex items-center gap-3 border-t py-4 ${t.borde} ${plegado ? "justify-center" : "px-5"}`}>
        <span
          aria-hidden
          title={plegado ? `${nombre} · ${email}` : undefined}
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${t.avatar}`}
        >
          {iniciales(nombre, email)}
        </span>
        {!plegado && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{nombre || email}</p>
            <p className={`truncate text-xs ${t.tenue}`} title={email}>
              {email}
            </p>
          </div>
        )}
      </div>
    </nav>
  );
}
