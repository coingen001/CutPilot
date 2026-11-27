// Ottimizzazione 2D di pannelli con tagli a ghigliottina (passanti),
// adatti a sezionatrici e squadratrici. Tutte le misure in millimetri.

export interface Part2D {
  label: string;
  length: number; // lungo la lunghezza (e la venatura) del pannello
  width: number;
  qty: number;
  canRotate?: boolean; // false = venatura vincolata, il pezzo non si gira
}

export interface Opts2D {
  stockLength: number;
  stockWidth: number;
  kerf?: number; // spessore lama
  trim?: number; // rifilo su ogni bordo
}

export interface Placed {
  label: string;
  x: number;
  y: number;
  length: number; // ingombro lungo x
  width: number; // ingombro lungo y
  rotated: boolean;
}

export interface Rect {
  x: number;
  y: number;
  length: number;
  width: number;
}

export interface Sheet {
  placed: Placed[];
  offcuts: Rect[]; // ritagli liberi, dal più grande
}

export interface Result2D {
  sheets: Sheet[];
  unplaced: Part2D[];
  wastePct: number;
}

interface Free {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Item {
  label: string;
  l: number;
  w: number;
  canRotate: boolean;
}

const EPS = 1e-6;

const SORTS: ((a: Item, b: Item) => number)[] = [
  (a, b) => b.l * b.w - a.l * a.w,
  (a, b) => Math.max(b.l, b.w) - Math.max(a.l, a.w) || b.l * b.w - a.l * a.w,
  (a, b) => b.l + b.w - (a.l + a.w),
  (a, b) => b.w - a.w || b.l - a.l,
  (a, b) => b.l - a.l || b.w - a.w,
];
type Choice = 'shortSide' | 'area';
type Split = 'shorterAxis' | 'longerAxis' | 'shorterLeftover' | 'longerLeftover';
const CHOICES: Choice[] = ['shortSide', 'area'];
const SPLITS: Split[] = ['shorterAxis', 'longerAxis', 'shorterLeftover', 'longerLeftover'];

function pack(items: Item[], W: number, H: number, kerf: number, choice: Choice, split: Split) {
  const sheets: { free: Free[]; placed: Placed[]; used: number }[] = [];
  for (const it of items) {
    const rotations = it.canRotate && it.l !== it.w ? [false, true] : [false];
    let target: { s: number; f: number; rot: boolean } | null = null;
    // Riempie prima i pannelli già aperti; dentro il pannello sceglie il vano migliore.
    for (let s = 0; s < sheets.length && !target; s++) {
      let bestScore = Infinity;
      for (let fi = 0; fi < sheets[s].free.length; fi++) {
        const f = sheets[s].free[fi];
        for (const rot of rotations) {
          const pw = (rot ? it.w : it.l) + kerf;
          const ph = (rot ? it.l : it.w) + kerf;
          if (pw > f.w + EPS || ph > f.h + EPS) continue;
          const score = choice === 'shortSide' ? Math.min(f.w - pw, f.h - ph) : f.w * f.h - pw * ph;
          if (score < bestScore) {
            bestScore = score;
            target = { s, f: fi, rot };
          }
        }
      }
    }
    if (!target) {
      sheets.push({ free: [{ x: 0, y: 0, w: W, h: H }], placed: [], used: 0 });
      const fitsFlat = it.l + kerf <= W + EPS && it.w + kerf <= H + EPS;
      target = { s: sheets.length - 1, f: 0, rot: !fitsFlat };
    }
    const sheet = sheets[target.s];
    const f = sheet.free.splice(target.f, 1)[0];
    const pw = (target.rot ? it.w : it.l) + kerf;
    const ph = (target.rot ? it.l : it.w) + kerf;
    sheet.placed.push({ label: it.label, x: f.x, y: f.y, length: pw - kerf, width: ph - kerf, rotated: target.rot });
    sheet.used += (pw - kerf) * (ph - kerf);

    const restW = f.w - pw;
    const restH = f.h - ph;
    let horizontal: boolean;
    if (split === 'shorterAxis') horizontal = f.w <= f.h;
    else if (split === 'longerAxis') horizontal = f.w > f.h;
    else if (split === 'shorterLeftover') horizontal = restW <= restH;
    else horizontal = restW > restH;
    // Taglio passante orizzontale: il vano sotto prende tutta la larghezza.
    const right: Free = { x: f.x + pw, y: f.y, w: restW, h: horizontal ? ph : f.h };
    const below: Free = { x: f.x, y: f.y + ph, w: horizontal ? f.w : pw, h: restH };
    for (const r of [right, below]) if (r.w > EPS && r.h > EPS) sheet.free.push(r);
  }
  return sheets;
}

export function optimize2D(parts: Part2D[], opts: Opts2D): Result2D {
  const kerf = opts.kerf ?? 0;
  const trim = opts.trim ?? 0;
  // Ogni pezzo occupa misura + lama; l'area utile cresce di una lama perché
  // l'ultimo pezzo di ogni fila non ha bisogno del taglio a valle.
  const W = opts.stockLength - 2 * trim + kerf;
  const H = opts.stockWidth - 2 * trim + kerf;

  const items: Item[] = [];
  const unplaced: Part2D[] = [];
  for (const p of parts) {
    const qty = Math.max(0, Math.floor(p.qty));
    if (!(p.length > 0) || !(p.width > 0) || qty === 0) continue;
    const canRotate = p.canRotate !== false;
    const fits =
      (p.length + kerf <= W + EPS && p.width + kerf <= H + EPS) ||
      (canRotate && p.width + kerf <= W + EPS && p.length + kerf <= H + EPS);
    if (!fits) {
      unplaced.push({ ...p, qty });
      continue;
    }
    for (let i = 0; i < qty; i++) items.push({ label: p.label, l: p.length, w: p.width, canRotate });
  }

  // Prova tutte le combinazioni di euristiche e tiene la migliore:
  // meno pannelli, poi il pannello meno pieno più vuoto possibile (ritaglio più utile).
  let best: ReturnType<typeof pack> = [];
  let bestKey = [Infinity, Infinity];
  if (items.length > 0) {
    for (const sort of SORTS) {
      const sorted = [...items].sort(sort);
      for (const choice of CHOICES) {
        for (const split of SPLITS) {
          const sheets = pack(sorted, W, H, kerf, choice, split);
          const key = [sheets.length, Math.min(...sheets.map((s) => s.used))];
          if (key[0] < bestKey[0] || (key[0] === bestKey[0] && key[1] < bestKey[1])) {
            best = sheets;
            bestKey = key;
          }
        }
      }
    }
  }

  const sheets: Sheet[] = best.map((s) => ({
    placed: s.placed.map((p) => ({ ...p, x: p.x + trim, y: p.y + trim })),
    offcuts: s.free
      .map((f) => ({ x: f.x + trim, y: f.y + trim, length: f.w - kerf, width: f.h - kerf }))
      .filter((r) => r.length > EPS && r.width > EPS)
      .sort((a, b) => b.length * b.width - a.length * a.width),
  }));
  const partsArea = items.reduce((s, it) => s + it.l * it.w, 0);
  const total = sheets.length * opts.stockLength * opts.stockWidth;
  return { sheets, unplaced, wastePct: total > 0 ? (1 - partsArea / total) * 100 : 0 };
}
