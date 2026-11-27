import '@fontsource-variable/outfit';
import '@fontsource-variable/figtree';
import './style.css';
import { optimize1D, type Result1D } from './engine/cut1d';
import { optimize2D, type Result2D } from './engine/cut2d';
import { dict, type Lang } from './i18n';
import { readRows, rowsToParts } from './import';
import { track } from './track';
import { formatInch, parseDim } from './units';

const htmlLang = document.documentElement.lang.toLowerCase();
const lang: Lang = htmlLang in dict ? (htmlLang as Lang) : 'en-us';
const t = dict[lang];
const app = document.getElementById('app')!;
const inch = t.unit === 'in';
// Le distinte in pollici e in millimetri si salvano separate.
const preset = JSON.parse(app.dataset.preset || '{}') as { key?: string; mode?: '2d' | '1d'; sheet?: object; bar?: object };
const STORE = `cutpilot-v1-${t.unit}-${preset.key ?? 'home'}`;

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
  mode: preset.mode ?? '2d',
  sheet: inch ? { stockLength: 96, stockWidth: 48, kerf: 0.125, trim: 0, grain: false } : { stockLength: 2800, stockWidth: 2070, kerf: 3.2, trim: 10, grain: false },
  bar: inch ? { stockLength: 96, kerf: 0.125, trim: 0 } : { stockLength: 6000, kerf: 3, trim: 0 },
  parts2d: [blank2d()],
  parts1d: [blank1d()],
};
state.sheet = { ...state.sheet, ...preset.sheet };
state.bar = { ...state.bar, ...preset.bar };
const defaults = { ...state.sheet };
try {
  const saved = localStorage.getItem(STORE);
  if (saved) state = { ...state, ...JSON.parse(saved) };
} catch { /* archivio locale non disponibile: si parte dai valori iniziali */ }

let message = '';
let result: { kind: '2d'; data: Result2D } | { kind: '1d'; data: Result1D } | null = null;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const decimal = (n: number) => (lang === 'en-us' ? String(+n.toFixed(1)) : String(+n.toFixed(1)).replace('.', ','));
// Misure: frazioni di pollice negli Stati Uniti, millimetri altrove.
const fmt = (n: number) => (inch ? formatInch(n) : decimal(n));
const TINTS = ['#cfe3d8', '#f6dfb4', '#dde6ea', '#a9cdbb', '#fbeed3', '#e7eae3', '#8fbfa8', '#eccf94'];
const tint = (n: number) => TINTS[(n - 1) % TINTS.length];
// Nelle impostazioni lo zero si mostra (lama 0 per il vetro); nella distinta una misura vuota resta vuota.
const dimAttrs = (value: number, showZero = false) => {
  const shown = value || showZero ? (inch ? fmt(value) : String(value)) : '';
  return inch ? `type="text" data-dim autocomplete="off" value="${shown}"` : `type="number" inputmode="decimal" min="0" step="any" value="${shown}"`;
};
const num = (key: string, value: number, labelText: string) => `<label>${labelText}<input ${dimAttrs(value, true)} data-set="${key}"></label>`;

function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* nessun salvataggio */ }
}

function partsTable(): string {
  const is2d = state.mode === '2d';
  const rows = (is2d ? state.parts2d : state.parts1d)
    .map((r, i) => {
      const cell = (field: string, value: number | string, kind: 'dim' | 'qty' | 'text' = 'dim') =>
        `<td><input ${
          kind === 'dim'
            ? dimAttrs(value as number)
            : kind === 'qty'
              ? `type="number" inputmode="numeric" min="0" step="1" value="${value || ''}"`
              : `type="text" value="${esc(String(value))}"`
        } data-row="${i}" data-field="${field}" aria-label="${field}"></td>`;
      const r2 = r as Row2D;
      return `<tr>${cell('label', r.label, 'text')}${cell('length', r.length)}${is2d ? cell('width', r2.width) : ''}${cell('qty', r.qty, 'qty')}${
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

type Piece = { label: string; length: number; width?: number; rotated?: boolean };

// Ogni tipo di pezzo (descrizione + misure) riceve un numero, usato nello schema e nella legenda.
function numbering(items: Piece[]) {
  const ids = new Map<string, number>();
  const key = (p: Piece) => {
    const dims = p.width === undefined ? [p.length] : p.rotated ? [p.width, p.length] : [p.length, p.width];
    return `${p.label}|${dims.join('x')}`;
  };
  for (const p of items) if (!ids.has(key(p))) ids.set(key(p), ids.size + 1);
  return (p: Piece) => ids.get(key(p))!;
}

function sheetSvg(sheet: Result2D['sheets'][number], L: number, W: number, idOf: (p: Piece) => number, highlight = 0): string {
  const fs = Math.max(L, W) / 46;
  const m = fs * 2.4;
  const parts = sheet.placed
    .map((p) => {
      const n = idOf(p);
      const big = p.length > fs * 5 && p.width > fs * 3.4;
      const small = !big && p.length > fs * 1.6 && p.width > fs * 1.4;
      const cx = p.x + p.length / 2;
      const cy = p.y + p.width / 2;
      const fill = n === highlight ? '#e39930' : tint(n);
      return `<rect x="${p.x}" y="${p.y}" width="${p.length}" height="${p.width}" fill="${fill}" stroke="#0f3f31" stroke-width="${fs / 9}"/>${
        big
          ? `<text x="${cx}" y="${cy - fs * 0.15}" font-size="${fs * 1.5}" font-weight="700" text-anchor="middle">${n}</text><text x="${cx}" y="${cy + fs * 1.15}" font-size="${fs * 0.82}" text-anchor="middle" fill="#3c4a44">${fmt(p.length)} × ${fmt(p.width)}</text>`
          : small
            ? `<text x="${cx}" y="${cy + fs * 0.4}" font-size="${fs * 1.1}" font-weight="700" text-anchor="middle">${n}</text>`
            : ''
      }`;
    })
    .join('');
  const offcuts = sheet.offcuts.map((o) => `<rect x="${o.x}" y="${o.y}" width="${o.length}" height="${o.width}" fill="url(#hatch)"/>`).join('');
  return `<svg viewBox="${-m} ${-m} ${L + m * 1.15} ${W + m * 1.15}" class="sheet" role="img"><defs><pattern id="hatch" width="${fs}" height="${fs}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${fs}" stroke="#b9c4be" stroke-width="${fs / 7}"/></pattern></defs><text x="${L / 2}" y="${-m * 0.4}" font-size="${fs}" text-anchor="middle" fill="#5d6b64">${fmt(L)} ${t.unit}</text><text transform="translate(${-m * 0.4} ${W / 2}) rotate(-90)" font-size="${fs}" text-anchor="middle" fill="#5d6b64">${fmt(W)} ${t.unit}</text><rect width="${L}" height="${W}" fill="#fff" stroke="#0f3f31" stroke-width="${fs / 4}"/>${offcuts}${parts}</svg>`;
}

function legend(items: Piece[], idOf: (p: Piece) => number): string {
  const rows = new Map<number, { text: string; count: number }>();
  for (const p of items) {
    const n = idOf(p);
    const dims = p.width === undefined ? fmt(p.length) : p.rotated ? `${fmt(p.width)} × ${fmt(p.length)}` : `${fmt(p.length)} × ${fmt(p.width)}`;
    const row = rows.get(n) ?? { text: `${p.label ? esc(p.label) + ' · ' : ''}${dims} ${t.unit}${p.rotated ? ` (${t.rotated})` : ''}`, count: 0 };
    row.count++;
    rows.set(n, row);
  }
  return `<ul class="legend">${[...rows]
    .sort((x, y) => x[0] - y[0])
    .map(([n, r]) => `<li><span class="num" style="background:${tint(n)}">${n}</span><span>${r.text}</span><b>${r.count}×</b></li>`)
    .join('')}</ul>`;
}

function results(): string {
  if (!result) return '';
  const unplaced = result.data.unplaced.length
    ? `<p class="warn">${t.unplaced} ${result.data.unplaced.map((u) => `${u.qty}× ${esc(u.label)} ${fmt(u.length)}${'width' in u ? '×' + fmt(u.width) : ''}`).join(', ')}</p>`
    : '';
  const stat = (label: string, value: string) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`;

  if (result.kind === '2d') {
    const { sheets, wastePct } = result.data;
    const { stockLength: L, stockWidth: W } = state.sheet;
    const idOf = numbering(sheets.flatMap((s) => s.placed));
    const best = sheets.flatMap((s) => s.offcuts.slice(0, 1)).sort((a, b) => b.length * b.width - a.length * a.width)[0];
    return `${unplaced}<div class="stats">${stat(t.sheets, String(sheets.length))}${stat(t.waste, decimal(wastePct) + ' %')}${stat(
      t.placed,
      String(sheets.reduce((s, sh) => s + sh.placed.length, 0)),
    )}${best ? stat(t.bestOffcut, `${fmt(best.length)} × ${fmt(best.width)}`) : ''}</div>${sheets
      .map((s, i) => `<article class="plan"><h3>${t.sheetN(i + 1, sheets.length)}</h3>${sheetSvg(s, L, W, idOf)}${legend(s.placed, idOf)}</article>`)
      .join('')}`;
  }

  const { bars, wastePct } = result.data;
  const L = state.bar.stockLength;
  const h = L / 26;
  const idOf = numbering(bars.flatMap((b) => b.cuts));
  return `${unplaced}<div class="stats">${stat(t.bars, String(bars.length))}${stat(t.waste, decimal(wastePct) + ' %')}${stat(
    t.placed,
    String(bars.reduce((s, b) => s + b.cuts.length, 0)),
  )}</div>${bars
    .map(
      (b, i) =>
        `<article class="plan"><h3>${t.barN(i + 1, bars.length)} · ${t.rest} ${fmt(b.rest)} ${t.unit}</h3><svg viewBox="0 0 ${L} ${h}" class="bar" role="img"><defs><pattern id="hatch1" width="${h / 5}" height="${h / 5}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${h / 5}" stroke="#b9c4be" stroke-width="${h / 30}"/></pattern></defs><rect width="${L}" height="${h}" fill="url(#hatch1)" stroke="#0f3f31" stroke-width="${h / 14}"/>${b.cuts
          .map(
            (c) =>
              `<rect x="${c.offset}" y="0" width="${c.length}" height="${h}" fill="${tint(idOf(c))}" stroke="#0f3f31" stroke-width="${h / 22}"/>${
                c.length > h * 1.1 ? `<text x="${c.offset + c.length / 2}" y="${h * 0.66}" font-size="${h * 0.46}" font-weight="700" text-anchor="middle">${idOf(c)}</text>` : ''
              }`,
          )
          .join('')}</svg>${legend(b.cuts, idOf)}</article>`,
    )
    .join('')}`;
}

// Salvare i progetti è una funzione PRO: il pulsante è visibile e, quando si prova, spiega il piano.
let overLimit = false;

function projectsBlock(): string {
  return `<section class="projects">
      <button data-act="save-project">${t.saveProject}</button>
      ${overLimit ? `<div class="upgrade"><p>${t.limit}</p><a class="btn primary" href="${app.dataset.pricing ?? '#'}">${t.seePlans}</a></div>` : ''}
    </section>`;
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
        <button data-act="import-open">${t.importFile}</button>
        <button data-act="example">${t.example}</button>
        <button data-act="clear">${t.clear}</button>
      </div>
      <p class="hint">${t.importHint}</p>
      ${message ? `<p class="msg">${message}</p>` : ''}
    </section>
    <button class="primary" data-act="run">${t.run}</button>
    ${projectsBlock()}
  </div>
  <section id="results">${results()}${result ? `<button class="no-print" data-act="print">${t.print}</button>` : ''}</section>`;
}

function run() {
  track('run');
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

// Esempi: stesso armadio e stesso telaio, in millimetri o in pollici.
const dims2d = inch
  ? [[78, 22, 2], [30, 21, 5], [31.5, 22, 2], [78, 15.5, 2], [30, 4, 2]]
  : [[2000, 560, 2], [764, 540, 5], [800, 560, 2], [1996, 397, 2], [764, 100, 2]];
const example2d: Row2D[] = dims2d.map(([length, width, qty], i) => ({ label: t.ex[i], length, width, qty, rot: i === 4 }));
const dims1d = inch ? [[82, 6], [49, 8], [25, 10]] : [[2100, 6], [1250, 8], [640, 10]];
const example1d: Row1D[] = dims1d.map(([length, qty], i) => ({ label: t.ex[5 + i], length, qty }));

// Un input modificato aggiorna lo stato senza ridisegnare, per non perdere il cursore.
app.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  const value = el.type === 'checkbox' ? el.checked : el.dataset.dim !== undefined ? parseDim(el.value) || 0 : el.type === 'number' ? Number(el.value) || 0 : el.value;
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

async function importFile(file: File) {
  try {
    const is2d = state.mode === '2d';
    const rows = rowsToParts(await readRows(file), is2d ? 3 : 2);
    if (is2d) state.parts2d = rows.map((r) => ({ label: r.label, length: r.nums[0], width: r.nums[1], qty: r.nums[2], rot: true }));
    else state.parts1d = rows.map((r) => ({ label: r.label, length: r.nums[0], qty: r.nums[1] }));
    message = t.importDone(rows.length);
    track('import');
  } catch {
    message = t.importFail;
  }
  result = null;
  save();
  render();
}

// Finestra di importazione: spiega la struttura del file e offre un modello da scaricare.
const importDialog = document.createElement('dialog');
importDialog.className = 'import-dialog';
document.body.append(importDialog);

function openImport() {
  const is2d = state.mode === '2d';
  const head = is2d ? [t.label, t.length, t.width, t.qty] : [t.label, t.length, t.qty];
  const sample = is2d ? example2d.map((r) => [r.label, fmt(r.length), fmt(r.width), r.qty]) : example1d.map((r) => [r.label, fmt(r.length), r.qty]);
  const sep = inch ? ',' : ';';
  const quote = (v: string | number) => (String(v).includes(sep) ? `"${v}"` : String(v));
  const csv = '\ufeff' + [head, ...sample].map((row) => row.map(quote).join(sep)).join('\r\n') + '\r\n';
  importDialog.innerHTML = `<h2>${t.importTitle}</h2>
    <p>${t.importIntro} ${t.unitNote}</p>
    <table class="sample"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${sample
      .slice(0, 3)
      .map((row) => `<tr>${row.map((c) => `<td>${esc(String(c))}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>
    <ul>${t.importRules.map((r) => `<li>${r}</li>`).join('')}</ul>
    <div class="actions">
      <label class="button primary">${t.chooseFile}<input type="file" accept=".csv,.txt,.xlsx" hidden></label>
      <a class="btn" download="cutpilot-${is2d ? '2d' : '1d'}.csv" href="${URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))}">${t.template}</a>
      <button data-close>${t.close}</button>
    </div>`;
  importDialog.showModal();
}
importDialog.addEventListener('click', (e) => {
  if (e.target === importDialog || (e.target as HTMLElement).closest('[data-close]')) importDialog.close();
});
importDialog.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  importDialog.close();
  void importFile(file);
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
  } else if (el.dataset.act === 'import-open') {
    return openImport();
  } else if (el.dataset.act === 'save-project') {
    overLimit = true;
    track('limit');
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

// Figura d'apertura: uno schema vero, calcolato dal motore sull'esempio dell'armadio.
const hero = document.getElementById('hero-figure');
if (hero) {
  const demo = optimize2D(example2d.map((r) => ({ label: r.label, length: r.length, width: r.width, qty: r.qty })), defaults);
  hero.innerHTML = sheetSvg(demo.sheets[0], defaults.stockLength, defaults.stockWidth, numbering(demo.sheets.flatMap((sh) => sh.placed)), 2);
}
document.querySelector('[data-hero-example]')?.addEventListener('click', () => {
  track('example');
  state.mode = '2d';
  state.parts2d = example2d.map((r) => ({ ...r }));
  save();
  run();
});
track('view');
