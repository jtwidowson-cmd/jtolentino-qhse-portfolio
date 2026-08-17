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
  return node;
}

function setText(id, value, fallback) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = value && String(value).trim() ? value : (fallback || "");
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

// ---- Hero typing effect (cycles through role titles) ----
function initTypingEffect() {
  const node = document.getElementById("typing-text");
  if (!node) return;

  const roles = [
    "IRCA Lead Auditor",
    "RTITB CT Instructor",
    "Abrasive Wheels Instructor",
    "Working at Heights Instructor",
    "EPC & Construction HSE Professional",
    "Oil & Gas Safety Professional",
  ];

  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    node.textContent = roles[0];
    return;
  }

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = roles[roleIndex];

    if (!deleting) {
      charIndex++;
      node.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1500);
        return;
      }
      setTimeout(tick, 55);
    } else {
      charIndex--;
      node.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(tick, 300);
        return;
      }
      setTimeout(tick, 30);
    }
  }

  tick();
}

// ---- Scroll-spy: highlight the active nav link based on visible section ----
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.main-nav a[data-section]');
  if (!navLinks.length || !("IntersectionObserver" in window)) return;

  const linkMap = new Map();
  navLinks.forEach((link) => linkMap.set(link.getAttribute("data-section"), link));

  const sections = [...linkMap.keys()]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = linkMap.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((section) => observer.observe(section));
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

  // Electric blue / cyan majority, subtle violet accent — no rainbow colors.
  function pickColor(dark) {
    const roll = Math.random();
    if (dark) {
      if (roll < 0.55) return "110,180,255"; // electric blue
      if (roll < 0.85) return "80,220,225"; // cyan
      return "175,135,255"; // subtle violet accent
    }
    if (roll < 0.55) return "60,110,220";
    if (roll < 0.85) return "20,150,165";
    return "130,90,210";
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
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      r: Math.random() < 0.12 ? 2.2 + Math.random() * 0.8 : 1 + Math.random() * 1.2,
      colorRgb: pickColor(dark),
      boost: 0,
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

  function drawConnections(interactive) {
    const maxDist = connectDistance();
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist >= maxDist) continue;

        let alpha = 0.16 * (1 - dist / maxDist);
        if (interactive) {
          const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
          const mDist = Math.hypot(midX - mouse.x, midY - mouse.y);
          if (mDist < REPEL_RADIUS) alpha += (1 - mDist / REPEL_RADIUS) * 0.2;
        }
        ctx.strokeStyle = `rgba(130,175,255,${Math.min(alpha, 0.5)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  function drawNodes() {
    nodes.forEach((n) => {
      const boosted = n.boost;
      const radius = n.r + boosted * 1.2;

      if (n.r > 1.8 || boosted > 0.4) {
        // soft glow — cheap radial gradient rather than a canvas blur filter
        const glowR = radius * 4;
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        grad.addColorStop(0, `rgba(${n.colorRgb}, ${0.22 + boosted * 0.25})`);
        grad.addColorStop(1, `rgba(${n.colorRgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgba(${n.colorRgb}, ${0.55 + boosted * 0.4})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawCursorGlow() {
    if (isTouchDevice || glowIntensity < 0.01) return;
    glow.x += (mouse.x - glow.x) * 0.08;
    glow.y += (mouse.y - glow.y) * 0.08;

    const r = 320;
    const grad = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, r);
    grad.addColorStop(0, `rgba(90,190,255,${0.05 * glowIntensity})`);
    grad.addColorStop(0.5, `rgba(90,160,255,${0.025 * glowIntensity})`);
    grad.addColorStop(1, "rgba(90,160,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(glow.x, glow.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const interactive = !isTouchDevice && mouse.active && Date.now() - mouse.lastMoveAt < 2000;
    glowIntensity += ((interactive ? 1 : 0) - glowIntensity) * 0.06;

    updateNodes(interactive);
    drawCursorGlow();
    drawConnections(interactive);
    drawNodes();

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
  const { data, error } = await supabaseClient
    .from("profile")
    .select("full_name, title, tagline, bio, location, years_experience, linkedin_url")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to load profile", error);
    return;
  }

  document.title = `${data.full_name || "Portfolio"} — ${data.title || "QHSE Practitioner"}`;
  setText("hero-name", data.full_name);
  setText("hero-title", data.title);
  setText("hero-tagline", data.tagline);
  setText("hero-bio", data.bio);
  setText("about-location", data.location, "—");
  setText("about-experience", data.years_experience, "—");
  setText("about-location-hero", data.location, "—");
  setText("contact-location", data.location, "—");
  if (data.years_experience) setText("stat-years", data.years_experience);

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

  renderCompetencyChips();
}

// ---- About: competency chip list (static keyword list from verified CV/portfolio content) ----
function renderCompetencyChips() {
  const container = document.getElementById("about-competencies");
  if (!container) return;

  const competencies = [
    "QHSE Management Systems", "Occupational Health & Safety", "Environmental Management",
    "Risk Assessment", "Hazard Identification", "Incident Prevention", "Incident Investigation",
    "Safety Inspections", "Site Audits", "Compliance Monitoring", "Contractor Safety",
    "Emergency Preparedness", "Permit-to-Work Systems", "Toolbox Talks", "Safety Training",
    "Leadership Engagement", "KPI Monitoring", "Continuous Improvement",
  ];

  const chips = competencies.map((c) => el("li", null, [c]));
  container.replaceChildren(...chips);
}

// ---- Skills, grouped by category ----
async function loadSkills() {
  const container = document.getElementById("skills-grid");
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
    el("div", { class: "skill-card" }, [
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
  if (cert.issuer) rows.push(el("p", null, [el("strong", null, ["Issuer: "]), cert.issuer]));
  if (cert.issue_date) rows.push(el("p", null, [el("strong", null, ["Date: "]), cert.issue_date]));
  if (cert.credential_no) rows.push(el("p", null, [el("strong", null, ["Credential No.: "]), cert.credential_no]));
  if (cert.category) rows.push(el("p", null, [el("strong", null, ["Category: "]), cert.category]));
  if (cert.framework) rows.push(el("p", null, [el("strong", null, ["Framework: "]), cert.framework]));
  if (cert.verify_url) {
    rows.push(el("p", null, [
      el("strong", null, ["Verify: "]),
      el("a", { href: cert.verify_url, target: "_blank", rel: "noopener noreferrer" }, [cert.verify_url]),
    ]));
  }
  if (!rows.length) rows.push(el("p", null, ["Full certificate details coming soon."]));
  return rows;
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
  const { data, error } = await supabaseClient
    .from("certifications")
    .select("name, issuer, issue_date, credential_no, verify_url, framework, category, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    showEmptyState(container, "Certifications coming soon.");
    return;
  }

  setText("stat-certs", String(data.length));

  const items = data.map((cert) => {
    const metaParts = [cert.issuer, cert.issue_date].filter(Boolean).join(" — ");
    const metaChildren = [metaParts];
    if (cert.credential_no) metaChildren.push(` · Credential No. ${cert.credential_no}`);

    const li = el("li", { class: "credential-card", tabindex: "0", role: "button", "aria-haspopup": "dialog" }, [
      el("div", { class: "card-title" }, [cert.name]),
      el("div", { class: "card-meta" }, metaChildren),
    ]);

    if (cert.category) {
      li.appendChild(el("div", { class: "card-framework" }, [cert.category]));
    }
    if (cert.framework) {
      li.appendChild(el("div", { class: "card-framework" }, [cert.framework]));
    }
    li.appendChild(el("div", { class: "card-expand-hint" }, ["View details →"]));

    if (certModal) {
      li.addEventListener("click", () => certModal.open(cert.name, certModalRows(cert)));
      li.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          certModal.open(cert.name, certModalRows(cert));
        }
      });
    }
    return li;
  });
  container.replaceChildren(...items);
}

// ---- Approvals & Accreditations ----
async function loadApprovals() {
  const container = document.getElementById("approvals-list");
  const { data, error } = await supabaseClient
    .from("approvals")
    .select("name, issuer, description, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    showEmptyState(container, "Approvals coming soon.");
    return;
  }

  const items = data.map((row) =>
    el("li", null, [el("strong", null, [row.name]), row.issuer ? ` — ${row.issuer}` : ""])
  );
  container.replaceChildren(...items);
}

// ---- Education ----
async function loadEducation() {
  const container = document.getElementById("education-list");
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
      el("div", { class: "timeline-card glass" }, [
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
  if (!container) return;
  const { data, error } = await supabaseClient
    .from("experience")
    .select("role, company, location, period, description, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    showEmptyState(container, "Experience coming soon.");
    return;
  }

  const items = data.map((row) => {
    const titleText = row.role || row.company;
    const metaParts = [];
    if (row.role) metaParts.push(row.company);
    if (row.location) metaParts.push(row.location);

    const cardChildren = [
      el("div", { class: "timeline-role" }, [titleText]),
    ];
    if (metaParts.length) cardChildren.push(el("div", { class: "timeline-meta" }, [metaParts.join(" — ")]));
    if (row.period) cardChildren.push(el("div", { class: "timeline-period" }, [row.period]));
    if (row.description) {
      const bullets = row.description.split("|").map((s) => s.trim()).filter(Boolean);
      if (bullets.length) {
        cardChildren.push(el("ul", { class: "timeline-desc" }, bullets.map((b) => el("li", null, [b]))));
      }
    }

    return el("li", { class: "timeline-item" }, [
      el("span", { class: "timeline-node", "aria-hidden": "true" }),
      el("div", { class: "timeline-card glass" }, cardChildren),
    ]);
  });
  container.replaceChildren(...items);
}

// ---- Client Projects ----
async function loadProjects(projectModal) {
  const container = document.getElementById("projects-grid");
  const { data, error } = await supabaseClient
    .from("projects")
    .select("name, client_industry, role, tools, results, industry_badge, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    showEmptyState(container, "Client projects coming soon.");
    return;
  }

  setText("stat-projects", String(data.length));

  const cards = data.map((project) => {
    const card = el("div", { class: "project-card" }, []);
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

// ---- QHSE Focus Areas (static, qualitative — no fabricated numbers) ----
function renderFocusAreas() {
  const container = document.getElementById("focus-grid");
  if (!container) return;

  const areas = [
    { icon: "🛡️", title: "Risk Management", desc: "Proactive hazard identification and risk assessment embedded across every phase of site operations." },
    { icon: "👷", title: "Safety Leadership", desc: "Building a visible, engaged safety culture through leadership presence, coaching, and accountability." },
    { icon: "📋", title: "Compliance", desc: "Aligning site practices with ISO 45001, ISO 9001, ISO 14001, and applicable regulatory requirements." },
    { icon: "🚧", title: "Incident Prevention", desc: "Investigation, root cause analysis, and corrective action follow-through to prevent recurrence." },
    { icon: "🎓", title: "Workforce Training", desc: "Inductions, toolbox talks, and instructor-led training that build competent, safety-aware teams." },
    { icon: "🌱", title: "Environmental Protection", desc: "Environmental management practices that reduce impact across EPC, Oil & Gas, and construction sites." },
  ];

  const cards = areas.map((a) =>
    el("div", { class: "focus-card glass reveal" }, [
      el("span", { class: "focus-icon", "aria-hidden": "true" }, [a.icon]),
      el("div", { class: "focus-title" }, [a.title]),
      el("div", { class: "focus-desc" }, [a.desc]),
    ])
  );
  container.replaceChildren(...cards);
}

// ---- Access request form ----
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
      status.textContent = "Thanks — your request has been sent.";
      status.className = "form-status success";
      form.reset();
      return;
    }

    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const company = (formData.get("company") || "").toString().trim();
    const message = (formData.get("message") || "").toString().trim();

    if (!name || !email || !company) {
      status.textContent = "Please fill in your name, work email, and company.";
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
    });

    submitBtn.disabled = false;

    if (error) {
      console.error("Access request failed", error);
      status.textContent = "Something went wrong. Please try again in a moment.";
      status.className = "form-status error";
      return;
    }

    status.textContent = "Thanks — your request has been sent. You'll hear back soon.";
    status.className = "form-status success";
    form.reset();
  });
}

// ---- Init ----
document.getElementById("footer-year").textContent = new Date().getFullYear();
initThemeToggle();
initMobileNav();
initBackgroundAnimation();
initTypingEffect();
initScrollSpy();
initAccessForm();

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

loadProfile();
loadSkills();
loadCertifications(certModal);
loadApprovals();
loadEducation();
loadExperience();
loadProjects(projectModal);
renderFocusAreas();
initRevealAnimations();
