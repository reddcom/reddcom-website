// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  // SSR: cada página lee el CMS al visitarse (la caché corta está en src/middleware.ts).
  output: "server",
  adapter: vercel(),
  // Sitio en 3000 y CMS en 3001 (ver apps/cms/vite.config.ts).
  // allowedHosts: para compartir el servidor local con un túnel de Cloudflare.
  server: { port: 3000, allowedHosts: [".trycloudflare.com"] },
  vite: {
    plugins: [tailwindcss()],
  },
});
