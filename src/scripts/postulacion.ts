import {
  esquemaPostulacion,
  problemaConCv,
  tieneFirmaPdf,
  type CampoPostulacion,
} from "../../api/convex/compartido/postulaciones";

/* =========================================================
   FORMULARIO DE POSTULACIÓN
   Validación en tiempo real con el mismo esquema de Zod que
   usa Convex: un campo se revisa al salir de él y, desde ese
   momento, en cada tecla (el error aparece tarde y se va
   pronto). Al enviar se revisa todo y se enfoca el primer
   error. El envío sube el CV a Convex y luego llama a la
   acción `postulaciones:enviar`, que vuelve a validar.
========================================================= */

const URL_CONVEX = import.meta.env.PUBLIC_CONVEX_URL;
const CAMPOS = ["nombre", "correo", "telefono", "enlace", "mensaje", "consentimiento"] as const satisfies CampoPostulacion[];
type Campo = (typeof CAMPOS)[number];

async function llamar(tipo: "mutation" | "action", path: string, args: Record<string, unknown>) {
  const respuesta = await fetch(`${URL_CONVEX}/api/${tipo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  const resultado = await respuesta.json();
  if (resultado.status !== "success") {
    throw new Error(resultado.errorData?.mensaje ?? "No pudimos enviar tu postulación. Intenta de nuevo.");
  }
  return resultado.value;
}

function iniciarFormulario(formulario: HTMLFormElement) {
  const seccion = formulario.closest("section")!;
  const estado = formulario.querySelector<HTMLElement>("[data-estado]")!;
  const textoBoton = formulario.querySelector<HTMLElement>("[data-texto-boton]")!;
  const boton = formulario.querySelector<HTMLButtonElement>("button[type=submit]")!;
  const entradaCv = formulario.querySelector<HTMLInputElement>("input[name=cv]")!;
  const zonaCv = formulario.querySelector<HTMLElement>("[data-zona-cv]")!;
  const mensaje = formulario.querySelector<HTMLTextAreaElement>("textarea[name=mensaje]")!;
  const contador = formulario.querySelector<HTMLElement>("[data-contador]")!;

  const tocados = new Set<string>();
  let cv: File | null = null;
  let errorCv: string | null = "Adjunta tu CV en PDF.";

  const entrada = (campo: Campo) => formulario.elements.namedItem(campo) as HTMLInputElement;
  const valor = (campo: Campo) => (campo === "consentimiento" ? entrada(campo).checked : entrada(campo).value);

  function mostrarError(campo: string, mensajeError: string | null) {
    const contenedor = formulario.querySelector<HTMLElement>(`[data-campo="${campo}"]`)!;
    contenedor.querySelector<HTMLElement>("[data-error]")!.textContent = mensajeError ?? "";
    const control = campo === "cv" ? entradaCv : entrada(campo as Campo);
    control.setAttribute("aria-invalid", String(Boolean(mensajeError)));
    if (campo === "cv") zonaCv.toggleAttribute("data-invalido", Boolean(mensajeError));
  }

  /** Valida un campo con su regla del esquema; devuelve si es válido. */
  function validar(campo: Campo, mostrar = tocados.has(campo)) {
    const resultado = esquemaPostulacion.shape[campo].safeParse(valor(campo));
    if (mostrar) mostrarError(campo, resultado.success ? null : (resultado.error.issues[0]?.message ?? "Revisa este campo."));
    return resultado.success;
  }

  for (const campo of CAMPOS) {
    const control = entrada(campo);
    control.addEventListener("blur", () => {
      tocados.add(campo);
      validar(campo);
    });
    control.addEventListener(campo === "consentimiento" ? "change" : "input", () => {
      if (campo === "consentimiento") tocados.add(campo);
      validar(campo);
    });
  }

  mensaje.addEventListener("input", () => {
    contador.textContent = `${mensaje.value.length} / 1000`;
  });

  /* ---------- CV: tipo, tamaño y firma de PDF, apenas se elige ---------- */

  async function revisarCv(archivo: File | undefined) {
    tocados.add("cv");
    cv = archivo ?? null;
    errorCv = !archivo ? "Adjunta tu CV en PDF." : problemaConCv(archivo.type, archivo.size);
    if (archivo && !errorCv && !tieneFirmaPdf(new Uint8Array(await archivo.slice(0, 5).arrayBuffer()))) {
      errorCv = "El archivo no es un PDF válido.";
    }

    const nombre = formulario.querySelector<HTMLElement>("[data-nombre-cv]")!;
    const detalle = formulario.querySelector<HTMLElement>("[data-detalle-cv]")!;
    const listo = Boolean(archivo && !errorCv);
    nombre.textContent = archivo ? archivo.name : "Adjunta tu CV o arrástralo aquí";
    detalle.textContent = archivo
      ? `${(archivo.size / 1024 / 1024).toFixed(1)} MB · ${listo ? "listo para enviar" : "no se puede usar"} · toca para cambiarlo`
      : "Solo PDF · máximo 5 MB";
    formulario.querySelector("[data-icono-vacio]")!.classList.toggle("hidden", listo);
    formulario.querySelector("[data-icono-listo]")!.classList.toggle("hidden", !listo);
    mostrarError("cv", errorCv);
  }

  entradaCv.addEventListener("change", () => revisarCv(entradaCv.files?.[0]));
  zonaCv.addEventListener("dragover", (evento) => {
    evento.preventDefault();
    zonaCv.setAttribute("data-arrastrando", "");
  });
  zonaCv.addEventListener("dragleave", () => zonaCv.removeAttribute("data-arrastrando"));
  zonaCv.addEventListener("drop", (evento) => {
    evento.preventDefault();
    zonaCv.removeAttribute("data-arrastrando");
    const archivo = evento.dataTransfer?.files[0];
    if (!archivo) return;
    // Se refleja en el input para que el formulario y el lector de pantalla lo vean.
    const lista = new DataTransfer();
    lista.items.add(archivo);
    entradaCv.files = lista.files;
    revisarCv(archivo);
  });

  /* ---------- Envío ---------- */

  async function enviar() {
    estado.textContent = "";
    CAMPOS.forEach((campo) => tocados.add(campo));
    tocados.add("cv");

    const invalidos = CAMPOS.filter((campo) => !validar(campo, true));
    mostrarError("cv", errorCv);
    if (invalidos.length > 0 || errorCv || !cv) {
      const primero = invalidos[0] ? entrada(invalidos[0]) : entradaCv;
      (primero === entradaCv ? zonaCv : primero).scrollIntoView({ behavior: "smooth", block: "center" });
      primero.focus({ preventScroll: true });
      return;
    }

    const datos = esquemaPostulacion.parse(Object.fromEntries(CAMPOS.map((campo) => [campo, valor(campo)])));
    boton.disabled = true;
    try {
      textoBoton.textContent = "Subiendo tu CV…";
      const urlSubida: string = await llamar("mutation", "postulaciones:generarUrlSubida", {});
      const subida = await fetch(urlSubida, { method: "POST", headers: { "Content-Type": cv.type }, body: cv });
      if (!subida.ok) throw new Error("No pudimos subir tu CV. Revisa tu conexión e intenta de nuevo.");
      const { storageId } = await subida.json();

      textoBoton.textContent = "Enviando…";
      // Los opcionales vacíos ya vienen como `undefined` del esquema: no viajan.
      await llamar("action", "postulaciones:enviar", {
        ...datos,
        vacanteId: formulario.dataset.vacante,
        cvId: storageId,
        sitioWeb: (formulario.elements.namedItem("sitioWeb") as HTMLInputElement).value || undefined,
      });

      formulario.hidden = true;
      const exito = seccion.querySelector<HTMLElement>("[data-exito]")!;
      exito.hidden = false;
      exito.focus();
    } catch (error) {
      estado.textContent = error instanceof Error ? error.message : "No pudimos enviar tu postulación. Intenta de nuevo.";
    } finally {
      boton.disabled = false;
      textoBoton.textContent = "Enviar postulación";
    }
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    enviar();
  });
}

document.addEventListener("astro:page-load", () => {
  document.querySelectorAll<HTMLFormElement>("[data-postulacion]").forEach(iniciarFormulario);
});
