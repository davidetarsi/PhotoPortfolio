terraform {
  required_version = ">= 1.9"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.13.0"
    }
  }
}

provider "cloudflare" {
  # Il token si legge da CLOUDFLARE_API_TOKEN nell'ambiente.
  # Non va mai scritto qui né in un file .tfvars versionato.
}
