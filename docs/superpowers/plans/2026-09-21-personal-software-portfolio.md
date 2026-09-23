# Personal Software + Photography Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasformare `PhotoPortfolio` in un sito personale product-led con aree Software e Fotografia autonome, progetti curati in Markdown e GitHub pubblico come semplice link opzionale.

**Architecture:** Il sito personale integra esplicitamente l'upstream fotografico, poi aggiunge una pipeline build-time che compila Markdown validato in JSON statico. Il browser renderizza indice e case study da questi artefatti; il Worker risolve URL puliti, restituisce 404 reali e inietta metadati specifici senza chiamare GitHub o altri servizi esterni.

**Tech Stack:** JavaScript ESM, Vite 8, Vitest 4, Cloudflare Workers/R2, `gray-matter`, `marked`, `sanitize-html`, HTML/CSS vanilla.

**Spec:** `docs/superpowers/specs/2026-09-21-software-photography-portfolio-architecture-design.md`

## Global Constraints

- Prerequisito: il piano `2026-09-21-template-extension-points.md` deve essere unito in `PhotoPortfolioTemplate/main`.
- Eseguire in un worktree pulito creato da `PhotoPortfolio/staging`; non usare direttamente il worktree con modifiche locali preesistenti.
- Prima di modificare il sito personale, configurare `PhotoPortfolioTemplate` come remote `upstream` e integrare `upstream/main` in un branch dedicato.
- Software è gerarchicamente primario; Fotografia resta una sezione autonoma completa.
- Ogni progetto pubblicato nasce da `content/projects/*.md`; nessun repository GitHub genera progetti automaticamente.
- `repositoryUrl` è facoltativo, deve usare `https://github.com/<owner>/<repo>` e non viene verificato via rete.
- Nessun token, SDK o chiamata API GitHub in build, Worker o browser.
- Nessuna migrazione a framework.
- Il Markdown viene compilato e sanitizzato durante la build; il browser non riceve Markdown grezzo.
- Album, dashboard, R2 e contatti devono restare indipendenti dai dati Software.
- Applicare TDD e creare un commit indipendente per ogni task.

## Decisione tecnica sulla pipeline Markdown

- `gray-matter` estrae front matter e corpo.
- `marked` produce HTML in Node durante la build.
- `sanitize-html` applica un'allowlist prima di scrivere gli artefatti.
- `public/generated/projects-index.json` contiene solo metadati necessari a home e indice.
- `public/generated/projects/<slug>.json` contiene metadati e `bodyHtml` del singolo case study.
- `public/generated/` è generato, ignorato da Git e ricreato da `npm run content:build` prima di `dev` e `build`.

Questa sanitizzazione è obbligatoria perché Marked dichiara esplicitamente che il proprio output non è sanitizzato.

Riferimenti verificati:

- [gray-matter](https://www.npmjs.com/package/gray-matter) per `data` e `content` del front matter;
- [Marked](https://marked.js.org/) per la compilazione Markdown e l'avvertenza sulla sanitizzazione;
- [sanitize-html](https://www.npmjs.com/package/sanitize-html) per l'allowlist HTML in Node.

## File map

### Integrazione upstream

- Modify: `.git/config` tramite `git remote add upstream` — collegamento al template.
- Modify after merge: `config/site.config.js`, `config/navigation.config.js`, `config/routes.config.js`, `wrangler.json` — overlay personale sui contratti upstream.
- Create: `docs/upstream-sync.md` — procedura ripetibile di aggiornamento.

### Contenuti Software

- Create: `content/projects/photo-portfolio-template.md` — primo case study verificabile.
- Create: `public/projects/photo-portfolio-template/cover.webp` — visual reale del progetto.
- Create: `src/projects/project-schema.js` — schema e normalizzazione.
- Create: `src/projects/project-schema.test.js` — contratto front matter.
- Create: `scripts/project-content.js` — lettura, compilazione e scrittura degli artefatti.
- Create: `scripts/project-content.test.js` — pipeline su directory temporanee.
- Create: `scripts/build-projects.js` — entry point CLI.
- Create: `content/projects/.gitkeep` — directory di authoring disponibile anche prima del primo progetto.
- Modify: `package.json`, `package-lock.json`, `.gitignore` — dipendenze e lifecycle build.

### UI e routing

- Create: `software.html`, `project.html`, `fotografia.html`, `about.html`, `404.html`.
- Create: `src/projects/project-data.js`, `src/projects/project-data.test.js`.
- Create: `src/components/ProjectCard.js`, `src/components/ProjectCard.test.js`.
- Create: `src/components/PersonalHero.js`, `src/components/PersonalHero.test.js`.
- Create: `src/pages/software.js`, `src/pages/project.js`, `src/pages/fotografia.js`, `src/pages/about.js`.
- Create: `src/worker/project-page.js`, `src/worker/project-page.test.js`.
- Create: `src/shared/personal-routes.js`, `src/shared/personal-routes.test.js`.
- Create: `src/styles/project-card.css`, `src/styles/software.css`, `src/styles/project.css`, `src/styles/personal-home.css`, `src/styles/about.css`.
- Modify: `src/worker.js`, `vite.config.js`, `index.html`, `album.html`, `src/pages/index.js`, `src/pages/album.js`, `src/components/AlbumCard.js`, `src/components/AlbumCard.test.js`.

## Stima

24–36 ore complessive:

- riallineamento upstream: 3–5 ore;
- pipeline contenuti: 5–7 ore;
- routing, SEO e pagine Software: 6–9 ore;
- ricomposizione Home/Fotografia/About: 5–8 ore;
- contenuto iniziale, responsive, accessibilità e QA: 5–7 ore.

La stima non include attese Cloudflare, iterazioni visuali estese né la redazione completa dei case study di tutti i progetti personali.

---

### Task 1: Riallineare il sito personale con l'upstream senza distribuire regressioni

**Files:**
- Create: `docs/upstream-sync.md`
- Modify: `config/site.config.js`
- Modify: `config/navigation.config.js`
- Modify: `config/routes.config.js`
- Modify: `wrangler.json`

**Interfaces:**
- Consumes: `PhotoPortfolioTemplate/main` con i contratti del piano template.
- Produces: branch personale basato sul template corrente, testabile localmente e non ancora distribuito.

- [ ] **Step 1: Creare il worktree isolato e verificare la baseline**

Usare `superpowers:using-git-worktrees`, quindi nel nuovo worktree:

```bash
npm ci
npm test
npm run build
```

Expected: baseline personale PASS prima del merge. Se fallisce, fermare il task e diagnosticare la baseline senza attribuire il problema all'upstream.

- [ ] **Step 2: Configurare e verificare il remote upstream**

```bash
git remote get-url upstream || git remote add upstream https://github.com/davidetarsi/PhotoPortfolioTemplate.git
git fetch upstream
git log --oneline --decorate -5 upstream/main
```

Expected: `upstream/main` contiene i commit del piano `template-extension-points`.

- [ ] **Step 3: Integrare l'upstream in un commit di merge**

```bash
git merge --no-ff upstream/main -m "merge: riallinea il sito personale al template"
```

Non distribuire questo merge. Se `wrangler.json` entra in conflitto, mantenere i binding, bucket, nomi Worker, domain Access e URL R2 del sito personale; acquisire soltanto nuove chiavi strutturali richieste dal template.

- [ ] **Step 4: Applicare l'overlay personale sul nuovo schema**

Portare `config/site.config.js` alla forma corrente del template usando:

```js
export const siteConfig = {
  name: 'Davide Tarsi',
  bio: 'Software developer e fotografo.',
  language: 'it',
  heroImage: { album: 'sport', name: '4x5-crop-7302.webp' },
  social: {},
  provider: 'r2',
  r2PublicUrl: import.meta.env?.VITE_R2_PUBLIC_URL,
  turnstileSitekey: import.meta.env?.VITE_TURNSTILE_SITEKEY ?? '',
}
```

In questo task lasciare la navigazione con la configurazione fotografica upstream. Le voci Software/Fotografia/About arrivano dopo che le rispettive pagine esistono.

- [ ] **Step 5: Rieseguire test e build dopo il merge**

```bash
npm ci
npm test
npm run build
```

Expected: tutti PASS. Non accettare snapshot aggiornati o test rimossi per far passare il merge.

- [ ] **Step 6: Documentare la procedura ripetibile**

Creare `docs/upstream-sync.md`:

```markdown
# Aggiornare PhotoPortfolio dal template

1. Parti da `staging` pulito e crea `chore/sync-template-YYYY-MM-DD`.
2. Esegui `git fetch upstream`.
3. Controlla `git log --oneline HEAD..upstream/main`.
4. Esegui `git merge --no-ff upstream/main`.
5. Nei conflitti conserva identità, contenuti, token visivi e valori Cloudflare personali; conserva invece le API e le shape nuove dell'upstream.
6. Esegui `npm ci`, `npm test`, `npm run build` e un'anteprima locale.
7. Integra in `staging`; la produzione resta un passaggio distinto.

Non fare merge automatici schedulati: un aggiornamento upstream può cambiare config, routing o infrastruttura.
```

- [ ] **Step 7: Commit del solo riallineamento**

```bash
git add config/site.config.js config/navigation.config.js config/routes.config.js wrangler.json docs/upstream-sync.md
git commit -m "chore: riallinea il sito personale al template"
```

Expected: nessun deploy e nessuna modifica ai contenuti R2.

---

### Task 2: Definire e validare il modello dei progetti

**Files:**
- Create: `src/projects/project-schema.js`
- Create: `src/projects/project-schema.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: front matter JavaScript object e nome del file sorgente.
- Produces: `validateProjectMeta(meta, source) -> {ok, errors}` e `normalizeProject(meta) -> ProjectMeta`.
- `ProjectMeta`: `{title, slug, summary, status, featured, order, cover, technologies, productUrl?, repositoryUrl?, storeUrl?, caseStudyUrl?, startedAt?, completedAt?, role?}`.

- [ ] **Step 1: Installare le sole dipendenze build-time necessarie**

```bash
npm install --save-dev gray-matter marked sanitize-html
```

Expected: lockfile aggiornato; nessuna dipendenza aggiunta al bundle browser perché i tre pacchetti saranno importati solo da `scripts/`.

- [ ] **Step 2: Scrivere il test fallente dello schema**

Creare `src/projects/project-schema.test.js`:

```js
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { normalizeProject, validateProjectMeta } from './project-schema.js'

const valid = {
  title: 'PhotoPortfolio Template',
  slug: 'photo-portfolio-template',
  summary: 'Template self-hosted per portfolio fotografici.',
  status: 'active',
  featured: true,
  order: 10,
  cover: '/projects/photo-portfolio-template/cover.webp',
  technologies: ['JavaScript', 'Cloudflare Workers', 'R2'],
  repositoryUrl: 'https://github.com/davidetarsi/PhotoPortfolioTemplate',
  role: 'Ideazione e sviluppo',
}

describe('project schema', () => {
  it('accetta un progetto completo e uno senza repository', () => {
    expect(validateProjectMeta(valid, 'ok.md')).toEqual({ ok: true, errors: [] })
    const { repositoryUrl, ...closedSource } = valid
    expect(validateProjectMeta(closedSource, 'closed.md').ok).toBe(true)
  })

  it('rifiuta campi obbligatori, status e slug invalidi', () => {
    expect(validateProjectMeta({ ...valid, title: '' }, 'x.md').ok).toBe(false)
    expect(validateProjectMeta({ ...valid, status: 'draft' }, 'x.md').ok).toBe(false)
    expect(validateProjectMeta({ ...valid, slug: 'Bad Slug' }, 'x.md').ok).toBe(false)
  })

  it('accetta solo repository HTTPS pubblicamente linkabili su github.com', () => {
    expect(validateProjectMeta({ ...valid, repositoryUrl: 'git@github.com:x/y.git' }, 'x.md').ok).toBe(false)
    expect(validateProjectMeta({ ...valid, repositoryUrl: 'https://gitlab.com/x/y' }, 'x.md').ok).toBe(false)
    expect(validateProjectMeta({ ...valid, repositoryUrl: 'https://github.com/x' }, 'x.md').ok).toBe(false)
  })

  it('normalizza stringhe e ordina le tecnologie senza mutare input', () => {
    const input = { ...valid, title: '  Titolo  ', technologies: ['R2', 'JavaScript'] }
    expect(normalizeProject(input).title).toBe('Titolo')
    expect(normalizeProject(input).technologies).toEqual(['JavaScript', 'R2'])
    expect(input.title).toBe('  Titolo  ')
  })
})
```

- [ ] **Step 3: Eseguire il test e verificare il fallimento**

```bash
npm test -- src/projects/project-schema.test.js
```

Expected: FAIL perché il modulo non esiste.

- [ ] **Step 4: Implementare schema e normalizzazione**

Creare `src/projects/project-schema.js` con:

```js
import { SLUG_RE } from '../shared/content-rules.js'

const STATUSES = new Set(['active', 'completed', 'archived'])
const REQUIRED_STRINGS = ['title', 'slug', 'summary', 'cover']
const OPTIONAL_URLS = ['productUrl', 'storeUrl', 'caseStudyUrl']

function isHttpUrl(value) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
}

function isPublicGitHubUrl(value) {
  try {
    const url = new URL(value)
    const parts = url.pathname.split('/').filter(Boolean)
    return url.protocol === 'https:' && url.hostname === 'github.com' && parts.length === 2
  } catch { return false }
}

export function validateProjectMeta(meta, source = 'project') {
  const errors = []
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return { ok: false, errors: [`${source}: front matter non valido`] }
  }
  for (const field of REQUIRED_STRINGS) {
    if (typeof meta[field] !== 'string' || !meta[field].trim()) errors.push(`${source}: ${field} obbligatorio`)
  }
  if (!SLUG_RE.test(meta.slug ?? '')) errors.push(`${source}: slug non valido`)
  if (!STATUSES.has(meta.status)) errors.push(`${source}: status non valido`)
  if (typeof meta.featured !== 'boolean') errors.push(`${source}: featured deve essere boolean`)
  if (!Number.isInteger(meta.order)) errors.push(`${source}: order deve essere intero`)
  if (!Array.isArray(meta.technologies) || meta.technologies.length === 0 || meta.technologies.some(v => typeof v !== 'string' || !v.trim())) {
    errors.push(`${source}: technologies deve contenere stringhe non vuote`)
  }
  for (const field of OPTIONAL_URLS) {
    if (meta[field] !== undefined && !isHttpUrl(meta[field])) errors.push(`${source}: ${field} non valido`)
  }
  if (meta.repositoryUrl !== undefined && !isPublicGitHubUrl(meta.repositoryUrl)) {
    errors.push(`${source}: repositoryUrl deve essere https://github.com/<owner>/<repo>`)
  }
  return { ok: errors.length === 0, errors }
}

export function normalizeProject(meta) {
  return {
    ...meta,
    title: meta.title.trim(),
    slug: meta.slug.trim(),
    summary: meta.summary.trim(),
    cover: meta.cover.trim(),
    technologies: [...meta.technologies].map(value => value.trim()).sort((a, b) => a.localeCompare(b)),
  }
}
```

- [ ] **Step 5: Eseguire test mirati e commit**

```bash
npm test -- src/projects/project-schema.test.js
git add package.json package-lock.json src/projects/project-schema.js src/projects/project-schema.test.js
git commit -m "feat: definisce lo schema dei progetti software"
```

Expected: PASS; nessun accesso di rete.

---

### Task 3: Compilare Markdown in artefatti JSON statici

**Files:**
- Create: `scripts/project-content.js`
- Create: `scripts/project-content.test.js`
- Create: `scripts/build-projects.js`
- Create: `content/projects/.gitkeep`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: directory `content/projects`, file `.md` e `validateProjectMeta`.
- Produces: `loadProjects(contentDir)`, `compileMarkdown(markdown)`, `writeProjectArtifacts(projects, outputDir)`.
- Produces su disco: `projects-index.json` e `projects/<slug>.json`.

- [ ] **Step 1: Scrivere il test fallente end-to-end su directory temporanea**

Creare `scripts/project-content.test.js`:

```js
// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { loadProjects, writeProjectArtifacts } from './project-content.js'

let root
afterEach(async () => { if (root) await rm(root, { recursive: true, force: true }) })

async function fixture() {
  root = await mkdtemp(join(tmpdir(), 'portfolio-projects-'))
  const contentDir = join(root, 'content')
  await mkdir(contentDir)
  await writeFile(join(contentDir, 'test.md'), `---
title: Progetto Test
slug: progetto-test
summary: Un progetto senza repository pubblico.
status: active
featured: true
order: 1
cover: /projects/test/cover.webp
technologies: [JavaScript, Vite]
---
# Problema

Testo **utile**.<script>alert(1)</script>
`)
  return { contentDir, outputDir: join(root, 'generated') }
}

describe('project content build', () => {
  it('scrive indice senza body e dettaglio con HTML sanitizzato', async () => {
    const { contentDir, outputDir } = await fixture()
    const projects = await loadProjects(contentDir)
    await writeProjectArtifacts(projects, outputDir)
    const index = JSON.parse(await readFile(join(outputDir, 'projects-index.json'), 'utf8'))
    const detail = JSON.parse(await readFile(join(outputDir, 'projects/progetto-test.json'), 'utf8'))
    expect(index[0]).not.toHaveProperty('bodyHtml')
    expect(detail.bodyHtml).toContain('<strong>utile</strong>')
    expect(detail.bodyHtml).not.toContain('<script>')
  })

  it('fallisce su slug duplicato indicando entrambi i file', async () => {
    const { contentDir } = await fixture()
    const first = await readFile(join(contentDir, 'test.md'), 'utf8')
    await writeFile(join(contentDir, 'duplicate.md'), first.replace('Progetto Test', 'Duplicato'))
    await expect(loadProjects(contentDir)).rejects.toThrow('slug duplicato')
  })
})
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

```bash
npm test -- scripts/project-content.test.js
```

Expected: FAIL perché `project-content.js` non esiste.

- [ ] **Step 3: Implementare lettura, sanitizzazione e output deterministico**

Creare `scripts/project-content.js` usando queste API:

```js
import matter from 'gray-matter'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { mkdir, readFile, readdir, rm, writeFile } from 'fs/promises'
import { basename, join } from 'path'
import { normalizeProject, validateProjectMeta } from '../src/projects/project-schema.js'

export function compileMarkdown(markdown) {
  const rendered = marked.parse(markdown.replace(/^[\u200B-\u200F\uFEFF]/, ''), { gfm: true })
  return sanitizeHtml(rendered, {
    allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'code', 'pre', 'hr'],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  })
}

export async function loadProjects(contentDir) {
  const names = (await readdir(contentDir)).filter(name => name.endsWith('.md')).sort()
  const projects = []
  const seen = new Map()
  for (const name of names) {
    const source = join(contentDir, name)
    const parsed = matter(await readFile(source, 'utf8'))
    const result = validateProjectMeta(parsed.data, name)
    if (!result.ok) throw new Error(result.errors.join('\n'))
    const meta = normalizeProject(parsed.data)
    if (seen.has(meta.slug)) throw new Error(`slug duplicato "${meta.slug}": ${seen.get(meta.slug)}, ${name}`)
    if (basename(name, '.md') !== meta.slug) throw new Error(`${name}: il nome file deve coincidere con slug "${meta.slug}"`)
    seen.set(meta.slug, name)
    projects.push({ ...meta, bodyHtml: compileMarkdown(parsed.content) })
  }
  return projects.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

export async function writeProjectArtifacts(projects, outputDir) {
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(join(outputDir, 'projects'), { recursive: true })
  const index = projects.map(({ bodyHtml, ...meta }) => meta)
  await writeFile(join(outputDir, 'projects-index.json'), JSON.stringify(index, null, 2))
  for (const project of projects) {
    await writeFile(join(outputDir, `projects/${project.slug}.json`), JSON.stringify(project, null, 2))
  }
}
```

- [ ] **Step 4: Creare il comando CLI e collegarlo al lifecycle**

Creare la directory `content/projects/` con un file vuoto `.gitkeep`, così una build senza progetti produce un indice vuoto valido invece di fallire per directory assente.

Creare `scripts/build-projects.js`:

```js
import { loadProjects, writeProjectArtifacts } from './project-content.js'

const projects = await loadProjects('content/projects')
await writeProjectArtifacts(projects, 'public/generated')
process.stdout.write(`Progetti compilati: ${projects.length}\n`)
```

In `package.json` impostare:

```json
{
  "scripts": {
    "content:build": "node scripts/build-projects.js",
    "dev": "npm run content:build && vite",
    "build": "npm run content:build && vite build"
  }
}
```

Aggiungere a `.gitignore`:

```gitignore
public/generated/
```

- [ ] **Step 5: Verificare pipeline e commit**

```bash
npm test -- scripts/project-content.test.js src/projects/project-schema.test.js
npm run content:build
test -f public/generated/projects-index.json
git status --short
git add scripts/project-content.js scripts/project-content.test.js scripts/build-projects.js content/projects/.gitkeep package.json package-lock.json .gitignore
git commit -m "feat: compila i progetti Markdown durante la build"
```

Expected: gli artefatti esistono ma non compaiono in `git status`.

---

### Task 4: Indice Software, ProjectCard e pagina progetto

**Files:**
- Create: `software.html`
- Create: `project.html`
- Create: `src/projects/project-data.js`
- Create: `src/projects/project-data.test.js`
- Create: `src/components/ProjectCard.js`
- Create: `src/components/ProjectCard.test.js`
- Create: `src/pages/software.js`
- Create: `src/pages/project.js`
- Create: `src/styles/project-card.css`
- Create: `src/styles/software.css`
- Create: `src/styles/project.css`
- Modify: `vite.config.js`

**Interfaces:**
- Consumes: `/generated/projects-index.json` e `/generated/projects/<slug>.json`.
- Produces: `fetchProjectIndex()`, `fetchProject(slug)`, `selectFeaturedProjects(projects)` e `createProjectCard(project)`.

- [ ] **Step 1: Scrivere i test fallenti del data layer e della card**

Creare `src/projects/project-data.test.js`:

```js
import { describe, expect, it, vi } from 'vitest'
import { fetchProject, selectFeaturedProjects } from './project-data.js'

describe('project data', () => {
  it('restituisce NOT_FOUND per un dettaglio assente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })))
    await expect(fetchProject('missing')).resolves.toEqual({ ok: false, error: 'NOT_FOUND' })
    vi.unstubAllGlobals()
  })

  it('seleziona solo featured mantenendo order', () => {
    const projects = [
      { slug: 'b', featured: true, order: 2 },
      { slug: 'x', featured: false, order: 0 },
      { slug: 'a', featured: true, order: 1 },
    ]
    expect(selectFeaturedProjects(projects).map(p => p.slug)).toEqual(['a', 'b'])
  })
})
```

Creare `src/components/ProjectCard.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { createProjectCard } from './ProjectCard.js'

it('rende il case study e omette il repository assente', () => {
  const card = createProjectCard({
    slug: 'packlog', title: 'PackLog', summary: 'Packing assistant',
    cover: '/packlog.webp', technologies: ['Flutter'], status: 'active',
  })
  expect(card.getAttribute('href')).toBe('/software/packlog')
  expect(card.textContent).toContain('PackLog')
  expect(card.querySelector('[data-repository]')).toBeNull()
})
```

- [ ] **Step 2: Implementare data layer e card accessibile**

Creare `src/projects/project-data.js`:

```js
async function fetchJson(url) {
  try {
    const response = await fetch(url)
    if (response.status === 404) return { ok: false, error: 'NOT_FOUND' }
    if (!response.ok) return { ok: false, error: 'UNKNOWN' }
    return { ok: true, data: await response.json() }
  } catch {
    return { ok: false, error: 'NETWORK' }
  }
}

export const fetchProjectIndex = () => fetchJson('/generated/projects-index.json')
export const fetchProject = slug => fetchJson(`/generated/projects/${encodeURIComponent(slug)}.json`)
export const selectFeaturedProjects = projects => projects.filter(project => project.featured)
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
```

Creare `ProjectCard.js` usando nodi DOM e `textContent`, con immagine decorativa `alt=""`, titolo, summary, tecnologie e link principale `/software/<slug>`. Su `error` dell'immagine, rimuovere l'elemento `img` e aggiungere la classe `project-card__cover--fallback` al contenitore, mantenendo dimensioni e contrasto. Non inserire `repositoryUrl` nella card: il repository è un'azione secondaria del dettaglio.

- [ ] **Step 3: Creare HTML ed entry point**

`software.html` deve contenere `#site-nav`, `#software-heading`, `#software-projects`, `#software-status` con `aria-live="polite"` e `#site-footer`.

`project.html` deve contenere:

```html
<title>{{PROJECT_TITLE}} — {{SITE_NAME}}</title>
<meta name="description" content="{{PROJECT_SUMMARY}}">
<meta property="og:title" content="{{PROJECT_TITLE}} — {{SITE_NAME}}">
<meta property="og:description" content="{{PROJECT_SUMMARY}}">
<meta property="og:image" content="{{PROJECT_IMAGE}}">
<main id="project-main" class="project-page" aria-busy="true"></main>
```

Entrambi gli entry point importano `navigationItems`, renderizzano Nav e Footer con gli stessi componenti globali e gestiscono lo stato di caricamento senza lasciare `aria-busy="true"` dopo successo o errore.

`src/pages/software.js` carica l'indice, rende le card o un errore testuale. `src/pages/project.js` estrae l'ultimo segmento del pathname, carica il dettaglio e rende titolo, summary, cover, tecnologie, corpo sanitizzato e CTA. Anche la cover del dettaglio usa un fallback senza layout rotto. Ordine CTA: `productUrl`, `storeUrl`, `caseStudyUrl`, quindi `repositoryUrl` con etichetta `Codice sorgente` e `rel="noopener noreferrer"`.

- [ ] **Step 4: Registrare gli entry point Vite**

In `vite.config.js` aggiungere a `rollupOptions.input`:

```js
software: resolve(__dirname, 'software.html'),
project: resolve(__dirname, 'project.html'),
```

- [ ] **Step 5: Eseguire test, build e commit**

```bash
npm test -- src/projects/project-data.test.js src/components/ProjectCard.test.js
npm run build
test -f dist/software.html
test -f dist/project.html
git add software.html project.html src/projects/project-data.js src/projects/project-data.test.js src/components/ProjectCard.js src/components/ProjectCard.test.js src/pages/software.js src/pages/project.js src/styles/project-card.css src/styles/software.css src/styles/project.css vite.config.js
git commit -m "feat: aggiunge indice e dettagli dei progetti software"
```

---

### Task 5: Routing pulito, 404 reali e metadati progetto

**Files:**
- Create: `404.html`
- Create: `src/shared/personal-routes.js`
- Create: `src/shared/personal-routes.test.js`
- Create: `src/worker/project-page.js`
- Create: `src/worker/project-page.test.js`
- Modify: `src/worker.js`
- Modify: `config/routes.config.js`
- Modify: `vite.config.js`

**Interfaces:**
- Consumes: pathname e binding `env.ASSETS`.
- Produces: `matchProjectSlug(pathname)`, `matchAlbumSlug(pathname)`, `injectProjectMeta(html, project)`, `serveProjectPage(request, env, slug)`.

- [ ] **Step 1: Scrivere i test fallenti delle rotte**

Creare `src/shared/personal-routes.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { matchAlbumSlug, matchProjectSlug } from './personal-routes.js'

describe('personal routes', () => {
  it('estrae solo slug validi dai namespace previsti', () => {
    expect(matchProjectSlug('/software/packlog')).toBe('packlog')
    expect(matchProjectSlug('/software/Bad Slug')).toBeNull()
    expect(matchAlbumSlug('/fotografia/sport')).toBe('sport')
    expect(matchAlbumSlug('/sport')).toBeNull()
  })
})
```

Creare `src/worker/project-page.test.js` con un fake `ASSETS` che restituisce JSON progetto e `project.html`; verificare sostituzione escaped di titolo/summary, status 200 e status 404 quando il JSON manca.

- [ ] **Step 2: Implementare matcher e servizio pagina**

`src/shared/personal-routes.js` riusa la stessa `SLUG_RE` dei contenuti fotografici e software:

```js
import { SLUG_RE } from './content-rules.js'

function matchNestedSlug(pathname, namespace) {
  const parts = String(pathname).replace(/\/+$/, '').split('/').filter(Boolean)
  return parts.length === 2 && parts[0] === namespace && SLUG_RE.test(parts[1]) ? parts[1] : null
}

export const matchProjectSlug = pathname => matchNestedSlug(pathname, 'software')
export const matchAlbumSlug = pathname => matchNestedSlug(pathname, 'fotografia')
```

In `src/worker/project-page.js`, implementare escape HTML per `&<>'"`, caricare prima `/generated/projects/<slug>.json`, poi `/project.html`, sostituire `PROJECT_TITLE`, `PROJECT_SUMMARY`, `PROJECT_IMAGE`; trasformare `project.cover` in URL assoluto con `new URL(project.cover, request.url).href` prima di iniettarlo in `og:image`. Se il JSON manca, restituire `/404.html` con status 404. Conservare gli header dell'asset HTML e impostare `content-type: text/html; charset=UTF-8`.

- [ ] **Step 3: Integrare l'ordine di routing nel Worker**

In `src/worker.js` mantenere questo ordine:

```text
1. /api/data/*
2. /api/admin/*
3. /api/contact
4. pagine statiche registrate
5. /software/<slug> -> serveProjectPage
6. /fotografia/<slug> -> /album.html
7. vecchio /<album-slug> -> redirect 301 a /fotografia/<album-slug>
8. asset o 404 Cloudflare
```

Registrare in `config/routes.config.js`:

```js
{ path: '/software', asset: '/software.html' },
{ path: '/fotografia', asset: '/fotografia.html' },
{ path: '/about', asset: '/about.html' },
```

- [ ] **Step 4: Aggiungere la pagina 404 e l'entry Vite**

Creare `404.html` con messaggio `Pagina non trovata`, link `/` e `meta name="robots" content="noindex"`. Registrarla in Vite come `notFound`.

- [ ] **Step 5: Test e commit**

```bash
npm test -- src/shared/personal-routes.test.js src/worker/project-page.test.js src/worker/admin-routes.test.js src/shared/content-rules.test.js
npm run build
git add 404.html src/shared/personal-routes.js src/shared/personal-routes.test.js src/worker/project-page.js src/worker/project-page.test.js src/worker.js config/routes.config.js vite.config.js
git commit -m "feat: instrada progetti e album con URL stabili"
```

Expected: `/software/missing` restituisce 404 dal Worker; `software`, `fotografia` e `about` compaiono automaticamente fra gli slug album riservati.

---

### Task 6: Separare Fotografia dalla home e preservare la galleria

**Files:**
- Create: `fotografia.html`
- Create: `src/pages/fotografia.js`
- Modify: `src/pages/album.js`
- Modify: `src/components/AlbumCard.js`
- Modify: `src/components/AlbumCard.test.js`
- Modify: `vite.config.js`

**Interfaces:**
- Consumes: provider fotografico esistente e `createAlbumCard(album, options)`.
- Produces: `/fotografia`, `/fotografia/<album-slug>` e redirect legacy.

- [ ] **Step 1: Estendere il test di AlbumCard**

Aggiungere a `src/components/AlbumCard.test.js`:

```js
it('accetta un basePath senza rompere il default del template', () => {
  const card = createAlbumCard(
    { slug: 'sport', title: 'Sport', description: '', coverUrl: null },
    { basePath: '/fotografia' },
  )
  expect(card.getAttribute('href')).toBe('/fotografia/sport')
})
```

- [ ] **Step 2: Implementare `basePath`**

Modificare la firma:

```js
export function createAlbumCard({ slug, title, description, coverUrl }, { basePath = '' } = {}) {
```

e costruire l'URL con:

```js
a.href = `${basePath}/${slug}`.replace(/\/+/g, '/')
```

- [ ] **Step 3: Creare la pagina Fotografia riusando la logica corrente**

Duplicare la struttura semantica corrente di `index.html` in `fotografia.html`, ma con titolo e description specifici. In `src/pages/fotografia.js` riusare `fetchSite`, `fetchAlbums`, `fetchConfig`, `resolveSiteContent`, `albumsToCards`, `renderHero`, `renderFooter` e `renderNav`; passare `{ basePath: '/fotografia' }` a ogni AlbumCard.

Non duplicare componenti galleria, provider o logica di fallback.

- [ ] **Step 4: Correggere l'estrazione slug nella pagina album**

In `src/pages/album.js` sostituire:

```js
const slug = window.location.pathname.replace(/^\/|\/$/g, '')
```

con:

```js
const slug = window.location.pathname.split('/').filter(Boolean).at(-1) ?? ''
```

Cambiare il link di ritorno per gli album inesistenti da `/` a `/fotografia`.

- [ ] **Step 5: Registrare l'entry, testare e committare**

```bash
npm test -- src/components/AlbumCard.test.js src/pages/album-logic.test.js src/pages/home-logic.test.js
npm run build
git add fotografia.html src/pages/fotografia.js src/pages/album.js src/components/AlbumCard.js src/components/AlbumCard.test.js vite.config.js
git commit -m "feat: separa il portfolio fotografico dalla home"
```

---

### Task 7: Home product-led, pagina About e navigazione definitiva

**Files:**
- Create: `about.html`
- Create: `src/pages/about.js`
- Create: `src/components/PersonalHero.js`
- Create: `src/components/PersonalHero.test.js`
- Create: `src/styles/personal-home.css`
- Create: `src/styles/about.css`
- Modify: `index.html`
- Modify: `src/pages/index.js`
- Modify: `config/navigation.config.js`
- Modify: `vite.config.js`

**Interfaces:**
- Consumes: indice Software statico e album R2 in due richieste indipendenti.
- Produces: home ordinata Hero → Software → Fotografia → profilo/contatti.

- [ ] **Step 1: Scrivere il test del nuovo Hero**

Creare `src/components/PersonalHero.test.js`:

```js
import { expect, it } from 'vitest'
import { renderPersonalHero } from './PersonalHero.js'

it('rende proposta professionale e CTA verso Software', () => {
  const container = document.createElement('div')
  renderPersonalHero(container, {
    eyebrow: 'Software developer & photographer',
    title: 'Prodotti digitali costruiti per essere usati.',
    body: 'Progetto e sviluppo prodotti software; fotografo persone, luoghi e sport.',
  })
  expect(container.querySelector('h1').textContent).toContain('Prodotti digitali')
  expect(container.querySelector('a').getAttribute('href')).toBe('/software')
})
```

- [ ] **Step 2: Implementare Hero e struttura home**

`PersonalHero.js` deve creare i nodi con `textContent`, una CTA primaria `Scopri i progetti` verso `/software` e una secondaria `Guarda le fotografie` verso `/fotografia`.

Ristrutturare `index.html` con gli ID:

```text
#site-nav
#personal-hero
#featured-projects
#featured-projects-status
#featured-albums
#featured-albums-status
#home-about
#site-footer
```

- [ ] **Step 3: Rendere Software e Fotografia indipendenti nella home**

In `src/pages/index.js` avviare in parallelo:

```js
const projectPromise = fetchProjectIndex()
const photographyPromise = Promise.all([fetchSite(), fetchAlbums(), fetchConfig()])
```

Gestire le due risposte separatamente:

- errore Software: messaggio nella sola sezione Software;
- errore R2: messaggio nella sola sezione Fotografia;
- progetti: `selectFeaturedProjects(...).slice(0, 4)`;
- album: `albumsToCards(...).slice(0, 3)` con `basePath: '/fotografia'`.

La pagina deve continuare a mostrare hero, About e Contatti anche se entrambe le fonti falliscono.

- [ ] **Step 4: Creare About e navigazione finale**

`about.html` e `src/pages/about.js` devono presentare in linguaggio diretto:

```text
Sono Davide Tarsi, software developer con background Flutter/mobile e laurea in Informatica. Costruisco prodotti personali completi, dall'architettura alla distribuzione. Parallelamente lavoro con la fotografia, soprattutto hospitality, sport e viaggio.
```

Configurare `config/navigation.config.js` esattamente nell'ordine:

```js
export const navigationItems = [
  { label: 'Software', href: '/software' },
  { label: 'Fotografia', href: '/fotografia' },
  { label: 'About', href: '/about' },
  { label: 'Contatti', href: '/contatti' },
]
```

- [ ] **Step 5: Registrare About, testare e committare**

```bash
npm test -- src/components/PersonalHero.test.js src/components/ProjectCard.test.js src/components/AlbumCard.test.js
npm run build
git add about.html src/pages/about.js src/components/PersonalHero.js src/components/PersonalHero.test.js src/styles/personal-home.css src/styles/about.css index.html src/pages/index.js config/navigation.config.js vite.config.js
git commit -m "feat: costruisce la home product-led e la pagina about"
```

---

### Task 8: Primo case study reale e copertura GitHub opzionale

**Files:**
- Create: `content/projects/photo-portfolio-template.md`
- Create: `public/projects/photo-portfolio-template/cover.webp`
- Test: `scripts/project-content.test.js`

**Interfaces:**
- Consumes: schema e compilatore dei Task 2–3.
- Produces: primo progetto pubblicato con repository GitHub pubblico opzionale e case study interno.

- [ ] **Step 1: Creare una cover reale**

Avviare il template in locale o usare la demo pubblica verificata, catturare home e dashboard in un'unica composizione 1600×900, esportare WebP sRGB qualità 85 in:

```text
public/projects/photo-portfolio-template/cover.webp
```

La cover non deve contenere mockup inventati, badge di stelle/fork o UI GitHub.

- [ ] **Step 2: Scrivere il case study esplicito**

Creare `content/projects/photo-portfolio-template.md`:

```markdown
---
title: PhotoPortfolio Template
slug: photo-portfolio-template
summary: Un template self-hosted per portfolio fotografici, con gestione degli album da dashboard e storage Cloudflare R2.
status: active
featured: true
order: 10
cover: /projects/photo-portfolio-template/cover.webp
technologies:
  - Cloudflare Workers
  - Cloudflare R2
  - JavaScript
  - Vite
role: Ideazione, architettura e sviluppo
repositoryUrl: https://github.com/davidetarsi/PhotoPortfolioTemplate
---

## Problema

I portfolio fotografici semplici costringono spesso a scegliere tra un servizio in abbonamento e un sito statico che richiede un nuovo deploy per ogni aggiornamento.

## Soluzione

PhotoPortfolio Template mantiene il frontend statico e sposta foto e metadati su Cloudflare R2. Una dashboard protetta permette di creare album, caricare e riordinare fotografie, scegliere le copertine e aggiornare il profilo senza modificare il codice.

## Scelte tecniche

- componenti in JavaScript vanilla e build multipagina con Vite;
- Worker Cloudflare per routing, API e controllo degli input;
- R2 come storage self-hosted;
- validazione condivisa fra browser e Worker;
- test Vitest sui componenti, sulle trasformazioni pure e sulle route.

## Risultato

Il progetto è distribuibile come template e rimane personalizzabile da sviluppatori che vogliono mantenere controllo su codice, infrastruttura e contenuti.
```

- [ ] **Step 3: Verificare che l'assenza di repository resti valida**

Mantenere nel test fixture di `scripts/project-content.test.js` il progetto privo di `repositoryUrl`. Eseguire:

```bash
npm test -- scripts/project-content.test.js src/projects/project-schema.test.js
npm run content:build
node -e "const p=require('./public/generated/projects-index.json'); if(p[0].repositoryUrl?.includes('github.com')!==true) process.exit(1)"
```

Expected: il progetto reale ha il link pubblico; la fixture closed-source passa ugualmente.

- [ ] **Step 4: Commit**

```bash
git add content/projects/photo-portfolio-template.md public/projects/photo-portfolio-template/cover.webp scripts/project-content.test.js
git commit -m "content: pubblica il case study del template fotografico"
```

---

### Task 9: Responsive, accessibilità, documentazione e verifica end-to-end

**Files:**
- Modify: `src/styles/nav.css`
- Modify: `src/styles/project-card.css`
- Modify: `src/styles/software.css`
- Modify: `src/styles/project.css`
- Modify: `src/styles/personal-home.css`
- Modify: `src/styles/about.css`
- Modify: `README.md`
- Modify: `CUSTOMIZING.md`

**Interfaces:**
- Consumes: tutte le pagine e i contratti dei task precedenti.
- Produces: MVP verificato e documentato, pronto per review visuale e staging.

- [ ] **Step 1: Applicare i vincoli visuali e di accessibilità**

Verificare e correggere nei CSS:

```css
:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Le CTA devono avere area cliccabile minima 44×44 CSS px. Il menu deve andare a capo senza overflow fra 320 e 430 px. Le card devono mantenere rapporto cover stabile tramite `aspect-ratio` per evitare layout shift.

- [ ] **Step 2: Documentare authoring e build**

In `CUSTOMIZING.md` aggiungere:

```markdown
## Software projects

Create `content/projects/<slug>.md`. The filename and front-matter `slug` must match. `repositoryUrl` is optional and accepts only public `https://github.com/<owner>/<repo>` links; the build never connects to GitHub. Run `npm run content:build` to validate and preview content changes.
```

In `README.md` documentare `npm run content:build`, le route `/software`, `/fotografia`, `/about` e la separazione fra Markdown software e dati R2 fotografici.

- [ ] **Step 3: Eseguire tutti i gate automatici**

```bash
npm test
npm run content:build
npm run build
git diff --check
```

Expected: tutti PASS; `dist/` contiene `software.html`, `project.html`, `fotografia.html`, `about.html`, `404.html` e `generated/projects/photo-portfolio-template.json`.

- [ ] **Step 4: Eseguire smoke test con Worker locale**

Avviare:

```bash
npx wrangler dev
```

Verificare con browser e richieste HTTP:

```text
/                                      200, Software prima di Fotografia
/software                              200, indice
/software/photo-portfolio-template     200, meta specifici e case study
/software/non-esiste                   404
/fotografia                            200, album
/fotografia/<slug-reale>               200, griglia e lightbox
/<slug-reale>                          301 verso /fotografia/<slug-reale>
/about                                 200
/contatti                              200
/admin                                 comportamento Access invariato
```

Controllare a 320, 768 e 1440 px; tastiera completa; Network offline dopo il primo caricamento della pagina Software; errore R2 simulato senza perdita della sezione Software.

- [ ] **Step 5: Verificare assenza di integrazioni GitHub non autorizzate**

```bash
rg -n "api\.github\.com|GITHUB_TOKEN|ghp_|github_pat_|octokit" . --glob '!node_modules/**' --glob '!docs/**'
```

Expected: nessun risultato. `github.com` può comparire soltanto come URL pubblico nei contenuti e nella configurazione del remote Git.

- [ ] **Step 6: Commit finale della documentazione e degli aggiustamenti QA**

```bash
git add src/styles/nav.css src/styles/project-card.css src/styles/software.css src/styles/project.css src/styles/personal-home.css src/styles/about.css README.md CUSTOMIZING.md
git commit -m "docs: completa authoring e QA del portfolio personale"
```

---

## Completion gate

Prima di integrare il branch in `staging`:

```bash
npm test
npm run build
git diff staging...HEAD --check
git log --oneline staging..HEAD
git status --short
```

Accettare l'MVP solo se:

- il worktree è pulito;
- home, Software, Fotografia, About e Contatti rispettano la gerarchia approvata;
- un progetto senza repository passa schema, build e rendering;
- il repository pubblico è solo un link secondario;
- nessuna rete GitHub viene contattata;
- `/software/non-esiste` restituisce HTTP 404;
- le route album legacy reindirizzano senza rompere la galleria;
- dashboard, contatti e dati R2 superano i test esistenti;
- il merge upstream è documentato e ripetibile;
- staging viene verificato prima di qualunque promozione in produzione.
