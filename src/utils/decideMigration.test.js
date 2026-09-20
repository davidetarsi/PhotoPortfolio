import { describe, it, expect } from 'vitest';
import { decideMigration } from './decideMigration.js';

describe('decideMigration', () => {
  it('procede quando su R2 non c e nulla', () => {
    const d = decideMigration([], false);
    expect(d.procedi).toBe(true);
  });

  it('si ferma quando i dati esistono gia', () => {
    const d = decideMigration(['_site/site.json'], false);
    expect(d.procedi).toBe(false);
  });

  it('dice quali chiavi ha trovato, per non lasciare indovinare', () => {
    const d = decideMigration(['_site/site.json', '_data/albums.json'], false);
    expect(d.messaggio).toContain('_site/site.json');
    expect(d.messaggio).toContain('_data/albums.json');
  });

  it('spiega come forzare, ma avverte di cosa si perde', () => {
    const d = decideMigration(['_site/site.json'], false);
    expect(d.messaggio).toContain('--force');
    expect(d.messaggio).toMatch(/dashboard/i);
  });

  it('con --force procede e avverte che sta sovrascrivendo', () => {
    const d = decideMigration(['_site/site.json'], true);
    expect(d.procedi).toBe(true);
    expect(d.messaggio).toMatch(/sovrascriv/i);
  });

  it('con --force ma niente da sovrascrivere non allarma', () => {
    const d = decideMigration([], true);
    expect(d.procedi).toBe(true);
    expect(d.messaggio).not.toMatch(/sovrascriv/i);
  });
});
