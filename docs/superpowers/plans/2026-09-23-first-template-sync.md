# First PhotoPortfolio ← PhotoPortfolioTemplate Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task. This plan is assigned to one `gpt-5.6-luna` agent at `max` reasoning effort; do not delegate or parallelize it. The primary agent reviews every resulting commit, the staging deployment, and the production promotion.

**Goal:** Import the completed photography-template baseline into Davide's personal portfolio without losing personal content or Cloudflare configuration, validate it on the existing staging environment, and promote the exact verified Git state to production.

**Architecture:** `PhotoPortfolioTemplate/main` remains the upstream source for the generic photography subsystem; `PhotoPortfolio` remains a divergent downstream. The first sync is performed as an explicit non-fast-forward merge on a dedicated branch and isolated worktree. Personal fallback content and deployment configuration are adapted during the merge, while generic application, Worker, dashboard, infrastructure, and test changes come from upstream.

**Tech Stack:** Git worktrees and two remotes, Node.js 20+, Vite 8, Vitest 4, Cloudflare Workers/R2/Access, Terraform 1.16.3.

**Architecture decision:** `docs/upstream-sync.md`

## Current verified state

- Personal repository: `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolio`.
- Template repository: `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolioTemplate`.
- Personal `staging` is at `4af3612` before this plan is committed, is two commits ahead of `origin/staging`, and has personal Software/Photography architecture documents.
- The personal working directory is dirty. It contains an intentional `.gitignore` edit and several untracked documents. They must remain untouched; do not stash, delete, rename, or bulk-add them.
- Personal baseline: 34 test files and 264 tests pass; the production build passes.
- Template target behavior is present on `origin/codex/staging-opt-in` at `ac49272`.
- Template `origin/main` currently contains the fallback work through merge commit `7f72f76`, but not the six staging-opt-in commits. `origin/main...origin/codex/staging-opt-in` is currently `1 6`.
- Template target baseline: 49 test files and 402 tests pass; the placeholder build passes; Terraform native tests report 2 passed and 0 failed.
- Personal and template histories have diverged. The sync is a real merge, but `wrangler.json` still does **not** conflict because the personal branch has not changed it since the shared base. Without explicit restoration, Git silently accepts the template placeholders.

## Non-negotiable constraints

- Do not start the personal-site merge until all six staging-opt-in commits are on the template's remote `main` and its checks pass.
- Do not work in the dirty personal working directory. Create a dedicated Git worktree from local `staging`.
- Do not inspect, copy, print, stage, or commit `.env` or any Cloudflare secret.
- Preserve the existing production and staging Worker names, R2 bucket names, R2 public URLs, Access team domain, and Access AUD values in `wrangler.json`.
- Keep the existing `env.staging` block. Staging is opt-in for new template users, but it is already provisioned for this site.
- Add `TURNSTILE_SITEKEY` to both production and staging vars with the empty string for now. Do not configure only one half of Turnstile.
- Do not run `npm run migrate` or `npm run infra:sync`; either command can replace live-site content or deployment configuration.
- Delete `public/_headers` as upstream intends. The only valid deployed file is generated as `dist/_headers` during the build.
- Preserve and migrate the personal `config/*.config.js` values. They are now the public fallback when R2 returns `NOT_FOUND`; the neutral template seeds are not acceptable for the personal site.
- Preserve the three personal Software/Photography architecture documents and all commits already on personal `staging`.
- No write operation against R2 is part of verification. Staging and production smoke tests are read-only.
- Production promotion happens only after an explicit successful staging gate and must use the same verified Git tree, with no second conflict resolution.

---

## Task 1: Make template `main` a valid upstream target

**Repository:** `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolioTemplate`

**Files:**
- Modify: `docs/azioni-manuali.md`
- Merge: `origin/codex/staging-opt-in` into a branch based on `origin/main`

- [ ] **Step 1: Refresh and prove the branch relationship**

```bash
git fetch origin --prune
git rev-list --left-right --count origin/main...origin/codex/staging-opt-in
git merge-base --is-ancestor ac49272 origin/main
```

Expected before the fix: the count is `1 6`; the ancestry check exits non-zero. If `ac49272` is already an ancestor of `origin/main`, skip the merge mechanics but still perform all validation and documentation corrections below.

- [ ] **Step 2: Create an isolated landing worktree**

Create branch `codex/land-staging-opt-in` from fresh `origin/main` in a new worktree. Do not reuse the existing `staging-opt-in` worktree.

```bash
git worktree add -b codex/land-staging-opt-in ../PhotoPortfolioTemplate-land-staging origin/main
```

- [ ] **Step 3: Merge the missing staging work**

Inside the new worktree:

```bash
git merge --no-ff origin/codex/staging-opt-in -m "merge: land opt-in staging on main"
```

Expected: a clean merge. If Git reports a conflict, stop and report it; do not select `ours` or `theirs` wholesale.

- [ ] **Step 4: Correct the manual-action record before publishing**

In `docs/azioni-manuali.md`:

- mark action 6 complete and record that the dedicated deploy key for `PhotoPortfolio` was verified with write access;
- remove the stale statement that action 5 is currently a fast-forward;
- state that personal `staging` has its own commits, while `wrangler.json` will still be overwritten without a conflict because it was unchanged after the shared base;
- replace the claim that neutral `config/*.config.js` seeds are harmless: personalized configs must be migrated because they are now the public fallback;
- require preserving the existing `env.staging` block and adding an empty `TURNSTILE_SITEKEY` to both environments;
- keep action 5 open until the live staging and production gates in this plan pass.

Commit only that documentation change:

```bash
git add docs/azioni-manuali.md
git commit -m "docs: correct first downstream sync procedure"
```

- [ ] **Step 5: Verify the combined template**

```bash
npm ci
npm test
ALLOW_PLACEHOLDER_CSP=1 npm run build
terraform -chdir=infra fmt -check -recursive
terraform -chdir=infra validate
terraform -chdir=infra test
git diff --check origin/main...HEAD
```

Expected:

- 49 Vitest files and 402 tests pass, unless new tests intentionally increase the counts;
- Vite produces `dist/_headers`, `dist/about.html`, and the remaining production assets;
- Terraform reports 2 passed and 0 failed;
- no formatting or whitespace errors.

- [ ] **Step 6: Publish and merge the template prerequisite**

Push `codex/land-staging-opt-in`, open a pull request into template `main`, and wait for all checks. The primary agent reviews the PR before merge.

After merge:

```bash
git fetch origin --prune
git merge-base --is-ancestor ac49272 origin/main
```

Expected: exit 0. Record the resulting `origin/main` commit; that immutable commit is the upstream target for the rest of the plan.

---

## Task 2: Establish a clean downstream baseline without touching local work

**Repository:** `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolio`

**Files:**
- Preserve unchanged: current dirty working-directory files
- Create worktree: `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolio-sync-2026-09-23`
- Create branch: `codex/sync-template-2026-09-23`

- [ ] **Step 1: Capture the original worktree status**

```bash
git status --short --branch
git log --oneline origin/staging..staging
```

Expected: local `staging` contains the approved Software/Photography documentation commits plus the commit containing this plan; unrelated dirty files remain only in this original worktree.

- [ ] **Step 2: Configure and validate the upstream remote**

If `upstream` does not exist, add it:

```bash
git remote add upstream https://github.com/davidetarsi/PhotoPortfolioTemplate.git
git fetch upstream --tags --prune
git merge-base --is-ancestor ac49272 upstream/main
```

Expected: the ancestry check exits 0. Also compare the fetched `upstream/main` SHA with the immutable commit recorded in Task 1. Do not continue if they differ unexpectedly.

- [ ] **Step 3: Create the isolated sync worktree**

```bash
git worktree add -b codex/sync-template-2026-09-23 ../PhotoPortfolio-sync-2026-09-23 staging
```

Inside the new worktree, `git status --short` must be empty. Confirm that `.env` is absent. Do not copy it from the original worktree.

- [ ] **Step 4: Re-run the downstream baseline in isolation**

```bash
npm ci
npm test
npm run build
```

Expected before the merge: 34 test files and 264 tests pass, and the build exits 0. If the baseline fails, stop; do not mix a pre-existing failure with the upstream sync.

- [ ] **Step 5: Create a private temporary configuration snapshot**

Create a temporary directory with `mktemp -d`, restrict it to the current user, and copy only these tracked non-secret files into it:

- `wrangler.json`
- `config/site.config.js`
- `config/albums.config.js`
- `config/texts.config.js`
- `config/admin.config.js`

Do not place the snapshot under either repository and do not include `.env`. Record the temporary path for this execution only; delete the snapshot after the merge commit and verification are complete.

Before continuing, assert structurally—without printing values—that the saved `wrangler.json` contains both production and `env.staging`, each with a Worker name, one `BUCKET` binding, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, and `R2_PUBLIC_URL`.

---

## Task 3: Merge upstream and migrate the personal overlay

**Repository:** `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolio-sync-2026-09-23`

**Files:**
- Merge from: `upstream/main`
- Modify: `wrangler.json`
- Modify: `config/site.config.js`
- Modify: `config/albums.config.js`
- Modify: `config/texts.config.js`
- Modify: `config/admin.config.js`
- Create: `src/personal-config.test.js`
- Modify: `README.md`
- Verify deleted: `public/_headers`, `contatti.html`, `src/pages/contatti.js`
- Verify added: `about.html`, `src/pages/about.js`, `theme/card.css`, `wrangler.example.json`

- [ ] **Step 1: Start the merge without committing it**

```bash
git merge --no-ff --no-commit upstream/main
```

Expected: Git can merge automatically. This does **not** make the result safe: inspect the staged tree before committing.

- [ ] **Step 2: Prove personal roadmap documents survived**

Verify that all three files still exist:

- `docs/superpowers/specs/2026-09-21-software-photography-portfolio-architecture-design.md`
- `docs/superpowers/plans/2026-09-21-template-extension-points.md`
- `docs/superpowers/plans/2026-09-21-personal-software-portfolio.md`

Also verify that the two commits `27af2e5` and `4af3612` remain ancestors of `HEAD` after the merge is committed.

- [ ] **Step 3: Restore and extend the real Wrangler configuration**

Restore `wrangler.json` from the private snapshot, then add this key without changing any existing value:

```json
"TURNSTILE_SITEKEY": ""
```

It must exist in both:

- top-level `vars` for production;
- `env.staging.vars` for staging.

The resulting file must keep the template's structural fields (`compatibility_date`, `main`, assets binding) and all current personal production/staging values. It must not contain placeholder strings such as `il-tuo-`, `pub-xxxxxxxx`, or `incolla-qui`.

Do not add `TURNSTILE_SECRET`, `CONTACT_NOTIFY_URL`, API tokens, or any other secret to this file.

- [ ] **Step 4: Migrate the personal site fallback**

Adapt `config/site.config.js` to the new schema:

- keep `name: 'Davide Tarsi'`;
- keep `bio: 'Fotografo sportivo e di viaggio.'`;
- keep `language: 'it'`, the current `social` object, `provider: 'r2'`, and `r2PublicUrl`;
- replace `heroImageUrl` with:

```js
heroImage: { album: 'sport', name: '4x5-crop-7302.webp' },
```

- remove `web3formsAccessKey`; the contact flow now belongs to the Worker.

Adapt `config/albums.config.js` while keeping slugs, titles, and descriptions:

```js
coverName: '4x5-crop-IMG_8689-.webp'
```

for `sport`, and:

```js
coverName: '4x5-2637.webp'
```

for `around-the-world`. Remove the old absolute `coverUrl` fields.

Adapt `config/texts.config.js` by taking the complete upstream shape, preserving the current Italian personal copy, and applying the new keys:

- rename `contatti` to `about`;
- rename `nav.contattiLabel` to `nav.aboutLabel`;
- add `subjectPlaceholder`;
- add `album.error.noImage`;
- keep all new `admin.site`, `admin.albums`, `admin.album`, `admin.status`, and `admin.messages` strings from upstream.

Restore the existing personal `backgroundImageUrl` in `config/admin.config.js`; do not replace it with the empty template seed.

- [ ] **Step 5: Add a personal regression test**

Create `src/personal-config.test.js`. It must verify behavior, not repeat full public URLs:

- personal name and bio are present;
- hero uses the `{ album, name }` shape and contains no `heroImageUrl`;
- the two expected album slugs exist and both use `coverName`, with no `coverUrl`;
- the old `web3formsAccessKey`, `texts.contatti`, and `nav.contattiLabel` properties are absent;
- `texts.about`, subject placeholder, no-image copy, and admin message copy exist;
- `adminConfig.backgroundImageUrl` is non-empty.

Run it first:

```bash
npx vitest run src/personal-config.test.js
```

Expected: PASS after the migrations above.

- [ ] **Step 6: Make the personal README truthful**

Replace the generic template landing copy in `README.md` with a concise downstream README that states:

- this repository powers Davide Tarsi's personal site;
- the photography area is derived from and periodically synchronized with `PhotoPortfolioTemplate`, linked explicitly;
- Software is the planned professional area and Photography remains an autonomous portfolio area;
- generic installation/customization instructions live in the upstream template;
- local commands are `npm ci`, `npm run dev`, `npm test`, and `npm run build`;
- deployment-specific values and secrets are intentionally not documented inline;
- link `docs/upstream-sync.md` and the personal Software/Photography architecture documents.

Do not copy template marketing claims or setup instructions back into this personal README.

- [ ] **Step 7: Verify the route and header migration**

Assert:

- `public/_headers` is deleted;
- `dist/_headers` is generated only by the build;
- `/contatti` is redirected permanently to `/about` by the Worker;
- `about.html` and `src/pages/about.js` exist;
- no production source still imports `src/pages/contatti.js`;
- no production source refers to Web3Forms or `VITE_WEB3FORMS_ACCESS_KEY`.

- [ ] **Step 8: Install the merged dependency graph and run focused checks**

```bash
npm ci
npx vitest run src/personal-config.test.js src/providers/data.test.js src/pages/index.test.js src/components/ContactForm.test.js src/worker/contact-routes.test.js src/utils/buildHeaders.test.js
```

Expected: all focused tests pass. Do not weaken upstream assertions to accommodate personal configuration.

- [ ] **Step 9: Commit the merge**

Review `git diff --cached --stat` and `git diff --check`, then commit the pending merge:

```bash
git add wrangler.json config src/personal-config.test.js README.md
git commit -m "merge: sync PhotoPortfolioTemplate baseline"
```

The commit must have two parents: the previous personal `staging` tip and the immutable template `main` commit recorded in Task 1.

---

## Task 4: Run the complete local verification gate

**Repository:** `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolio-sync-2026-09-23`

**Files:**
- Verify: complete merged tree
- Modify only if a failing check proves a defect

- [ ] **Step 1: Run the full JavaScript suite**

```bash
npm test
```

Expected: at least the 49 upstream test files and 402 upstream tests pass, plus `src/personal-config.test.js`; zero failures.

- [ ] **Step 2: Build with the real deployment configuration**

```bash
npm run build
```

Do not set `ALLOW_PLACEHOLDER_CSP=1`. Expected: build succeeds and generates `dist/_headers`, `dist/about.html`, and no `dist/contatti.html`.

- [ ] **Step 3: Validate the generated CSP without exposing identifiers**

Use a small read-only Node assertion that parses `wrangler.json`, extracts the origins of the production and staging `R2_PUBLIC_URL` values, and proves that both origins occur in `dist/_headers`. It must also fail if `_headers` contains `pub-xxxxxxxx`, `il-tuo-`, or `incolla-qui`.

Expected: exit 0 and no configuration values printed.

- [ ] **Step 4: Validate deployment structure and absence of secrets**

Programmatically assert:

- production and staging each have exactly one `BUCKET` binding;
- both environments include `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `R2_PUBLIC_URL`, and `TURNSTILE_SITEKEY`;
- both `TURNSTILE_SITEKEY` values are empty;
- `wrangler.json` contains none of `TURNSTILE_SECRET`, `CONTACT_NOTIFY_URL`, `CF_API_TOKEN`, or `CLOUDFLARE_API_TOKEN`;
- no tracked file is named `.env`.

Do not print the values during these assertions.

- [ ] **Step 5: Run static and history checks**

```bash
git diff --check staging...HEAD
git merge-base --is-ancestor 27af2e5 HEAD
git merge-base --is-ancestor 4af3612 HEAD
git merge-base --is-ancestor ac49272 HEAD
git status --short
```

Expected: all ancestry checks exit 0 and the worktree is clean. The merge commit is ahead of local `staging`; the original dirty working directory remains unchanged.

- [ ] **Step 6: Delete the temporary configuration snapshot**

Only after all checks above pass, delete the exact temporary directory created in Task 2. Do not use a broad path, glob, home directory, or unresolved variable.

---

## Task 5: Publish to staging and perform a read-only live smoke test

**Repository:** `PhotoPortfolio`

**Remote changes:**
- Push: `codex/sync-template-2026-09-23`
- Merge target: `staging`
- Do not update: `main`

- [ ] **Step 1: Push the sync branch and open a PR into `staging`**

```bash
git push -u origin codex/sync-template-2026-09-23
```

Open a PR whose body records:

- exact upstream commit imported;
- personal configuration migrations;
- test and build results;
- explicit statement that `npm run migrate` and `npm run infra:sync` were not run;
- staging smoke-test checklist below.

The primary agent reviews the complete diff before merging. Attach the PR to the Codex task.

- [ ] **Step 2: Merge into `staging` and wait for Cloudflare**

After review, merge the PR into `staging`. Wait for the configured Cloudflare deployment to finish. A GitHub merge alone does not satisfy this gate.

- [ ] **Step 3: Verify staging without mutating R2**

On the real staging hostname, verify:

- `/` returns 200 and shows Davide's identity rather than template placeholders;
- both `sport` and `around-the-world` appear;
- one album opens, images load, and lightbox navigation works;
- `/about` returns 200 and renders the Worker-backed contact form;
- `/contatti` redirects permanently to `/about`;
- `/admin` is protected by Cloudflare Access;
- after authentication, the admin dashboard can read site, albums, and messages;
- responsive navigation works at a mobile viewport;
- response CSP contains the real image origins and no placeholders.

Do not submit the contact form, upload/delete/reorder photos, save site settings, or delete messages during this smoke test.

- [ ] **Step 4: Record the staging gate**

Add the staging deployment URL, deployed commit SHA, date, and pass/fail result to the PR or implementation report. If any check fails, stop production promotion and fix it on the sync branch through a reviewed follow-up commit.

---

## Task 6: Promote the exact verified state to production

**Repository:** `PhotoPortfolio`

**Remote changes:**
- Promote: verified `origin/staging` tree to `main`

- [ ] **Step 1: Prove promotion is monotonic**

```bash
git fetch origin --prune
git merge-base --is-ancestor origin/main origin/staging
```

Expected: exit 0. If not, do not create another manual merge; report the divergence for review.

- [ ] **Step 2: Promote without changing the tree**

Use a fast-forward update when branch protection allows it. If GitHub requires a PR, merge `staging` into `main` and then prove that the resulting `main` tree hash is identical to the verified `staging` tree hash.

No file may be edited and no conflict may be re-resolved during promotion.

- [ ] **Step 3: Wait for production deployment and smoke-test read-only behavior**

Repeat the public checks from staging on production:

- home and both albums;
- `/about` and `/contatti` redirect;
- Access protection on `/admin`;
- generated CSP with no placeholders.

Do not perform R2 mutations or submit the form.

- [ ] **Step 4: Record the production gate**

Record production URL, deployed commit SHA, date, and pass/fail result. Confirm that the production tree hash equals the staging tree hash that passed Task 5.

---

## Task 7: Close the documentation loop

**Repositories:** both template and personal downstream

**Files:**
- Modify upstream: `PhotoPortfolioTemplate/docs/azioni-manuali.md`
- Modify downstream: `PhotoPortfolio/docs/upstream-sync.md`
- Create downstream: `PhotoPortfolio/docs/upstream-sync-log.md`

- [ ] **Step 1: Close actions 5 and 6 upstream**

In the template repository, move actions 5 and 6 out of the pending table and record:

- action 6: dedicated deploy key verified for write;
- action 5: exact upstream commit imported, personal merge commit, staging verification, production verification, and completion date;
- corrected reusable lessons: ancestry alone does not predict per-file conflicts, `wrangler.json` must be preserved explicitly, and fallback config is live behavior.

Publish this as a small documentation-only PR into template `main`.

- [ ] **Step 2: Record the downstream sync**

Update `docs/upstream-sync.md` from “implementation deferred” to “first synchronization completed”. Create `docs/upstream-sync-log.md` with one table row containing:

- date;
- imported template commit;
- downstream merge commit;
- staging and production deployed commit;
- verification result;
- noteworthy migrations (`/about`, Worker contact form, generated CSP, fallback config, opt-in staging preserved).

No credentials, full Access identifiers, bucket names, or URLs belong in the log.

- [ ] **Step 3: Import the final upstream documentation commit**

Merge the final template documentation commit into personal `staging`, verify the tree change is documentation-only, then promote that same tree to personal `main` using the Task 6 rule. This final documentation-only deploy may skip the full UI smoke test but must still pass `npm test`, `npm run build`, and the CSP assertion.

- [ ] **Step 4: Final verification**

```bash
npm test
npm run build
git status --short
```

Expected: all tests and build pass; the implementation worktree is clean; template and downstream remotes contain their reviewed commits; actions 5 and 6 are documented as complete.

## Final review gate

- [ ] Template `main` contains both album fallback and opt-in staging work.
- [ ] Personal history retains commits `27af2e5` and `4af3612`.
- [ ] Personal fallback renders Davide's identity and both real album entries.
- [ ] Production and staging deployment values are preserved without committing secrets.
- [ ] Turnstile remains deliberately disabled in both environments, not half-configured.
- [ ] `public/_headers` is gone and `dist/_headers` is generated from the real Wrangler configuration.
- [ ] `/contatti` redirects to `/about`; the new contact flow and admin messages view are present.
- [ ] Full local tests, real-config build, CSP assertions, staging smoke test, and production smoke test pass.
- [ ] Production uses the exact Git tree verified on staging.
- [ ] The original dirty personal working directory was not modified by the implementation.
- [ ] Actions 5 and 6 and the first-sync log are up to date.
