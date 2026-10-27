// Saves a completed run to the player log and emails the player their results.
import { env, json, readToken, supabase } from "./lib/shared.mjs";
import { describeRun, resultsEmail } from "./lib/email.mjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RUN_MS = 4 * 60 * 60 * 1000;
const PER_EMAIL_PER_HOUR = 3;
const PER_DAY = Number(process.env.MAX_EMAILS_PER_DAY || 95); // Resend's free tier allows 100 a day

export default async req => {
  if (req.method !== "POST") return json(405, { message: "Use POST." });
  let b;
  try { b = await req.json(); } catch { return json(400, { message: "We couldn't read that request." }); }

  // Bots fill the hidden field; tell them it worked and do nothing.
  if (b.website) return json(200, { ok: true });

  const name = String(b.name || "").trim().slice(0, 60);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  if (!name || !EMAIL_RE.test(email)) return json(400, { message: "Your name or email looks incomplete, so we couldn't send your results." });
  if (b.consent !== true) return json(400, { message: "Results are only emailed when you agree on the start screen." });
  const run = describeRun(b.d1, b.d2);
  if (!run) return json(400, { message: "That run didn't match a known ending." });

  const tok = readToken(b.token);
  const minMs = Number(process.env.MIN_RUN_SECONDS || 240) * 1000;
  const age = tok ? Date.now() - tok.issuedAt : -1;
  if (!tok || age < minMs || age > MAX_RUN_MS)
    return json(400, { message: "We couldn't confirm this run, so no email was sent. Use Download or Copy to keep your results." });

  try {
    const hourAgo = new Date(Date.now() - 3600e3).toISOString(), dayAgo = new Date(Date.now() - 86400e3).toISOString();
    const recent = await supabase(`runs?select=id&email=eq.${encodeURIComponent(email)}&created_at=gte.${hourAgo}`);
    if (recent.length >= PER_EMAIL_PER_HOUR)
      return json(429, { message: "You've had several results emails this hour. Your next run will email again later." });
    const today = await supabase(`runs?select=id&email_status=eq.sent&created_at=gte.${dayAgo}`);
    const overDaily = today.length >= PER_DAY;

    const [row] = await supabase("runs", {
      method: "POST", headers: { prefer: "return=representation" },
      body: { name, email, consent_at: new Date().toISOString(), first_call: b.d1, team_calls: b.d2, ending: run.ending,
        champion: run.champion, token_id: tok.id, run_seconds: Math.round(age / 1000), email_status: overDaily ? "skipped_daily_limit" : "pending" },
    });
    if (overDaily) return json(503, { message: "Today's results emails have run out. Your run was saved; use Download or Copy to keep your results." });

    const site = process.env.URL || "";
    const msg = resultsEmail(name, run, site);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env("RESEND_API_KEY")}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env("RESULTS_FROM"), to: [email], subject: msg.subject, html: msg.html, text: msg.text,
        ...(process.env.FACILITATOR_EMAIL ? { bcc: [process.env.FACILITATOR_EMAIL] } : {}) }),
    });
    const status = res.ok ? "sent" : `failed_${res.status}`;
    if (!res.ok) console.error("Resend error", res.status, await res.text());
    await supabase(`runs?id=eq.${row.id}`, { method: "PATCH", body: { email_status: status } });
    return res.ok ? json(200, { ok: true }) : json(502, { message: "Your run was saved, but the email didn't go through. Use Download or Copy to keep your results." });
  } catch (e) {
    if (String(e.message).includes("23505")) return json(409, { message: "These results were already sent." });
    console.error(e);
    return json(500, { message: "Something went wrong saving your run. Use Download or Copy to keep your results." });
  }
};

export const config = { path: "/api/finish-run" };
