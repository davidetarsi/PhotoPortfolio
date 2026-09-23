# PhotoPortfolioTemplate Extension Points Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere navigazione, pagine statiche e slug riservati configurabili nel template fotografico senza introdurre alcuna conoscenza della futura sezione Software personale.

**Architecture:** Una configurazione dati descrive le voci di navigazione e una seconda descrive il mapping fra URL pubblici e asset HTML. Funzioni pure condivise validano e risolvono queste strutture; Worker, Nav e validazione album consumano la stessa fonte, eliminando gli elenchi hardcoded duplicati.

**Tech Stack:** JavaScript ESM, Vite 8, Vitest 4, jsdom, Cloudflare Workers.

**Spec:** `/Users/davide/Desktop/Personal/Progetti/PhotoPortfolio/docs/superpowers/specs/2026-09-21-software-photography-portfolio-architecture-design.md`

## Global Constraints

- Eseguire questo piano nel repository `PhotoPortfolioTemplate`, partendo da un worktree pulito basato su `origin/main`, non dal worktree locale `feature/f0-cold-install-audit` attualmente divergente.
- Node.js minimo: 20, come dichiarato in `package.json`.
- Il template non deve contenere le etichette `Software`, `Davide`, PackLog o altri contenuti personali.
- Le rotte pubbliche correnti `/`, `/contatti`, `/admin` e `/<album-slug>` devono continuare a funzionare.
- Nessuna nuova dipendenza runtime.
- La configurazione invalida deve fallire durante test/build o all'avvio del Worker, non degradare silenziosamente.
- Applicare TDD e creare un commit indipendente per ogni task.

## File map

- Create: `config/navigation.config.js` — voci ordinate della navigazione pubblica.
- Create: `config/routes.config.js` — mapping dichiarativo delle pagine statiche.
- Create: `src/shared/site-structure.js` — validazione e risoluzione pura di navigazione, rotte e slug riservati.
- Create: `src/shared/site-structure.test.js` — contratto delle configurazioni.
- Modify: `src/components/Nav.js` — rendering di una lista, senza link hardcoded.
- Modify: `src/components/Nav.test.js` — ordine, link interni/esterni e configurazione vuota.
- Modify: `src/pages/index.js`, `src/pages/album.js`, `src/pages/contatti.js` — passaggio della configurazione Nav.
- Modify: `src/worker.js` — risoluzione delle pagine statiche dal registro.
- Modify: `src/shared/content-rules.js` — slug riservati derivati dal registro.
- Modify: `src/shared/content-rules.test.js` — regressione sulle rotte riservate.
- Modify: `CUSTOMIZING.md`, `README.md`, `README.it.md` — API di personalizzazione e aggiornamento downstream.

## Stima

4–6 ore, incluse suite completa, build e revisione. La stima assume `origin/main` nello stato osservato al 2026-09-21 e nessun conflitto introdotto da commit successivi.

---

### Task 1: Registro delle pagine statiche e slug riservati derivati

**Files:**
- Create: `config/routes.config.js`
- Create: `src/shared/site-structure.js`
- Create: `src/shared/site-structure.test.js`
- Modify: `src/worker.js`
- Modify: `src/shared/content-rules.js`
- Modify: `src/shared/content-rules.test.js`
- Test: `src/shared/site-structure.test.js`

**Interfaces:**
- Consumes: array `staticPages: Array<{path: string, asset: string}>`.
- Produces: `validateStaticPages(pages)`, `resolveStaticAsset(pathname, pages)`, `buildReservedSlugs(pages, technicalSlugs)` e `normalizePathname(pathname)`.
- Produces per i task successivi: `staticPages` come unica fonte delle pagine statiche e `RESERVED_SLUGS` derivato.

- [ ] **Step 1: Creare il test fallente del registro**

Creare `src/shared/site-structure.test.js`:

```js
import { describe, expect, it } from 'vitest'
import {
  buildReservedSlugs,
  normalizePathname,
  resolveStaticAsset,
  validateStaticPages,
} from './site-structure.js'

const pages = [
  { path: '/contatti', asset: '/contatti.html' },
  { path: '/admin', asset: '/admin.html' },
]

describe('site structure', () => {
  it('normalizza slash finale e root', () => {
    expect(normalizePathname('/contatti/')).toBe('/contatti')
    expect(normalizePathname('/')).toBe('/')
  })

  it('risolve un asset registrato e restituisce null per una rotta ignota', () => {
    expect(resolveStaticAsset('/contatti/', pages)).toBe('/contatti.html')
    expect(resolveStaticAsset('/non-esiste', pages)).toBeNull()
  })

  it('deriva gli slug riservati dalle rotte e dai namespace tecnici', () => {
    expect(buildReservedSlugs(pages, ['api', 'assets']))
      .toEqual(['admin', 'api', 'assets', 'contatti'])
  })

  it('rifiuta path, asset e duplicati invalidi', () => {
    expect(() => validateStaticPages([{ path: 'contatti', asset: '/contatti.html' }]))
      .toThrow('path')
    expect(() => validateStaticPages([{ path: '/x', asset: 'x.html' }]))
      .toThrow('asset')
    expect(() => validateStaticPages([
      { path: '/x', asset: '/x.html' },
      { path: '/x/', asset: '/x-2.html' },
    ])).toThrow('duplicata')
  })
})
```

- [ ] **Step 2: Eseguire il test e verificare il fallimento**

Run:

```bash
npm test -- src/shared/site-structure.test.js
```

Expected: FAIL perché `site-structure.js` non esiste.

- [ ] **Step 3: Implementare configurazione e funzioni pure minime**

Creare `config/routes.config.js`:

```js
export const staticPages = [
  { path: '/contatti', asset: '/contatti.html' },
  { path: '/admin', asset: '/admin.html' },
]
```

Creare `src/shared/site-structure.js`:

```js
const PATH_RE = /^\/[a-z0-9][a-z0-9/-]*$/
const ASSET_RE = /^\/[a-z0-9][a-z0-9/-]*\.html$/
export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/

export function normalizePathname(pathname) {
  return pathname === '/' ? '/' : String(pathname).replace(/\/+$/, '') || '/'
}

export function validateStaticPages(pages) {
  if (!Array.isArray(pages)) throw new Error('[routes] staticPages deve essere un array')
  const seen = new Set()
  for (const page of pages) {
    if (!page || typeof page !== 'object') throw new Error('[routes] pagina non valida')
    const path = normalizePathname(page.path)
    if (!PATH_RE.test(path)) throw new Error(`[routes] path non valido: "${page.path}"`)
    if (!ASSET_RE.test(page.asset)) throw new Error(`[routes] asset non valido: "${page.asset}"`)
    if (seen.has(path)) throw new Error(`[routes] rotta duplicata: "${path}"`)
    seen.add(path)
  }
  return pages
}

export function resolveStaticAsset(pathname, pages) {
  validateStaticPages(pages)
  const normalized = normalizePathname(pathname)
  return pages.find(page => normalizePathname(page.path) === normalized)?.asset ?? null
}

export function buildReservedSlugs(pages, technicalSlugs = []) {
  validateStaticPages(pages)
  for (const slug of technicalSlugs) {
    if (!SLUG_RE.test(slug)) throw new Error(`[routes] slug tecnico non valido: "${slug}"`)
  }
  const routeSlugs = pages.map(page => normalizePathname(page.path).split('/').filter(Boolean)[0])
  return [...new Set([...technicalSlugs, ...routeSlugs])].sort()
}
```

- [ ] **Step 4: Usare il registro nel Worker**

In `src/worker.js`:

```js
import { staticPages } from '../config/routes.config.js'
import { normalizePathname, resolveStaticAsset } from './shared/site-structure.js'
```

Eliminare `STATIC_PAGES`, sostituire la normalizzazione locale con:

```js
const pathname = normalizePathname(url.pathname)
```

e sostituire il blocco delle pagine statiche con:

```js
const staticAsset = resolveStaticAsset(pathname, staticPages)
if (staticAsset) {
  return env.ASSETS.fetch(new URL(staticAsset, url))
}
```

- [ ] **Step 5: Derivare `RESERVED_SLUGS` dalla stessa configurazione**

All'inizio di `src/shared/content-rules.js` importare:

```js
import { staticPages } from '../../config/routes.config.js'
import { buildReservedSlugs, SLUG_RE } from './site-structure.js'
```

Rimuovere la definizione locale di `SLUG_RE`, riesportarla per mantenere compatibili i consumer esistenti e sostituire la lista hardcoded:

```js
export { SLUG_RE }
export const RESERVED_SLUGS = buildReservedSlugs(staticPages, ['api', 'assets'])
```

In `src/shared/content-rules.test.js` mantenere il test sui quattro slug correnti e aggiungere:

```js
it('deriva gli slug delle pagine configurate', () => {
  expect(RESERVED_SLUGS).toEqual(['admin', 'api', 'assets', 'contatti'])
})
```

- [ ] **Step 6: Eseguire i test mirati e la suite Worker**

Run:

```bash
npm test -- src/shared/site-structure.test.js src/shared/content-rules.test.js src/worker/admin-routes.test.js
```

Expected: tutti PASS; `/contatti` e `/admin` risolti, `contatti` e `admin` ancora rifiutati come slug album.

- [ ] **Step 7: Commit**

```bash
git add config/routes.config.js src/shared/site-structure.js src/shared/site-structure.test.js src/shared/content-rules.js src/shared/content-rules.test.js src/worker.js
git commit -m "refactor: centralizza pagine statiche e slug riservati"
```

---

### Task 2: Navigazione configurabile

**Files:**
- Create: `config/navigation.config.js`
- Modify: `src/shared/site-structure.js`
- Modify: `src/shared/site-structure.test.js`
- Modify: `src/components/Nav.js`
- Modify: `src/components/Nav.test.js`
- Modify: `src/pages/index.js`
- Modify: `src/pages/album.js`
- Modify: `src/pages/contatti.js`

**Interfaces:**
- Consumes: `navigationItems: Array<{label: string, href: string, external?: boolean}>`.
- Produces: `validateNavigation(items)` e `renderNav(container, siteConfig, navigationItems)`.
- Dipende da Task 1: `normalizePathname` resta separato e non viene duplicato.

- [ ] **Step 1: Scrivere i test fallenti della configurazione e del rendering**

Aggiungere a `src/shared/site-structure.test.js`:

```js
import { validateNavigation } from './site-structure.js'

it('accetta link interni ed esterni espliciti', () => {
  expect(validateNavigation([
    { label: 'Contatti', href: '/contatti' },
    { label: 'GitHub', href: 'https://github.com/example', external: true },
  ])).toHaveLength(2)
})

it('rifiuta label vuota, href relativo e duplicati', () => {
  expect(() => validateNavigation([{ label: '', href: '/x' }])).toThrow('label')
  expect(() => validateNavigation([{ label: 'X', href: 'x' }])).toThrow('href')
  expect(() => validateNavigation([
    { label: 'X', href: '/x' },
    { label: 'X2', href: '/x' },
  ])).toThrow('duplicato')
})
```

Sostituire i test di `src/components/Nav.test.js` con il nuovo contratto:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { renderNav } from './Nav.js'

describe('renderNav', () => {
  let container
  beforeEach(() => { container = document.createElement('div') })

  it('rende brand e link nell ordine configurato', () => {
    renderNav(container, { name: 'Fotografo Test' }, [
      { label: 'Portfolio', href: '/' },
      { label: 'Contatti', href: '/contatti' },
    ])
    expect(container.querySelector('.site-nav__brand').textContent).toBe('Fotografo Test')
    expect([...container.querySelectorAll('.site-nav__links a')].map(a => [a.textContent, a.getAttribute('href')]))
      .toEqual([['Portfolio', '/'], ['Contatti', '/contatti']])
  })

  it('marca i link esterni senza dedurli dall URL', () => {
    renderNav(container, { name: 'F' }, [
      { label: 'GitHub', href: 'https://github.com/example', external: true },
    ])
    const link = container.querySelector('.site-nav__links a')
    expect(link.target).toBe('_blank')
    expect(link.rel).toContain('noopener')
  })

  it('accetta una navigazione vuota', () => {
    renderNav(container, { name: 'F' }, [])
    expect(container.querySelectorAll('.site-nav__links a')).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Eseguire i test e verificare il fallimento**

```bash
npm test -- src/shared/site-structure.test.js src/components/Nav.test.js
```

Expected: FAIL perché `validateNavigation` non esiste e `renderNav` usa ancora `texts.nav`.

- [ ] **Step 3: Implementare la validazione**

Aggiungere a `src/shared/site-structure.js`:

```js
export function validateNavigation(items) {
  if (!Array.isArray(items)) throw new Error('[navigation] deve essere un array')
  const seen = new Set()
  for (const item of items) {
    if (!item || typeof item !== 'object') throw new Error('[navigation] voce non valida')
    if (typeof item.label !== 'string' || !item.label.trim()) throw new Error('[navigation] label obbligatoria')
    const isInternal = typeof item.href === 'string' && item.href.startsWith('/')
    let isExternal = false
    try { isExternal = new URL(item.href).protocol === 'https:' } catch { isExternal = false }
    if ((!item.external && !isInternal) || (item.external && !isExternal)) {
      throw new Error(`[navigation] href non valido: "${item.href}"`)
    }
    if (seen.has(item.href)) throw new Error(`[navigation] href duplicato: "${item.href}"`)
    seen.add(item.href)
  }
  return items
}
```

- [ ] **Step 4: Creare la configurazione predefinita e rendere il Nav data-driven**

Creare `config/navigation.config.js`:

```js
export const navigationItems = [
  { label: 'Contatti', href: '/contatti' },
]
```

Sostituire `renderNav` in `src/components/Nav.js` con:

```js
import '../styles/nav.css'
import { validateNavigation } from '../shared/site-structure.js'

export function renderNav(container, siteConfig, navigationItems) {
  validateNavigation(navigationItems)
  container.innerHTML = `
    <nav class="site-nav">
      <a href="/" class="site-nav__brand"></a>
      <div class="site-nav__links"></div>
    </nav>
  `
  container.querySelector('.site-nav__brand').textContent = siteConfig.name
  const links = container.querySelector('.site-nav__links')
  for (const item of navigationItems) {
    const link = document.createElement('a')
    link.href = item.href
    link.textContent = item.label
    if (item.external) {
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    }
    links.appendChild(link)
  }
}
```

- [ ] **Step 5: Aggiornare i tre entry point pubblici**

In `src/pages/index.js`, `src/pages/album.js` e `src/pages/contatti.js` importare:

```js
import { navigationItems } from '../../config/navigation.config.js'
```

e sostituire ogni chiamata con:

```js
renderNav(document.getElementById('site-nav'), { name: site.name }, navigationItems)
```

Non modificare i testi della dashboard né rimuovere `texts.nav` in questo task: la pulizia del copy legacy è indipendente e non necessaria al contratto.

- [ ] **Step 6: Eseguire i test mirati e la build**

```bash
npm test -- src/shared/site-structure.test.js src/components/Nav.test.js src/pages/home-logic.test.js src/pages/album-logic.test.js
ALLOW_PLACEHOLDER_CSP=1 npm run build
```

Expected: test PASS e build completata con i quattro entry point correnti.

- [ ] **Step 7: Commit**

```bash
git add config/navigation.config.js src/shared/site-structure.js src/shared/site-structure.test.js src/components/Nav.js src/components/Nav.test.js src/pages/index.js src/pages/album.js src/pages/contatti.js
git commit -m "feat: rende configurabile la navigazione pubblica"
```

---

### Task 3: Documentazione del contratto downstream e verifica completa

**Files:**
- Modify: `CUSTOMIZING.md`
- Modify: `README.md`
- Modify: `README.it.md`

**Interfaces:**
- Consumes: `navigationItems`, `staticPages` e `RESERVED_SLUGS` dei task precedenti.
- Produces: istruzioni stabili per aggiungere una pagina e integrare aggiornamenti nel downstream.

- [ ] **Step 1: Documentare la procedura completa in `CUSTOMIZING.md`**

Aggiungere una sezione con questa matrice operativa:

```markdown
## Adding a public page

Adding a page requires four aligned artifacts:

1. Create `<page>.html` and its `src/pages/<page>.js` entry point.
2. Add the HTML file to `build.rollupOptions.input` in `vite.config.js`.
3. Register `{ path: '/<page>', asset: '/<page>.html' }` in `config/routes.config.js`.
4. Add a `config/navigation.config.js` item only when the page belongs in the main navigation.

Registered first path segments automatically become reserved album slugs. Do not add the same slug manually to `content-rules.js`.
```

Specificare inoltre che `external: true` è obbligatorio per link HTTPS che devono aprirsi in una nuova scheda.

- [ ] **Step 2: Aggiornare README inglese e italiano**

Nella mappa dei file aggiungere:

```text
config/navigation.config.js  public navigation items and order
config/routes.config.js      clean public paths mapped to built HTML assets
```

Nella sezione sugli aggiornamenti upstream chiarire che nuove pagine personali si dichiarano tramite i due file di configurazione, mentre la loro implementazione resta nel repository downstream.

- [ ] **Step 3: Eseguire la suite completa e la build**

```bash
npm test
ALLOW_PLACEHOLDER_CSP=1 npm run build
```

Expected: suite completa PASS; build completata; nessun warning relativo a rotte duplicate.

- [ ] **Step 4: Smoke test locale delle rotte**

Avviare:

```bash
npx wrangler dev
```

Verificare:

```text
/             -> 200 home
/contatti     -> 200 contatti
/admin        -> 200 dashboard o gate Access locale
/sport        -> album.html e gestione client dello slug
/api/data/x   -> resta nel namespace API, non cade nelle rotte album
```

Terminare il server dopo il controllo.

- [ ] **Step 5: Verificare il diff e committare**

```bash
git diff --check
git status --short
git add CUSTOMIZING.md README.md README.it.md
git commit -m "docs: documenta le estensioni del template"
```

Expected: il commit contiene solo documentazione; il branch complessivo contiene i tre commit del piano e nessun contenuto personale.

---

## Completion gate

Prima di aprire o unire la PR del template:

```bash
npm test
ALLOW_PLACEHOLDER_CSP=1 npm run build
git diff origin/main...HEAD --check
git log --oneline origin/main..HEAD
```

Accettare la tranche solo se:

- tutti i test e la build passano;
- `Nav.js`, `worker.js` e `content-rules.js` non contengono più liste duplicate delle pagine;
- l'esperienza fotografica corrente non cambia;
- il diff non contiene nomi o contenuti del sito personale;
- la documentazione spiega il contratto completo per una nuova pagina.
