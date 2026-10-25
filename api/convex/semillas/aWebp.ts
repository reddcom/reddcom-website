/* =========================================================
   MIGRACIÓN DEL BANCO DE IMÁGENES A WEBP
   Uso (desde api/convex):
     node --experimental-strip-types semillas/aWebp.ts
   Descarga cada imagen del banco que todavía no es WebP, la
   convierte igual que el CMS (WebP a 1920 px), la sube y
   cambia el archivo de la fila; el original se borra. Se
   puede repetir: solo toca las que faltan.
   Necesita cwebp: brew install webp
========================================================= */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { TIPO_IMAGEN } from "../compartido/imagenes.ts";
import { convertirAWebp } from "./webp.ts";

const PAQUETE = resolve(import.meta.dirname, "..");
const TEMPORAL = mkdtempSync(join(tmpdir(), "reddcom-webp-"));

function convex<T>(funcion: string, args: Record<string, unknown> = {}): T {
  const salida = execFileSync("npx", ["convex", "run", funcion, JSON.stringify(args)], {
    cwd: PAQUETE,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  // Las mutaciones sin valor de retorno no imprimen nada.
  return (salida.trim() ? JSON.parse(salida) : undefined) as T;
}

const pendientes = convex<{ id: string; nombre: string; url: string | null }[]>("semilla:imagenesSinWebp");
console.log(`${pendientes.length} imágenes por convertir`);

for (const { id, nombre, url } of pendientes) {
  if (!url) {
    console.log(`! ${nombre}: el archivo ya no existe, se omite`);
    continue;
  }
  const descarga = await fetch(url);
  if (!descarga.ok) throw new Error(`No se pudo descargar ${nombre}: ${descarga.status}`);

  const original = join(TEMPORAL, id);
  const webp = `${original}.webp`;
  writeFileSync(original, Buffer.from(await descarga.arrayBuffer()));
  convertirAWebp(original, webp);

  const subida = await fetch(convex<string>("semilla:urlDeSubida"), {
    method: "POST",
    headers: { "Content-Type": TIPO_IMAGEN },
    body: readFileSync(webp),
  });
  if (!subida.ok) throw new Error(`No se pudo subir ${nombre}: ${subida.status}`);
  const { storageId } = (await subida.json()) as { storageId: string };

  const nuevoNombre = nombre.replace(/\.[^.]+$/, "") + ".webp";
  convex("semilla:reemplazarArchivo", { id, storageId, nombre: nuevoNombre });
  console.log(`✓ ${nombre} → ${nuevoNombre}`);
}
