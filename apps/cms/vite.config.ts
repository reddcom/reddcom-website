import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El codificador WebP carga su .wasm por URL relativa; el preempaquetado de Vite la rompería.
  optimizeDeps: { exclude: ["@jsquash/webp"] },
  // Puerto fijo: coincide con SITE_URL de Better Auth en Convex.
  // allowedHosts: para compartir el servidor local con un túnel de Cloudflare.
  server: { port: 3001, strictPort: true, allowedHosts: [".trycloudflare.com"] },
});
