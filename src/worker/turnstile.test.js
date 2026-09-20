import { describe, it, expect } from 'vitest';
import { verifyTurnstile } from './turnstile.js';

const okFetch = async () => new Response(JSON.stringify({ success: true }));
const koFetch = async () => new Response(JSON.stringify({ success: false }));

describe('verifyTurnstile', () => {
  it('passa quando Cloudflare risponde success', async () => {
    expect(await verifyTurnstile('tok', 'sec', okFetch)).toBe(true);
  });

  it('blocca quando Cloudflare risponde success:false', async () => {
    expect(await verifyTurnstile('tok', 'sec', koFetch)).toBe(false);
  });

  it('senza secret la verifica e disattivata e passa', async () => {
    // Turnstile e' opzionale: chi non lo configura deve avere un form
    // funzionante, non uno che rifiuta tutto.
    expect(await verifyTurnstile('', '', okFetch)).toBe(true);
  });

  it('con secret ma senza token blocca', async () => {
    expect(await verifyTurnstile('', 'sec', okFetch)).toBe(false);
  });

  it('blocca se la chiamata a Cloudflare fallisce', async () => {
    const rotto = async () => { throw new Error('rete'); };
    expect(await verifyTurnstile('tok', 'sec', rotto)).toBe(false);
  });

  it('blocca se Cloudflare risponde con qualcosa che non e JSON', async () => {
    const strano = async () => new Response('<html>errore</html>');
    expect(await verifyTurnstile('tok', 'sec', strano)).toBe(false);
  });
});
