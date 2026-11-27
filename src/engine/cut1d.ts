// Ottimizzazione 1D (barre e profilati). Tutte le misure in millimetri.

export interface Part1D {
  label: string;
  length: number;
  qty: number;
}

export interface Opts1D {
  stockLength: number;
  kerf?: number; // spessore lama
  trim?: number; // rifilo iniziale della barra
  remnants?: { length: number; qty: number }[]; // spezzoni in magazzino, usati come barre senza rifilo
}

export interface Cut1D {
  label: string;
  length: number;
  offset: number; // posizione di inizio sulla barra
}

export interface Bar {
  stockLength: number; // lunghezza della barra o dello spezzone usato
  remnant: boolean; // true se è uno spezzone preso dal magazzino
  cuts: Cut1D[];
  rest: number; // spezzone riutilizzabile a fine barra
}

export interface Result1D {
  bars: Bar[];
  unplaced: Part1D[];
  wastePct: number;
}

const EPS = 1e-6;

export function optimize1D(parts: Part1D[], opts: Opts1D): Result1D {
  const kerf = opts.kerf ?? 0;
  const trim = opts.trim ?? 0;
  const usable = opts.stockLength - trim;

  const items: { label: string; length: number }[] = [];
  const unplaced: Part1D[] = [];
  for (const p of parts) {
    const qty = Math.max(0, Math.floor(p.qty));
    if (!(p.length > 0) || qty === 0) continue;
    if (p.length > usable + EPS) {
      unplaced.push({ ...p, qty });
      continue;
    }
    for (let i = 0; i < qty; i++) items.push({ label: p.label, length: p.length });
  }
  items.sort((a, b) => b.length - a.length);

  // Best Fit Decreasing. Ogni pezzo consuma lunghezza + lama; la capacità è
  // usable + kerf perché l'ultimo pezzo può finire a filo barra senza taglio.
  // Gli spezzoni in magazzino sono già "aperti": il Best Fit li riempie prima di prendere barre nuove.
  const open: { cuts: Cut1D[]; remaining: number; cursor: number; stock: number; rem: boolean }[] = (opts.remnants ?? []).flatMap((r) =>
    r.length > 0 ? Array.from({ length: Math.max(0, Math.floor(r.qty)) }, () => ({ cuts: [], remaining: r.length + kerf, cursor: 0, stock: r.length, rem: true })) : [],
  );
  for (const it of items) {
    const need = it.length + kerf;
    let best = -1;
    for (let i = 0; i < open.length; i++) {
      if (need <= open[i].remaining + EPS && (best < 0 || open[i].remaining < open[best].remaining)) best = i;
    }
    if (best < 0) {
      open.push({ cuts: [], remaining: usable + kerf, cursor: trim, stock: opts.stockLength, rem: false });
      best = open.length - 1;
    }
    const bar = open[best];
    bar.cuts.push({ label: it.label, length: it.length, offset: bar.cursor });
    bar.cursor += need;
    bar.remaining -= need;
  }

  const bars: Bar[] = open
    .filter((b) => b.cuts.length > 0)
    .map((b) => ({ stockLength: b.stock, remnant: b.rem, cuts: b.cuts, rest: Math.max(0, b.remaining - kerf) }));
  const partsLength = items.reduce((s, it) => s + it.length, 0);
  const total = bars.reduce((sum, b) => sum + b.stockLength, 0);
  return { bars, unplaced, wastePct: total > 0 ? (1 - partsLength / total) * 100 : 0 };
}
