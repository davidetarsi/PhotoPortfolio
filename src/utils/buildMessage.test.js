import { describe, it, expect } from 'vitest';
import { buildMessage, messageKey } from './buildMessage.js';

const NOW = 1_800_000_000_000;

describe('buildMessage', () => {
  it('tiene i campi e aggiunge receivedAt', () => {
    const m = buildMessage({ name: 'Mario', email: 'm@e.it', message: 'Ciao' }, NOW);
    expect(m).toEqual({ name: 'Mario', email: 'm@e.it', message: 'Ciao', receivedAt: NOW });
  });

  it('include subject solo se valorizzato', () => {
    const con = buildMessage({ name: 'M', email: 'm@e.it', message: 'C', subject: 'X' }, NOW);
    expect(con.subject).toBe('X');
    const senza = buildMessage({ name: 'M', email: 'm@e.it', message: 'C', subject: '  ' }, NOW);
    expect('subject' in senza).toBe(false);
  });

  it('toglie gli spazi ai bordi', () => {
    const m = buildMessage({ name: '  Mario  ', email: ' m@e.it ', message: ' Ciao ' }, NOW);
    expect(m.name).toBe('Mario');
    expect(m.email).toBe('m@e.it');
    expect(m.message).toBe('Ciao');
  });

  it('non porta con se campi estranei', () => {
    const m = buildMessage({ name: 'M', email: 'm@e.it', message: 'C', botcheck: 'x', ip: '1.2.3.4' }, NOW);
    expect('botcheck' in m).toBe(false);
    expect('ip' in m).toBe(false);
  });
});

describe('messageKey', () => {
  it('sta sotto _messages/ ed e un json', () => {
    const k = messageKey(NOW, 'a7f3k2');
    expect(k.startsWith('_messages/')).toBe(true);
    expect(k.endsWith('.json')).toBe(true);
  });

  it('e ordinabile per data: prima viene prima', () => {
    const a = messageKey(NOW, 'aaaaaa');
    const b = messageKey(NOW + 60_000, 'aaaaaa');
    expect([b, a].sort()).toEqual([a, b]);
  });

  it('non contiene due punti, che in una chiave R2 sono scomodi', () => {
    expect(messageKey(NOW, 'a7f3k2')).not.toContain(':');
  });

  it('due messaggi nello stesso istante hanno chiavi diverse', () => {
    expect(messageKey(NOW, 'aaaaaa')).not.toBe(messageKey(NOW, 'bbbbbb'));
  });
});
