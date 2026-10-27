// Issues a signed run token when a player starts, so finish-run can check how long the run took.
import { issueToken, json } from "./lib/shared.mjs";

export default async req => {
  if (req.method !== "POST") return json(405, { message: "Use POST." });
  return json(200, { token: issueToken() });
};

export const config = { path: "/api/start-run" };
