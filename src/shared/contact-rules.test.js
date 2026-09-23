import { describe, it, expect } from 'vitest';
import { validateContactShape, LIMITS } from './contact-rules.js';

const valido = { name: 'Mario', email: 'mario@esempio.it', message: 'Ciao' };

describe('validateContactShape', () => {
  it('accetta i tre campi obbligatori', () => {
    expect(validateContactShape(valido).ok).toBe(true);
  });

  it('accetta subject facoltativo', () => {
    expect(validateContactShape({ ...valido, subject: 'Matrimonio' }).ok).toBe(true);
  });

  it('rifiuta se manca un campo obbligatorio, dicendo quale', () => {
    for (const campo of ['name', 'email', 'message']) {
      const { [campo]: _, ...senza } = valido;
      const r = validateContactShape(senza);
      expect(r.ok).toBe(false);
      expect(r.error).toContain(campo);
    }
  });

  it('rifiuta campi di soli spazi', () => {
    expect(validateContactShape({ ...valido, name: '   ' }).ok).toBe(false);
  });

  it('rifiuta un email senza forma di email', () => {
    for (const email of ['mario', 'mario@', '@esempio.it', 'mario esempio.it']) {
      expect(validateContactShape({ ...valido, email }).ok).toBe(false);
    }
  });

  it('rifiuta oltre i limiti di lunghezza', () => {
    expect(validateContactShape({ ...valido, message: 'x'.repeat(LIMITS.message + 1) }).ok).toBe(false);
    expect(validateContactShape({ ...valido, name: 'x'.repeat(LIMITS.name + 1) }).ok).toBe(false);
    expect(validateContactShape({ ...valido, subject: 'x'.repeat(LIMITS.subject + 1) }).ok).toBe(false);
  });

  it('accetta esattamente al limite', () => {
    expect(validateContactShape({ ...valido, message: 'x'.repeat(LIMITS.message) }).ok).toBe(true);
  });

  it('rifiuta un input che non e un oggetto', () => {
    for (const x of [null, 'stringa', 42, []]) {
      expect(validateContactShape(x).ok).toBe(false);
    }
  });

  it('rifiuta campi di tipo sbagliato', () => {
    expect(validateContactShape({ ...valido, message: 42 }).ok).toBe(false);
  });
});
