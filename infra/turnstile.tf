# Protegge /api/contact, l'unica rotta pubblica che scrive. Modalita'
# managed: il widget compare solo quando Cloudflare sospetta qualcosa,
# grazie ad appearance=interaction-only impostato lato client.
resource "cloudflare_turnstile_widget" "contact" {
  count = var.enable_turnstile ? 1 : 0

  account_id = var.account_id
  name       = "${var.project_name} contact form"
  domains    = compact([var.prod_hostname, var.staging_hostname])
  mode       = "managed"
  region     = "world"
}
