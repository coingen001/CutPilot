import { describe, expect, it } from 'vitest';
import { optimize1D } from '../src/engine/cut1d';
import { optimize2D } from '../src/engine/cut2d';

const inside = (p: { x: number; y: number; length: number; width: number }, L: number, W: number) =>
  p.x >= -1e-6 && p.y >= -1e-6 && p.x + p.length <= L + 1e-6 && p.y + p.width <= W + 1e-6;

describe('scarti in magazzino', () => {
  it('2D: un pezzo che entra in uno scarto non apre un pannello nuovo', () => {
    const res = optimize2D([{ label: 'A', length: 500, width: 400, qty: 1 }], {
      stockLength: 2800, stockWidth: 2070, kerf: 4, trim: 10, remnants: [{ length: 600, width: 450, qty: 1 }],
    });
    expect(res.sheets).toHaveLength(1);
    expect(res.sheets[0].remnant).toBe(true);
    expect(res.sheets[0].length).toBe(600);
    expect(res.sheets[0].placed[0]).toMatchObject({ x: 0, y: 0 });
  });

  it('2D: scarti non usati spariscono, i pezzi restano dentro le misure di ogni pannello', () => {
    const parts = [
      { label: 'Fianco', length: 2000, width: 560, qty: 2 },
      { label: 'Ripiano', length: 764, width: 540, qty: 5 },
      { label: 'Listello', length: 300, width: 80, qty: 6 },
    ];
    const remnants = [{ length: 900, width: 600, qty: 2 }, { length: 200, width: 100, qty: 3 }];
    const res = optimize2D(parts, { stockLength: 2800, stockWidth: 2070, kerf: 4, trim: 10, remnants });
    const without = optimize2D(parts, { stockLength: 2800, stockWidth: 2070, kerf: 4, trim: 10 });
    expect(res.sheets.filter((s) => !s.remnant).length).toBeLessThanOrEqual(without.sheets.length);
    for (const s of res.sheets) {
      expect(s.placed.length).toBeGreaterThan(0);
      for (const p of s.placed) expect(inside(p, s.length, s.width)).toBe(true);
    }
    expect(res.sheets.reduce((n, s) => n + s.placed.length, 0)).toBe(13);
  });

  it('1D: usa lo spezzone e lo conta come barra di magazzino', () => {
    const res = optimize1D([{ label: 'A', length: 1200, qty: 1 }, { label: 'B', length: 5000, qty: 1 }], {
      stockLength: 6000, kerf: 3, remnants: [{ length: 1500, qty: 1 }, { length: 400, qty: 2 }],
    });
    expect(res.bars).toHaveLength(2);
    const rem = res.bars.find((b) => b.remnant)!;
    expect(rem.stockLength).toBe(1500);
    expect(rem.cuts[0]).toMatchObject({ label: 'A', offset: 0 });
    expect(rem.rest).toBeCloseTo(297);
  });
});
