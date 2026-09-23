import { describe, it, expect } from 'vitest';
import { formatText } from './formatText.js';

describe('formatText', () => {
  it('sostituisce un segnaposto', () => {
    expect(formatText('Eliminare {nome}?', { nome: 'foto.webp' }))
      .toBe('Eliminare foto.webp?');
  });

  it('sostituisce lo stesso segnaposto piu volte', () => {
    expect(formatText('{a} e ancora {a}', { a: 'x' })).toBe('x e ancora x');
  });

  it('lascia intatto un segnaposto senza valore, invece di scrivere undefined', () => {
    expect(formatText('Ciao {nome}', {})).toBe('Ciao {nome}');
  });

  it('accetta numeri', () => {
    expect(formatText('Caricate {n} foto.', { n: 3 })).toBe('Caricate 3 foto.');
  });

  it('senza segnaposto restituisce il testo tale e quale', () => {
    expect(formatText('Album salvato.', {})).toBe('Album salvato.');
  });

  it('non interpreta il valore come segnaposto a sua volta', () => {
    expect(formatText('{a}', { a: '{b}', b: 'x' })).toBe('{b}');
  });
});
