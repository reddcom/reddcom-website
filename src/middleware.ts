import { defineMiddleware } from "astro:middleware";

/* El CDN de Vercel guarda cada página 60 s: así no se consulta Convex en
   cada visita y un cambio del CMS se ve en menos de un minuto. Pasado ese
   tiempo sirve la copia anterior mientras arma la nueva en segundo plano. */
const CACHE_PAGINAS = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";

export const onRequest = defineMiddleware(async (_contexto, siguiente) => {
  const respuesta = await siguiente();
  const esPagina = respuesta.headers.get("content-type")?.startsWith("text/html");
  if (import.meta.env.PROD && respuesta.ok && esPagina && !respuesta.headers.has("cache-control")) {
    respuesta.headers.set("Cache-Control", CACHE_PAGINAS);
  }
  return respuesta;
});
