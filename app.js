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

// ---- Certifications ----
async function loadCertifications() {
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

    const li = el("li", null, [
      el("div", { class: "card-title" }, [cert.name]),
      el("div", { class: "card-meta" }, metaChildren),
    ]);

    if (cert.verify_url) {
      const meta = li.querySelector(".card-meta");
      meta.appendChild(document.createTextNode(" · "));
      meta.appendChild(el("a", { href: cert.verify_url, target: "_blank", rel: "noopener noreferrer" }, ["Verify"]));
    }
    if (cert.framework) {
      li.appendChild(el("div", { class: "card-framework" }, [cert.framework]));
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
initAccessForm();
loadProfile();
loadSkills();
loadCertifications();
loadApprovals();
loadEducation();
loadProjects();
