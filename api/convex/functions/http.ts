import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Rutas de Better Auth (/api/auth/*). CORS necesario porque el CMS vive en otro dominio.
authComponent.registerRoutes(http, createAuth, { cors: true });

export default http;
