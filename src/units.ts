// Misure in pollici: si scrivono come 15 1/2, 15-1/2, 3/4 o 15.5 e si mostrano in frazioni.

export function parseDim(input: unknown): number {
  if (typeof input === 'number') return input;
  const s = String(input ?? '')
    .trim()
    .replace(/("|in\.?|mm)$/i, '')
    .replace(',', '.')
    .replace(/(\d)-(\d)/, '$1 $2')
    .trim();
  const m = /^(\d+(?:\.\d+)?)?\s*(?:(\d+)\s*\/\s*(\d+))?$/.exec(s);
  if (!m || (m[1] === undefined && m[2] === undefined)) return NaN;
  const fraction = m[2] !== undefined ? Number(m[2]) / Number(m[3]) : 0;
  const value = Number(m[1] ?? 0) + fraction;
  return Number.isFinite(value) ? value : NaN;
}

// Arrotonda al trentaduesimo di pollice, la precisione usata in officina.
export function formatInch(value: number): string {
  let num = Math.round(value * 32);
  const whole = Math.floor(num / 32);
  num -= whole * 32;
  if (num === 0) return String(whole);
  let den = 32;
  while (num % 2 === 0) {
    num /= 2;
    den /= 2;
  }
  return whole ? `${whole} ${num}/${den}` : `${num}/${den}`;
}
