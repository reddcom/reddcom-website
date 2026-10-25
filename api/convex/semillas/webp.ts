import { execFileSync } from "node:child_process";
import { CALIDAD_WEBP, LADO_MAXIMO_IMAGEN } from "../compartido/imagenes.ts";

/**
 * Convierte una imagen local a WebP igual que el CMS: el lado mayor se reduce
 * a LADO_MAXIMO_IMAGEN (las pequeñas no se agrandan). sips la pasa a PNG sin
 * pérdida y cwebp la codifica conservando la transparencia.
 * Necesita cwebp: brew install webp
 */
export function convertirAWebp(entrada: string, salida: string) {
  const medidas = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", entrada], { encoding: "utf8" });
  const ladoMayor = Math.max(...[...medidas.matchAll(/pixel(?:Width|Height): (\d+)/g)].map(([, valor]) => Number(valor)));
  const reducir = ladoMayor > LADO_MAXIMO_IMAGEN ? ["-Z", String(LADO_MAXIMO_IMAGEN)] : [];

  const png = `${salida}.png`;
  execFileSync("sips", ["-s", "format", "png", ...reducir, entrada, "--out", png], { stdio: "ignore" });
  execFileSync("cwebp", ["-quiet", "-q", String(CALIDAD_WEBP), png, "-o", salida]);
}
