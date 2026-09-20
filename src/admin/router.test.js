import { describe, it, expect } from 'vitest';
import { parseAdminHash } from './router.js';

describe('parseAdminHash', () => {
  it('vuoto o #/ → home; #/album/slug → album; garbage → home', () => {
    expect(parseAdminHash('')).toEqual({ view: 'home' });
    expect(parseAdminHash('#/')).toEqual({ view: 'home' });
    expect(parseAdminHash('#/album/sport')).toEqual({ view: 'album', slug: 'sport' });
    expect(parseAdminHash('#/album/NO SLUG')).toEqual({ view: 'home' });
    expect(parseAdminHash('#/boh')).toEqual({ view: 'home' });
  });
});
