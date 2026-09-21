const CHIAVI_RICHIESTE = [
  'project_name', 'bucket_prod', 'bucket_staging',
  'r2_public_url_prod', 'r2_public_url_staging',
  'access_aud_prod', 'access_aud_staging', 'access_team_domain',
];

/**
 * Renders wrangler.json from Terraform outputs (or manual values following the runbook).
 * Pure function: does not mutate the input object.
 *
 * @param {object} example - The content of wrangler.example.json template.
 * @param {Record<string,string>} outputs - Terraform outputs from infra/outputs.tf.
 * @returns {object} Complete wrangler.json configuration ready to write.
 */
export function renderWrangler(example, outputs) {
  const mancanti = CHIAVI_RICHIESTE.filter(k => !outputs[k]);
  if (mancanti.length > 0) {
    throw new Error(`Valori mancanti negli output: ${mancanti.join(', ')}`);
  }

  const out = structuredClone(example);

  out.name = outputs.project_name;
  out.r2_buckets[0].bucket_name = outputs.bucket_prod;
  out.vars.R2_PUBLIC_URL = outputs.r2_public_url_prod;
  out.vars.ACCESS_AUD = outputs.access_aud_prod;
  out.vars.ACCESS_TEAM_DOMAIN = outputs.access_team_domain;
  out.vars.TURNSTILE_SITEKEY = outputs.turnstile_sitekey ?? '';

  const st = out.env.staging;
  st.name = `${outputs.project_name}-staging`;
  st.r2_buckets[0].bucket_name = outputs.bucket_staging;
  st.vars.R2_PUBLIC_URL = outputs.r2_public_url_staging;
  st.vars.ACCESS_AUD = outputs.access_aud_staging;
  st.vars.ACCESS_TEAM_DOMAIN = outputs.access_team_domain;
  st.vars.TURNSTILE_SITEKEY = outputs.turnstile_sitekey ?? '';

  return out;
}
