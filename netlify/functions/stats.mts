// Report del contatore interno, protetto da una chiave scelta dal proprietario del sito.
// Uso: /api/stats?key=LA_TUA_CHIAVE   (variabile d'ambiente STATS_KEY su Netlify)
import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

const DAYS = 30;
const LABELS: Record<string, string> = {
  view: "Pagine viste",
  run: "Calcoli",
  example: "Esempio aperto",
  import: "File importati",
  limit: "Tentativi di salvare un progetto",
  plan_click: "Clic su PRO/Business",
  waitlist: "Iscritti lista d'attesa",
};

export default async (req: Request) => {
  const secret = Netlify.env.get("STATS_KEY");
  if (!secret) return new Response("Imposta la variabile STATS_KEY su Netlify per attivare il report.", { status: 503 });
  if (new URL(req.url).searchParams.get("key") !== secret) return new Response("Non autorizzato", { status: 401 });

  const store = getStore("stats");
  const days = Array.from({ length: DAYS }, (_, i) => new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  const byDay: Record<string, Record<string, number>> = {};
  const byPage: Record<string, Record<string, number>> = {};
  for (const day of days) {
    const { blobs } = await store.list({ prefix: `${day}/` });
    for (const { key } of blobs) {
      const [, event, page] = key.split("/");
      (byDay[day] ??= {})[event] = (byDay[day][event] ?? 0) + 1;
      (byPage[page] ??= {})[event] = (byPage[page][event] ?? 0) + 1;
    }
  }

  const events = Object.keys(LABELS);
  const head = `<tr><th></th>${events.map((e) => `<th>${LABELS[e]}</th>`).join("")}</tr>`;
  const row = (name: string, counts: Record<string, number> = {}) => `<tr><td>${name}</td>${events.map((e) => `<td>${counts[e] ?? 0}</td>`).join("")}</tr>`;
  const total: Record<string, number> = {};
  for (const counts of Object.values(byDay)) for (const [e, n] of Object.entries(counts)) total[e] = (total[e] ?? 0) + n;
  const pages = Object.entries(byPage).sort((a, b) => (b[1].view ?? 0) - (a[1].view ?? 0));

  const html = `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>CutPilot – statistiche</title>
<style>body{font-family:system-ui,sans-serif;margin:20px;color:#14211c}table{border-collapse:collapse;margin:12px 0 32px;font-size:14px}th,td{border:1px solid #d5ddd8;padding:6px 9px;text-align:right}td:first-child,th:first-child{text-align:left}th{background:#f2f5f3}div{overflow-x:auto}</style>
<h1>CutPilot – ultimi ${DAYS} giorni</h1>
<p>Conta pagine viste e azioni, non persone: senza cookie non si distinguono i visitatori.</p>
<h2>Totale e per giorno</h2><div><table>${head}${row("Totale", total)}${days.map((d) => row(d, byDay[d])).join("")}</table></div>
<h2>Per pagina</h2><div><table>${head}${pages.map(([p, c]) => row(p.replace(/_/g, "/"), c)).join("")}</table></div></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
};

export const config: Config = { path: "/api/stats" };
