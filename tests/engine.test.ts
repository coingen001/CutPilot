import { describe, expect, it } from 'vitest';
import { optimize1D } from '../src/engine/cut1d';
import { optimize2D, type Opts2D, type Part2D, type Result2D } from '../src/engine/cut2d';

// Generatore casuale deterministico, per test ripetibili.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function check2D(parts: Part2D[], opts: Opts2D, res: Result2D) {
  const kerf = opts.kerf ?? 0;
  const trim = opts.trim ?? 0;
  const eps = 1e-6;
  const expected = new Map<string, number>();
  for (const p of parts) expected.set(p.label, (expected.get(p.label) ?? 0) + p.qty);
  for (const u of res.unplaced) expected.set(u.label, (expected.get(u.label) ?? 0) - u.qty);
  const byLabel = new Map(parts.map((p) => [p.label, p]));

  for (const sheet of res.sheets) {
    for (const a of sheet.placed) {
      // dentro il pannello, rispettando il rifilo
      expect(a.x).toBeGreaterThanOrEqual(trim - eps);
      expect(a.y).toBeGreaterThanOrEqual(trim - eps);
      expect(a.x + a.length).toBeLessThanOrEqual(opts.stockLength - trim + eps);
      expect(a.y + a.width).toBeLessThanOrEqual(opts.stockWidth - trim + eps);
      // misure e venatura
      const src = byLabel.get(a.label)!;
      if (a.rotated) {
        expect(src.canRotate).not.toBe(false);
        expect([a.length, a.width]).toEqual([src.width, src.length]);
      } else {
        expect([a.length, a.width]).toEqual([src.length, src.width]);
      }
      expected.set(a.label, expected.get(a.label)! - 1);
    }
    // nessuna sovrapposizione e almeno una lama tra pezzi vicini
    for (let i = 0; i < sheet.placed.length; i++) {
      for (let j = i + 1; j < sheet.placed.length; j++) {
        const a = sheet.placed[i];
        const b = sheet.placed[j];
        const gapX = Math.max(b.x - (a.x + a.length), a.x - (b.x + b.length));
        const gapY = Math.max(b.y - (a.y + a.width), a.y - (b.y + b.width));
        expect(Math.max(gapX, gapY)).toBeGreaterThanOrEqual(kerf - eps);
      }
    }
  }
  // ogni pezzo richiesto è piazzato una sola volta
  for (const [, left] of expected) expect(left).toBe(0);
}

describe('optimize1D', () => {
  it('conta la lama tra i pezzi', () => {
    const three = [{ label: 'A', length: 2000, qty: 3 }];
    expect(optimize1D(three, { stockLength: 6000, kerf: 3 }).bars).toHaveLength(2);
    expect(optimize1D(three, { stockLength: 6000, kerf: 0 }).bars).toHaveLength(1);
    expect(optimize1D([{ label: 'A', length: 1998, qty: 3 }], { stockLength: 6000, kerf: 3 }).bars).toHaveLength(1);
  });

  it('segnala i pezzi più lunghi della barra', () => {
    const res = optimize1D([{ label: 'X', length: 7000, qty: 2 }], { stockLength: 6000 });
    expect(res.bars).toHaveLength(0);
    expect(res.unplaced).toEqual([{ label: 'X', length: 7000, qty: 2 }]);
  });

  it('non supera mai la barra e piazza tutto (casi casuali)', () => {
    const rand = rng(7);
    for (let n = 0; n < 200; n++) {
      const kerf = Math.floor(rand() * 5);
      const trim = Math.floor(rand() * 20);
      const stockLength = 3000 + Math.floor(rand() * 4000);
      const parts = Array.from({ length: 1 + Math.floor(rand() * 8) }, (_, i) => ({
        label: `P${i}`,
        length: 100 + Math.floor(rand() * 2500),
        qty: 1 + Math.floor(rand() * 6),
      }));
      const res = optimize1D(parts, { stockLength, kerf, trim });
      let count = 0;
      for (const bar of res.bars) {
        let cursor = trim;
        bar.cuts.forEach((c, i) => {
          expect(c.offset).toBeGreaterThanOrEqual(cursor + (i > 0 ? kerf : 0) - 1e-6);
          cursor = c.offset + c.length;
          count++;
        });
        expect(cursor).toBeLessThanOrEqual(stockLength + 1e-6);
      }
      expect(count).toBe(parts.reduce((s, p) => s + p.qty, 0));
      const lowerBound = Math.ceil(parts.reduce((s, p) => s + p.length * p.qty, 0) / stockLength);
      expect(res.bars.length).toBeGreaterThanOrEqual(lowerBound);
    }
  });
});

describe('optimize2D', () => {
  const sheet = { stockLength: 2000, stockWidth: 1000 };

  it('riempie esattamente un pannello senza lama', () => {
    const res = optimize2D([{ label: 'A', length: 1000, width: 500, qty: 4 }], { ...sheet, kerf: 0 });
    expect(res.sheets).toHaveLength(1);
    expect(res.wastePct).toBeCloseTo(0);
  });

  it('la lama fa uscire dal pannello il pezzo di troppo', () => {
    const parts = [{ label: 'A', length: 1000, width: 500, qty: 4 }];
    const opts = { ...sheet, kerf: 3 };
    const res = optimize2D(parts, opts);
    expect(res.sheets.length).toBeGreaterThan(1);
    check2D(parts, opts, res);
  });

  it('ruota i pezzi solo se la venatura lo permette', () => {
    const tall = { label: 'T', length: 900, width: 1800, qty: 1 };
    expect(optimize2D([tall], sheet).sheets[0].placed[0].rotated).toBe(true);
    const locked = optimize2D([{ ...tall, canRotate: false }], sheet);
    expect(locked.sheets).toHaveLength(0);
    expect(locked.unplaced).toHaveLength(1);
  });

  it('il rifilo riduce l’area utile', () => {
    const parts = [{ label: 'F', length: 2000, width: 1000, qty: 1 }];
    expect(optimize2D(parts, sheet).sheets).toHaveLength(1);
    expect(optimize2D(parts, { ...sheet, trim: 10 }).unplaced).toHaveLength(1);
  });

  it('schemi sempre validi su casi casuali', () => {
    const rand = rng(42);
    for (let n = 0; n < 300; n++) {
      const opts: Opts2D = {
        stockLength: 2000 + Math.floor(rand() * 1500),
        stockWidth: 1000 + Math.floor(rand() * 1100),
        kerf: Math.floor(rand() * 5),
        trim: Math.floor(rand() * 15),
      };
      const parts: Part2D[] = Array.from({ length: 1 + Math.floor(rand() * 10) }, (_, i) => ({
        label: `P${i}`,
        length: 80 + Math.floor(rand() * 1600),
        width: 60 + Math.floor(rand() * 900),
        qty: 1 + Math.floor(rand() * 6),
        canRotate: rand() > 0.4,
      }));
      const res = optimize2D(parts, opts);
      check2D(parts, opts, res);
      const placedArea = res.sheets.flatMap((s) => s.placed).reduce((s, p) => s + p.length * p.width, 0);
      expect(res.sheets.length).toBeGreaterThanOrEqual(Math.ceil(placedArea / (opts.stockLength * opts.stockWidth)));
    }
  });
});
