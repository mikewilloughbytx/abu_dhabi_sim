// Setup check for the facilitator: which settings are present and whether Supabase answers. Protected by ADMIN_PASSWORD.
import { createHash, timingSafeEqual } from "node:crypto";
import { json, supabase } from "./lib/shared.mjs";

const digest = s => createHash("sha256").update(String(s)).digest();
const VARS = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "RESEND_API_KEY", "RESULTS_FROM", "RUN_SECRET", "ADMIN_PASSWORD", "FACILITATOR_EMAIL", "MIN_RUN_SECONDS"];

export default async req => {
  if (req.method !== "POST") return json(405, { message: "Use POST." });
  const { password } = await req.json().catch(() => ({}));
  if (!password || !process.env.ADMIN_PASSWORD || !timingSafeEqual(digest(password), digest(process.env.ADMIN_PASSWORD)))
    return json(401, { message: "That password isn't right." });
  const settings = Object.fromEntries(VARS.map(v => [v, Boolean(process.env[v])]));
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  const out = {
    settings,
    supabaseUrlShape: /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url) ? "ok" : "should look like https://<project>.supabase.co",
    supabaseKeyKind: key.startsWith("eyJ") ? "service_role (JWT)" : key.startsWith("sb_secret_") ? "secret key" : key.startsWith("sb_publishable_") ? "publishable key: wrong one, use the secret or service_role key" : key ? "unrecognised" : "missing",
    resultsFrom: process.env.RESULTS_FROM ? process.env.RESULTS_FROM.replace(/^.*@/, "@") : null,
  };
  try { await supabase("runs?select=id&limit=1"); out.supabase = "ok: runs table reachable"; }
  catch (e) { out.supabase = String(e.message).replace(key, "[key]").slice(0, 400); }
  return json(200, out);
};

export const config = { path: "/api/health" };
