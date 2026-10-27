// Lists completed runs for the facilitator's results page. Protected by ADMIN_PASSWORD.
import { createHash, timingSafeEqual } from "node:crypto";
import { env, json, supabase } from "./lib/shared.mjs";

const digest = s => createHash("sha256").update(String(s)).digest();

export default async req => {
  if (req.method !== "POST") return json(405, { message: "Use POST." });
  const { password } = await req.json().catch(() => ({}));
  if (!password || !timingSafeEqual(digest(password), digest(env("ADMIN_PASSWORD")))) {
    await new Promise(r => setTimeout(r, 800));
    return json(401, { message: "That password isn't right." });
  }
  const rows = await supabase("runs?select=created_at,name,email,first_call,team_calls,champion,run_seconds,email_status&order=created_at.desc&limit=5000");
  return json(200, { rows });
};

export const config = { path: "/api/runs" };
