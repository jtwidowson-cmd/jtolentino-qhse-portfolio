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

// ---- Full-page ambient background animation ----
// A lightweight, low-opacity backdrop suggesting connected systems, risk
// monitoring, and engineering process control: a drifting blueprint grid,
// diagonal industrial panels, hexagonal motifs, a connected node network,
// small drifting particles, and occasional brighter "pulse" nodes.
function initBackgroundAnimation() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [];
  let dust = [];
  let hexagons = [];
  let panels = [];
  let rafId = null;
  let t = 0;

  function counts() {
    if (width < 560) return { nodes: 16, dust: 12, hex: 3 };
    if (width < 1000) return { nodes: 28, dust: 20, hex: 5 };
    return { nodes: 42, dust: 30, hex: 7 };
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") !== "light";
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
    const c = counts();
    nodes = Array.from({ length: c.nodes }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      pulse: 0,
    }));
    dust = Array.from({ length: c.dust }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      r: 0.6 + Math.random() * 1.1,
    }));
    hexagons = Array.from({ length: c.hex }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 26 + Math.random() * 42,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.0004,
    }));
    panels = [
      { x: width * 0.06, y: height * 0.1, w: width * 0.46, h: height * 0.5, angle: -0.12, phase: 0 },
      { x: width * 0.56, y: height * 0.42, w: width * 0.42, h: height * 0.56, angle: 0.1, phase: 2.1 },
      { x: width * 0.16, y: height * 0.6, w: width * 0.32, h: height * 0.36, angle: -0.07, phase: 4.2 },
    ];
  }

  function drawGrid(rgb) {
    const cell = 64;
    const offset = (t * 0.06) % cell; // very slow drift
    ctx.strokeStyle = `rgba(${rgb}, 0.05)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -offset; x < width + cell; x += cell) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = -offset; y < height + cell; y += cell) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  function drawPanels(rgb) {
    panels.forEach((p) => {
      const breathe = 0.025 + 0.015 * Math.sin(t * 0.006 + p.phase);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = `rgba(${rgb}, ${breathe})`;
      ctx.strokeStyle = `rgba(${rgb}, 0.08)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(0, 0, p.w, p.h);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawHexagons(rgb) {
    hexagons.forEach((h) => {
      h.rotation += h.spin;
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation);
      ctx.strokeStyle = `rgba(${rgb}, 0.09)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = Math.cos(angle) * h.size;
        const py = Math.sin(angle) * h.size;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawDust(rgb) {
    dust.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0) d.x = width; else if (d.x > width) d.x = 0;
      if (d.y < 0) d.y = height; else if (d.y > height) d.y = 0;
      ctx.fillStyle = `rgba(${rgb}, 0.35)`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawNetwork(lineRgb, dotRgb, glowRgb) {
    const maxDist = Math.min(160, width / 6);

    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
      if (n.pulse <= 0 && Math.random() < 0.0009) n.pulse = 1; // occasional brighter node
      if (n.pulse > 0) n.pulse *= 0.985;
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          ctx.strokeStyle = `rgba(${lineRgb}, ${0.14 * (1 - dist / maxDist)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach((n) => {
      if (n.pulse > 0.02) {
        const glowR = 11 * n.pulse;
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        gradient.addColorStop(0, `rgba(${glowRgb}, ${0.5 * n.pulse})`);
        gradient.addColorStop(1, `rgba(${glowRgb}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(${dotRgb}, ${0.5 + 0.4 * n.pulse})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.5 + n.pulse * 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    t += 1;

    const dark = isDark();
    const structureRgb = dark ? "109,117,246" : "71,80,214";
    const lineRgb = dark ? "109,117,246" : "71,80,214";
    const dotRgb = dark ? "144,152,255" : "71,80,214";
    const glowRgb = dark ? "160,220,255" : "90,150,220";

    drawGrid(structureRgb);
    drawPanels(structureRgb);
    drawHexagons(structureRgb);
    drawDust(dotRgb);
    drawNetwork(lineRgb, dotRgb, glowRgb);

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
