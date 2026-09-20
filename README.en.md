# Photo Portfolio

**A photography portfolio that updates itself: you upload photos from a dashboard, and they're live.** No database, no server to maintain, nothing to pay every month.

<!-- TODO: replace with a real screenshot of the home page, e.g. docs/screenshot-home.png
     A photography portfolio is judged by looking at it: this image is worth
     more than all the text that follows.
![The site](docs/screenshot-home.png)
-->

> 🔗 **Live demo:** *(to be added)* · **Dashboard:** *(screenshot to be added)*

## Why it exists

Portfolios for photographers usually end up in one of two places: a monthly subscription to a platform that decides how your work should look, or a static site that forces you to rebuild and redeploy every time you add a photo.

This template sits in between. The site is static and very fast, but the photos live in a **Cloudflare R2** bucket and are uploaded from a **login-protected dashboard**: you add them, reorder them, pick the cover, and the site changes right away — without touching the code, without a deploy.

It's meant for **photographers who can code**, or for anyone setting up a site for a friend who takes pictures: the initial setup asks you to know git and the Cloudflare console, nothing after that does.

## What it does

- **Pages**: home with the albums, album page with grid and lightbox, contact page with a working form.
- **`/admin` dashboard**: upload photos (compressed in the browser before they're sent), reorder by dragging or by date, pick the cover, create and delete albums, edit name, bio and social links.
- **Protected access** through Cloudflare Access: you sign in with a code sent by email, and no password lives in the code.
- **Three ready-made looks** for the album cards, switched with a single line.
- **Everything customizable from the config files**: colors, fonts, spacing and copy — the dashboard's copy too.
- **Infrastructure described in Terraform**, or created by hand following the runbook.
- **Security headers generated automatically**, matched to your own domain without you writing them.

## What you need

- A **Cloudflare** account (the free plan is enough).
- **Node.js 20+**.
- A domain, if you want one: otherwise it runs on a free `workers.dev` subdomain.

Recurring cost: **zero**, except the domain if you choose to have one.

## Getting started, and staying up to date

**Fork it** — don't use "Use this template". A fork keeps the git history, and that's the only way you'll be able to pull in future improvements with a merge. "Use this template" creates a repository with no common ancestor: convenient on day one, permanent forever.

After forking:

```bash
git clone git@github.com:YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
git remote add upstream git@github.com:davidetarsi/PhotoPortfolioTemplate.git
npm install
# then open wrangler.json, replace the placeholders with your own values, and commit it:
# Cloudflare's deploy reads that file from the repository, so it has to be in there.
```

To pull in updates, whenever you want:

```bash
git fetch upstream
git merge upstream/main
```

Conflicts, if any, will land on `config/`, `theme/` and `wrangler.json` — that is, on what you customized. Keep your changes inside those files and updates will stay painless.

`wrangler.json` in particular will conflict almost every time, because the template ships it with placeholders and you've put your own values in it: resolve by keeping your version, with `git checkout --ours wrangler.json`.

> Prefer a private repository, unlinked from the fork? Then `git clone` this repo, point `origin` at your own, and add `upstream` as above: for updates the result is identical.

## Quick start

```bash
node --version   # requires v20+
npm install
cp .env.example .env
# Fill in .env: VITE_R2_PUBLIC_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, VITE_WEB3FORMS_ACCESS_KEY
npm run dev      # → http://localhost:5173/
ALLOW_PLACEHOLDER_CSP=1 npm run build  # build check with placeholder values
npm test         # the full suite
```

For the first deploy to Cloudflare, fill `wrangler.json` with your real values (not the placeholders).

## Setting up a new portfolio

### 1. Cloudflare infrastructure

Create the R2 bucket and the Access applications. Two equivalent paths:

- **Automatically, with Terraform** (recommended): follow `infra/` and section 3 of the runbook — it creates everything in one command.
- **By hand, from the dashboard**: follow the [runbook](docs/runbook-cloudflare.md) section 5 — remember that `staging_hostname` isn't known until after the first deploy (see runbook section 4).

Either way, the CSP is generated automatically from `wrangler.json` during the build.

### 2. Configuring `wrangler.json`

Fill in the placeholders:

```json
{
  "name": "your-portfolio",
  "main": "src/worker.js",
  "r2_buckets": [
    { "binding": "BUCKET", "bucket_name": "your-bucket" }
  ],
  "vars": {
    "ACCESS_TEAM_DOMAIN": "your-team.cloudflareaccess.com",
    "ACCESS_AUD": "aud-of-your-Access-app",
    "R2_PUBLIC_URL": "https://pub-xxxxxxxx.r2.dev"
  }
}
```

By hand, or with `npm run infra:sync` if you use Terraform.

### 3. Local environment variables

Fill `.env` with the R2 credentials (used by `npm run migrate` and `npm run upload`):

```bash
VITE_R2_PUBLIC_URL="https://pub-xxxxxxxx.r2.dev"  # copy from wrangler.json vars.R2_PUBLIC_URL
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="your-bucket"
VITE_WEB3FORMS_ACCESS_KEY="..."  # from web3forms.com
```

These credentials must not go into git — `.env` is ignored, while the Cloudflare variables belong in `wrangler.json`, which is versioned.

### 4. Initial seed

Fill in the configuration files that make up the site's seed:

- **`config/site.config.js`**: name, bio, social links, hero
- **`config/albums.config.js`**: albums, with slug, title, description and cover file name
- **`config/texts.config.js`** (optional): UI copy
- **`config/admin.config.js`** (optional): dashboard styling
- **`theme/tokens.css`**: colors and font variables
- **`theme/typography.css`**: type scale and Google Fonts links

Then:

```bash
npm run migrate
```

`migrate` is a one-time bootstrap command: it turns the seed into the JSON files on R2. **Running it again after you've used the dashboard resets everything to the seed, wiping out the work you did there.** The command notices, stops and explains what you'd lose, and asks for `--force` if you insist.

### 5. Git integration

Connect the repository to Cloudflare Workers & Pages (see [runbook](docs/runbook-cloudflare.md) section 6):

- Build command: `npm test && npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Staging branch: `staging` (optional but recommended)

Cloudflare creates two Workers that deploy themselves on every push.

## Using the site once it's live

The `/admin` dashboard is where you shape the site while it's running:

- **Site section**: edit name, bio, hero, social links
- **Albums section**: add albums, edit their title and description
- **Album view**: upload photos, reorder them, delete them

The files in `config/` are only the initial seed — after `migrate`, R2 is the source of truth. Changes made from the dashboard are live immediately, with no deploy.

## Customizing

Read [`CUSTOMIZING.md`](CUSTOMIZING.md) to find out:

- Where to go for each kind of change
- The distinction between content (R2 + dashboard) and appearance/copy (files)
- What not to touch, to avoid conflicts on future merges from the template

## Project structure

```
config/          ← initial seed: identity, albums, copy, admin styling
theme/           ← appearance: CSS design tokens, typography, Google Fonts
src/pages/       ← JS entry point for each page
src/components/  ← reusable UI components
src/styles/      ← structural CSS (imports tokens only)
src/utils/       ← pure functions and helpers
src/worker.js    ← Cloudflare Worker
infra/           ← Terraform configuration (optional)
scripts/         ← tools: migrate, upload, compress
docs/            ← documentation: runbook, specs
public/          ← static assets (favicon). `_headers` doesn't live here: it's generated into dist/
```

## Architecture

- **Hosting:** Cloudflare Workers (static assets + API for `/admin`)
- **Photo storage:** Cloudflare R2 (public bucket via r2.dev or a custom domain)
- **Admin authentication:** Cloudflare Access (Zero Trust) with JWT
- **Bundler:** Vite 8.x, multi-page — entry points in `vite.config.js`
- **CSP (Content Security Policy):** generated from `wrangler.json` during the build
- **OpenGraph meta tags:** injected at build time from `site.config.js`, with the image URL built from the domain in `wrangler.json`
- **Framework:** vanilla JS/HTML/CSS (no runtime framework)
- **Photo compression:** `npm run compress -- --input <path>` (Sharp, WebP 1900px q85)

## License

[MIT](LICENSE) — you can use it, modify it and redistribute it, commercially too, as long as you keep the copyright notice.

## Support the project

If this template has been useful to you — if you've put your portfolio online with it, or someone else's you care about — you can help keep it alive. Anything you give goes into maintaining it, answering issues, and adding what the people using it need.

It isn't owed, and the project stays free either way: it's a way of saying it was good for something.

- **[GitHub Sponsors](https://github.com/sponsors/davidetarsi)** — also the *Sponsor* button at the top of this page
- **Ko-fi** — *(to be added)*
- **PayPal** — *(to be added)*

If you'd rather not contribute money: open an issue when you hit a problem, or tell me what you built with it. That counts for a lot too.
