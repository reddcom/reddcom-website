/* =========================================================
   PISTAS HORIZONTALES CON FLECHAS
   Dentro de un [data-pista-grupo], las flechas
   [data-pista-anterior] y [data-pista-siguiente] desplazan la
   lista [data-pista] una tarjeta (ancho + separación).
========================================================= */

function iniciarPistas() {
  document.querySelectorAll<HTMLElement>("[data-pista-grupo]").forEach((grupo) => {
    const pista = grupo.querySelector<HTMLElement>("[data-pista]");
    if (!pista) return;

    const paso = () => {
      const primera = pista.firstElementChild as HTMLElement | null;
      const separacion = parseFloat(getComputedStyle(pista).columnGap) || 0;
      return (primera?.offsetWidth ?? 0) + separacion;
    };

    grupo
      .querySelector("[data-pista-anterior]")
      ?.addEventListener("click", () => pista.scrollBy({ left: -paso(), behavior: "smooth" }));
    grupo
      .querySelector("[data-pista-siguiente]")
      ?.addEventListener("click", () => pista.scrollBy({ left: paso(), behavior: "smooth" }));
  });
}

document.addEventListener("astro:page-load", iniciarPistas);
