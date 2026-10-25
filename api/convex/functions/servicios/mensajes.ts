import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { invalido } from "../lib/errores";
import type { Datos } from "../lib/repositorio";
import { existente, textoOpcional, textoRequerido } from "../lib/validacion";
import { mensajes } from "../repositorios/mensajes";

/* =========================================================
   ENVÍO PÚBLICO
   El formulario no exige sesión, así que el servicio limpia
   cada campo, acota longitudes y limita envíos repetidos.
========================================================= */

const VENTANA_MS = 10 * 60 * 1000;
const MAXIMO_POR_VENTANA = 3;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function conLimite(valor: string, maximo: number, campo: string) {
  if (valor.length > maximo) invalido(`${campo} admite hasta ${maximo} caracteres.`);
  return valor;
}

export type EntradaMensaje = Omit<Datos<"mensajes">, "fecha" | "leido">;

export async function enviarMensaje(ctx: MutationCtx, entrada: EntradaMensaje) {
  const correo = conLimite(textoRequerido(entrada.correo, "El correo").toLowerCase(), 120, "El correo");
  if (!FORMATO_CORREO.test(correo)) invalido("Escribe un correo válido.");

  const ahora = Date.now();
  const recientes = await mensajes.recientesDe(ctx, correo, ahora - VENTANA_MS);
  if (recientes.length >= MAXIMO_POR_VENTANA) {
    invalido("Ya recibimos tus mensajes. Espera unos minutos antes de enviar otro.");
  }

  const opcional = (valor: string | undefined, maximo: number, campo: string) => {
    const limpio = textoOpcional(valor);
    return limpio === undefined ? undefined : conLimite(limpio, maximo, campo);
  };

  await mensajes.insertar(ctx, {
    nombre: conLimite(textoRequerido(entrada.nombre, "El nombre"), 100, "El nombre"),
    correo,
    telefono: opcional(entrada.telefono, 30, "El teléfono"),
    empresa: opcional(entrada.empresa, 100, "La empresa"),
    pais: opcional(entrada.pais, 60, "El país"),
    motivo: entrada.motivo,
    mensaje: conLimite(textoRequerido(entrada.mensaje, "El mensaje"), 3000, "El mensaje"),
    fecha: ahora,
    leido: false,
  });
}

/* =========================================================
   BANDEJA DEL CMS
========================================================= */

export async function listarBandeja(ctx: QueryCtx) {
  return { mensajes: await mensajes.listar(ctx), sinLeer: await mensajes.contarSinLeer(ctx) };
}

export function contarSinLeer(ctx: QueryCtx) {
  return mensajes.contarSinLeer(ctx);
}

export async function marcarLeido(ctx: MutationCtx, id: Id<"mensajes">, leido: boolean) {
  existente(await mensajes.obtener(ctx, id), "El mensaje");
  await mensajes.actualizar(ctx, id, { leido });
}

export async function eliminarMensaje(ctx: MutationCtx, id: Id<"mensajes">) {
  existente(await mensajes.obtener(ctx, id), "El mensaje");
  await mensajes.eliminar(ctx, id);
}
