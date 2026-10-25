/** Variables de entorno; falla al arrancar si falta alguna en vez de romperse a medio uso. */
function requerida(nombre: string, valor: string | undefined): string {
  if (!valor) throw new Error(`Falta ${nombre} en apps/cms/.env.local (ver .env.example).`);
  return valor;
}

export const entorno = {
  convexUrl: requerida("VITE_CONVEX_URL", import.meta.env.VITE_CONVEX_URL),
  convexSiteUrl: requerida("VITE_CONVEX_SITE_URL", import.meta.env.VITE_CONVEX_SITE_URL),
  websiteUrl: requerida("VITE_WEBSITE_URL", import.meta.env.VITE_WEBSITE_URL).replace(/\/$/, ""),
};
