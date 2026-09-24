# Contact Form Turnstile and ntfy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate real Turnstile validation and ntfy notifications for the personal contact form in staging and production without committing or exposing either secret.

**Architecture:** Generic correctness fixes land in `PhotoPortfolioTemplate` first and are then merged explicitly into `PhotoPortfolio`. One Managed Turnstile widget authorizes both public hostnames, while one capability-secret ntfy topic and one Turnstile secret are attached to versioned deployments of the existing `photo-portfolio` Worker. The Worker derives the admin link from each request origin, so no duplicated `SITE_URL` setting is introduced.

**Tech Stack:** JavaScript ES modules, Vitest, Vite, Cloudflare Workers, Turnstile, Workers Versions, R2, ntfy, GitHub PRs.

**Spec:** `docs/superpowers/specs/2026-09-23-contact-form-protection-ntfy-design.md`

## Global Constraints

- Generic behavior changes originate in `PhotoPortfolioTemplate`; personal deploy values remain in `PhotoPortfolio`.
- Use one `gpt-5.6-luna` implementer sequentially for the plan; it must not dispatch subagents. The primary agent performs every review.
- Never print, read back, persist, or commit `TURNSTILE_SECRET` or the value of `CONTACT_NOTIFY_URL`.
- Treat the ntfy topic URL as a capability secret even though ntfy does not require an account.
- Use one Managed Turnstile widget for `davidetarsi.com` and `staging-photo-portfolio.davidetarsi-dev.workers.dev`.
- The same public sitekey must be present in production and `env.staging`; no secret belongs in `wrangler.json`.
- Configure version secrets on Worker `photo-portfolio` without `--env staging`; do not create or target a second Worker.
- Use `wrangler versions secret put` during preparation; do not use the immediately deploying `wrangler secret put`.
- Do not promote production until staging stores a neutral canary, Turnstile accepts it, and Davide confirms the ntfy notification is safe.
- Production must receive the exact Git tree verified in staging through a non-forced fast-forward.
- Do not delete either canary message without Davide's explicit authorization.
- Preserve the original dirty checkout at `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolio` unchanged.

## Review Focus

- A production or staging request must create an absolute `/admin` link for its own origin, never relative `/admin` and never the other environment's hostname.
- A configured sitekey with a missing secret must not be mistaken for completed protection; live completion requires a successful Siteverify-backed submission.
- A notification timeout must not remove the R2 message or change the visitor's successful response.
- The explicit Turnstile loader must load once and use the documented `?render=explicit` URL.
- Future version uploads must retain both secret bindings by name without exposing values or creating `photo-portfolio-staging`.

---

### Task 1: Fix notification URLs and explicit Turnstile loading upstream

**Repository:** `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolioTemplate-land-staging`

**Files:**
- Modify: `src/worker/contact-routes.js`
- Modify: `src/worker/contact-routes.test.js`
- Modify: `src/components/ContactForm.js`
- Modify: `src/components/ContactForm.test.js`

**Interfaces:**
- Consumes: `handleContactRequest(request, env, deps)` and `createContactForm(siteConfig, texts)`.
- Produces: notifier calls shaped as `notify(env, message, adminUrl)` with an absolute URL; loader URL `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`.

- [ ] **Step 1: Prepare the upstream branch and verify baseline**

```bash
git status --short
git fetch origin main
git switch -c codex/contact-form-protection-ntfy-2026-09-23 origin/main
npm test
```

Expected: the existing upstream suite passes. Stop if the worktree is dirty before the branch switch.

- [ ] **Step 2: Write the failing notification-origin test**

Add to `src/worker/contact-routes.test.js`:

```js
it('notifica con la dashboard assoluta dell host chiamato', async () => {
  const env = makeEnv();
  const deps = makeDeps();
  await post(env, VALIDO, deps);

  expect(deps.notify).toHaveBeenCalledWith(
    env,
    expect.objectContaining({ name: 'Mario' }),
    'https://x.dev/admin',
  );
});
```

- [ ] **Step 3: Write the failing explicit-loader test**

Extend `afterEach` in `src/components/ContactForm.test.js` so it removes any script whose
`src` contains `challenges.cloudflare.com/turnstile`, then add:

```js
it('carica Turnstile nella modalita di rendering esplicita', () => {
  createContactForm({ turnstileSitekey: 'test-sitekey' }, texts);

  const script = document.head.querySelector(
    'script[src*="challenges.cloudflare.com/turnstile"]',
  );
  expect(script).not.toBeNull();
  expect(script.src).toBe(
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  );
});
```

- [ ] **Step 4: Run RED**

```bash
npx vitest run src/worker/contact-routes.test.js src/components/ContactForm.test.js
```

Expected: the new notifier-argument and script-URL assertions fail; existing cases pass.

- [ ] **Step 5: Implement the minimal Worker change**

Change the internal notifier to:

```js
async function inviaNotifica(env, messaggio, adminUrl) {
  const url = env.CONTACT_NOTIFY_URL;
  if (!url) return;
  await fetch(url, {
    method: 'POST',
    body: notifyBody(messaggio, adminUrl),
    signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
  });
}
```

Immediately before notification, derive and pass:

```js
const adminUrl = new URL('/admin', request.url).href;
await notify(env, messaggio, adminUrl);
```

Remove `SITE_URL` from JSDoc. Do not alter validation, R2 ordering or best-effort error handling.

- [ ] **Step 6: Implement the official loader URL**

```js
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
```

Do not change appearance, reset behavior, payload or UI copy.

- [ ] **Step 7: Run GREEN and the complete gate**

```bash
npx vitest run src/worker/contact-routes.test.js src/components/ContactForm.test.js src/utils/notifyBody.test.js src/worker/turnstile.test.js
npm test
ALLOW_PLACEHOLDER_CSP=1 npm run build
git diff --check
rg -n "SITE_URL" src
```

Expected: all tests and build pass; the final `rg` exits with no production-source matches.

- [ ] **Step 8: Commit**

```bash
git add src/worker/contact-routes.js src/worker/contact-routes.test.js src/components/ContactForm.js src/components/ContactForm.test.js
git commit -m "fix: complete contact protection flow"
```

---

### Task 2: Correct upstream secret documentation and publish the implementation PR

**Repository:** `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolioTemplate-land-staging`

**Files:**
- Modify: `docs/runbook-cloudflare.md`
- Modify: `docs/staging.md`
- Modify: `docs/azioni-manuali.md`

**Interfaces:**
- Consumes: the verified one-Worker/version-preview model.
- Produces: preparation commands that cannot activate the secret before the public sitekey; action 9 remains open until live gates pass.

- [ ] **Step 1: Replace preparation commands**

Use these commands in the verified workflow:

```bash
npx wrangler versions secret put CONTACT_NOTIFY_URL
npx wrangler versions secret put TURNSTILE_SECRET
```

Add this exact explanation:

```markdown
`versions secret put` creates a Worker version without promoting it. Use it while
preparing Turnstile so the secret cannot become active before the public sitekey is
served. The ordinary `secret put` command deploys immediately and is only appropriate
when an immediate production rollout is intentional.
```

- [ ] **Step 2: Correct the staging-secret model**

Remove the verified-flow instruction to repeat `secret put --env staging`. Document:

```markdown
Production and the staging version URL belong to the same Worker. Configure the secret
bindings on that Worker and upload the staging version with `env.staging` bindings. Do
not target `{project-name}-staging`; that would configure a different Worker instead of
the reviewed version preview.
```

Keep a note that a deliberately separate Wrangler Worker must manage its own secrets and
is outside the verified workflow.

- [ ] **Step 3: Keep action 9 open with an exact closing gate**

State that action 9 closes only after staging and production each accept a neutral
Turnstile-protected submission, save it in `/admin`, and deliver an ntfy notification
containing neither email nor message body.

- [ ] **Step 4: Verify docs**

```bash
git diff --check
rg -n "secret put|versions secret put|--env staging|photo-portfolio-staging" docs/runbook-cloudflare.md docs/staging.md docs/azioni-manuali.md
```

Expected: no real personal hostname, sitekey, topic or secret appears; action 9 is pending.

- [ ] **Step 5: Commit, push and open the PR**

```bash
git add docs/runbook-cloudflare.md docs/staging.md docs/azioni-manuali.md
git commit -m "docs: clarify version-scoped contact secrets"
git push -u origin codex/contact-form-protection-ntfy-2026-09-23
gh pr create --repo davidetarsi/PhotoPortfolioTemplate --base main --head codex/contact-form-protection-ntfy-2026-09-23 --title "fix: complete contact protection flow" --body "Adds request-derived dashboard links, official explicit Turnstile loading, regression tests, and the verified version-secret procedure. Action 9 remains open pending live staging and production canaries."
```

The implementer stops. The primary agent reviews the complete diff, repeats focused tests and merges only after approval.

---

### Task 3: Prepare the Turnstile widget and private ntfy topic

**Repositories:** none; this task changes Cloudflare state and Davide's ntfy app.

**Files:** none.

**Interfaces:**
- Produces: one public sitekey for Task 4; one user-held Turnstile secret and one user-held ntfy URL for Task 5.

- [ ] **Step 1: Fill the widget form**

In Cloudflare Dashboard → Turnstile → Add widget, fill:

- name: `photo-portfolio contact form`;
- mode: `Managed`;
- hostname: `davidetarsi.com`;
- hostname: `staging-photo-portfolio.davidetarsi-dev.workers.dev`.

The agent stops before the final create action if its result may display the secret.

- [ ] **Step 2: Davide creates the widget**

Davide completes creation, stores the secret privately and sends only the public sitekey
to the agent. The secret never enters chat.

- [ ] **Step 3: Davide creates the ntfy subscription**

Davide chooses a long random topic in ntfy and subscribes. He keeps the complete topic
URL private and does not send it to the agent.

- [ ] **Step 4: Verify non-secret settings**

The agent verifies only widget name, mode and the two hostnames. Its report records no key value.

---

### Task 4: Import upstream and configure the public sitekey downstream

**Repository:** `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolio-sync-2026-09-23`

**Files:**
- Merge: reviewed `PhotoPortfolioTemplate/main`
- Modify: `wrangler.json`
- Modify: `src/personal-config.test.js`

**Interfaces:**
- Consumes: merged upstream commit and public sitekey.
- Produces: identical non-empty sitekeys in production and staging, no committed secret, Turnstile CSP enabled.

- [ ] **Step 1: Merge the reviewed upstream commit**

```bash
git fetch upstream main
git merge --no-ff upstream/main
```

Resolve only actual conflicts. Preserve personal bindings and identifiers. Do not run
`npm run migrate` or `npm run infra:sync`.

- [ ] **Step 2: Write the failing personal-config test**

Load `wrangler.json` in `src/personal-config.test.js`:

```js
import { readFileSync } from 'node:fs';

const wrangler = JSON.parse(
  readFileSync(new URL('../wrangler.json', import.meta.url), 'utf8'),
);
```

Add:

```js
it('configures one public Turnstile sitekey without committing secrets', () => {
  const production = wrangler.vars.TURNSTILE_SITEKEY;
  const staging = wrangler.env.staging.vars.TURNSTILE_SITEKEY;

  expect(production).toEqual(expect.any(String));
  expect(production.length).toBeGreaterThan(10);
  expect(staging).toBe(production);

  const serialized = JSON.stringify(wrangler);
  expect(serialized).not.toContain('TURNSTILE_SECRET');
  expect(serialized).not.toContain('CONTACT_NOTIFY_URL');
});
```

- [ ] **Step 3: Run RED**

```bash
npx vitest run src/personal-config.test.js
```

Expected: failure because both sitekeys are empty.

- [ ] **Step 4: Insert the public sitekey**

Set the exact sitekey supplied by Davide in both `vars.TURNSTILE_SITEKEY` and
`env.staging.vars.TURNSTILE_SITEKEY`. Do not print surrounding Wrangler values.

- [ ] **Step 5: Run GREEN, full tests, build and non-printing CSP checks**

```bash
npx vitest run src/personal-config.test.js src/components/ContactForm.test.js src/worker/contact-routes.test.js src/worker/turnstile.test.js src/utils/notifyBody.test.js src/utils/buildHeaders.test.js
npm test
npm run build
```

Run a Node assertion that exits non-zero unless both sitekeys are equal and non-empty,
`dist/_headers` authorizes `challenges.cloudflare.com` in `script-src`, `connect-src` and
`frame-src`, both configured R2 origins occur, and no placeholder occurs. Print only
`CSP_OK` on success.

- [ ] **Step 6: Commit locally; do not push**

```bash
git add wrangler.json src/personal-config.test.js
git commit -m "feat: configure contact form protection"
git status --short
```

Expected: clean branch containing spec, plan, upstream merge, public sitekey and test, but no secret.

---

### Task 5: Attach version secrets and pass staging

**Repository:** `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolio-sync-2026-09-23`

**Files:** none for secret insertion; PR metadata remains external.

**Interfaces:**
- Consumes: clean Task 4 branch and private values held by Davide.
- Produces: reviewed staging version with both binding names and one stored/notified canary.

- [ ] **Step 1: Davide adds the ntfy URL interactively**

```bash
npx wrangler versions secret put CONTACT_NOTIFY_URL --name photo-portfolio
```

Davide pastes the private ntfy URL only into Wrangler's prompt.

- [ ] **Step 2: Davide adds the Turnstile secret interactively**

```bash
npx wrangler versions secret put TURNSTILE_SECRET --name photo-portfolio
```

Davide pastes only into Wrangler's prompt. Neither command uses `--env staging`.

- [ ] **Step 3: Verify names and no production deployment**

In Cloudflare Dashboard, confirm the newest undeployed version lists both secret binding
names with hidden values and the active production deployment has not changed.

- [ ] **Step 4: Push and open the downstream PR**

```bash
git push -u origin codex/contact-form-protection-ntfy-2026-09-23
gh pr create --repo davidetarsi/PhotoPortfolio --base staging --head codex/contact-form-protection-ntfy-2026-09-23 --title "feat: protect contact form and notify with ntfy" --body "Imports the reviewed upstream contact fix, configures the shared public Turnstile sitekey, and adds deployment regression coverage. Secret values remain outside Git."
```

The primary agent reviews the diff and verifies that Workers Builds uploads a staging version without moving production traffic.

- [ ] **Step 5: Verify staging bindings by name**

Confirm the staging version lists both secret names, staging R2 and a non-empty sitekey.
Do not use or create a `photo-portfolio-staging` Worker.

- [ ] **Step 6: Submit the staging canary**

After Access login, submit:

- name: `Turnstile staging smoke`;
- email: `test@example.com`;
- subject: `Test tecnico`;
- message: `Canary staging Turnstile e ntfy del 23 settembre 2026.`

Expected: the form succeeds and staging `/admin` shows the saved canary.

- [ ] **Step 7: Davide validates ntfy**

Davide confirms exactly one notification arrived, includes `Turnstile staging smoke` and
an absolute staging `/admin` link, and excludes both email and canary body. Stop without this confirmation.

- [ ] **Step 8: Merge into staging**

After primary review:

```bash
gh pr merge --repo davidetarsi/PhotoPortfolio codex/contact-form-protection-ntfy-2026-09-23 --merge --delete-branch=false
git fetch origin
```

Prove the merge tree equals the reviewed branch tree and wait for the staging build. Keep the canary stored.

---

### Task 6: Promote the verified tree and pass production

**Repository:** `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolio-sync-2026-09-23`

**Files:** none.

**Interfaces:**
- Consumes: Task 5 staging commit/tree.
- Produces: identical production tree and a second safe notification.

- [ ] **Step 1: Repeat immutable preflight**

```bash
git fetch origin
npm test
npm run build
```

Repeat Task 4's non-printing assertion. Prove `origin/main` is an ancestor of
`origin/staging`; stop on divergence.

- [ ] **Step 2: Fast-forward production without a new commit**

Push `origin/staging` to `origin/main` without force. Fetch again and prove both refs and
trees match. Wait for the production Workers Build to succeed.

- [ ] **Step 3: Verify production bindings by name**

Confirm the active version lists both secret names, production R2 and the non-empty sitekey.

- [ ] **Step 4: Submit the production canary**

Submit:

- name: `Turnstile production smoke`;
- email: `test@example.com`;
- subject: `Test tecnico`;
- message: `Canary produzione Turnstile e ntfy del 23 settembre 2026.`

Expected: form success and canary visible in production `/admin`.

- [ ] **Step 5: Davide validates production ntfy**

Davide confirms exactly one notification arrived, contains `Turnstile production smoke`
and a production `/admin` link, and excludes email and message body. Only then may action 9 close.

---

### Task 7: Close action 9 and synchronize documentation

**Repositories:** template and downstream.

**Files:**
- Modify upstream: `docs/azioni-manuali.md`
- Modify upstream only if evidence requires correction: `docs/runbook-cloudflare.md`, `docs/staging.md`
- Modify downstream: `docs/upstream-sync-log.md`

**Interfaces:**
- Consumes: exact live Git commits and both user-confirmed canaries.
- Produces: closed action 9 and a downstream audit row without confidential values.

- [ ] **Step 1: Close action 9 upstream**

On a documentation branch from template `main`, move point 9 out of the pending table and
record completion date, one shared Managed widget, both secret binding names, both stored
canaries, Davide's safe-notification confirmation and exact Git commit identifiers read
from the repositories. Never record sitekey, secret, topic URL, Access ID or bucket name.

- [ ] **Step 2: Publish and review the upstream docs PR**

Run `git diff --check` and the scoped Markdown-link check, commit, push and open a PR to
template `main`. The primary agent reviews and merges it.

- [ ] **Step 3: Import final docs downstream**

Merge the final upstream docs commit into a fresh downstream branch from `origin/staging`.
Preserve the personal README. Add a row to `docs/upstream-sync-log.md` containing the exact
runtime Git identifiers and `Turnstile + ntfy attivi`, but no confidential value.

- [ ] **Step 4: Final docs-only gate and promotion**

```bash
git diff --check
npm test
npm run build
git status --short
```

Repeat the non-printing CSP/sitekey assertion. Open a PR to downstream `staging`, obtain
primary review, merge, and fast-forward the same tree to `main`. Both builds must succeed;
a duplicate UI smoke is unnecessary for this documentation-only commit.

- [ ] **Step 5: Final audit**

Verify clean implementation worktrees, matching downstream remote refs, unchanged original
dirty checkout, no tracked confidential values, and both canaries retained unless Davide
separately authorizes deletion.
