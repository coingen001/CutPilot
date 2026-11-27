import { describe, expect, it } from 'vitest';
import { formatInch, parseDim } from '../src/units';

describe('misure in pollici', () => {
  it('legge frazioni, numeri misti e decimali', () => {
    expect(parseDim('15 1/2')).toBe(15.5);
    expect(parseDim('15-1/2')).toBe(15.5);
    expect(parseDim('3/4')).toBe(0.75);
    expect(parseDim('15.5')).toBe(15.5);
    expect(parseDim('15,5')).toBe(15.5);
    expect(parseDim('96"')).toBe(96);
    expect(parseDim('2000')).toBe(2000);
    expect(parseDim(12)).toBe(12);
  });

  it('rifiuta testo che non è una misura', () => {
    expect(parseDim('')).toBeNaN();
    expect(parseDim('Länge')).toBeNaN();
    expect(parseDim('1/0')).toBeNaN();
  });

  it('scrive le misure in frazioni ridotte', () => {
    expect(formatInch(15.5)).toBe('15 1/2');
    expect(formatInch(0.125)).toBe('1/8');
    expect(formatInch(26.875)).toBe('26 7/8');
    expect(formatInch(96)).toBe('96');
    expect(formatInch(0.03125)).toBe('1/32');
    expect(formatInch(11.999)).toBe('12');
  });

  it('andata e ritorno senza perdere la misura', () => {
    for (const v of [0.25, 7.0625, 31.5, 48, 77.96875]) expect(parseDim(formatInch(v))).toBe(v);
  });
});
