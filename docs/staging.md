# Optional staging environment

Staging is an opt-in version preview of the connected Cloudflare Worker. It is disabled
by default; follow this guide only if you need deployment-level checks before promoting
an update. It uses the same connected Worker as production, with the `env.staging`
bindings for its bucket, public URL, Access audience, and Turnstile values.

> **Existing staging users: preserve it before planning**
>
> Staging is now opt-in. If your current Terraform state already contains a staging
> bucket, managed domain, or Access application, add this to `infra/terraform.tfvars`
> before running the first `terraform plan` after the update:
>
> ```hcl
> enable_staging = true
> ```
>
> Without it, the default is `false` and Terraform proposes destroying those three
> staging resources. Stop if the plan contains those destroys.

## 1. What staging is, and what it is not

Staging lets you verify that a build deploys, Cloudflare Access login works, admin routes
are reachable, and the contact form submits. It publishes a generated version-preview
alias of the connected Worker with the `env.staging` bindings; it does not create a
second Worker automatically.

It does not mirror production content and does not add draft/publish semantics. The two
environments have separate bindings and content, while the dashboard continues to manage
one Worker.

## 2. Do you need it?

Local `npm run dev` runs Vite and cannot exercise the Worker APIs. Local `wrangler dev`
cannot provide the Cloudflare Access header that protects `/admin`; the Worker rejects
admin requests without it. A deployed version preview can check those integration points
before you update production. It is not a copy of production albums or photos.

## 3. The staging bucket starts empty

A new staging bucket starts empty. Production photos and albums are not copied to it, and
there is no production-to-staging copy command in this template. Expect an empty portfolio
until you add staging content yourself.

## 4. Enable staging with Terraform

> **Cold bootstrap limitation — not yet verified.** This section describes the resource
> inventory and configuration for an existing workflow with a complete `env.staging`; it
> is not a proven first-install sequence. A version upload needs the complete
> `env.staging` block, including `ACCESS_AUD` obtained from the Access application, while
> creating that Access application needs the generated version-preview hostname. Do not
> assume that the steps below can bootstrap a new adopter in this order. The limitation
> is non-blocking for Davide's existing site.

In `infra/terraform.tfvars`, opt in to the optional staging resources:

```hcl
enable_staging  = true
staging_hostname = ""
```

If this Terraform state already has staging resources, follow the warning in
[`docs/upgrading.md`](upgrading.md) before the first plan after updating the template.

Terraform provisions the optional staging bucket, managed domain, and Access resources;
their outputs are rendered into the `env.staging` block by `npm run infra:sync`. This
does not create a second Worker. The connected Worker dashboard publishes the staging
version preview using those bindings; keep the existing-state warning above in place
before any `terraform plan` or `apply`.

## 5. Enable staging manually

> **Cold bootstrap limitation — not yet verified.** The items below are a resource
> inventory, not a validated first-install order. Access creation needs the generated
> preview hostname; the non-production version upload needs a complete `env.staging`,
> including the `ACCESS_AUD` returned by Access. The existing complete workflow is
> verified only after those dependencies are already satisfied. Do not present this
> section as turnkey bootstrap for a new adopter.

For an existing setup, confirm the following staging resources and settings. Their order
for a new installation is intentionally not specified here.

### R2 Buckets

1. Cloudflare dashboard → **R2 → Create Bucket**
2. Name: `{project_name}-staging` (e.g. `mario-portfolio-staging`)
3. Replica region: no (optional, only for geographic redundancy)
4. Create

### R2 managed domains (r2.dev)

1. Dashboard → **R2 → select staging bucket → Settings → Public access → Edit**
2. Enable public access
3. Copy the shown domain (format `pub-xxxxxxxx.r2.dev`)

These domains expose photos — they're rate-limited and uncached, suitable only for
development. Before production, consider a custom domain (see the runbook's
[custom-domain section](runbook-cloudflare.md#8-custom-domain-for-photos)).

### Access application for the staging version preview

If the staging version preview is protected by Access, configure the policy for the
preview hostname shown by Workers Builds. Access may protect the whole preview hostname
when path-scoping is unavailable; do not create a second Worker for this purpose.

1. Cloudflare dashboard → **Zero Trust → Access → Applications → Create new application**
2. Select **Self-hosted and private**
3. Name: e.g. `mario-portfolio admin (staging)`
4. **Add public hostname:** enter the generated staging version-preview hostname; if
   Access protects the whole hostname, do not add a path.
5. Access policies → **Create new policy**:
   - Name: `Just me`
   - Decision: **Allow**
   - Include → **Emails** → your email (e.g. `mario@mario.com`)
6. Identity providers: leave **One-time PIN** (default, needs no setup)
7. Save and create application
8. Copy the **Audience (AUD) Tag** value from the application page

### Zero Trust team domain

The team domain is provided by Cloudflare with your first Zero Trust account — format
`{team}.cloudflareaccess.com` (e.g. `mario.cloudflareaccess.com`). You don't create it, it
already exists. The Worker uses it to validate JWTs issued by Access — see
`ACCESS_TEAM_DOMAIN` in `wrangler.json`.

Find it at: Cloudflare dashboard → **Zero Trust → Settings → Custom domain**. If you don't
see it, navigate to **Access → Applications** and find the team domain in the browser URL
(`https://{team}.cloudflareaccess.com/...`).

### Turnstile widget

On the Terraform path this widget is created for you. Here you create it by hand — or you
skip it, and the form still works: the runbook's [contact-form section](runbook-cloudflare.md#9-contact-form-notifications-and-spam-protection)
explains what you give up.

1. Cloudflare dashboard → **Turnstile → Add widget**
2. Name: e.g. `mario-portfolio contact form`
3. **Hostnames:** add the production hostname and the generated staging version-preview
   hostname when the preview form is protected by Turnstile. One widget can cover both.
   A hostname that isn't listed fails validation, so a staging form pointed at a prod-only
   widget answers `CHALLENGE_FAILED` every time.
4. Widget Mode: **Managed**
5. Create

The staging preview hostname is supplied by Workers Builds. Add it to the widget after
the first version preview when the preview form needs Turnstile validation.

The widget page then shows two values, and they go to **two different places** — never
both into `wrangler.json`:

| Value | Where it goes | Why |
|---|---|---|
| **Site Key** | `wrangler.json`, as `vars.TURNSTILE_SITEKEY`, and again under `env.staging.vars` | it ends up in the HTML; it is not a secret |
| **Secret Key** | `wrangler secret put`, once per environment | the Worker validates tokens with it; it must never reach git |

```bash
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put TURNSTILE_SECRET --env staging
```

Secrets are per-environment, and a missing one fails **open**, not closed: `verifyTurnstile`
reads an absent secret as "Turnstile isn't in use here" and accepts every submission. So
setting it only for production doesn't break staging — it silently leaves it unguarded,
with the widget still drawn on the page if the staging sitekey is set. Nothing in the UI
tells you. Set it in both environments, or decide deliberately that staging goes without.

### Git integration — Connect repository

Cloudflare Workers Builds deploys the connected Worker directly from Git — no GitHub
Actions are needed.

1. Cloudflare dashboard → **Workers & Pages → select the connected Worker**
2. Connect your GitHub account (if not done yet)
3. Select the portfolio repository
4. Configure the builds:
   - **Build command:** `npm test && npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** `/` (leave default)
   - **Production branch:** `main`
   - **Non-production builds:** enabled
   - **Version command:** `npx wrangler versions upload --env staging`
5. Environment: add environment variables only if your fork requires them; the standard
   template reads its non-secret Cloudflare configuration from `wrangler.json`.

The production branch runs the deploy command. A non-production build runs the version
command and publishes a generated version-preview alias of the same Worker, using the
`env.staging` bindings. It does not create a second Worker automatically.

### Add the staging environment to `wrangler.json` manually

The distributed `wrangler.example.json` contains production only. For a manual setup, add
this top-level block to your local `wrangler.json` and replace each placeholder with the
values from the bucket, Access application, and Turnstile widget:

```json
{
  "env": {
    "staging": {
      "name": "mario-portfolio-staging",
      "r2_buckets": [
        { "binding": "BUCKET", "bucket_name": "mario-portfolio-staging" }
      ],
      "vars": {
        "ACCESS_TEAM_DOMAIN": "mario.cloudflareaccess.com",
        "ACCESS_AUD": "staging-access-aud",
        "R2_PUBLIC_URL": "https://pub-xxxxxxxx.r2.dev",
        "TURNSTILE_SITEKEY": "your-widget-sitekey"
      }
    }
  }
}
```

Merge the `env` object into the existing JSON root; do not replace the production values.
`TURNSTILE_SECRET` is a secret and does not belong in this file.

## 6. Add staging to an existing production site

> **Cold bootstrap limitation — not yet verified.** This section covers adding resources
> to an existing production site and assumes a complete `env.staging`; it does not prove
> a first-time setup for a new adopter. The generated preview hostname is needed for the
> Access application, while version upload needs `env.staging` with the Access-derived
> `ACCESS_AUD`. This is non-blocking for Davide's existing site, but blocks calling the
> optional staging path turnkey from zero.

Adding staging later is additive: production keeps its current bucket, hostname, and
configuration. With Terraform, set `enable_staging = true` and render the complete
`env.staging` block. The connected Worker publishes the staging version preview with
those bindings. If the widget is manual, add the generated preview hostname in its
dashboard settings when required; until that hostname is listed, every staging form
submission fails with `CHALLENGE_FAILED`. Set `TURNSTILE_SECRET` separately for staging
with:

```bash
npx wrangler secret put TURNSTILE_SECRET --env staging
```

For a manually managed installation, add the staging bucket, public `r2.dev` domain, and
Access application described in [the manual procedure](#5-enable-staging-manually).
The staging bucket stays empty unless you add content to it.

If these manually created resources should later be managed by Terraform, first set
`enable_staging = true`, complete the staging bindings setup, and then import the three
staging resources using their counted Terraform addresses:

```bash
terraform import 'cloudflare_r2_bucket.staging[0]' {account_id}/{bucket-name}-staging
terraform import 'cloudflare_r2_managed_domain.staging[0]' {account_id}/{domain-id}
terraform import 'cloudflare_zero_trust_access_application.staging[0]' {account_id}/{app-id}
```

After applying the configuration, export outputs and run `npm run infra:sync` so
`wrangler.json` includes a complete `env.staging` block. The generator rejects partial
staging outputs.

## 7. Upgrade through staging

An update is not a code review, it is a deployment. A push to `main` runs the production
deploy command; a non-production push runs the version command and publishes a generated
version-preview alias of the same Worker with `env.staging`. The alias has its own bucket
and bindings, so you can verify an update without touching production or creating a second
Worker.

```bash
git checkout staging
git merge upstream/main
#   ...restore wrangler.json and commit, as above...

npm test && npm run build && head -2 dist/_headers
```

Read that CSP line. It must contain **your** R2 URL. If it contains `pub-xxxxxxxx`, the
restore failed — stop, do not push.

```bash
git push origin staging
```

Workers Builds runs `npx wrangler versions upload --env staging` for the non-production
build and exposes the generated version-preview alias. Open that alias and click through
the home page, an album, `/admin`, and the contact form. When you are satisfied:

```bash
git checkout main && git merge --ff-only staging    # promote the same bytes you just tested
git push origin main
```

The promotion resolves nothing a second time. `staging` already contains everything, so
production gets exactly the bytes you verified — not a second hand-made resolution that
might differ from the first.

## 8. Disable staging safely

Do not disable staging until its bucket is empty; Terraform cannot delete a non-empty R2
bucket. First, confirm the staging bucket is empty and manually disable its `r2.dev` public
URL in Cloudflare. The managed-domain wrapper cannot be destroyed through Terraform, so
while `enable_staging` is still `true`, remove only that wrapper from state:

```bash
terraform state rm 'cloudflare_r2_managed_domain.staging[0]'
```

After the state removal succeeds, set `enable_staging = false` in
`infra/terraform.tfvars`, then run and review the plan:

```bash
terraform plan
```

The plan should remove only the empty staging bucket and staging Access application. If it
shows any other changes, stop and resolve them before continuing. Once the plan matches
that scope, apply:

```bash
terraform apply
```

Finally, regenerate Wrangler configuration from Terraform outputs with
`npm run infra:sync` and rebuild production.
