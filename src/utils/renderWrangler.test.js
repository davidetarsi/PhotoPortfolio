import { describe, it, expect } from 'vitest';
import { renderWrangler } from './renderWrangler.js';

const EXAMPLE = {
  name: 'il-tuo-portfolio',
  main: 'src/worker.js',
  r2_buckets: [{ binding: 'BUCKET', bucket_name: 'il-tuo-bucket' }],
  vars: { ACCESS_TEAM_DOMAIN: 'x', ACCESS_AUD: 'y', R2_PUBLIC_URL: 'z' },
  env: {
    staging: {
      name: 'il-tuo-portfolio-staging',
      r2_buckets: [{ binding: 'BUCKET', bucket_name: 'il-tuo-bucket-staging' }],
      vars: { ACCESS_TEAM_DOMAIN: 'x', ACCESS_AUD: 'y', R2_PUBLIC_URL: 'z' },
    },
  },
};

const OUTPUTS = {
  project_name: 'mario-portfolio',
  bucket_prod: 'mario-portfolio',
  bucket_staging: 'mario-portfolio-staging',
  r2_public_url_prod: 'https://img.mario.com',
  r2_public_url_staging: 'https://pub-bbb.r2.dev',
  access_aud_prod: 'aud-prod',
  access_aud_staging: 'aud-staging',
  access_team_domain: 'mario.cloudflareaccess.com',
};

describe('renderWrangler', () => {
  it('sostituisce nomi, bucket e vars di produzione', () => {
    const r = renderWrangler(EXAMPLE, OUTPUTS);
    expect(r.name).toBe('mario-portfolio');
    expect(r.r2_buckets[0].bucket_name).toBe('mario-portfolio');
    expect(r.vars.R2_PUBLIC_URL).toBe('https://img.mario.com');
    expect(r.vars.ACCESS_AUD).toBe('aud-prod');
    expect(r.vars.ACCESS_TEAM_DOMAIN).toBe('mario.cloudflareaccess.com');
  });

  it('sostituisce anche il blocco staging, con i suoi valori', () => {
    const r = renderWrangler(EXAMPLE, OUTPUTS);
    expect(r.env.staging.name).toBe('mario-portfolio-staging');
    expect(r.env.staging.r2_buckets[0].bucket_name).toBe('mario-portfolio-staging');
    expect(r.env.staging.vars.R2_PUBLIC_URL).toBe('https://pub-bbb.r2.dev');
    expect(r.env.staging.vars.ACCESS_AUD).toBe('aud-staging');
  });

  it('non muta l oggetto di esempio ricevuto', () => {
    const copia = structuredClone(EXAMPLE);
    renderWrangler(EXAMPLE, OUTPUTS);
    expect(EXAMPLE).toEqual(copia);
  });

  it('conserva i campi che non dipendono dall infrastruttura', () => {
    const r = renderWrangler(EXAMPLE, OUTPUTS);
    expect(r.main).toBe('src/worker.js');
  });

  it('fallisce con messaggio parlante se manca una chiave', () => {
    const { access_aud_prod, ...incompleti } = OUTPUTS;
    expect(() => renderWrangler(EXAMPLE, incompleti)).toThrow(/access_aud_prod/);
  });
});
