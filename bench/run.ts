// Calcola i risultati di CutPilot sulle distinte di prova e il limite teorico
// (minimo di pannelli o barre sotto cui nessun programma può scendere).
// Uso: npm run bench  → stampa la tabella e scrive bench/risultati-cutpilot.csv
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { optimize1D } from '../src/engine/cut1d';
import { optimize2D } from '../src/engine/cut2d';

// Parametri comuni a tutti i confronti: vanno usati uguali nei programmi concorrenti.
export const SHEET = { stockLength: 2800, stockWidth: 2070, kerf: 4, trim: 10 };
export const BAR = { stockLength: 6000, kerf: 3, trim: 0 };

const dir = join(__dirname, 'distinte');
const rows: string[] = ['distinta;tipo;pezzi;limite_teorico;cutpilot;sfrido_cutpilot_pct;ms'];

for (const file of readdirSync(dir).filter((f) => f.endsWith('.csv')).sort()) {
  const lines = readFileSync(join(dir, file), 'utf8').trim().split(/\r?\n/).slice(1);
  const cells = lines.map((l) => l.split(';'));
  const t0 = performance.now();
  let pieces: number, bound: number, used: number, waste: number;

  if (file.startsWith('2d')) {
    const parts = cells.map(([label, l, w, q]) => ({ label, length: +l, width: +w, qty: +q }));
    const res = optimize2D(parts, SHEET);
    const usableArea = (SHEET.stockLength - 2 * SHEET.trim) * (SHEET.stockWidth - 2 * SHEET.trim);
    pieces = parts.reduce((s, p) => s + p.qty, 0);
    bound = Math.ceil(parts.reduce((s, p) => s + p.length * p.width * p.qty, 0) / usableArea);
    used = res.sheets.length;
    waste = res.wastePct;
  } else {
    const parts = cells.map(([label, l, q]) => ({ label, length: +l, qty: +q }));
    const res = optimize1D(parts, BAR);
    pieces = parts.reduce((s, p) => s + p.qty, 0);
    const need = parts.reduce((s, p) => s + (p.length + BAR.kerf) * p.qty, 0);
    bound = Math.ceil(need / (BAR.stockLength - BAR.trim + BAR.kerf));
    used = res.bars.length;
    waste = res.wastePct;
  }
  const ms = performance.now() - t0;
  rows.push([file.replace('.csv', ''), file.slice(0, 2).toUpperCase(), pieces, bound, used, waste.toFixed(1), ms.toFixed(0)].join(';'));
}

writeFileSync(join(__dirname, 'risultati-cutpilot.csv'), rows.join('\n') + '\n');
console.table(rows.slice(1).map((r) => Object.fromEntries(r.split(';').map((v, i) => [rows[0].split(';')[i], v]))));
