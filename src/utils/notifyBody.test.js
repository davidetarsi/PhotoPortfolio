import { describe, it, expect } from 'vitest';
import { notifyBody } from './notifyBody.js';

const M = {
  name: 'Mario Rossi',
  email: 'mario@esempio.it',
  subject: 'Matrimonio a giugno',
  message: 'SEGRETISSIMO: questo testo non deve uscire',
  receivedAt: 1_800_000_000_000,
};

describe('notifyBody', () => {
  it('dice chi ha scritto', () => {
    expect(notifyBody(M, 'https://sito.it/admin')).toContain('Mario Rossi');
  });

  it('NON contiene il testo del messaggio', () => {
    // I topic pubblici di ntfy sono leggibili da chiunque ne indovini il
    // nome: mandarci il messaggio sarebbe una fuga di dati (spec §4).
    expect(notifyBody(M, 'https://sito.it/admin')).not.toContain('SEGRETISSIMO');
  });

  it('NON contiene l email di chi scrive', () => {
    expect(notifyBody(M, 'https://sito.it/admin')).not.toContain('mario@esempio.it');
  });

  it('rimanda alla dashboard', () => {
    expect(notifyBody(M, 'https://sito.it/admin')).toContain('https://sito.it/admin');
  });

  it('funziona anche senza subject', () => {
    const { subject: _, ...senza } = M;
    expect(() => notifyBody(senza, 'https://sito.it/admin')).not.toThrow();
  });

  it('non lascia passare un nome lunghissimo', () => {
    const lungo = { ...M, name: 'x'.repeat(500) };
    expect(notifyBody(lungo, 'https://sito.it/admin').length).toBeLessThan(300);
  });
});
