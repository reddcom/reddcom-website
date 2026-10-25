/* =========================================================
   CARGA DEL CONTENIDO INICIAL DEL CMS
   Uso (desde api/convex):
     node --experimental-strip-types semillas/cargar.ts
   1. Sube al banco de imágenes las fotos de contenidoInicial
      (en WebP a 1920 px; las que ya existen por nombre se
      reutilizan, así que se puede correr varias veces).
      Necesita cwebp: brew install webp
   2. Llena, página por página, solo los campos vacíos.
   Usa `npx convex run` sobre el deployment configurado en
   .env.local (funciones internas de semilla.ts).
========================================================= */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { TIPO_IMAGEN } from "../compartido/imagenes.ts";
import { contenidoInicial, type BloqueSemilla, type Foto } from "./contenidoInicial.ts";
import { convertirAWebp } from "./webp.ts";

const PAQUETE = resolve(import.meta.dirname, "..");
const RAIZ = resolve(PAQUETE, "../..");
const TEMPORAL = mkdtempSync(join(tmpdir(), "reddcom-semilla-"));

function convex<T>(funcion: string, args: Record<string, unknown> = {}): T {
  const salida = execFileSync("npx", ["convex", "run", funcion, JSON.stringify(args)], {
    cwd: PAQUETE,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(salida) as T;
}

// Texto alternativo de las fotos que en el diseño iban sin él (el banco lo exige).
const altPorArchivo: Record<string, string> = {
  "cables-ethernet.jpg": "Cables de red conectados a un equipo",
  "fibra-panel.jpg": "Panel de fibra óptica con conectores",
  "equipo-oficina.jpg": "Equipo de trabajo reunido en una oficina",
  "ingenieros-reunion.jpg": "Ingenieros en una reunión de trabajo",
  "centro-datos.jpg": "Interior de un centro de datos",
  "edificio-ciudad.jpg": "Edificios de la ciudad",
  "temporal-ciudad-noche.jpg": "Ciudad iluminada de noche",
  "temporal-torre-nubes.jpg": "Torre de telecomunicaciones entre nubes",
};

/** Prepara la foto para la web como el CMS: WebP a 1920 px como máximo. */
function optimizar(archivo: string): { ruta: string; nombre: string; tipo: string } {
  const nombre = `${basename(archivo, extname(archivo))}.webp`;
  const ruta = join(TEMPORAL, nombre);
  convertirAWebp(join(RAIZ, archivo), ruta);
  return { ruta, nombre, tipo: TIPO_IMAGEN };
}

/* ---------- 1. Fotos ---------- */

const fotos = new Map<string, Foto>();
const recorrer = (bloque: BloqueSemilla) => {
  if (!("foto" in bloque) || !bloque.foto) return;
  const previa = fotos.get(bloque.foto.archivo);
  // La primera descripción no vacía gana: una foto es una sola fila del banco.
  if (!previa || (!previa.alt && bloque.foto.alt)) fotos.set(bloque.foto.archivo, bloque.foto);
};
Object.values(contenidoInicial).forEach((secciones) =>
  Object.values(secciones).forEach((campos) => Object.values(campos).flat().forEach(recorrer)),
);

const existentes = convex<Record<string, string>>("semilla:imagenesPorNombre");
const idPorArchivo = new Map<string, string>();

for (const { archivo, alt } of fotos.values()) {
  const { ruta, nombre, tipo } = optimizar(archivo);
  if (existentes[nombre]) {
    idPorArchivo.set(archivo, existentes[nombre]);
    console.log(`= ${nombre} (ya estaba)`);
    continue;
  }
  const url = convex<string>("semilla:urlDeSubida");
  const respuesta = await fetch(url, { method: "POST", headers: { "Content-Type": tipo }, body: readFileSync(ruta) });
  if (!respuesta.ok) throw new Error(`No se pudo subir ${nombre}: ${respuesta.status}`);
  const { storageId } = (await respuesta.json()) as { storageId: string };
  const descripcion = alt || altPorArchivo[basename(archivo)] || "Imagen de Reddcom";
  idPorArchivo.set(archivo, convex<string>("semilla:registrarImagen", { storageId, nombre, alt: descripcion }));
  console.log(`+ ${nombre}`);
}

/* ---------- 2. Contenido ---------- */

const conImagen = (bloque: BloqueSemilla) => {
  if (!("foto" in bloque) || !bloque.foto) return bloque;
  const { foto, ...resto } = bloque;
  return { ...resto, imagenId: idPorArchivo.get(foto.archivo) };
};

for (const [pagina, secciones] of Object.entries(contenidoInicial)) {
  const conIds = Object.fromEntries(
    Object.entries(secciones).map(([seccion, campos]) => [
      seccion,
      Object.fromEntries(Object.entries(campos).map(([campo, lista]) => [campo, lista.map(conImagen)])),
    ]),
  );
  const llenados = convex<number>("semilla:cargarContenido", { pagina, secciones: conIds });
  console.log(`${pagina}: ${llenados} campos llenados`);
}
