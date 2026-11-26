// ---- Configuration ----
// These are the public-safe Supabase Project URL and publishable (anon) key.
// They are safe to expose in client-side code: every table they can reach
// is protected by Row Level Security policies set in the database.
const SUPABASE_URL = "https://lpvqaelyddzuolpkokaq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_4iSBJhSoMIRHyf9MpkeizQ_sAuWmzXz";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Small helpers ----
function el(tag, props, children) {
  const node = document.createElement(tag);
  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      if (key === "class") node.className = value;
      else if (key === "html") node.innerHTML = value; // only used with our own escaped text, avoided elsewhere
      else node.setAttribute(key, value);
    });
  }
  (children || []).forEach((child) => {
    if (child == null) return;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  });
  if (node.classList && node.classList.contains("tilt")) attachTilt(node);
  return node;
}

function setText(id, value, fallback) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = value && String(value).trim() ? value : (fallback || "");
}

// ---- Animated number counter (hero stat cards) ----
const countPrefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function setCount(node, value) {
  if (!node) return;
  const target = parseInt(value, 10);
  if (node.dataset.value === String(value)) return;
  node.dataset.value = String(value);
  if (!Number.isFinite(target) || countPrefersReduced || !node.hasAttribute("data-count")) {
    node.textContent = String(value);
    return;
  }
  const duration = 1400;
  const start = performance.now();
  const runId = (node._countRun = (node._countRun || 0) + 1);
  function step(now) {
    if (runId !== node._countRun) return; // a newer value took over
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---- Years of experience: total months actually worked, summed over the Experience timeline ----
// Periods look like "June 2006 – October 2012" or "October 2024 – Present". Months are counted
// inclusively (June 2006 – October 2012 = 6 years, 5 months), the same way the CV states them.
// The fallback matches the CV (17+ years); the figure updates itself from the live data.
const CAREER_YEARS_FALLBACK = 17;
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function parseMonthYear(text) {
  const t = String(text || "").trim().toLowerCase();
  if (/present|current|now/.test(t)) {
    const d = new Date();
    return d.getFullYear() * 12 + d.getMonth();
  }
  const m = t.match(/([a-z]+)\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS.findIndex((name) => name.startsWith(m[1].slice(0, 3)));
  return month === -1 ? null : parseInt(m[2], 10) * 12 + month;
}

function periodMonths(period) {
  const parts = String(period || "").split(/\s*[–-]\s*/);
  if (parts.length < 2) return 0;
  const start = parseMonthYear(parts[0]);
  const end = parseMonthYear(parts[1]);
  return start != null && end != null && end >= start ? end - start + 1 : 0;
}

function formatDuration(months) {
  if (!months) return "";
  const y = Math.floor(months / 12);
  const m = months % 12;
  const out = [];
  if (y) out.push(`${y} ${y === 1 ? "year" : "years"}`);
  if (m) out.push(`${m} ${m === 1 ? "month" : "months"}`);
  return out.join(", ");
}

function setCareerYears(years) {
  if (!(years > 0)) return;
  document.querySelectorAll(".js-years").forEach((node) => setCount(node, years));
  setText("about-experience", `${years}+ years`);
}

// Database text can contain long dashes; show them as a middot separator instead.
function tidy(value) {
  return value == null ? value : String(value).replace(/\s*\u2014\s*/g, " · ");
}

// ---- Resume requests: the resume is shared on request, so "Request Resume" links open the
// contact form with the message pre-filled (contact.html?request=resume).
function initResumeRequest() {
  const message = document.getElementById("message");
  if (!message) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("request") !== "resume") return;
  if (!message.value.trim()) {
    message.value = "Hello Josue, I would like to request a copy of your resume. The role / project is: ";
  }
  const name = document.getElementById("name");
  if (name) name.focus({ preventScroll: true });
}

function showEmptyState(container, message) {
  container.replaceChildren(el("p", { class: "empty-state" }, [message]));
}

// ---- Theme toggle (dark by default, remembers the visitor's choice) ----
function initThemeToggle() {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  let saved = null;
  try { saved = window.localStorage.getItem("theme"); } catch (_e) { /* storage may be unavailable */ }
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  const initial = saved || (prefersLight ? "light" : "dark");
  root.setAttribute("data-theme", initial);
  toggle.setAttribute("aria-pressed", String(initial === "light"));

  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    toggle.setAttribute("aria-pressed", String(next === "light"));
    toggle.setAttribute("aria-label", next === "light" ? "Switch to dark theme" : "Switch to light theme");
    try { window.localStorage.setItem("theme", next); } catch (_e) { /* ignore */ }
  });
}

// ---- Mobile hamburger nav ----
function initMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("mobile-nav");
  if (!toggle || !nav) return;

  function close() {
    nav.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
  function open() {
    nav.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  }

  toggle.addEventListener("click", () => {
    if (nav.hidden) open(); else close();
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !nav.hidden) close();
  });
}

// ---- Scroll-reveal animations ----
function initRevealAnimations() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced || !("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((t) => observer.observe(t));
}

// ---- Hero pillars: typed one at a time, terminal style ----
// The full list stays in the page as screen-reader text; this only animates the visible line.
function initPillarTyping() {
  const node = document.getElementById("pillar-text");
  if (!node) return;
  const pillars = (node.dataset.pillars || "").split("|").map((p) => p.trim()).filter(Boolean);
  if (pillars.length < 2) return;
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { node.textContent = pillars.join(" · "); return; }

  let index = 0;
  let chars = 0;
  let deleting = false;
  node.textContent = "";

  function tick() {
    const word = pillars[index];
    if (!deleting) {
      chars += 1;
      node.textContent = word.slice(0, chars);
      if (chars === word.length) { deleting = true; setTimeout(tick, 1800); return; }
      setTimeout(tick, 65 + Math.random() * 45); // slight jitter reads as real typing
    } else {
      chars -= 1;
      node.textContent = word.slice(0, chars);
      if (chars === 0) { deleting = false; index = (index + 1) % pillars.length; setTimeout(tick, 350); return; }
      setTimeout(tick, 28);
    }
  }
  setTimeout(tick, 700);
}

// ---- 3D tilt interaction (skill/credential/project/timeline cards, hero photo) ----
// Any element with a "tilt" class gets a subtle pointer-tracked perspective
// tilt plus a soft light sheen — the existing look and layout are untouched,
// this only adds a reactive depth effect on top of it. Skipped entirely for
// touch devices (no hover) and when the visitor prefers reduced motion.
const TILT_MAX_DEG = 8;
const tiltPrefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const tiltIsTouchDevice =
  (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) || "ontouchstart" in window;

function attachTilt(node) {
  if (!node || node.dataset.tiltReady || tiltPrefersReduced || tiltIsTouchDevice) return;
  node.dataset.tiltReady = "1";

  function onMove(event) {
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * TILT_MAX_DEG * 2;
    const ry = (px - 0.5) * TILT_MAX_DEG * 2;
    node.style.setProperty("--tilt-rx", `${rx.toFixed(2)}deg`);
    node.style.setProperty("--tilt-ry", `${ry.toFixed(2)}deg`);
    node.style.setProperty("--tilt-gx", `${(px * 100).toFixed(1)}%`);
    node.style.setProperty("--tilt-gy", `${(py * 100).toFixed(1)}%`);
  }
  function onLeave() {
    node.style.setProperty("--tilt-rx", "0deg");
    node.style.setProperty("--tilt-ry", "0deg");
  }

  node.addEventListener("mousemove", onMove);
  node.addEventListener("mouseleave", onLeave);
}

function initTiltEffect() {
  document.querySelectorAll(".tilt").forEach(attachTilt);
}

// ---- Interactive particle network background ----
// A full-page, low-opacity canvas of glowing nodes connected by thin lines,
// drifting slowly on their own and gently reacting to the cursor (desktop
// only — touch devices keep the ambient drift but never receive cursor
// interaction). Runs behind all page content; the canvas itself is
// pointer-events:none so nothing on the site becomes unclickable.
function initBackgroundAnimation() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchDevice =
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) || "ontouchstart" in window;

  let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [];
  let rafId = null;
  let glowIntensity = 0; // eased 0..1, drives the cursor glow fade in/out

  const mouse = { x: -9999, y: -9999, active: false, lastMoveAt: 0 };
  const glow = { x: -9999, y: -9999 };

  const REPEL_RADIUS = 140; // px — moderate interaction radius (100-180 range)
  const ATTRACT_RADIUS = 220; // px — larger, much weaker pull ring beyond repulsion
  const PARALLAX_STRENGTH = 26; // px — how far the closest (z=1) particles drift with the cursor

  function particleCount() {
    if (width < 560) return 22; // mobile: 15-30
    if (width < 1000) return 48; // tablet: 35-60
    return 80; // desktop: 60-100
  }

  function connectDistance() {
    if (width < 560) return 100;
    if (width < 1000) return 130;
    return 150;
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") !== "light";
  }

  // Executive monochrome palette: soft white with a few champagne-gold accents.
  function pickColor(dark) {
    const roll = Math.random();
    if (dark) {
      return roll < 0.75 ? "235,235,235" /* soft white */ : "201,169,110" /* champagne gold */;
    }
    return roll < 0.75 ? "40,40,40" : "154,123,63";
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const dark = isDark();
    const count = particleCount();
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      r: Math.random() < 0.12 ? 2.2 + Math.random() * 0.8 : 1 + Math.random() * 1.2,
      colorRgb: pickColor(dark),
      boost: 0,
      z: 0.35 + Math.random() * 0.65, // depth: 0.35 (far) .. 1 (near) — drives parallax + size
    }));
  }

  function onMouseMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.active = true;
    mouse.lastMoveAt = Date.now();
  }
  function onMouseLeave() {
    mouse.active = false;
  }

  if (!isTouchDevice) {
    // Coordinates are captured globally; the canvas itself never receives
    // pointer events (pointer-events: none), so page content stays clickable.
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
  }

  function updateNodes(interactive) {
    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;

      // wrap naturally at the edges
      if (n.x < -10) n.x = width + 10;
      else if (n.x > width + 10) n.x = -10;
      if (n.y < -10) n.y = height + 10;
      else if (n.y > height + 10) n.y = -10;

      n.boost = 0;

      if (interactive) {
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const dist = Math.max(Math.hypot(dx, dy), 0.001);

        if (dist < REPEL_RADIUS) {
          // closer particles get pushed harder; smooth (squared) falloff avoids sudden jumps
          const strength = Math.pow(1 - dist / REPEL_RADIUS, 2) * 0.6;
          n.x += (dx / dist) * strength;
          n.y += (dy / dist) * strength;
          n.boost = 1 - dist / REPEL_RADIUS;
        } else if (dist < ATTRACT_RADIUS) {
          // very subtle inward pull at the larger ring — barely noticeable
          const strength = (1 - (dist - REPEL_RADIUS) / (ATTRACT_RADIUS - REPEL_RADIUS)) * 0.05;
          n.x -= (dx / dist) * strength;
          n.y -= (dy / dist) * strength;
        }
      }
    });
  }

  function drawConnections(interactive, parX, parY) {
    const maxDist = connectDistance();
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist >= maxDist) continue;

        const ax = a.x + parX * a.z * PARALLAX_STRENGTH, ay = a.y + parY * a.z * PARALLAX_STRENGTH;
        const bx = b.x + parX * b.z * PARALLAX_STRENGTH, by = b.y + parY * b.z * PARALLAX_STRENGTH;

        let alpha = 0.16 * (1 - dist / maxDist);
        if (interactive) {
          const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
          const mDist = Math.hypot(midX - mouse.x, midY - mouse.y);
          if (mDist < REPEL_RADIUS) alpha += (1 - mDist / REPEL_RADIUS) * 0.2;
        }
        ctx.strokeStyle = `rgba(200,200,200,${Math.min(alpha, 0.35)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }
  }

  function drawNodes(parX, parY) {
    nodes.forEach((n) => {
      const boosted = n.boost;
      // depth (z) scales size and glow so nearer particles read as closer —
      // combined with the parallax offset below this is what gives the
      // background its 3D feel.
      const radius = n.r * (0.55 + n.z * 0.75) + boosted * 1.2;
      const nx = n.x + parX * n.z * PARALLAX_STRENGTH;
      const ny = n.y + parY * n.z * PARALLAX_STRENGTH;

      if (n.r > 1.8 || boosted > 0.4) {
        // soft glow — cheap radial gradient rather than a canvas blur filter
        const glowR = radius * 4;
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, glowR);
        grad.addColorStop(0, `rgba(${n.colorRgb}, ${(0.22 + boosted * 0.25) * (0.6 + n.z * 0.4)})`);
        grad.addColorStop(1, `rgba(${n.colorRgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgba(${n.colorRgb}, ${(0.55 + boosted * 0.4) * (0.55 + n.z * 0.45)})`;
      ctx.beginPath();
      ctx.arc(nx, ny, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawCursorGlow() {
    if (isTouchDevice || glowIntensity < 0.01) return;
    glow.x += (mouse.x - glow.x) * 0.08;
    glow.y += (mouse.y - glow.y) * 0.08;

    const r = 320;
    const grad = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, r);
    grad.addColorStop(0, `rgba(255,255,255,${0.04 * glowIntensity})`);
    grad.addColorStop(0.5, `rgba(201,169,110,${0.02 * glowIntensity})`);
    grad.addColorStop(1, "rgba(201,169,110,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(glow.x, glow.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const interactive = !isTouchDevice && mouse.active && Date.now() - mouse.lastMoveAt < 2000;
    glowIntensity += ((interactive ? 1 : 0) - glowIntensity) * 0.06;

    // Depth parallax: particles nearer the viewer (higher z) drift further
    // from center-relative cursor position than distant ones, the same way
    // layered scenery does — this is what gives the flat canvas a 3D depth.
    const parX = isTouchDevice ? 0 : ((mouse.x - width / 2) / (width / 2)) * glowIntensity;
    const parY = isTouchDevice ? 0 : ((mouse.y - height / 2) / (height / 2)) * glowIntensity;

    updateNodes(interactive);
    drawCursorGlow();
    drawConnections(interactive, parX, parY);
    drawNodes(parX, parY);

    if (!prefersReduced) rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);

  draw(); // always draw a first frame; loops only when motion isn't reduced

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!document.hidden && !prefersReduced && !rafId) {
      draw();
    }
  });
}

// ---- Load and render profile ----
async function loadProfile() {
  if (!document.querySelector("#hero-bio, #about-location, #contact-location, #about-linkedin, #contact-linkedin")) return;
  const { data, error } = await supabaseClient
    .from("profile")
    .select("full_name, title, tagline, bio, location, years_experience, linkedin_url")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to load profile", error);
    return;
  }

  // Page title, hero name ("Josue Tolentino") and hero title are set in index.html, not from the database.
  setText("hero-bio", data.bio);
  setText("about-location", data.location, "");
  setText("contact-location", data.location, "");

  const linkedinNode = document.getElementById("about-linkedin");
  if (linkedinNode && data.linkedin_url) {
    linkedinNode.replaceChildren(
      el("a", { href: data.linkedin_url, target: "_blank", rel: "noopener noreferrer" }, ["View profile"])
    );
    const footerLink = document.getElementById("footer-linkedin");
    if (footerLink) footerLink.href = data.linkedin_url;
  }
  const contactLinkedinNode = document.getElementById("contact-linkedin");
  if (contactLinkedinNode && data.linkedin_url) {
    contactLinkedinNode.replaceChildren(
      el("a", { href: data.linkedin_url, target: "_blank", rel: "noopener noreferrer" }, ["View profile"])
    );
  }
}

// ---- Skills, grouped by category ----
async function loadSkills() {
  const container = document.getElementById("skills-grid");
  if (!container) return;
  const { data, error } = await supabaseClient
    .from("skills")
    .select("category, item, sort_order")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    showEmptyState(container, "Skills coming soon.");
    return;
  }

  const groups = new Map();
  data.forEach((row) => {
    if (!groups.has(row.category)) groups.set(row.category, []);
    groups.get(row.category).push(row.item);
  });

  const cards = [...groups.entries()].map(([category, items]) =>
    el("div", { class: "skill-card tilt" }, [
      el("h3", null, [category]),
      el("ul", null, items.map((item) => el("li", null, [item]))),
    ])
  );
  container.replaceChildren(...cards);
}

// ---- Generic detail modal (used by certifications and projects) ----
function initDetailModal(ids) {
  const backdrop = document.getElementById(ids.backdrop);
  const closeBtn = document.getElementById(ids.close);
  const titleNode = document.getElementById(ids.title);
  const bodyNode = document.getElementById(ids.body);
  if (!backdrop || !closeBtn) return null;

  let lastFocused = null;

  function close() {
    backdrop.hidden = true;
    if (lastFocused) lastFocused.focus();
  }
  function open(title, rows) {
    lastFocused = document.activeElement;
    titleNode.textContent = title;
    bodyNode.replaceChildren(...rows);
    backdrop.hidden = false;
    closeBtn.focus();
  }

  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.hidden) close();
  });

  return { open, close };
}

function certModalRows(cert) {
  const rows = [];
  if (cert.issuer) rows.push(el("p", { class: "pre-line" }, [el("strong", null, ["Issuer: "]), tidy(cert.issuer)]));
  if (cert.issue_date) rows.push(el("p", null, [el("strong", null, ["Date: "]), cert.issue_date]));
  if (cert.expiry_date) rows.push(el("p", null, [el("strong", null, ["Expiry: "]), cert.expiry_date]));
  if (cert.credential_no) rows.push(el("p", null, [el("strong", null, ["Credential No.: "]), cert.credential_no]));
  if (cert.category) rows.push(el("p", null, [el("strong", null, ["Category: "]), cert.category]));
  if (cert.framework) rows.push(el("p", null, [el("strong", null, ["Framework: "]), tidy(cert.framework)]));
  if (cert.verify_url) {
    rows.push(el("p", null, [
      el("strong", null, ["Verify: "]),
      el("a", { href: cert.verify_url, target: "_blank", rel: "noopener noreferrer" }, [cert.verify_url]),
    ]));
  }
  if (!rows.length) rows.push(el("p", null, ["Full certificate details coming soon."]));
  if (Array.isArray(cert.preview_images) && cert.preview_images.length) {
    const gallery = el("div", { class: "cert-preview" }, cert.preview_images.map((src, i) =>
      el("a", { href: src, target: "_blank", rel: "noopener", class: "cert-preview-item", title: "Open full size" }, [
        el("img", {
          src, loading: "lazy", decoding: "async",
          alt: `${tidy(cert.name)}: certificate preview ${i + 1} of ${cert.preview_images.length}`,
        }),
      ])
    ));
    rows.push(el("p", { class: "cert-preview-note" }, ["Verification copy. Personal identifiers are withheld for privacy."]));
    rows.push(gallery);
  }
  return rows;
}

function openCertModal(certModal, cert) {
  certModal.open(tidy(cert.name), certModalRows(cert));
  const panel = document.querySelector("#cert-modal .modal-panel");
  if (panel) panel.classList.toggle("has-preview", Array.isArray(cert.preview_images) && cert.preview_images.length > 0);
}

// Category filter above the credentials grid (built from the categories present in the data).
function renderCertFilters(items) {
  const bar = document.getElementById("cert-filters");
  if (!bar || !items.length) return;
  const counts = new Map();
  items.forEach((li) => {
    const c = li.dataset.category || "Other";
    counts.set(c, (counts.get(c) || 0) + 1);
  });
  const options = [["All", items.length], ...counts.entries()];
  const buttons = options.map(([label, n]) => {
    const btn = el("button", { type: "button", class: "filter-chip", "aria-pressed": label === "All" ? "true" : "false" }, [
      `${label} `, el("span", { class: "filter-count" }, [String(n)]),
    ]);
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      items.forEach((li) => { li.hidden = label !== "All" && (li.dataset.category || "Other") !== label; });
    });
    return btn;
  });
  bar.replaceChildren(...buttons);
  bar.hidden = false;
}

function projectModalRows(project) {
  const rows = [];
  if (project.client_industry) rows.push(el("p", null, [el("strong", null, ["Client / Sector: "]), project.client_industry]));
  if (project.role) rows.push(el("p", null, [el("strong", null, ["Role: "]), project.role]));
  if (project.tools) rows.push(el("p", null, [el("strong", null, ["Scope / Tools: "]), project.tools]));
  if (project.results) rows.push(el("p", null, [el("strong", null, ["Key Responsibilities / Result: "]), project.results]));
  if (!rows.length) rows.push(el("p", null, ["Full project details coming soon."]));
  return rows;
}

// ---- Certifications ----
async function loadCertifications(certModal) {
  const container = document.getElementById("certifications-list");
  const stat = document.getElementById("stat-certs");
  if (!container && !stat) return;
  const { data, error } = await supabaseClient
    .from("certifications")
    .select("name, issuer, issue_date, expiry_date, preview_images, credential_no, verify_url, framework, category, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (container) showEmptyState(container, "Certifications coming soon.");
    return;
  }

  setCount(stat, data.length);
  if (!container) return;

  const items = data.map((cert) => {
    const metaParts = [tidy(cert.issuer), cert.issue_date].filter(Boolean).join(" · ");
    const metaChildren = [metaParts];
    if (cert.credential_no) metaChildren.push(` · Credential No. ${cert.credential_no}`);

    const li = el("li", { class: "credential-card tilt", tabindex: "0", role: "button", "aria-haspopup": "dialog" }, [
      el("div", { class: "card-title" }, [tidy(cert.name)]),
      el("div", { class: "card-meta" }, metaChildren),
    ]);

    if (cert.category) {
      li.appendChild(el("div", { class: "card-framework" }, [cert.category]));
    }
    if (cert.framework) {
      li.appendChild(el("div", { class: "card-framework" }, [tidy(cert.framework)]));
    }
    li.dataset.category = cert.category || "Other";
    if (Array.isArray(cert.preview_images) && cert.preview_images.length) {
      li.appendChild(el("div", { class: "card-preview-flag" }, ["Certificate preview available"]));
    }
    li.appendChild(el("div", { class: "card-expand-hint" }, ["View details →"]));

    if (certModal) {
      li.addEventListener("click", () => openCertModal(certModal, cert));
      li.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCertModal(certModal, cert);
        }
      });
    }
    return li;
  });
  container.replaceChildren(...items);
  renderCertFilters(items);
}

// ---- Approvals & Accreditations ----
async function loadApprovals() {
  const container = document.getElementById("approvals-list");
  if (!container) return;
  const { data, error } = await supabaseClient
    .from("approvals")
    .select("name, issuer, description, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    showEmptyState(container, "Approvals coming soon.");
    return;
  }

  const items = data.map((row) =>
    el("li", null, [el("strong", null, [tidy(row.name)]), row.issuer ? ` · ${tidy(row.issuer)}` : ""])
  );
  container.replaceChildren(...items);
}

// ---- Education ----
async function loadEducation() {
  const container = document.getElementById("education-list");
  if (!container) return;
  const { data, error } = await supabaseClient
    .from("education")
    .select("qualification, school, year, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    showEmptyState(container, "Education coming soon.");
    return;
  }

  const items = data.map((row) =>
    el("li", { class: "timeline-item" }, [
      el("span", { class: "timeline-node", "aria-hidden": "true" }),
      el("div", { class: "timeline-card glass tilt" }, [
        el("div", { class: "timeline-role" }, [row.qualification]),
        row.school ? el("div", { class: "timeline-meta" }, [row.school]) : null,
        row.year ? el("div", { class: "timeline-period" }, [String(row.year)]) : null,
      ]),
    ])
  );
  container.replaceChildren(...items);
}

// ---- Professional Experience timeline ----
async function loadExperience() {
  const container = document.getElementById("experience-list");
  if (!container && !document.querySelector(".js-years, #about-experience")) return;
  const { data, error } = await supabaseClient
    .from("experience")
    .select("role, company, location, period, description, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (container) showEmptyState(container, "Experience coming soon.");
    return;
  }

  const totalMonths = data.reduce((sum, row) => sum + periodMonths(row.period), 0);
  if (totalMonths) setCareerYears(Math.floor(totalMonths / 12));
  if (!container) return;

  const items = data.map((row) => {
    const titleText = row.role || row.company;
    const metaParts = [];
    if (row.role) metaParts.push(row.company);
    if (row.location) metaParts.push(row.location);

    const cardChildren = [
      el("div", { class: "timeline-role" }, [titleText]),
    ];
    if (metaParts.length) cardChildren.push(el("div", { class: "timeline-meta" }, [tidy(metaParts.join(" · "))]));
    if (row.period) {
      const duration = formatDuration(periodMonths(row.period));
      cardChildren.push(el("div", { class: "timeline-period" }, [
        el("span", null, [row.period]),
        duration ? el("span", { class: "timeline-duration" }, [duration]) : null,
      ]));
    }
    if (row.description) {
      const bullets = row.description.split("|").map((s) => s.trim()).filter(Boolean);
      if (bullets.length) {
        cardChildren.push(el("ul", { class: "timeline-desc" }, bullets.map((b) => el("li", null, [b]))));
      }
    }

    return el("li", { class: "timeline-item" }, [
      el("span", { class: "timeline-node", "aria-hidden": "true" }),
      el("div", { class: "timeline-card glass tilt" }, cardChildren),
    ]);
  });
  container.replaceChildren(...items);
}

// ---- Client Projects ----
async function loadProjects(projectModal) {
  const container = document.getElementById("projects-grid");
  const stat = document.getElementById("stat-projects");
  if (!container && !stat) return;
  const { data, error } = await supabaseClient
    .from("projects")
    .select("name, client_industry, role, tools, results, industry_badge, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (container) showEmptyState(container, "Client projects coming soon.");
    return;
  }

  setCount(stat, data.length);
  if (!container) return;

  const cards = data.map((raw) => {
    const project = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? tidy(v) : v]));
    const card = el("div", { class: "project-card tilt" }, []);
    if (project.industry_badge) {
      card.appendChild(el("div", { class: "badge-row" }, [el("span", { class: "badge" }, [project.industry_badge])]));
    }
    card.appendChild(el("h3", null, [project.name]));
    card.appendChild(el("div", { class: "card-meta" }, [project.client_industry || ""]));
    if (project.role) card.appendChild(el("p", null, [el("span", { class: "project-label" }, ["Role: "]), project.role]));
    if (project.tools) card.appendChild(el("p", null, [el("span", { class: "project-label" }, ["Tools: "]), project.tools]));
    if (project.results) card.appendChild(el("p", null, [el("span", { class: "project-label" }, ["Result: "]), project.results]));

    if (projectModal) {
      const detailBtn = el("button", { type: "button", class: "btn btn-tertiary" }, ["View Details →"]);
      detailBtn.addEventListener("click", () => projectModal.open(project.name, projectModalRows(project)));
      card.appendChild(detailBtn);
    }
    return card;
  });
  container.replaceChildren(...cards);
}

// ---- Access request form ----
// Confirmation shown after a successful enquiry (wording supplied by the site owner).
const ENQUIRY_THANK_YOU =
  "Thank you for your interest in my professional profile.\n\n" +
  "Your recruitment enquiry has been successfully submitted. I will personally review the information provided and get back to you through your registered email address if the opportunity is relevant.\n\n" +
  "I appreciate your time and consideration.";
const ENQUIRY_TYPES = [
  "Employment Opportunity", "Recruitment / Job Offer", "Project Opportunity",
  "EPC / Contractor Enquiry", "Professional Collaboration", "Other",
];

function initAccessForm() {
  const form = document.getElementById("access-form");
  const submitBtn = document.getElementById("access-submit");
  const status = document.getElementById("access-status");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    const formData = new FormData(form);
    const honeypot = (formData.get("website") || "").toString().trim();
    if (honeypot) {
      // Likely a bot. Pretend success, submit nothing.
      status.textContent = ENQUIRY_THANK_YOU;
      status.className = "form-status success";
      form.reset();
      return;
    }

    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const company = (formData.get("company") || "").toString().trim();
    const message = (formData.get("message") || "").toString().trim();
    const jobTitle = (formData.get("job_title") || "").toString().trim();
    const jobLocation = (formData.get("job_location") || "").toString().trim();
    const enquiryType = (formData.get("enquiry_type") || "").toString().trim();
    const jobDescription = (formData.get("job_description") || "").toString().trim();

    if (!name || !email || !company) {
      status.textContent = "Please fill in your name, work email, and company.";
      status.className = "form-status error";
      return;
    }
    if (form.elements.enquiry_type && !ENQUIRY_TYPES.includes(enquiryType)) {
      status.textContent = "Please select an enquiry type.";
      status.className = "form-status error";
      return;
    }

    submitBtn.disabled = true;
    status.textContent = "Sending…";

    const { error } = await supabaseClient.from("access_requests").insert({
      name: name.slice(0, 200),
      email: email.slice(0, 320),
      company: company.slice(0, 200),
      message: message.slice(0, 2000),
      job_title: jobTitle.slice(0, 200) || null,
      job_location: jobLocation.slice(0, 200) || null,
      enquiry_type: enquiryType || null,
      job_description: jobDescription.slice(0, 5000) || null,
    });

    submitBtn.disabled = false;

    if (error) {
      console.error("Access request failed", error);
      const msg = String(error.message || "");
      if (msg.includes("RATE_LIMIT")) {
        // Server-side anti-spam limit (see access_requests_guard in Supabase)
        status.textContent = msg.replace(/^RATE_LIMIT_[A-Z]+:\s*/, "");
      } else if (error.code === "23514") {
        status.textContent = "Please check your details: a valid work email is required, and fields must be within the length limits.";
      } else {
        status.textContent = "Something went wrong. Please try again in a moment.";
      }
      status.className = "form-status error";
      return;
    }

    status.textContent = ENQUIRY_THANK_YOU;
    status.className = "form-status success";
    form.reset();
  });
}

// ---- Init ----
setText("footer-year", String(new Date().getFullYear()));
initThemeToggle();
initMobileNav();
initBackgroundAnimation();
initAccessForm();
initTiltEffect();

const certModal = initDetailModal({
  backdrop: "cert-modal",
  close: "cert-modal-close",
  title: "cert-modal-title",
  body: "cert-modal-body",
});
const projectModal = initDetailModal({
  backdrop: "project-modal",
  close: "project-modal-close",
  title: "project-modal-title",
  body: "project-modal-body",
});

setCareerYears(CAREER_YEARS_FALLBACK);
initResumeRequest();
initPillarTyping();
// start the hero counters at 0 so they visibly count up
document.querySelectorAll(".stat-num [data-count]").forEach((n) => {
  if (!n.dataset.value && /^\d+$/.test(n.textContent)) setCount(n, n.textContent.trim());
});
loadProfile();
loadSkills();
loadCertifications(certModal);
loadApprovals();
loadEducation();
loadExperience();
loadProjects(projectModal);
initRevealAnimations();
