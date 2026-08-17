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

// ---- Hero network/particle background ----
function initHeroParticles() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [];
  let rafId = null;

  function nodeCount() {
    if (width < 560) return 22;
    if (width < 900) return 36;
    return 55;
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const count = nodeCount();
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") !== "light";
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const lineColor = isDark() ? "109,117,246" : "71,80,214";
    const dotColor = isDark() ? "144,152,255" : "71,80,214";
    const maxDist = Math.min(150, width / 6);

    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          ctx.strokeStyle = `rgba(${lineColor}, ${0.16 * (1 - dist / maxDist)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    nodes.forEach((n) => {
      ctx.fillStyle = `rgba(${dotColor}, 0.55)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!prefersReduced) rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);

  if (prefersReduced) {
    draw(); // single static frame, no loop
  } else {
    draw();
  }

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
  if (data.years_experience) setText("stat-years", data.years_experience);

  const linkedinNode = document.getElementById("about-linkedin");
  if (linkedinNode && data.linkedin_url) {
    linkedinNode.replaceChildren(
      el("a", { href: data.linkedin_url, target: "_blank", rel: "noopener noreferrer" }, ["View profile"])
    );
    const footerLink = document.getElementById("footer-linkedin");
    if (footerLink) footerLink.href = data.linkedin_url;
  }
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

// ---- Certification detail modal ----
function initCertModal() {
  const backdrop = document.getElementById("cert-modal");
  const closeBtn = document.getElementById("cert-modal-close");
  if (!backdrop || !closeBtn) return null;

  let lastFocused = null;

  function close() {
    backdrop.hidden = true;
    if (lastFocused) lastFocused.focus();
  }
  function open(cert) {
    lastFocused = document.activeElement;
    document.getElementById("cert-modal-title").textContent = cert.name;
    const body = document.getElementById("cert-modal-body");
    const rows = [];
    if (cert.issuer) rows.push(el("p", null, [el("strong", null, ["Issuer: "]), cert.issuer]));
    if (cert.issue_date) rows.push(el("p", null, [el("strong", null, ["Date: "]), cert.issue_date]));
    if (cert.credential_no) rows.push(el("p", null, [el("strong", null, ["Credential No.: "]), cert.credential_no]));
    if (cert.framework) rows.push(el("p", null, [el("strong", null, ["Framework: "]), cert.framework]));
    if (cert.verify_url) {
      rows.push(el("p", null, [
        el("strong", null, ["Verify: "]),
        el("a", { href: cert.verify_url, target: "_blank", rel: "noopener noreferrer" }, [cert.verify_url]),
      ]));
    }
    body.replaceChildren(...rows);
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

// ---- Certifications ----
async function loadCertifications(certModal) {
  const container = document.getElementById("certifications-list");
  const { data, error } = await supabaseClient
    .from("certifications")
    .select("name, issuer, issue_date, credential_no, verify_url, framework, sort_order")
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

    if (cert.framework) {
      li.appendChild(el("div", { class: "card-framework" }, [cert.framework]));
    }
    li.appendChild(el("div", { class: "card-expand-hint" }, ["View details →"]));

    if (certModal) {
      li.addEventListener("click", () => certModal.open(cert));
      li.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          certModal.open(cert);
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
    el("li", null, [
      el("div", { class: "card-title" }, [row.qualification]),
      el("div", { class: "card-meta" }, [[row.school, row.year].filter(Boolean).join(" — ")]),
    ])
  );
  container.replaceChildren(...items);
}

// ---- Client Projects ----
async function loadProjects() {
  const container = document.getElementById("projects-grid");
  const { data, error } = await supabaseClient
    .from("projects")
    .select("name, client_industry, role, tools, results, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    showEmptyState(container, "Client projects coming soon.");
    return;
  }

  setText("stat-projects", String(data.length));

  const cards = data.map((project) => {
    const card = el("div", { class: "project-card" }, [
      el("h3", null, [project.name]),
      el("div", { class: "card-meta" }, [project.client_industry || ""]),
    ]);
    if (project.role) card.appendChild(el("p", null, [el("span", { class: "project-label" }, ["Role: "]), project.role]));
    if (project.tools) card.appendChild(el("p", null, [el("span", { class: "project-label" }, ["Tools: "]), project.tools]));
    if (project.results) card.appendChild(el("p", null, [el("span", { class: "project-label" }, ["Result: "]), project.results]));
    return card;
  });
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

    if (!name || !email) {
      status.textContent = "Please fill in your name and work email.";
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
initHeroParticles();
initAccessForm();
const certModal = initCertModal();
loadProfile();
loadSkills();
loadCertifications(certModal);
loadApprovals();
loadEducation();
loadProjects();
initRevealAnimations();
