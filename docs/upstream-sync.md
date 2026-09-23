# Strategia di sincronizzazione tra template fotografico e sito personale

**Data:** 2026-09-23
**Stato:** prima sincronizzazione completata
**Upstream:** `PhotoPortfolioTemplate`
**Downstream:** `PhotoPortfolio`

**Evidenza:** il primo sync ha importato `b171728198973c0c0678cafc51684ea747c7b2ce`,
ha prodotto il merge downstream `79271528af6ed4aac8f264b44e147b282a51ba2f` e ha
portato lo stesso stato verificato su staging e produzione al commit
`439725711ba25f6ab4afd0abd9a5e8324c326535`. I dettagli e le verifiche sono nel
[registro della sincronizzazione](upstream-sync-log.md).

## 1. Obiettivo

Mantenere `PhotoPortfolioTemplate` come prodotto fotografico generico e riutilizzabile, permettendo al sito personale `PhotoPortfolio` di evolvere in una direzione più ampia, con Software come area professionale primaria e Fotografia come area autonoma completa.

Gli sviluppi futuri del template devono poter essere integrati nel sito personale senza sovrascrivere configurazioni, contenuti o scelte editoriali specifiche e senza obbligare i due repository a evolvere nello stesso modo.

## 2. Decisione

I due repository restano separati e conservano una relazione **upstream/downstream**:

- `PhotoPortfolioTemplate` è l'upstream canonico;
- `PhotoPortfolio` è il downstream personale;
- il sito personale configura il repository del template come remote Git `upstream`;
- gli aggiornamenti vengono importati con merge espliciti e revisionati;
- non sono previsti merge automatici o sincronizzazioni schedulate;
- il sito personale può divergere dal template dove la sua identità o la sezione Software lo richiedono.

```text
PhotoPortfolioTemplate/main
          │
          │ merge periodico controllato
          ▼
PhotoPortfolio/chore/sync-template-<versione-o-data>
          │
          │ test, build e revisione
          ▼
PhotoPortfolio/staging
          │
          │ verifica sull'ambiente Cloudflare di staging
          ▼
PhotoPortfolio/main
```

Il template non viene importato come dipendenza runtime. Il sito personale continua a possedere il proprio codice e riceve gli aggiornamenti attraverso la cronologia Git condivisa.

## 3. Perché questa soluzione

Questa strategia mantiene semplice lo stack attuale e offre contemporaneamente:

- aggiornamenti selettivi e reversibili;
- cronologia leggibile di ogni sincronizzazione;
- libertà di divergere nella home e nell'esperienza Software;
- possibilità di correggere una sola volta i problemi fotografici generici;
- staging obbligatorio prima di portare un aggiornamento in produzione;
- nessuna infrastruttura aggiuntiva per pacchetti condivisi o monorepo.

Non vengono adottati, per ora:

- un pacchetto npm condiviso, prematuro finché esiste un solo downstream principale;
- un monorepo, che ridurrebbe l'indipendenza del template pubblico;
- Git submodule o subtree, che aggiungerebbero complessità senza eliminare i conflitti nei punti di estensione;
- merge automatici, perché modifiche a routing, configurazione o infrastruttura richiedono revisione umana anche quando i test passano.

## 4. Proprietà delle responsabilità

Il modo principale per ridurre i conflitti è evitare che template e sito personale modifichino continuamente gli stessi file per motivi diversi.

| Area | Proprietario | Contenuto |
|---|---|---|
| Sottosistema fotografico | Template | Album, galleria, lightbox, provider R2, manifest, upload, dashboard e API fotografiche |
| Infrastruttura condivisa | Template | Build Vite, primitive del Worker, validazioni generiche, test e documentazione di installazione |
| Shell condivisa | Template, tramite extension point | Navigazione, footer, token visivi, registro delle pagine e slug riservati |
| Identità personale | Sito personale | Testi, gerarchia editoriale, home professionale, About e adattamenti visivi |
| Sezione Software | Sito personale | Indice progetti, case study, contenuti Markdown, asset, componenti e routing Software |
| Configurazione di deploy | Sito personale | Nomi Worker, binding R2, domini, Access, URL pubblici e segreti per ambiente |

### 4.1 Punti di conflitto da stabilizzare

I file che, nello stato attuale, hanno maggiore probabilità di essere modificati in entrambi i repository sono:

- `src/worker.js`;
- `src/components/Nav.js`;
- `src/pages/index.js`;
- `vite.config.js`;
- `wrangler.json`.

Prima dell'integrazione Software, il template deve rendere configurabili almeno:

- voci e ordine della navigazione;
- registro delle pagine statiche;
- namespace e slug riservati;
- dati personali della shell condivisa.

La home personale è invece autorizzata a divergere. Un futuro aggiornamento della home fotografica del template non deve essere importato automaticamente se non è coerente con la home professionale del sito personale.

## 5. Regola per decidere dove sviluppare una modifica

Ogni nuova modifica deve essere classificata prima di essere implementata.

1. Se è utile a qualunque fotografo che usa il template, nasce in `PhotoPortfolioTemplate`.
2. Se riguarda Software, i progetti personali o la gerarchia professionale di Davide, nasce soltanto in `PhotoPortfolio`.
3. Se è un bug del sottosistema fotografico scoperto dal sito personale, viene corretto prima nel template e poi importato nel sito personale.
4. Se una personalizzazione può essere espressa come configurazione generica, si aggiunge un extension point al template.
5. Se la personalizzazione è specifica del sito personale, non entra nel template.

Questo evita correzioni duplicate e implementazioni diverse dello stesso comportamento.

## 6. Versionamento del template

Quando il template raggiungerà una prima versione stabile, gli aggiornamenti destinati ai downstream dovrebbero essere identificati da tag o release, per esempio:

```text
v0.1.0
v0.2.0
v0.2.1
```

Ogni release dovrebbe indicare almeno:

- nuove funzionalità;
- correzioni;
- breaking change;
- nuove chiavi di configurazione;
- migrazioni necessarie;
- modifiche a Cloudflare, R2 o Access;
- eventuali problemi di sicurezza.

Il merge nel sito personale deve citare la versione o, in assenza di tag, la data e il commit importato:

```text
merge: aggiorna PhotoPortfolioTemplate a v0.2.1
```

Non è necessario importare ogni commit appena viene pubblicato. Il sito personale può restare su una versione verificata finché non esiste un motivo concreto per aggiornare.

## 7. Prerequisiti di una sincronizzazione

Prima di iniziare un aggiornamento:

- il branch `main` del template deve essere pulito e pubblicato su `origin`;
- il template deve superare test e build;
- il branch `staging` del sito personale deve avere una baseline pulita e verificata;
- modifiche locali non correlate devono essere escluse dal branch di sincronizzazione;
- la configurazione personale di Cloudflare, R2 e Access deve essere identificata e preservata;
- devono essere lette le note della release o almeno i commit in arrivo.

Se uno di questi prerequisiti manca, la sincronizzazione viene rinviata. Non si risolvono contemporaneamente problemi preesistenti e conflitti introdotti dall'upstream.

## 8. Configurazione iniziale del remote

Quando il template sarà pronto per la prima integrazione, nel repository personale verrà configurato una sola volta:

```bash
git remote add upstream https://github.com/davidetarsi/PhotoPortfolioTemplate.git
git fetch upstream --tags
```

Prima del merge va verificato che `upstream/main` punti davvero alla versione pubblicata e validata del template.

## 9. Procedura di aggiornamento

### 9.1 Preparazione

Partire da `staging` aggiornato e creare un branch dedicato:

```bash
git switch staging
git switch -c chore/sync-template-<versione-o-data>
git fetch upstream --tags
git log --oneline HEAD..upstream/main
```

Il log deve essere letto prima del merge, prestando particolare attenzione a:

- routing;
- Worker e API;
- configurazione;
- dipendenze;
- migrazioni dei contenuti;
- sicurezza e autenticazione;
- cambiamenti di URL pubblici.

### 9.2 Merge

```bash
git merge --no-ff upstream/main
```

I conflitti vanno risolti manualmente. Non si deve applicare in modo indiscriminato una strategia “ours” o “theirs”.

Regole principali:

- mantenere valori, binding, bucket, domini e identificatori del sito personale;
- acquisire eventuali nuove chiavi strutturali richieste dal template;
- mantenere contenuti e routing Software del sito personale;
- integrare le modifiche fotografiche generiche compatibili;
- non reintrodurre una home esclusivamente fotografica sopra la home professionale;
- non eliminare test o aggiornare snapshot soltanto per far passare il merge.

### 9.3 Verifica locale

Come minimo:

```bash
npm test
ALLOW_PLACEHOLDER_CSP=1 npm run build
```

La verifica deve includere anche:

- navigazione e URL puliti;
- home personale;
- indice e dettaglio Software;
- indice fotografico, album, galleria e lightbox;
- dashboard amministrativa;
- modulo contatti;
- risposte 404 reali;
- CSP generata;
- configurazione R2 e Access;
- comportamento mobile e accessibilità di base.

### 9.4 Staging e produzione

Il branch di sincronizzazione viene integrato prima in `staging`. L'ambiente di staging deve essere verificato manualmente con dati e binding separati dalla produzione.

Solo dopo questa verifica lo stesso stato Git può essere portato in `main`. Non si deve ripetere una seconda risoluzione manuale dei conflitti direttamente sul branch di produzione.

## 10. Errori e recupero

Finché il branch di sincronizzazione non è stato integrato, un tentativo fallito si abbandona senza modificare `staging` o `main` e si ricrea il branch dalla baseline pulita.

Se un problema viene scoperto dopo l'integrazione:

- non si riscrive la cronologia condivisa;
- si prepara un revert o una correzione dedicata;
- si ripete la verifica su staging;
- si documenta il motivo del rollback o della patch.

La riuscita del merge e l'assenza di conflitti non dimostrano che l'aggiornamento sia sicuro. Test, build e verifica sullo staging restano obbligatori.

## 11. Gate prima dell'integrazione Software

Il lavoro sul sito personale Software può iniziare quando:

1. la prima versione utilizzabile di `PhotoPortfolioTemplate` è conclusa;
2. il suo `main` è pulito, pubblicato e possibilmente marcato con una release;
3. navigazione, rotte statiche e slug riservati sono configurabili;
4. il sito personale ha configurato il remote `upstream`;
5. è stata eseguita almeno una sincronizzazione reale in un branch dedicato;
6. test, build e staging fotografico restano funzionanti dopo il merge;
7. la baseline risultante viene usata per iniziare la sezione Software.

Solo dopo questo gate si implementano la nuova home, `/software`, `/software/<slug>`, `/fotografia`, About e i contenuti dei progetti.

## 12. Quando rivalutare questa strategia

L'estrazione di pacchetti condivisi o il passaggio a un monorepo vanno rivalutati soltanto se si verifica almeno una delle seguenti condizioni:

- esistono più siti downstream mantenuti attivamente;
- gli stessi componenti vengono corretti più volte in repository diversi;
- ogni aggiornamento produce numerosi conflitti negli stessi file;
- serve rilasciare componenti condivisi con versioni indipendenti;
- il template e il sito personale non condividono più una cronologia Git gestibile.

Fino ad allora, il merge upstream esplicito è la soluzione più semplice e controllabile.

## 13. Stato osservato al 2026-09-22

Al momento della stesura:

- i due repository condividono il commit iniziale e possono quindi essere uniti tramite merge Git normale;
- `PhotoPortfolio` ha soltanto il remote `origin`; `upstream` non è ancora configurato;
- `PhotoPortfolio/staging` contiene commit locali successivi a `origin/staging`;
- `PhotoPortfolioTemplate/main` locale contiene commit successivi a `origin/main`;
- entrambi i worktree contengono modifiche o file locali non ancora tracciati.

Questo è uno snapshot, non una condizione permanente. Prima della prima sincronizzazione lo stato deve essere ricontrollato dal vivo.

## 14. Documenti collegati

- `docs/superpowers/specs/2026-09-21-software-photography-portfolio-architecture-design.md`
- `docs/superpowers/plans/2026-09-21-template-extension-points.md`
- `docs/superpowers/plans/2026-09-21-personal-software-portfolio.md`
- `PhotoPortfolioTemplate/docs/upgrading.md`

Questo documento registra la strategia. Non autorizza ancora l'implementazione della sezione Software né una sincronizzazione fra i repository: entrambe inizieranno soltanto dopo il completamento e la verifica della prima versione del template fotografico.
