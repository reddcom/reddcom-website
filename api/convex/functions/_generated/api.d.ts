/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as areas from "../areas.js";
import type * as auth from "../auth.js";
import type * as ciudades from "../ciudades.js";
import type * as contenido from "../contenido.js";
import type * as crons from "../crons.js";
import type * as departamentos from "../departamentos.js";
import type * as http from "../http.js";
import type * as imagenes from "../imagenes.js";
import type * as lib_autorizacion from "../lib/autorizacion.js";
import type * as lib_errores from "../lib/errores.js";
import type * as lib_repositorio from "../lib/repositorio.js";
import type * as lib_validacion from "../lib/validacion.js";
import type * as mensajes from "../mensajes.js";
import type * as paises from "../paises.js";
import type * as postulaciones from "../postulaciones.js";
import type * as proyectos from "../proyectos.js";
import type * as puestos from "../puestos.js";
import type * as repositorios_contenido from "../repositorios/contenido.js";
import type * as repositorios_mensajes from "../repositorios/mensajes.js";
import type * as repositorios_organizacion from "../repositorios/organizacion.js";
import type * as repositorios_postulaciones from "../repositorios/postulaciones.js";
import type * as repositorios_proyectos from "../repositorios/proyectos.js";
import type * as repositorios_ubicacion from "../repositorios/ubicacion.js";
import type * as repositorios_usuarios from "../repositorios/usuarios.js";
import type * as repositorios_vacantes from "../repositorios/vacantes.js";
import type * as semilla from "../semilla.js";
import type * as servicios_contenido from "../servicios/contenido.js";
import type * as servicios_imagenes from "../servicios/imagenes.js";
import type * as servicios_mensajes from "../servicios/mensajes.js";
import type * as servicios_organizacion from "../servicios/organizacion.js";
import type * as servicios_postulaciones from "../servicios/postulaciones.js";
import type * as servicios_proyectos from "../servicios/proyectos.js";
import type * as servicios_ubicacion from "../servicios/ubicacion.js";
import type * as servicios_usuarios from "../servicios/usuarios.js";
import type * as servicios_vacantes from "../servicios/vacantes.js";
import type * as usuarios from "../usuarios.js";
import type * as vacantes from "../vacantes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  areas: typeof areas;
  auth: typeof auth;
  ciudades: typeof ciudades;
  contenido: typeof contenido;
  crons: typeof crons;
  departamentos: typeof departamentos;
  http: typeof http;
  imagenes: typeof imagenes;
  "lib/autorizacion": typeof lib_autorizacion;
  "lib/errores": typeof lib_errores;
  "lib/repositorio": typeof lib_repositorio;
  "lib/validacion": typeof lib_validacion;
  mensajes: typeof mensajes;
  paises: typeof paises;
  postulaciones: typeof postulaciones;
  proyectos: typeof proyectos;
  puestos: typeof puestos;
  "repositorios/contenido": typeof repositorios_contenido;
  "repositorios/mensajes": typeof repositorios_mensajes;
  "repositorios/organizacion": typeof repositorios_organizacion;
  "repositorios/postulaciones": typeof repositorios_postulaciones;
  "repositorios/proyectos": typeof repositorios_proyectos;
  "repositorios/ubicacion": typeof repositorios_ubicacion;
  "repositorios/usuarios": typeof repositorios_usuarios;
  "repositorios/vacantes": typeof repositorios_vacantes;
  semilla: typeof semilla;
  "servicios/contenido": typeof servicios_contenido;
  "servicios/imagenes": typeof servicios_imagenes;
  "servicios/mensajes": typeof servicios_mensajes;
  "servicios/organizacion": typeof servicios_organizacion;
  "servicios/postulaciones": typeof servicios_postulaciones;
  "servicios/proyectos": typeof servicios_proyectos;
  "servicios/ubicacion": typeof servicios_ubicacion;
  "servicios/usuarios": typeof servicios_usuarios;
  "servicios/vacantes": typeof servicios_vacantes;
  usuarios: typeof usuarios;
  vacantes: typeof vacantes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
