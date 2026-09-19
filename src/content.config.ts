import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const empleos = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/empleos",
  }),

  schema: z.object({
    titulo: z.string(),
    ubicacion: z.string(),
    area: z.string(),
    tipo: z.string(),
    descripcion: z.string(),
    fechaPublicacion: z.coerce.date(),
    activo: z.boolean(),
  }),
});

export const collections = {
  empleos,
};