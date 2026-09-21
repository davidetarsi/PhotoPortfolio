# Cloudflare Runbook — Manual infrastructure configuration

This document describes how to configure Cloudflare infrastructure for the photography portfolio manually from the dashboard, without using Terraform. It's the equivalent path to the `infra/` configuration file — produces the same result, and is supported as a permanent alternative.

If you prefer Terraform, skip this document and follow the automated path in `README.md`. If you've already created resources manually, go to [Importing existing resources](#infrastructure-preexistent--terraform-import).

## 1. Prerequisites

You need:

- **Active Cloudflare account** with dashboard access and permissions to create R2 buckets, public domains, and Access applications (Zero Trust).
- **Production domain** (optional on first deploy, required before going live). In our example we use a custom domain like `portfolio.example`, already an active Cloudflare zone. If you don't have one, for initial testing you can use the `workers.dev` domain provided by Cloudflare (read-only, with rate limiting).
- **Zone ID** of the custom domain, if you use it for photos. Find it in Cloudflare dashboard → select the domain → copy Zone ID from the right sidebar.

## 2. Cloudflare API Token

Terraform operations require an API token with specific permissions. If you're not using Terraform, you don't need this token: skip to [Manual path](#5-manual-path--creating-resources-from-cloudflare-dashboard). If you use it later, the token must have:

- **Workers R2 Storage: Edit** — allows creating and modifying R2 buckets.
- **Access: Apps and Policies: Edit** — allows creating Access applications and policies.
- **Turnstile: Edit** — required by the contact-form widget, enabled by default through `enable_turnstile = true`.
- **Zone: DNS: Edit** (only if using a custom domain for photos) — allows configuring DNS records on the domain.

Create the token in Cloudflare dashboard → **Account → API Tokens → Create Token** and assign these permissions. **Critical:** never write the token in a versioned file (never in `.env`, `wrangler.json`, or `terraform.tfvars`). Export it only as an environment variable in your shell:

```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
```

If you accidentally write it in a file, immediately revoke the token on Cloudflare and create a new one.

## 3. Terraform path

If using Terraform, the flow is:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# Now populate terraform.tfvars with your values:
# - account_id: find in Cloudflare dashboard → Account → right sidebar
# - project_name: bucket prefix, e.g. 'mario-portfolio'
# - access_team_domain: account's Zero Trust team domain, format team.cloudflareaccess.com
# - prod_hostname: your domain, e.g. 'mario.com'
# - staging_hostname: fill after first deploy (see next section)
# - admin_emails: emails authorized for admin dashboard

export CLOUDFLARE_API_TOKEN="..."
terraform init
terraform apply
terraform -chdir=. output -json > outputs.json
cd ..
npm run infra:sync
```

This creates all buckets, public domains, and Access applications in one command. If successful, `wrangler.json` is ready and synchronized.

## 4. Order constraint: `staging_hostname` isn't known before first deploy

Cloudflare assigns a `workers.dev` hostname (e.g., `mario-portfolio-staging.xxxxx.workers.dev`) only after the Worker's first deploy. So on first deploy you don't know this value yet — you can't write it in `terraform.tfvars` and run `terraform apply` straight away.

Solution: apply **only the buckets** on first pass:

```bash
terraform apply -target=cloudflare_r2_bucket.prod -target=cloudflare_r2_bucket.staging
```

Then do the first deploy (see [Git integration](#git-integration--connect-repository) below). After deploy, read the assigned `workers.dev` domain from Cloudflare dashboard:

```bash
# Cloudflare dashboard → Workers & Pages → photo-portfolio-staging → Settings → Domains & Routes
# Copy the URL in format mario-portfolio-staging.xxxxx.workers.dev
```

Fill the value in `terraform.tfvars` and run the full apply:

```bash
terraform apply  # Now apply everything, including Access and r2.dev managed domains
```

If you use the manual path (without Terraform), this constraint doesn't apply — Access applications are created manually step by step.

## 5. Manual path — Creating resources from Cloudflare dashboard

### R2 Buckets

1. Cloudflare dashboard → **R2 → Create Bucket**
2. Name: `{project_name}` (e.g. `mario-portfolio`)
3. Replica region: no (optional, only for geographic redundancy)
4. Create

Repeat for the staging bucket, named `{project_name}-staging` (e.g. `mario-portfolio-staging`).

### R2 managed domains (r2.dev)

1. Dashboard → **R2 → select prod bucket → Settings → Public access → Edit**
2. Enable public access
3. Copy the shown domain (format `pub-xxxxxxxx.r2.dev`)

Repeat for staging bucket. These domains expose photos — they're rate-limited and uncached, suitable only for development. Before production, consider a custom domain (see section 8).

### Access application for `/admin` (custom domain only)

If using a real domain (not `workers.dev`), Cloudflare Access can scope to specific paths. Configure like this:

1. Cloudflare dashboard → **Zero Trust → Access → Applications → Create new application**
2. Select **Self-hosted and private**
3. Name: e.g. `mario-portfolio admin (prod)`
4. **Add public hostname:**
   - Domain: your domain (e.g. `mario.com`)
   - Path: `admin`
   - Repeat to add `/api/admin`
5. Access policies → **Create new policy**:
   - Name: `Just me`
   - Decision: **Allow**
   - Include → **Emails** → your email (e.g. `mario@mario.com`)
6. Identity providers: leave **One-time PIN** (default, needs no setup)
7. Save and create application
8. Copy the **Audience (AUD) Tag** value from the application page

If using `workers.dev` for staging, Access can't do path-scoping on that domain — it protects the entire subdomain. Create a separate application that protects all of `mario-portfolio-staging.xxxxx.workers.dev`.

### Zero Trust team domain

The team domain is provided by Cloudflare with your first Zero Trust account — format `{team}.cloudflareaccess.com` (e.g. `mario.cloudflareaccess.com`). You don't create it, it already exists. The Worker uses it to validate JWTs issued by Access — see `ACCESS_TEAM_DOMAIN` in `wrangler.json`.

Find it at: Cloudflare dashboard → **Zero Trust → Settings → Custom domain**. If you don't see it, navigate to **Access → Applications** and find the team domain in the browser URL (`https://{team}.cloudflareaccess.com/...`).

## 6. Git integration — Connect repository

Cloudflare lets you deploy the Worker directly from Git — no GitHub Actions needed, it's native.

1. Cloudflare dashboard → **Workers & Pages → Create application → Pages**
2. Connect your GitHub account (if not done yet)
3. Select the portfolio repository
4. Configure the build:
   - **Build command:** `npm test && npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave default)
5. Environment: add environment variables if needed (in your case, probably none — `wrangler.json` is in the repo)
6. **Production branch:** `main` (for production Worker)
7. **Staging branch:** `staging` (for staging Worker)

Cloudflare creates two Workers automatically:
- `{project-name}` from `main` branch (reachable on `{project-name}.{account-subdomain}.workers.dev` and linked to custom domain if configured)
- `{project-name}-staging` from `staging` branch (reachable on `{project-name}-staging.{account-subdomain}.workers.dev`)

Every push triggers a new deploy automatically.

## 7. Infrastructure preexistent — terraform import

If you've already created buckets, public domains, or Access applications manually (like on Davide's site), you can import them into Terraform rather than recreate them. Use `terraform import`:

```bash
# Import production bucket
terraform import cloudflare_r2_bucket.prod {account_id}/{bucket-name}

# Import staging bucket
terraform import cloudflare_r2_bucket.staging {account_id}/{bucket-name}-staging

# Import production managed domain (find ID on R2 dashboard, "Public access domain ID" field)
terraform import cloudflare_r2_managed_domain.prod {account_id}/{domain-id}

# Import staging managed domain
terraform import cloudflare_r2_managed_domain.staging {account_id}/{domain-id}

# Import production Access application (copy ID from dashboard Access → Applications → Settings)
terraform import cloudflare_zero_trust_access_application.prod {account_id}/{app-id}

# Import staging Access application
terraform import cloudflare_zero_trust_access_application.staging {account_id}/{app-id}

# Import Access policy (copy ID from application page → Access policies)
terraform import cloudflare_zero_trust_access_policy.solo_admin {account_id}/{policy-id}
```

After imports, verify that `terraform plan` proposes no further changes. If it proposes fields you haven't specified in `.tf`, add them to configuration files to make them converge.

If you prefer staying on the manual path without Terraform, you don't need to import — resources are already live and the Worker reads from `wrangler.json`, which you populate manually.

## 8. Custom domain for photos

For production, Cloudflare **strongly recommends** a custom domain for photos instead of `r2.dev`. Why: `r2.dev` is rate-limited (Cloudflare says so), no cache, no WAF. A custom domain (e.g. `img.mario.com`) on a real Cloudflare zone gives you:

- Cloudflare edge cache (images served faster)
- WAF (attack protection)
- Access controls and rate limiting via Firewall Rules

If using Terraform, enable the custom domain by setting `custom_photo_domain` and `photo_domain_zone_id` in `terraform.tfvars`:

```hcl
custom_photo_domain  = "img.mario.com"
photo_domain_zone_id = "your-zone-id"
```

If proceeding manually:

1. Create a CNAME record in your domain DNS (`mario.com`):
   - Host: `img`
   - Target: `mario-portfolio.s.cloudflarestorage.com` (replace `mario-portfolio` with your bucket name)
   - (Cloudflare shows the exact target when you create the custom domain in step 2)
2. Cloudflare dashboard → **R2 → select prod bucket → Settings → Public access → Add custom domain**
3. Type `img.mario.com`
4. Copy the CNAME target shown and complete it in mario.com DNS

### Order procedure: enable custom then disable r2.dev

Once DNS propagates (a few minutes), follow these steps **in exact order**: the order matters, because disabling r2.dev before verifying custom would leave the site without photos.

1. **Verify the custom domain is available** on the Cloudflare zone containing it. On R2 dashboard → select prod bucket → Settings → Public access → you should see the custom domain next to `r2.dev`.

2. **Enable custom domain in Terraform** (if using Terraform) — set `custom_photo_domain` and `photo_domain_zone_id` in `terraform.tfvars`:
   ```hcl
   custom_photo_domain  = "img.mario.com"
   photo_domain_zone_id = "your-zone-id"
   # Still true — verify custom before disabling r2.dev
   keep_managed_domain = true
   ```

   **If using the manual path,** skip this step — the custom already exists from the previous section.

3. **Apply changes** and sync config:
   ```bash
   cd infra
   terraform apply
   cd ..
   terraform -chdir=infra output -json > infra/outputs.json
   npm run infra:sync
   ```
   
   This updates `wrangler.json` and build starts including the custom domain in CSP in `dist/_headers`.

4. **Wait for DNS and verify the custom domain serves photos**, with a terminal test:
   ```bash
   curl -sI https://img.mario.com/sport/photo.webp
   # Expected: HTTP/2 200 (not 404, not 403)
   ```
   
   If you see `404 Not Found`, DNS hasn't propagated yet or Cloudflare doesn't know where the bucket is. Wait and retry.

5. **Deploy and verify social meta tags** (og:image, og:title):
   ```bash
   # Local build to verify og:image uses custom domain
   npm run build
   # If site has hero configured, og:image meta contains custom domain.
   # If hero is empty (template seed), og:image meta doesn't exist (expected).
   grep -o 'og:image[^>]*' dist/index.html
   ```
   
   Share the site URL in chat or use an [Open Graph validator](https://www.opengraphcheck.com/) to verify crawlers see title and image. This step verifies that works.

6. **Only after verifying custom works,** disable the `r2.dev` domain in Terraform:
   ```hcl
   keep_managed_domain = false
   ```
   
   Apply:
   ```bash
   cd infra
   terraform apply
   cd ..
   ```
   
   From now the `r2.dev` domain on the production bucket is no longer reachable. **Warning:** any `r2.dev` URL already shared (on social, email, forums) will stop working.

7. **If you have r2.dev links circulating,** consider postponing step 6 until it's safe to let them die (e.g. after 1-3 months). You can keep it on as long as you want — `keep_managed_domain` allows it.

Staging doesn't change: it has no custom domain, so its `r2.dev` stays on forever.

---

## 9. Contact form: notifications and spam protection

The contact form writes straight to your R2 bucket through the Worker — no third-party service, no extra account. Messages are read in the `/admin` dashboard, next to the albums.

Two things are optional, and both are configured with **secrets, not `vars`**.

> ⚠️ **`wrangler.json` is committed to the repository.** A notification URL can contain a token — a Telegram bot URL certainly does. Putting one in `wrangler.json` publishes it on GitHub. Use `wrangler secret put`, which stores the value with Cloudflare and never writes it to a file.

### Notification when a message arrives

Without this, messages still arrive and are still readable in the dashboard — you just have to go and look. With it, you get a push.

```bash
npx wrangler secret put CONTACT_NOTIFY_URL
```

The Worker sends a `POST` to that URL. Any service that accepts one works; here are three.

**ntfy.sh — no account, nothing to sign up for**

Pick a topic name, install the [ntfy app](https://ntfy.sh/), subscribe to the topic. Your URL is `https://ntfy.sh/your-topic-name`.

> Public ntfy topics are readable by **anyone who guesses the name**. Use something long and random — `portfolio-msg-7f3a9c2b1e`, not `portfolio`. The notification deliberately contains only the sender's name and a link, never the message itself, precisely because this channel may not be private.

**Telegram — a bot you talk to**

Create a bot with [@BotFather](https://t.me/botfather), get its token, then get your chat id by messaging the bot and opening `https://api.telegram.org/bot<TOKEN>/getUpdates`. Your URL:

```
https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=
```

**Discord or Slack — one webhook**

Server Settings → Integrations → Webhooks (Discord), or an incoming webhook app (Slack). Copy the URL as-is.

### Turnstile, the spam protection

`/api/contact` is the only route on the site that writes without authentication. The honeypot catches naive bots; Turnstile catches the rest.

It is created by Terraform (`enable_turnstile = true`, the default), and produces two values that go to **two different places**:

| Value | Where | Why |
|---|---|---|
| **sitekey** | `wrangler.json`, as a `var` — written by `npm run infra:sync` | it ends up in the HTML; it is not a secret |
| **secret** | `npx wrangler secret put TURNSTILE_SECRET` | the Worker validates tokens with it; it must never reach git |

Take the secret from the Cloudflare dashboard, under Turnstile, on your widget's page.

Visitors see nothing: the widget is configured `interaction-only`, so it only appears when Cloudflare suspects something. There is no way to restyle it — it lives in an iframe — which is why it is configured to stay out of sight instead.

**If you turn Turnstile off**, the form keeps working and the honeypot keeps catching the simplest bots. But there is no rate limiting: someone determined could fill your bucket with junk messages. Know that you are accepting it.

---

## Manual path flow summary

1. Create the two R2 buckets and their r2.dev managed domains from the dashboard.
2. Create the Access application (`/admin` + `/api/admin/*`) with Allow policy for your email.
3. Copy team domain + AUD from the dashboard.
4. Populate `wrangler.json` manually (copy `wrangler.example.json`, fill bucket name, public R2 URL, team domain, AUD).
5. Connect repository to Cloudflare Workers & Pages with `main` and `staging` branches.
6. Push to trigger first deploy. Read the assigned `workers.dev` hostname.
7. If using Terraform later, import existing resources with `terraform import`.
8. (Optional) Enable a custom domain for photos before going live.

Both with Terraform and manually, CSP in `dist/_headers` is generated from `wrangler.json` during build — it's not hardcoded, so it stays correct whichever path you choose.
