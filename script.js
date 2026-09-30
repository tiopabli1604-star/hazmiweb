// Email que recibe las solicitudes del formulario. Cámbialo por el tuyo.
const CONTACT_EMAIL = "hola@hazmiweb.me";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canAnimate = !reduceMotion && window.gsap && window.ScrollTrigger;

// ---------- Navegación: fondo sólido al salir del hero ----------
const nav = document.querySelector(".nav");
const navSentinel = document.createElement("div");
navSentinel.style.cssText = "position:absolute;top:0;height:80px;width:1px;pointer-events:none";
document.body.prepend(navSentinel);
new IntersectionObserver(([e]) => nav.classList.toggle("is-solid", !e.isIntersecting)).observe(navSentinel);

// ---------- Escenas cinematográficas (GSAP ScrollTrigger) ----------
if (canAnimate) {
  document.documentElement.classList.add("has-motion");
  gsap.registerPlugin(ScrollTrigger);

  // Intro: la montaña se aleja y una ventana se abre a Tokio
  const intro = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: ".intro", start: "top top", end: "+=220%", pin: ".intro__stage", scrub: 1, anticipatePin: 1 },
  });
  intro
    .to(".intro__layer--a .intro__img", { scale: 1.25, yPercent: 6 }, 0)
    .to(".intro__copy--a", { opacity: 0, y: -60, duration: .35 }, 0)
    .to(".intro__layer--b", { clipPath: "inset(36% 32% 36% 32% round 28px)", duration: .35 }, 0.2)
    .to(".intro__layer--b", { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: .85 }, 0.55)
    .to(".intro__layer--b .intro__img", { scale: 1, duration: 1.4 }, 0.15)
    .to(".intro__copy--b .kicker", { opacity: 1, y: 0, duration: .35 }, 1.05)
    .fromTo(".intro__copy--b .display", { opacity: 0, y: 40, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: .45 }, 1.2)
    .to(".intro__copy--b .lead", { opacity: 1, duration: .3 }, 1.45)
    .to({}, { duration: .35 });

  // Escenas: aurora, desierto (cortina desde abajo), Tokio (círculo que se abre)
  const bars = document.querySelectorAll(".scenes__progress span");
  const scenes = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".scenes", start: "top top", end: "+=300%", pin: ".scenes__stage", scrub: 1, anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress * 3;
        bars.forEach((b, i) => b.style.setProperty("--p", Math.min(Math.max(p - i, 0), 1).toFixed(3)));
      },
    },
  });
  scenes
    .fromTo(".scene--1 .scene__img", { scale: 1.15 }, { scale: 1, duration: 1 }, 0)
    .from(".scene--1 .scene__copy > *", { opacity: 0, y: 50, stagger: .12, duration: .4 }, 0.05)
    .to(".scene--1 .scene__copy", { opacity: 0, y: -40, duration: .3 }, 0.8)
    .to(".scene--2", { clipPath: "inset(0% 0 0 0)", duration: .6 }, 0.85)
    .fromTo(".scene--2 .scene__img", { scale: 1.3, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 1 }, 0.85)
    .from(".scene--2 .scene__copy > *", { opacity: 0, x: 60, stagger: .12, duration: .4 }, 1.3)
    .to(".scene--2 .scene__copy", { opacity: 0, y: -40, duration: .3 }, 1.85)
    .to(".scene--3", { clipPath: "circle(75% at 50% 50%)", duration: .7 }, 1.9)
    .fromTo(".scene--3 .scene__img", { scale: 1.4, rotate: 2 }, { scale: 1, rotate: 0, duration: 1.1 }, 1.9)
    .from(".scene--3 .scene__copy > *", { opacity: 0, y: 50, stagger: .12, duration: .4 }, 2.4)
    .to({}, { duration: .4 });

  // Proceso: desplazamiento horizontal fijado
  const track = document.querySelector(".process__track");
  const distance = () => track.scrollWidth - window.innerWidth;
  gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: ".process", start: "top top", end: () => `+=${distance()}`,
      pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
    },
  });

  // Paralaje suave del fondo de contacto
  gsap.fromTo(".contact__bg", { yPercent: -8, scale: 1.1 }, {
    yPercent: 8, ease: "none",
    scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true },
  });

  // Apariciones al entrar en pantalla
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 80}ms`;
    io.observe(el);
  });

  // Las imágenes diferidas cambian alturas: recalcula al cargar
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

// ---------- Marquee: duplica la lista para un bucle sin cortes ----------
const marquee = document.querySelector(".marquee__track");
if (marquee && !reduceMotion) {
  [...marquee.children].forEach((li) => {
    const clone = li.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    marquee.appendChild(clone);
  });
}

// ---------- Botones de plan: preselecciona en el formulario ----------
const planSelect = document.getElementById("f-plan");
document.querySelectorAll("[data-plan]").forEach((btn) => {
  btn.addEventListener("click", () => { planSelect.value = btn.dataset.plan; });
});

// ---------- Formulario: valida y abre el correo con el mensaje listo ----------
const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");

function setError(input, show) {
  const err = document.getElementById(`${input.id}-err`);
  input.setAttribute("aria-invalid", show ? "true" : "false");
  if (!err) return;
  err.hidden = !show;
  if (show) input.setAttribute("aria-describedby", err.id);
  else input.removeAttribute("aria-describedby");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const { nombre, email, mensaje, plan } = form.elements;
  const checks = [
    [nombre, nombre.value.trim().length > 1],
    [email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())],
    [mensaje, mensaje.value.trim().length > 5],
  ];
  let firstBad = null;
  checks.forEach(([input, ok]) => {
    setError(input, !ok);
    if (!ok && !firstBad) firstBad = input;
  });
  if (firstBad) {
    firstBad.focus();
    status.textContent = "Revisa los campos marcados.";
    return;
  }
  const subject = `Nueva web: ${plan.value}`;
  const body = `Nombre: ${nombre.value.trim()}\nEmail: ${email.value.trim()}\nPlan: ${plan.value}\n\n${mensaje.value.trim()}`;
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  status.textContent = "Se ha abierto tu programa de correo con el mensaje listo para enviar.";
});

["f-name", "f-email", "f-msg"].forEach((id) => {
  const input = document.getElementById(id);
  input.addEventListener("input", () => {
    if (input.getAttribute("aria-invalid") === "true") setError(input, false);
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
