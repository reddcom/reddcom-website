/* =========================================================
   ROLES Y PERMISOS DEL CMS
   Un rol es un conjunto de permisos. Agregar un rol = sumar
   su entrada aquí y su literal en el schema; el resto del
   código pregunta por permisos, no por roles.
========================================================= */

export const permisos = {
  contenido: "Editar páginas",
  vacantes: "Gestionar vacantes",
  proyectos: "Gestionar proyectos",
  mensajes: "Leer mensajes de contacto",
  postulaciones: "Ver postulaciones a vacantes",
  imagenes: "Gestionar imágenes",
  catalogos: "Gestionar catálogos",
  usuarios: "Gestionar usuarios y roles",
} as const;

export type Permiso = keyof typeof permisos;

const todos = Object.keys(permisos) as Permiso[];

export const roles = {
  superAdmin: { nombre: "Super administrador", permisos: todos },
} as const satisfies Record<string, { nombre: string; permisos: readonly Permiso[] }>;

export type Rol = keyof typeof roles;

export const puede = (rol: Rol, permiso: Permiso) => roles[rol].permisos.includes(permiso);
