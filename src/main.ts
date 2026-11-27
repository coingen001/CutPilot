import './style.css';
import { optimize1D, type Result1D } from './engine/cut1d';
import { optimize2D, type Result2D } from './engine/cut2d';
import { dict, type Lang } from './i18n';
import { readRows, rowsToParts } from './import';

const lang: Lang = document.documentElement.lang === 'it' ? 'it' : 'de';
const t = dict[lang];
const app = document.getElementById('app')!;
const STORE = 'cutpilot-v1';

interface Row2D { label: string; length: number; width: number; qty: number; rot: boolean }
interface Row1D { label: string; length: number; qty: number }
interface State {
  mode: '2d' | '1d';
  sheet: { stockLength: number; stockWidth: number; kerf: number; trim: number; grain: boolean };
  bar: { stockLength: number; kerf: number; trim: number };
  parts2d: Row2D[];
  parts1d: Row1D[];
}

const blank2d = (): Row2D => ({ label: '', length: 0, width: 0, qty: 1, rot: true });
const blank1d = (): Row1D => ({ label: '', length: 0, qty: 1 });

let state: State = {
  mode: '2d',
  sheet: { stockLength: 2800, stockWidth: 2070, kerf: 3.2, trim: 10, grain: false },
  bar: { stockLength: 6000, kerf: 3, trim: 0 },
  parts2d: [blank2d()],
  parts1d: [blank1d()],
};
try {
  const saved = localStorage.getItem(STORE);
  if (saved) state = { ...state, ...JSON.parse(saved) };
} catch { /* archivio locale non disponibile: si parte dai valori iniziali */ }

let message = '';
let result: { kind: '2d'; data: Result2D } | { kind: '1d'; data: Result1D } | null = null;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const fmt = (n: number) => String(+n.toFixed(1)).replace('.', ',');
const hue = (label: string) => [...label].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const num = (key: string, value: number, labelText: string) =>
  `<label>${labelText}<input type="number" inputmode="decimal" min="0" step="any" data-set="${key}" value="${value || ''}"></label>`;

function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* nessun salvataggio */ }
}

function partsTable(): string {
  const is2d = state.mode === '2d';
  const rows = (is2d ? state.parts2d : state.parts1d)
    .map((r, i) => {
      const cell = (field: string, value: number | string, type = 'number') =>
        `<td><input ${type === 'number' ? 'type="number" inputmode="decimal" min="0" step="any"' : 'type="text"'} data-row="${i}" data-field="${field}" value="${type === 'number' ? value || '' : esc(String(value))}" aria-label="${field}"></td>`;
      const r2 = r as Row2D;
      return `<tr>${cell('label', r.label, 'text')}${cell('length', r.length)}${is2d ? cell('width', r2.width) : ''}${cell('qty', r.qty)}${
        is2d && state.sheet.grain
          ? `<td class="center"><input type="checkbox" data-row="${i}" data-field="rot" ${r2.rot ? 'checked' : ''} aria-label="${t.rotate}"></td>`
          : ''
      }<td><button class="icon" data-del="${i}" aria-label="${t.remove}">×</button></td></tr>`;
    })
    .join('');
  return `<table class="parts"><thead><tr><th>${t.label}</th><th>${t.length}</th>${is2d ? `<th>${t.width}</th>` : ''}<th>${t.qty}</th>${
    is2d && state.sheet.grain ? `<th>${t.rotate}</th>` : ''
  }<th></th></tr></thead><tbody>${rows}</tbody></table>`;
}

function sheetSvg(sheet: Result2D['sheets'][number]): string {
  const { stockLength: L, stockWidth: W } = state.sheet;
  const fs = Math.max(L, W) / 50;
  const parts = sheet.placed
    .map((p) => {
      const showText = p.length > fs * 4.5 && p.width > fs * 2.6;
      const cx = p.x + p.length / 2;
      const cy = p.y + p.width / 2;
      return `<rect x="${p.x}" y="${p.y}" width="${p.length}" height="${p.width}" fill="hsl(${hue(p.label)} 70% 86%)" stroke="#333" stroke-width="${fs / 8}"/>${
        showText
          ? `<text x="${cx}" y="${cy - fs * 0.2}" font-size="${fs}" text-anchor="middle">${esc(p.label)}</text><text x="${cx}" y="${cy + fs}" font-size="${fs * 0.85}" text-anchor="middle" fill="#444">${fmt(p.length)}×${fmt(p.width)}</text>`
          : ''
      }`;
    })
    .join('');
  const off = sheet.offcuts[0];
  const offcut = off
    ? `<rect x="${off.x}" y="${off.y}" width="${off.length}" height="${off.width}" fill="none" stroke="#888" stroke-dasharray="${fs / 2}" stroke-width="${fs / 8}"/>`
    : '';
  return `<svg viewBox="0 0 ${L} ${W}" class="sheet"><rect width="${L}" height="${W}" fill="#f4f1ea" stroke="#333" stroke-width="${fs / 5}"/>${offcut}${parts}</svg>`;
}

function grouped(items: { label: string; length: number; width?: number; rotated?: boolean }[]): string {
  const counts = new Map<string, number>();
  for (const p of items) {
    const key = `${p.label ? esc(p.label) + ' ' : ''}${fmt(p.length)}${p.width ? '×' + fmt(p.width) : ''}${p.rotated ? ` (${t.rotated})` : ''}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return `<ul class="cuts">${[...counts].map(([k, n]) => `<li>${n}× ${k}</li>`).join('')}</ul>`;
}

function results(): string {
  if (!result) return '';
  const unplaced = result.data.unplaced.length
    ? `<p class="warn">${t.unplaced} ${result.data.unplaced.map((u) => `${u.qty}× ${esc(u.label)} ${fmt(u.length)}${'width' in u ? '×' + fmt(u.width) : ''}`).join(', ')}</p>`
    : '';
  const stat = (label: string, value: string) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`;

  if (result.kind === '2d') {
    const { sheets, wastePct } = result.data;
    const best = sheets.flatMap((s) => s.offcuts.slice(0, 1)).sort((a, b) => b.length * b.width - a.length * a.width)[0];
    return `${unplaced}<div class="stats">${stat(t.sheets, String(sheets.length))}${stat(t.waste, fmt(wastePct) + ' %')}${stat(
      t.placed,
      String(sheets.reduce((s, sh) => s + sh.placed.length, 0)),
    )}${best ? stat(t.bestOffcut, `${fmt(best.length)}×${fmt(best.width)}`) : ''}</div>${sheets
      .map((s, i) => `<article class="plan"><h3>${t.sheetN(i + 1, sheets.length)}</h3>${sheetSvg(s)}${grouped(s.placed)}</article>`)
      .join('')}`;
  }

  const { bars, wastePct } = result.data;
  const L = state.bar.stockLength;
  const h = L / 40;
  return `${unplaced}<div class="stats">${stat(t.bars, String(bars.length))}${stat(t.waste, fmt(wastePct) + ' %')}${stat(
    t.placed,
    String(bars.reduce((s, b) => s + b.cuts.length, 0)),
  )}</div>${bars
    .map(
      (b, i) =>
        `<article class="plan"><h3>${t.barN(i + 1, bars.length)} · ${t.rest} ${fmt(b.rest)} mm</h3><svg viewBox="0 0 ${L} ${h}" class="bar"><rect width="${L}" height="${h}" fill="#f4f1ea" stroke="#333" stroke-width="${h / 20}"/>${b.cuts
          .map(
            (c) =>
              `<rect x="${c.offset}" y="0" width="${c.length}" height="${h}" fill="hsl(${hue(c.label + c.length)} 70% 86%)" stroke="#333" stroke-width="${h / 20}"/>${
                c.length > h * 2.2 ? `<text x="${c.offset + c.length / 2}" y="${h * 0.65}" font-size="${h * 0.45}" text-anchor="middle">${fmt(c.length)}</text>` : ''
              }`,
          )
          .join('')}</svg>${grouped(b.cuts)}</article>`,
    )
    .join('')}`;
}

function render() {
  const is2d = state.mode === '2d';
  app.innerHTML = `
  <div class="no-print">
    <div class="tabs" role="tablist">
      <button role="tab" data-mode="2d" aria-selected="${is2d}">${t.tab2d}</button>
      <button role="tab" data-mode="1d" aria-selected="${!is2d}">${t.tab1d}</button>
    </div>
    <section>
      <h2>${t.settings}</h2>
      <div class="grid">${
        is2d
          ? num('sheet.stockLength', state.sheet.stockLength, t.stockLength) +
            num('sheet.stockWidth', state.sheet.stockWidth, t.stockWidth) +
            num('sheet.kerf', state.sheet.kerf, t.kerf) +
            num('sheet.trim', state.sheet.trim, t.trim)
          : num('bar.stockLength', state.bar.stockLength, t.stockLength) + num('bar.kerf', state.bar.kerf, t.kerf) + num('bar.trim', state.bar.trim, t.trim1d)
      }</div>
      ${is2d ? `<label class="check"><input type="checkbox" data-set="sheet.grain" ${state.sheet.grain ? 'checked' : ''}> ${t.grain}</label>` : ''}
    </section>
    <section>
      <h2>${t.parts}</h2>
      ${partsTable()}
      <div class="actions">
        <button data-act="add">${t.addRow}</button>
        <label class="button">${t.importFile}<input type="file" accept=".csv,.txt,.xlsx" data-act="import" hidden></label>
        <button data-act="example">${t.example}</button>
        <button data-act="clear">${t.clear}</button>
      </div>
      <p class="hint">${t.importHint}</p>
      ${message ? `<p class="msg">${message}</p>` : ''}
    </section>
    <button class="primary" data-act="run">${t.run}</button>
  </div>
  <section id="results">${results()}${result ? `<button class="no-print" data-act="print">${t.print}</button>` : ''}</section>`;
}

function run() {
  message = '';
  if (state.mode === '2d') {
    const parts = state.parts2d
      .filter((r) => r.length > 0 && r.width > 0 && r.qty > 0)
      .map((r) => ({ label: r.label, length: r.length, width: r.width, qty: r.qty, canRotate: state.sheet.grain ? r.rot : true }));
    if (!parts.length) message = t.empty;
    result = parts.length ? { kind: '2d', data: optimize2D(parts, state.sheet) } : null;
  } else {
    const parts = state.parts1d.filter((r) => r.length > 0 && r.qty > 0);
    if (!parts.length) message = t.empty;
    result = parts.length ? { kind: '1d', data: optimize1D(parts, state.bar) } : null;
  }
  render();
  if (result) document.getElementById('results')!.scrollIntoView({ behavior: 'smooth' });
}

const example2d: Row2D[] = [
  { label: lang === 'it' ? 'Fianco' : 'Seite', length: 2000, width: 560, qty: 2, rot: false },
  { label: lang === 'it' ? 'Ripiano' : 'Boden', length: 764, width: 540, qty: 5, rot: false },
  { label: lang === 'it' ? 'Cielo/fondo' : 'Deckel/Sockel', length: 800, width: 560, qty: 2, rot: false },
  { label: lang === 'it' ? 'Anta' : 'Tür', length: 1996, width: 397, qty: 2, rot: false },
  { label: lang === 'it' ? 'Zoccolo' : 'Blende', length: 764, width: 100, qty: 2, rot: true },
];
const example1d: Row1D[] = [
  { label: lang === 'it' ? 'Montante' : 'Pfosten', length: 2100, qty: 6 },
  { label: lang === 'it' ? 'Traverso' : 'Riegel', length: 1250, qty: 8 },
  { label: lang === 'it' ? 'Rinforzo' : 'Strebe', length: 640, qty: 10 },
];

// Un input modificato aggiorna lo stato senza ridisegnare, per non perdere il cursore.
app.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.type === 'file') return;
  const value = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) || 0 : el.value;
  if (el.dataset.set) {
    const [group, key] = el.dataset.set.split('.') as ['sheet' | 'bar', string];
    (state[group] as Record<string, unknown>)[key] = value;
    if (el.dataset.set === 'sheet.grain') render();
  } else if (el.dataset.row) {
    const rows = (state.mode === '2d' ? state.parts2d : state.parts1d) as unknown as Record<string, unknown>[];
    rows[Number(el.dataset.row)][el.dataset.field!] = value;
  }
  save();
});

app.addEventListener('change', async (e) => {
  const el = e.target as HTMLInputElement;
  if (el.dataset.act !== 'import' || !el.files?.[0]) return;
  try {
    const is2d = state.mode === '2d';
    const rows = rowsToParts(await readRows(el.files[0]), is2d ? 3 : 2);
    if (is2d) state.parts2d = rows.map((r) => ({ label: r.label, length: r.nums[0], width: r.nums[1], qty: r.nums[2], rot: true }));
    else state.parts1d = rows.map((r) => ({ label: r.label, length: r.nums[0], qty: r.nums[1] }));
    message = t.importDone(rows.length);
  } catch {
    message = t.importFail;
  }
  result = null;
  save();
  render();
});

app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
  if (!el) return;
  const is2d = state.mode === '2d';
  if (el.dataset.mode) {
    state.mode = el.dataset.mode as State['mode'];
    result = null;
    message = '';
  } else if (el.dataset.del) {
    (is2d ? state.parts2d : state.parts1d).splice(Number(el.dataset.del), 1);
  } else if (el.dataset.act === 'add') {
    if (is2d) state.parts2d.push(blank2d());
    else state.parts1d.push(blank1d());
  } else if (el.dataset.act === 'example') {
    if (is2d) state.parts2d = example2d.map((r) => ({ ...r }));
    else state.parts1d = example1d.map((r) => ({ ...r }));
    result = null;
  } else if (el.dataset.act === 'clear') {
    if (is2d) state.parts2d = [blank2d()];
    else state.parts1d = [blank1d()];
    result = null;
  } else if (el.dataset.act === 'run') {
    save();
    return run();
  } else if (el.dataset.act === 'print') {
    return window.print();
  } else return;
  save();
  render();
});

render();
