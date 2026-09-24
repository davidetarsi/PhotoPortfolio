import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { adminConfig } from '../config/admin.config.js';
import { albums } from '../config/albums.config.js';
import { siteConfig } from '../config/site.config.js';
import { texts } from '../config/texts.config.js';

const wrangler = JSON.parse(
  readFileSync(new URL('../wrangler.json', new URL(import.meta.url)), 'utf8'),
);

describe('personal site seed configuration', () => {
  it('keeps the personal identity and the new hero shape', () => {
    expect(siteConfig.name).toBe('Davide Tarsi');
    expect(siteConfig.bio).toBe('Fotografo sportivo e di viaggio.');
    expect(siteConfig.language).toBe('it');
    expect(siteConfig.social).toEqual(expect.any(Object));
    expect(siteConfig).toHaveProperty('provider', 'r2');
    expect(siteConfig).toHaveProperty('r2PublicUrl');
    expect(siteConfig.heroImage).toEqual({ album: 'sport', name: '4x5-crop-7302.webp' });
    expect(siteConfig).not.toHaveProperty('heroImageUrl');
    expect(siteConfig).not.toHaveProperty('web3formsAccessKey');
  });

  it('keeps the personal albums in the template seed schema', () => {
    const bySlug = new Map(albums.map(album => [album.slug, album]));

    expect([...bySlug.keys()]).toEqual(['sport', 'around-the-world']);
    expect(bySlug.get('sport')).toMatchObject({
      coverName: '4x5-crop-IMG_8689-.webp',
    });
    expect(bySlug.get('around-the-world')).toMatchObject({
      coverName: '4x5-2637.webp',
    });
    for (const album of albums) {
      expect(album).not.toHaveProperty('coverUrl');
    }
  });

  it('uses the about copy and keeps the admin fallback copy', () => {
    expect(texts).not.toHaveProperty('contatti');
    expect(texts.nav).not.toHaveProperty('contattiLabel');
    expect(texts.about.form.subjectPlaceholder).toBeTruthy();
    expect(texts.album.error.noImage).toBeTruthy();
    expect(texts.album.error).not.toHaveProperty('forbidden');
    expect(texts.admin.messages).toMatchObject({
      sectionTitle: expect.any(String),
      empty: expect.any(String),
      loadError: expect.any(String),
      confirmDelete: expect.any(String),
      deleted: expect.any(String),
      reply: expect.any(String),
      delete: expect.any(String),
    });
    expect(adminConfig.backgroundImageUrl).toBeTruthy();
  });

  it('configures one public Turnstile sitekey without committing secrets', () => {
    const production = wrangler.vars.TURNSTILE_SITEKEY;
    const staging = wrangler.env.staging.vars.TURNSTILE_SITEKEY;

    expect(production).toEqual(expect.any(String));
    expect(production.length).toBeGreaterThan(10);
    expect(staging).toBe(production);

    const serialized = JSON.stringify(wrangler);
    expect(serialized).not.toContain('TURNSTILE_SECRET');
    expect(serialized).not.toContain('CONTACT_NOTIFY_URL');
  });
});
