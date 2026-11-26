// notify-access-request
// Called by the access_requests_notify database trigger with { id } after a contact-form insert.
// Security: the caller only supplies a row id. The function reads that row with the service role,
// requires it to be recent (10 min) and not yet notified, and claims it atomically before sending,
// so this public endpoint cannot be used to send arbitrary or repeated email.
// Deployed with verify_jwt = false. Secrets: RESEND_API_KEY, NOTIFY_EMAIL (set in the Supabase dashboard).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL");

const FROM_BRANDED = "Josh Portfolio <notifications@jt3rdegre3.com>";
const FROM_FALLBACK = "Josh Portfolio <onboarding@resend.dev>";
const MAX_AGE_MS = 10 * 60 * 1000;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

async function sendEmail(from: string, payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, from }),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
    return json(500, { error: "missing_secret", RESEND_API_KEY: !!RESEND_API_KEY, NOTIFY_EMAIL: !!NOTIFY_EMAIL });
  }

  let id: number;
  try {
    const body = await req.json();
    id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error();
  } catch {
    return json(400, { error: "bad_request" });
  }

  // Claim the row: only a recent, not-yet-notified request is accepted, and only once.
  const since = new Date(Date.now() - MAX_AGE_MS).toISOString();
  const claim = await rest(
    `access_requests?id=eq.${id}&notified_at=is.null&created_at=gte.${encodeURIComponent(since)}` +
      `&select=id,name,email,company,message,job_title,job_location,enquiry_type,job_description,created_at`,
    { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ notified_at: new Date().toISOString() }) },
  );
  if (!claim.ok) return json(502, { error: "db_error", status: claim.status });
  const rows = await claim.json();
  if (!Array.isArray(rows) || rows.length === 0) return json(200, { skipped: true });
  const r = rows[0];

  const when = new Date(r.created_at).toLocaleString("en-IE", { timeZone: "Europe/Dublin", dateStyle: "full", timeStyle: "short" });
  const isResume = /resume/i.test(r.message || "");
  const kind = r.enquiry_type || (isResume ? "Resume request" : "New enquiry");
  const subject = `${kind}: ${String(r.name).slice(0, 80)} (${String(r.company).slice(0, 80)})` +
    (r.job_title ? ` | ${String(r.job_title).slice(0, 80)}` : "");
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 16px 8px 0;color:#777;font-size:12px;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:8px 0;color:#111;font-size:15px">${value}</td></tr>`;
  const block = (label: string, value: string | null) => value
    ? `<p style="margin:20px 0 6px;color:#777;font-size:12px;letter-spacing:.08em;text-transform:uppercase">${label}</p><div style="padding:16px;background:#f5f5f5;border-left:3px solid #c9a96e;white-space:pre-wrap;font-size:15px;color:#111">${esc(value)}</div>`
    : "";
  const dash = "Not provided";
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <p style="margin:0 0 4px;color:#9a7b3f;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase">josh-portfolio.jt3rdegre3.com</p>
  <h1 style="margin:0 0 20px;font-size:22px;color:#111">${esc(kind)}</h1>
  <table style="border-collapse:collapse;width:100%">
    ${row("Full Name", esc(r.name))}
    ${row("Work Email", `<a href="mailto:${esc(r.email)}" style="color:#111">${esc(r.email)}</a>`)}
    ${row("Company", esc(r.company))}
    ${row("Job Title", esc(r.job_title || dash))}
    ${row("Job Location", esc(r.job_location || dash))}
    ${row("Enquiry Type", esc(r.enquiry_type || dash))}
    ${row("Submitted", esc(when))}
  </table>
  ${block("Job Description / Opportunity Details", r.job_description)}
  ${block("Additional Message", r.message)}
  <p style="margin-top:24px;color:#777;font-size:13px">No CV has been sent. Review this enquiry, then reply to this email to answer ${esc(r.name)} directly and attach your CV only if you approve.</p>
</div>`;
  const text = [
    kind, "",
    `Full Name: ${r.name}`, `Work Email: ${r.email}`, `Company: ${r.company}`,
    `Job Title: ${r.job_title || dash}`, `Job Location: ${r.job_location || dash}`,
    `Enquiry Type: ${r.enquiry_type || dash}`, `Submitted: ${when}`, "",
    `Job Description / Opportunity Details:\n${r.job_description || dash}`, "",
    `Additional Message:\n${r.message || dash}`, "",
    `No CV has been sent. Reply to this email to answer ${r.name} directly and attach your CV only if you approve.`,
  ].join("\n");

  const payload = { to: [NOTIFY_EMAIL], reply_to: r.email, subject, html, text };
  let sent = await sendEmail(FROM_BRANDED, payload);
  let usedFrom = FROM_BRANDED;
  if (!sent.ok && (sent.status === 403 || sent.status === 422)) {
    // Domain not usable (e.g. verification lapsed): fall back to Resend's shared sender.
    sent = await sendEmail(FROM_FALLBACK, payload);
    usedFrom = FROM_FALLBACK;
  }

  if (!sent.ok) {
    // Release the claim so a later retry is possible.
    await rest(`access_requests?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ notified_at: null }) });
    console.error("resend_failed", sent.status, sent.body);
    return json(502, { error: "email_failed", status: sent.status, detail: sent.body.slice(0, 300) });
  }
  return json(200, { sent: true, from: usedFrom });
});
