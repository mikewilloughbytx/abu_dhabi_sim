// Helpers shared by the functions: run tokens, Supabase REST calls and JSON responses.
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const env = name => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
};

export const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

// A run token is "<id>.<issued ms>.<signature>", signed with RUN_SECRET so the server knows when the run really started.
const sign = payload => createHmac("sha256", env("RUN_SECRET")).update(payload).digest("base64url");

export function issueToken() {
  const payload = `${randomUUID()}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function readToken(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(payload)), given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { id: parts[0], issuedAt: Number(parts[1]) };
}

export async function supabase(path, { method = "GET", body, headers = {} } = {}) {
  const key = env("SUPABASE_SERVICE_KEY");
  const res = await fetch(`${env("SUPABASE_URL").trim().replace(/\/+$/, "")}/rest/v1/${path}`, {
    method,
    // Legacy service_role keys are JWTs and also go in Authorization; newer sb_secret_ keys go in apikey only.
    headers: { apikey: key, ...(key.startsWith("eyJ") ? { authorization: `Bearer ${key}` } : {}), "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split("?")[0]} failed: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}
