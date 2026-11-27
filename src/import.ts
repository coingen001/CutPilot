// Lettura della distinta da CSV o Excel. Restituisce righe di celle grezze.

export async function readRows(file: File): Promise<unknown[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    const { default: readXlsxFile } = await import('read-excel-file');
    return (await readXlsxFile(file)) as unknown[][];
  }
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  const delimiter = [';', '\t', ','].find((d) => lines[0]?.includes(d)) ?? ';';
  return lines.map((l) => l.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, '')));
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  const n = Number(String(value ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

// Accetta righe con o senza colonna descrizione; salta intestazioni e righe non numeriche.
export function rowsToParts(rows: unknown[][], numbersNeeded: number) {
  const out: { label: string; nums: number[] }[] = [];
  for (const row of rows) {
    const hasLabel = Number.isNaN(toNumber(row[0])) || row.length > numbersNeeded;
    const cells = hasLabel ? row.slice(1) : row;
    const nums = cells.slice(0, numbersNeeded).map(toNumber);
    if (nums.length < numbersNeeded - 1 || nums.slice(0, numbersNeeded - 1).some((n) => !(n > 0))) continue;
    if (!(nums[numbersNeeded - 1] > 0)) nums[numbersNeeded - 1] = 1; // quantità mancante = 1
    out.push({ label: hasLabel ? String(row[0] ?? '') : '', nums });
  }
  return out;
}
