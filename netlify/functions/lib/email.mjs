// Builds the results email (HTML and plain text) from the sim data.
import data from "../../../public/sim-data.json";

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const champName = c => (c === "Hamilton" ? "Lewis Hamilton" : "Max Verstappen");

export function describeRun(d1, d2) {
  const first = data.firstCall.find(o => o.id === d1);
  const calls = data.teamCalls.find(o => o.id === d2);
  const outcome = data.outcomes[`${d1}_${d2}`];
  if (!first || !calls || !outcome) return null;
  return { first, calls, ending: `${d1}_${d2}`, champion: outcome[0], summary: outcome[1] };
}

export function resultsEmail(name, run, siteUrl) {
  const subject = `Your Abu Dhabi 2021 result: ${champName(run.champion)} is champion`;
  const rows = [
    ["First call", `${run.first.key}. ${run.first.title}`],
    ["Team calls", `${run.calls.key}. ${run.calls.title}`],
    ["World champion", champName(run.champion)],
  ];
  const text = [
    `Hi ${name},`, "", "Here's how your run of Abu Dhabi 2021 Race Control turned out.", "",
    ...rows.map(([k, v]) => `${k}: ${v}`), run.summary, "",
    "What happened in 2021", ...data.history, "",
    "Talk it over", ...data.questions.map(q => `- ${q}`), "",
    siteUrl ? `Run it again: ${siteUrl}` : "",
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#eceef1;font-family:Arial,Helvetica,sans-serif;color:#14181f">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#5b6472;margin:0 0 6px">Yas Marina Circuit · 12 December 2021</p>
<h1 style="font-size:24px;margin:0 0 16px">Abu Dhabi 2021 Race Control</h1>
<div style="background:#ffffff;border:1px solid #d3d8df;border-radius:6px;padding:20px">
<p style="margin:0 0 14px;font-size:16px">Hi ${esc(name)}, here's how your run turned out.</p>
<table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px">
${rows.map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;border-top:1px solid #d3d8df;color:#5b6472;font-size:12px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-top:1px solid #d3d8df;${k === "World champion" ? "font-weight:bold;font-size:18px" : ""}">${esc(v)}</td></tr>`).join("\n")}
</table>
<p style="margin:12px 0 0;font-size:15px">${esc(run.summary)}</p>
<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#5b6472;margin:22px 0 8px">What happened in 2021</h2>
${data.history.map(p => `<p style="margin:0 0 10px;font-size:15px;line-height:1.5">${esc(p)}</p>`).join("\n")}
<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#5b6472;margin:22px 0 8px">Talk it over</h2>
<ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.5">${data.questions.map(q => `<li>${esc(q)}</li>`).join("")}</ul>
${siteUrl ? `<p style="margin:20px 0 0"><a href="${esc(siteUrl)}" style="background:#c8102e;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:4px;font-weight:bold;display:inline-block">Run it again</a></p>` : ""}
</div>
<p style="font-size:12px;color:#5b6472;margin:14px 0 0">You're receiving this because you asked for your results when you played. We send one email per completed run.</p>
</div></body></html>`;
  return { subject, html, text };
}
