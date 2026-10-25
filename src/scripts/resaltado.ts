/* =========================================================
   RESALTADO DE CAMPOS (vista previa del CMS)
   El CMS muestra el sitio en un iframe y, al pedirlo el
   editor, envía { tipo: "cms:resaltar", seccion, campo,
   ancla }. Aquí se busca el elemento cuyo data-cms incluye
   "seccion.campo" (puede listar varios campos separados por
   espacio) o, si no está marcado, la sección #ancla; se centra
   y se marca un momento. Fuera del iframe no hace nada.
========================================================= */

type Aviso = { tipo: "cms:resaltar"; seccion: string; campo: string; ancla: string };

const DURACION = 3500;
let marcado: { elemento: HTMLElement; outline: string; offset: string; sombra: string } | undefined;
let temporizador: number | undefined;

function esAviso(dato: unknown): dato is Aviso {
  if (typeof dato !== "object" || dato === null) return false;
  const { tipo, seccion, campo, ancla } = dato as Record<string, unknown>;
  // Las claves del registro son identificadores simples; nada más entra al selector.
  const clave = (valor: unknown) => typeof valor === "string" && /^[\w-]+$/.test(valor);
  return tipo === "cms:resaltar" && clave(seccion) && clave(campo) && clave(ancla);
}

// Un campo puede pintarse en varios lugares (p. ej. menú de escritorio y móvil): se usa el visible.
const esVisible = (elemento: HTMLElement) => elemento.getClientRects().length > 0;

function buscar({ seccion, campo, ancla }: Aviso) {
  const candidatos = document.querySelectorAll<HTMLElement>(`[data-cms~="${seccion}.${campo}"]`);
  return [...candidatos].find(esVisible) ?? document.getElementById(ancla);
}

function quitarMarca() {
  if (!marcado) return;
  const { elemento, outline, offset, sombra } = marcado;
  Object.assign(elemento.style, { outline, outlineOffset: offset, boxShadow: sombra });
  marcado = undefined;
}

function marcar(elemento: HTMLElement) {
  quitarMarca();
  window.clearTimeout(temporizador);
  const { outline, outlineOffset, boxShadow } = elemento.style;
  marcado = { elemento, outline, offset: outlineOffset, sombra: boxShadow };

  Object.assign(elemento.style, {
    outline: "3px solid #19a9e5",
    outlineOffset: "4px",
    boxShadow: "0 0 0 9999px rgba(7, 28, 48, 0.12)",
  });
  elemento.scrollIntoView({ behavior: "smooth", block: "center" });
  temporizador = window.setTimeout(quitarMarca, DURACION);
}

if (window.parent !== window) {
  window.addEventListener("message", (evento) => {
    // Solo se atiende a la página que contiene al iframe (el CMS).
    if (evento.source !== window.parent || !esAviso(evento.data)) return;
    const elemento = buscar(evento.data);
    if (elemento) marcar(elemento);
  });
}
