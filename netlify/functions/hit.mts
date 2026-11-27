// Contatore interno: registra una riga per ogni pagina vista o azione.
// Non usa cookie e non salva indirizzo IP né altri dati della persona.
import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

const EVENTS = new Set(["view", "run", "example", "import", "limit", "plan_click", "waitlist"]);

export default async (req: Request) => {
  let data: { e?: unknown; p?: unknown };
  try {
    data = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const event = String(data.e ?? "");
  if (!EVENTS.has(event)) return new Response(null, { status: 400 });
  const page = String(data.p ?? "").replace(/[^a-z0-9\-/.]/gi, "").slice(0, 80).replace(/\//g, "_") || "_";
  const day = new Date().toISOString().slice(0, 10);
  // Una chiave nuova per ogni evento: nessun contatore da leggere e riscrivere, quindi nessun conteggio perso.
  await getStore("stats").set(`${day}/${event}/${page}/${crypto.randomUUID()}`, "");
  return new Response(null, { status: 204 });
};

export const config: Config = { path: "/api/hit", method: "POST" };
