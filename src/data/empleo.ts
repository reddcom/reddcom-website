import type { FunctionReturnType } from "convex/server";
import { api } from "../../api/convex/functions/_generated/api.js";
import { etiquetasJornada } from "../../api/convex/compartido/vacantes";
import { consultar } from "../lib/cms";

/* =========================================================
   VACANTES
   Salen del módulo Vacantes del CMS (tabla `vacantes` de
   Convex). Las comparten el listado y el detalle.
========================================================= */

export type Vacante = FunctionReturnType<typeof api.vacantes.listarActivas>[number];
export type DetalleVacante = NonNullable<FunctionReturnType<typeof api.vacantes.obtenerPorSlug>>;

/** Vacantes activas, de la más reciente a la más antigua. */
export const vacantesActivas = () =>
  consultar("las vacantes", (convex) => convex.query(api.vacantes.listarActivas, {}), [] as Vacante[]);

export const detalleVacante = (slug: string) =>
  consultar(`la vacante ${slug}`, (convex) => convex.query(api.vacantes.obtenerPorSlug, { slug }), null);

export const jornadaLegible = (vacante: Vacante) => etiquetasJornada[vacante.jornada];
export const ubicacionDe = (vacante: Vacante) => `${vacante.ciudad}, ${vacante.pais}`;

/** Respaldo mientras el CMS no tenga el correo en Detalle de vacante → Postulación. */
export const correoRrhhPrueba = "rrhh.auxiliart2@reddcomca.com";

export const enlaceCorreo = (correo: string, asunto: string, cuerpo = "") =>
  `mailto:${correo}?subject=${encodeURIComponent(asunto)}${cuerpo ? `&body=${encodeURIComponent(cuerpo)}` : ""}`;
