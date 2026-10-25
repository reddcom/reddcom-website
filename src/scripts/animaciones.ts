import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/* =========================================================
   ANIMACIONES DEL SITIO
   Se declaran en el HTML con data-anim y aquí se les da vida,
   así las páginas no repiten scripts. Solo animan transform y
   opacity; con movimiento reducido no se aplica ninguna.

   data-anim="titulo"    palabras que suben desde una máscara
   data-anim="hero"      entrada escalonada de [data-hero-item] y zoom de [data-hero-fondo]
   data-anim="foto"      foto que se descubre de abajo hacia arriba
   data-anim="revelar"   bloque que aparece al hacer scroll
   data-anim="parallax"  foto que se desplaza más lento que el scroll
   data-anim="flotar"    vaivén suave e infinito
   data-anim="girar"     rotación infinita (insignias circulares)
   data-anim="franja"    cinta de palabras en bucle
   data-anim="inclinar"  tarjetas que entran en 3D
   data-contar           cifra que cuenta desde 0 ("+20", "98%", "2005")
========================================================= */

gsap.registerPlugin(ScrollTrigger, SplitText);

let contexto: gsap.MatchMedia | undefined;

const todos = (selector: string) => gsap.utils.toArray<HTMLElement>(selector);

function titulos() {
  todos('[data-anim="titulo"]').forEach((titulo) => {
    const division = SplitText.create(titulo, { type: "words", mask: "words" });
    gsap.from(division.words, {
      yPercent: 110,
      duration: 0.9,
      ease: "power4.out",
      stagger: 0.06,
      scrollTrigger: { trigger: titulo, start: "top 90%", once: true },
    });
  });
}

function heros() {
  todos('[data-anim="hero"]').forEach((hero) => {
    const fondo = hero.querySelector("[data-hero-fondo]");
    if (fondo) gsap.from(fondo, { scale: 1.18, duration: 2.2, ease: "power3.out" });
    gsap.from(hero.querySelectorAll("[data-hero-item]"), {
      y: 40,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.1,
      delay: 0.2,
    });
  });
}

function fotos() {
  todos('[data-anim="foto"]').forEach((foto) => {
    gsap
      .timeline({ scrollTrigger: { trigger: foto, start: "top 90%", once: true } })
      .from(foto, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.2, ease: "power4.inOut" })
      .from(foto.querySelector("img") ?? foto, { scale: 1.25, duration: 1.6, ease: "power3.out" }, 0);
  });
}

function revelar() {
  gsap.set('[data-anim="revelar"]', { y: 40, opacity: 0 });
  ScrollTrigger.batch('[data-anim="revelar"]', {
    start: "top 90%",
    once: true,
    onEnter: (bloques) =>
      gsap.to(bloques, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.1 }),
  });
}

function parallax() {
  todos('[data-anim="parallax"]').forEach((foto) => {
    gsap.fromTo(
      foto,
      { yPercent: -8 },
      {
        yPercent: 8,
        ease: "none",
        scrollTrigger: { trigger: foto.parentElement ?? foto, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });
}

function bucles() {
  todos('[data-anim="flotar"]').forEach((elemento, indice) => {
    gsap.to(elemento, { y: -12, duration: 2.4 + indice * 0.3, ease: "sine.inOut", yoyo: true, repeat: -1 });
  });
  todos('[data-anim="girar"]').forEach((elemento) => {
    gsap.to(elemento, { rotation: 360, duration: 18, ease: "none", repeat: -1 });
  });
  // La pista lleva la lista dos veces: moverla la mitad cierra el bucle sin salto.
  todos('[data-anim="franja"]').forEach((pista) => {
    gsap.to(pista, { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
  });
}

function inclinar() {
  todos('[data-anim="inclinar"]').forEach((grupo) => {
    gsap.from(grupo.children, {
      rotationX: 35,
      y: 80,
      opacity: 0,
      transformPerspective: 900,
      duration: 1.1,
      ease: "power3.out",
      stagger: 0.08,
      delay: 0.4,
    });
  });
}

function contadores() {
  todos("[data-contar]").forEach((cifra) => {
    const original = cifra.textContent?.trim() ?? "";
    const coincidencia = original.match(/^(\D*)(\d+)(\D*)$/);
    if (!coincidencia) return;

    const [, antes, numero, despues] = coincidencia;
    const valor = { actual: 0 };
    gsap.to(valor, {
      actual: Number(numero),
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: cifra, start: "top 90%", once: true },
      onUpdate: () => (cifra.textContent = `${antes}${Math.round(valor.actual)}${despues}`),
      onComplete: () => (cifra.textContent = original),
    });
  });
}

function iniciar() {
  contexto = gsap.matchMedia();
  contexto.add("(prefers-reduced-motion: no-preference)", () => {
    titulos();
    heros();
    fotos();
    revelar();
    parallax();
    bucles();
    inclinar();
    contadores();
  });
}

// Con ClientRouter las páginas cambian sin recargar: se inicia en cada carga
// y se revierte todo antes de salir para no dejar animaciones huérfanas.
document.addEventListener("astro:page-load", iniciar);
document.addEventListener("astro:before-swap", () => contexto?.revert());
