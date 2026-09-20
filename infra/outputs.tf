output "project_name" {
  value = var.project_name
}

output "bucket_prod" {
  value = cloudflare_r2_bucket.prod.name
}

output "bucket_staging" {
  value = cloudflare_r2_bucket.staging.name
}

# Se e stato configurato un dominio custom vince quello: e l'unico
# adatto alla produzione. Altrimenti si ripiega su r2.dev.
output "r2_public_url_prod" {
  value = var.custom_photo_domain != "" ? "https://${var.custom_photo_domain}" : "https://${cloudflare_r2_managed_domain.prod.domain}"
}

output "r2_public_url_staging" {
  value = "https://${cloudflare_r2_managed_domain.staging.domain}"
}

output "access_aud_prod" {
  value = cloudflare_zero_trust_access_application.prod.aud
}

output "access_aud_staging" {
  value = cloudflare_zero_trust_access_application.staging.aud
}

# Non nasce da una risorsa: rimanda alla variabile omonima. Sta qui
# perche gen-wrangler.js legge un unico file di output, e spezzare la
# sorgente in due significherebbe tenerne allineate due.
output "access_team_domain" {
  value = var.access_team_domain
}
