const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const mouse = { x: -9999, y: -9999 };
window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

// Navbar + barra di avanzamento scroll
const nav = document.getElementById("nav");
const progress = document.getElementById("progress");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 30);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
});

// Menu mobile
const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");
burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  navLinks.classList.toggle("open");
});
navLinks.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    burger.classList.remove("open");
    navLinks.classList.remove("open");
  })
);

// Rete neurale di particelle sullo sfondo
const canvas = document.getElementById("network");
const ctx = canvas.getContext("2d");
let points = [];
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(90, Math.floor((innerWidth * innerHeight) / 16000));
  points = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.4 + 0.6,
  }));
}
function drawNetwork() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of points) {
    if (!reduceMotion) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
      if (p.y < 0 || p.y > innerHeight) p.vy *= -1;
      // leggera attrazione verso il mouse
      const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
      if (d < 200) { p.x += dx * 0.004; p.y += dy * 0.004; }
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(225, 225, 235, 0.7)";
    ctx.fill();
  }
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i], b = points[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 140) {
        ctx.strokeStyle = `rgba(200, 200, 212, ${0.16 * (1 - d / 140)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    const a = points[i];
    const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
    if (dm < 180) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * (1 - dm / 180)})`;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
    }
  }
  if (!reduceMotion) requestAnimationFrame(drawNetwork);
}
resizeCanvas();
drawNetwork();
window.addEventListener("resize", () => { resizeCanvas(); if (reduceMotion) drawNetwork(); });

// Alone luminoso che segue il cursore
const glow = document.getElementById("cursorGlow");
if (finePointer && !reduceMotion) {
  let gx = innerWidth / 2, gy = innerHeight / 2;
  (function followGlow() {
    gx += (mouse.x - gx) * 0.12;
    gy += (mouse.y - gy) * 0.12;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(followGlow);
  })();
} else {
  glow.remove();
}

// Effetto "decodifica" sui testi
const glyphs = "!<>-_\\/[]{}—=+*^?#01ΔΣΩ";
function scramble(el) {
  const final = el.dataset.text || (el.dataset.text = el.textContent);
  if (reduceMotion) return;
  let frame = 0;
  const total = final.length * 2 + 12;
  (function step() {
    el.textContent = [...final].map((ch, i) =>
      ch === " " || frame > i * 2 + 12 ? ch : glyphs[Math.floor(Math.random() * glyphs.length)]
    ).join("");
    if (frame++ < total) requestAnimationFrame(step);
  })();
}

// Comparsa degli elementi allo scroll (cascata + decodifica sugli eyebrow)
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = [...el.parentElement.querySelectorAll(":scope > .reveal")];
      el.style.transitionDelay = `${siblings.indexOf(el) * 0.08}s`;
      el.classList.add("visible");
      if (el.matches(".eyebrow")) scramble(el);
      el.querySelectorAll(".badge-text").forEach(scramble);
      el.addEventListener("transitionend", () => { el.style.transitionDelay = ""; el.classList.add("settled"); }, { once: true });
      observer.unobserve(el);
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Parole che si scrivono da sole nell'hero
const typed = document.getElementById("typed");
const words = ["siti web che convertono", "app su misura", "campagne che performano", "contenuti che lasciano il segno", "processi che vanno da soli"];
if (!typed) {
  // pagina senza hero animato
} else if (reduceMotion) {
  typed.textContent = words[0];
} else {
  let w = 0, c = 0, deleting = false;
  (function type() {
    const word = words[w];
    typed.textContent = word.slice(0, c);
    if (!deleting && c === word.length) { deleting = true; return setTimeout(type, 1800); }
    if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; }
    c += deleting ? -1 : 1;
    setTimeout(type, deleting ? 30 : 65);
  })();
}

// Card con inclinazione 3D e luce che segue il mouse
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
    if (reduceMotion) return;
    const rx = (y / r.height - 0.5) * -12;
    const ry = (x / r.width - 0.5) * 12;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
  });
  card.addEventListener("mouseleave", () => { card.style.transform = ""; });
});

// Bottoni magnetici
if (finePointer && !reduceMotion) {
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
    });
    btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
  });
}

// Console dell'Agent AI che lavora in diretta
const consoleBody = document.getElementById("console");
const tasksEl = document.getElementById("tasks");
const tasks = [
  ["Leggo nuova email da un cliente", "bozza di risposta pronta"],
  ["Genero preventivo dalla richiesta web", "PDF inviato al cliente"],
  ["Aggiorno il CRM con un nuovo lead", "lead qualificato"],
  ["Pianifico 5 post per i social", "pubblicazioni programmate"],
  ["Analizzo la campagna Meta Ads", "budget ottimizzato"],
  ["Rispondo a una chat WhatsApp", "appuntamento fissato"],
  ["Creo il report settimanale", "inviato al team"],
];
let taskIndex = 0, done = 0;
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

async function runAgent() {
  while (true) {
    const [action, result] = tasks[taskIndex++ % tasks.length];
    const line = document.createElement("div");
    line.className = "line";
    line.innerHTML = `<span class="prompt">›</span> <span class="txt"></span><span class="spinner"></span>`;
    consoleBody.appendChild(line);
    while (consoleBody.children.length > 6) consoleBody.firstElementChild.remove();
    const txt = line.querySelector(".txt");
    for (let i = 1; i <= action.length; i++) {
      txt.textContent = action.slice(0, i);
      await wait(reduceMotion ? 0 : 28);
    }
    await wait(900 + Math.random() * 700);
    line.querySelector(".spinner").remove();
    line.insertAdjacentHTML("beforeend", `<span class="ok">✓ ${result}</span>`);
    tasksEl.textContent = ++done;
    await wait(600);
  }
}
if (consoleBody) {
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { runAgent(); obs.disconnect(); }
  }, { threshold: 0.3 }).observe(consoleBody);
}

// Contatori animati
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = +el.dataset.count, suffix = el.dataset.suffix || "";
    const start = performance.now(), duration = reduceMotion ? 0 : 1600;
    (function tick(now) {
      const t = duration ? Math.min((now - start) / duration, 1) : 1;
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    })(start);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

// Carosello obiettivi: frecce, trascinamento e barra di avanzamento
const carousel = document.getElementById("goals");
if (carousel) {
  const bar = document.getElementById("goalsBar");
  const step = () => carousel.querySelector(".goal").offsetWidth + 20;
  document.querySelectorAll(".car-btn").forEach((btn) =>
    btn.addEventListener("click", () => carousel.scrollBy({ left: step() * +btn.dataset.dir, behavior: "smooth" }))
  );
  const updateBar = () => {
    const max = carousel.scrollWidth - carousel.clientWidth;
    const visible = carousel.clientWidth / carousel.scrollWidth;
    bar.style.width = `${visible * 100}%`;
    bar.style.transform = `translateX(${max > 0 ? (carousel.scrollLeft / max) * (1 / visible - 1) * 100 : 0}%)`;
  };
  carousel.addEventListener("scroll", updateBar, { passive: true });
  window.addEventListener("resize", updateBar);
  updateBar();

  let dragging = false, moved = false, startX = 0, startScroll = 0;
  carousel.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    dragging = true; moved = false; startX = e.clientX; startScroll = carousel.scrollLeft;
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) { moved = true; carousel.classList.add("dragging"); }
    carousel.scrollLeft = startScroll - dx;
  });
  window.addEventListener("pointerup", () => { dragging = false; carousel.classList.remove("dragging"); });
  carousel.addEventListener("click", (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
  carousel.addEventListener("dragstart", (e) => e.preventDefault());
}

// Tab dei casi d'uso AI
document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === tab.dataset.tab));
  })
);

// Calcolatore del tempo risparmiato
const rPeople = document.getElementById("r-people");
if (rPeople) {
  const rHours = document.getElementById("r-hours"), rCost = document.getElementById("r-cost");
  const fmt = (n) => Math.round(n).toLocaleString("it-IT");
  const calc = () => {
    document.getElementById("o-people").textContent = rPeople.value;
    document.getElementById("o-hours").textContent = rHours.value;
    document.getElementById("o-cost").textContent = `${rCost.value} €`;
    const hours = rPeople.value * rHours.value * 0.6 * 46;
    document.getElementById("calcHours").textContent = fmt(hours);
    document.getElementById("calcEuro").textContent = `${fmt(hours * rCost.value)} €`;
    [rPeople, rHours, rCost].forEach((r) => r.style.setProperty("--p", `${((r.value - r.min) / (r.max - r.min)) * 100}%`));
  };
  [rPeople, rHours, rCost].forEach((r) => r.addEventListener("input", calc));
  calc();
}

// Form di prenotazione: argomenti, precompilazione da obiettivo, invio via email
const goals = {
  sito: ["Sito web & E-commerce", "Vorrei un sito che mi porti nuovi clienti."],
  ecommerce: ["Sito web & E-commerce", "Vorrei lanciare o far crescere un e-commerce."],
  app: ["App & Web App", "Vorrei creare un'app per il mio business."],
  clienti: ["Digital Marketing", "Vorrei trovare nuovi clienti online."],
  social: ["Social & Comunicazione", "Vorrei crescere sui social."],
  brand: ["Social & Comunicazione", "Vorrei rinnovare il mio brand."],
  automazione: ["Agent AI & Automazione", "Vorrei automatizzare alcuni processi con l'AI."],
  assistente: ["Agent AI & Automazione", "Vorrei un assistente AI per i miei clienti."],
  tempo: ["Agent AI & Automazione", "Vorrei risparmiare tempo su email e preventivi."],
  iniziare: [null, "Non so da dove iniziare: vorrei un consiglio su come crescere online."],
};
document.querySelectorAll("[data-book]").forEach((form) => {
  const chips = form.querySelectorAll(".chip");
  chips.forEach((chip) => chip.addEventListener("click", () => chip.classList.toggle("active")));

  const goal = goals[new URLSearchParams(location.search).get("obiettivo")];
  if (goal) {
    chips.forEach((chip) => chip.classList.toggle("active", chip.dataset.topic === goal[0]));
    form.messaggio.value = goal[1];
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const error = form.querySelector(".form-error");
    if (!form.checkValidity()) {
      error.hidden = false;
      form.querySelector(":invalid").focus();
      return;
    }
    error.hidden = true;
    const topics = [...chips].filter((c) => c.classList.contains("active")).map((c) => c.dataset.topic);
    const body = [
      `Nome: ${form.nome.value}`,
      `Email: ${form.email.value}`,
      form.azienda.value ? `Azienda: ${form.azienda.value}` : null,
      topics.length ? `Argomenti: ${topics.join(", ")}` : null,
      "",
      form.messaggio.value,
    ].filter((l) => l !== null).join("\n");
    location.href = `mailto:info@ermeia.agency?subject=${encodeURIComponent("Richiesta consulenza — " + form.nome.value)}&body=${encodeURIComponent(body)}`;
    form.querySelector(".form-success").hidden = false;
  });
});

// Transizione morbida tra le pagine
const pagePath = (p) => p.replace(/index\.html$/, "");
document.querySelectorAll('a[href$=".html"], a[href*=".html?"], a[href*=".html#"]').forEach((link) =>
  link.addEventListener("click", (e) => {
    const url = new URL(link.href);
    if (e.metaKey || e.ctrlKey || reduceMotion) return;
    if (pagePath(url.pathname) === pagePath(location.pathname) && url.search === location.search) {
      if (url.hash) { e.preventDefault(); document.querySelector(url.hash)?.scrollIntoView({ behavior: "smooth" }); history.replaceState(null, "", url.hash); }
      return;
    }
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(() => (location.href = link.href), 350);
  })
);
window.addEventListener("pageshow", () => document.body.classList.remove("leaving"));

// Anno nel footer
document.getElementById("year").textContent = new Date().getFullYear();
