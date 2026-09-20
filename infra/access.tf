resource "cloudflare_zero_trust_access_policy" "solo_admin" {
  account_id = var.account_id
  name       = "${var.project_name} — admin"
  decision   = "allow"

  include = [{
    email = { email = var.admin_emails[0] }
  }]
}

# Produzione: zona reale, quindi Access si limita ai due percorsi admin
# e lascia pubblico tutto il resto del sito.
resource "cloudflare_zero_trust_access_application" "prod" {
  account_id       = var.account_id
  name             = "${var.project_name} admin (prod)"
  type             = "self_hosted"
  session_duration = "24h"

  destinations = [
    { type = "public", uri = "${var.prod_hostname}/admin" },
    { type = "public", uri = "${var.prod_hostname}/api/admin" },
  ]

  policies = [cloudflare_zero_trust_access_policy.solo_admin.id]
}

# Staging: dominio workers.dev, dove Access non sa fare path-scoping.
# Protegge tutto, ed e accettabile perche staging non ha pubblico.
resource "cloudflare_zero_trust_access_application" "staging" {
  account_id       = var.account_id
  name             = "${var.project_name} admin (staging)"
  type             = "self_hosted"
  session_duration = "24h"

  destinations = [
    { type = "public", uri = var.staging_hostname },
  ]

  policies = [cloudflare_zero_trust_access_policy.solo_admin.id]
}
