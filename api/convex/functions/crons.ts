import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// CVs de formularios sin terminar e imágenes sin registrar (ver servicios/postulaciones).
crons.daily("limpiar archivos huerfanos", { hourUTC: 9, minuteUTC: 0 }, internal.postulaciones.limpiarArchivosHuerfanos);

export default crons;
