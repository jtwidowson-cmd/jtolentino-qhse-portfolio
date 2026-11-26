// Private enquiry dashboard.
// Security model: every read and write goes through Supabase Row Level Security. Only a signed-in user
// listed in public.admins can read enquiries, change their status, or touch the private-cv bucket.
// This page never sends a CV anywhere: the owner reviews an enquiry and replies personally.
(function () {
  const SUPABASE_URL = "https://lpvqaelyddzuolpkokaq.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_4iSBJhSoMIRHyf9MpkeizQ_sAuWmzXz";
  const CV_BUCKET = "private-cv";
  const STATUSES = ["pending", "reviewed", "approved", "declined"];
  const LABEL = { pending: "Pending", reviewed: "Reviewed", approved: "Approved", declined: "Declined" };

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const $ = (id) => document.getElementById(id);
  let rows = [];
  let filter = "all";

  // theme follows the visitor's saved choice from the main site
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (_e) {}

  function el(tag, props, children) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === "class") node.className = v; else if (v !== null && v !== undefined) node.setAttribute(k, v);
    });
    (children || []).forEach((c) => { if (c != null) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return node;
  }
  const setStatus = (id, text, kind) => { const n = $(id); n.textContent = text || ""; n.className = "form-status" + (kind ? " " + kind : ""); };

  function show(view) {
    $("admin-login").hidden = view !== "login";
    $("admin-dashboard").hidden = view !== "dashboard";
    $("admin-signout").hidden = view === "login";
    $("admin-user").hidden = view === "login";
  }

  async function start() {
    const { data } = await sb.auth.getSession();
    if (!data.session) { show("login"); return; }
    $("admin-user").textContent = data.session.user.email || "";
    const { data: me, error } = await sb.from("admins").select("user_id").eq("user_id", data.session.user.id).maybeSingle();
    if (error || !me) {
      show("login");
      setStatus("login-status", "This account is not authorised to view enquiries.", "error");
      await sb.auth.signOut();
      return;
    }
    show("dashboard");
    renderFilters();
    await Promise.all([loadEnquiries(), loadCv()]);
  }

  // ---- Sign in / out ----
  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("login-email").value.trim();
    const password = $("login-password").value;
    if (!email || !password) { setStatus("login-status", "Enter your email and password.", "error"); return; }
    $("login-submit").disabled = true;
    setStatus("login-status", "Signing in…");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    $("login-submit").disabled = false;
    $("login-password").value = "";
    if (error) { setStatus("login-status", "Sign-in failed. Check your email and password.", "error"); return; }
    setStatus("login-status", "");
    start();
  });
  $("admin-signout").addEventListener("click", async () => { await sb.auth.signOut(); rows = []; $("enquiry-list").replaceChildren(); show("login"); });

  // ---- Enquiries ----
  async function loadEnquiries() {
    setStatus("admin-status", "Loading enquiries…");
    const { data, error } = await sb.from("access_requests")
      .select("id, name, email, company, message, job_title, job_location, enquiry_type, job_description, status, created_at")
      .order("created_at", { ascending: false });
    if (error) { setStatus("admin-status", "Could not load enquiries.", "error"); return; }
    rows = data || [];
    setStatus("admin-status", "");
    renderFilters();
    renderList();
  }

  function renderFilters() {
    const counts = { all: rows.length };
    STATUSES.forEach((s) => { counts[s] = rows.filter((r) => r.status === s).length; });
    const opts = [["all", "All"], ...STATUSES.map((s) => [s, LABEL[s]])];
    $("status-filters").replaceChildren(...opts.map(([key, label]) => {
      const b = el("button", { type: "button", class: "filter-chip", "aria-pressed": String(filter === key) }, [
        label + " ", el("span", { class: "filter-count" }, [String(counts[key] || 0)]),
      ]);
      b.addEventListener("click", () => { filter = key; renderFilters(); renderList(); });
      return b;
    }));
  }

  function renderList() {
    const q = $("admin-search").value.trim().toLowerCase();
    const list = rows.filter((r) => (filter === "all" || r.status === filter) &&
      (!q || [r.name, r.company, r.job_title, r.job_location, r.email].some((v) => (v || "").toLowerCase().includes(q))));
    if (!list.length) {
      $("enquiry-list").replaceChildren(el("li", { class: "admin-empty" }, [rows.length ? "No enquiries match this filter." : "No enquiries yet."]));
      return;
    }
    $("enquiry-list").replaceChildren(...list.map(card));
  }
  $("admin-search").addEventListener("input", renderList);

  function field(label, value) {
    return el("div", { class: "enq-field" }, [el("span", { class: "enq-label" }, [label]), el("span", null, [value || "Not provided"])]);
  }

  function card(r) {
    const when = new Date(r.created_at).toLocaleString("en-IE", { timeZone: "Europe/Dublin", dateStyle: "medium", timeStyle: "short" });
    const select = el("select", { class: "enq-status", "aria-label": `Status for ${r.name}` },
      STATUSES.map((s) => { const o = el("option", { value: s }, [LABEL[s]]); if (s === r.status) o.selected = true; return o; }));
    select.addEventListener("change", async () => {
      const prev = r.status;
      select.disabled = true;
      const { error } = await sb.from("access_requests").update({ status: select.value }).eq("id", r.id);
      select.disabled = false;
      if (error) { select.value = prev; setStatus("admin-status", "Could not update the status.", "error"); return; }
      r.status = select.value;
      badge.textContent = LABEL[r.status];
      badge.className = "enq-badge is-" + r.status;
      renderFilters();
      setStatus("admin-status", `Marked ${r.name} as ${LABEL[r.status]}.`, "success");
    });
    const subject = encodeURIComponent(`Re: ${r.job_title || r.enquiry_type || "your enquiry"} | Josue Tolentino`);
    const reply = el("a", { class: "btn btn-secondary btn-small", href: `mailto:${r.email}?subject=${subject}` }, ["Reply by email"]);
    const badge = el("span", { class: "enq-badge is-" + r.status }, [LABEL[r.status] || r.status]);

    const body = [
      el("div", { class: "enq-head" }, [
        el("div", null, [
          el("h3", { class: "enq-name" }, [r.name]),
          el("p", { class: "admin-muted" }, [`${r.company} · ${r.email}`]),
        ]),
        badge,
      ]),
      el("div", { class: "enq-grid" }, [
        field("Job title", r.job_title), field("Location", r.job_location),
        field("Enquiry type", r.enquiry_type), field("Submitted", when),
      ]),
    ];
    if (r.job_description) body.push(el("div", { class: "enq-text" }, [el("span", { class: "enq-label" }, ["Job description / opportunity details"]), el("p", null, [r.job_description])]));
    if (r.message) body.push(el("div", { class: "enq-text" }, [el("span", { class: "enq-label" }, ["Additional message"]), el("p", null, [r.message])]));
    body.push(el("div", { class: "enq-actions" }, [el("label", { class: "enq-label" }, ["Status"]), select, reply]));
    return el("li", { class: "enq-card glass" }, body);
  }

  // ---- Private CV (owner only; signed link valid for 60 seconds, never public) ----
  async function loadCv() {
    const { data, error } = await sb.storage.from(CV_BUCKET).list("", { limit: 20, sortBy: { column: "updated_at", order: "desc" } });
    const files = (data || []).filter((f) => f.id && !f.name.startsWith("."));
    if (error) { $("cv-status").textContent = "Private storage is not available."; return; }
    if (!files.length) {
      $("cv-status").textContent = "No CV uploaded yet. Upload one here; it stays private and is only shared when you send it yourself.";
      $("cv-download").hidden = true;
      return;
    }
    const f = files[0];
    const updated = f.updated_at ? new Date(f.updated_at).toLocaleDateString("en-IE", { dateStyle: "medium" }) : "";
    $("cv-status").textContent = `${f.name}${updated ? ` · updated ${updated}` : ""} · private, not publicly linked`;
    $("cv-download").hidden = false;
    $("cv-download").onclick = async () => {
      const { data: signed, error: e2 } = await sb.storage.from(CV_BUCKET).createSignedUrl(f.name, 60, { download: f.name });
      if (e2 || !signed) { setStatus("admin-status", "Could not create a download link.", "error"); return; }
      window.location.href = signed.signedUrl;
    };
  }

  $("cv-file").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const ok = /\.(pdf|docx)$/i.test(file.name) && file.size <= 10 * 1024 * 1024;
    if (!ok) { setStatus("admin-status", "Upload a PDF or Word (.docx) file up to 10 MB.", "error"); return; }
    setStatus("admin-status", "Uploading CV to private storage…");
    const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "_");
    const { error } = await sb.storage.from(CV_BUCKET).upload(safeName, file, { upsert: true, contentType: file.type || undefined });
    if (error) { setStatus("admin-status", "Upload failed: " + error.message, "error"); return; }
    setStatus("admin-status", "CV saved to private storage.", "success");
    loadCv();
  });

  start();
})();
