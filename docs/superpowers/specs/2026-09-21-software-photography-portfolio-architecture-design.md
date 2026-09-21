# Portfolio personale Software + Fotografia — design architetturale

**Data:** 2026-09-21

**Stato:** approvato; piani di implementazione preparati il 2026-09-21

**Repository di riferimento:** `PhotoPortfolio` (sito personale)

**Upstream:** `PhotoPortfolioTemplate` (template fotografico riutilizzabile)

## 1. Obiettivo

Evolvere il sito personale da portfolio esclusivamente fotografico a sito professionale unico con due aree autonome:

- **Software**, primaria, orientata alla scoperta e all'uso di prodotti e progetti;
- **Fotografia**, secondaria ma completa, dedicata agli album e agli eventuali lavori fotografici.

Il sito deve dimostrare capacità e qualità attraverso progetti reali, senza dipendere dalla disponibilità di codice open source. Il template fotografico deve restare riutilizzabile da altri fotografi e non deve incorporare contenuti o scelte editoriali specifiche del sito personale.

## 2. Decisioni approvate

1. Il prodotto finale è un **sito personale più ampio** che ingloba il portfolio fotografico; non è una sezione software aggiunta dentro un prodotto concettualmente solo fotografico.
2. L'identità visiva resta unitaria, ma la gerarchia è asimmetrica: **Software è il percorso professionale principale**, Fotografia è un percorso secondario esplicito.
3. La home mostra subito prodotti e progetti. La fotografia rimane accessibile dalla navigazione principale e da un richiamo editoriale in home.
4. Ogni progetto software esiste soltanto se è presente un file Markdown esplicito in `content/projects/`. GitHub non decide quali progetti pubblicare.
5. Il template fotografico riceve solo estensioni generiche utili anche ai suoi utilizzatori: navigazione configurabile, registro delle pagine statiche e gestione centralizzata degli slug riservati.
6. Il sito personale contiene le pagine Software, i relativi contenuti e la composizione della propria home.
7. GitHub è opzionale. Nell'MVP un repository è soltanto un link pubblico facoltativo; non sono previste API, token, sincronizzazioni o repository privati.
8. Gli aggiornamenti dal template al sito personale avvengono con un'integrazione Git esplicita e verificata. Non esiste una propagazione automatica immediata.

## 3. Fuori scope

Non fanno parte della prima implementazione:

- accesso a repository GitHub privati;
- autenticazione GitHub o gestione di personal access token;
- chiamate alle API GitHub durante build o runtime;
- generazione automatica di progetti a partire dai repository;
- CMS o editor web per i progetti software;
- trasformazione immediata della sezione Software in un template separato;
- unificazione dei dati fotografici R2 e dei contenuti software in un unico backend;
- redesign completo della galleria, della lightbox o della dashboard fotografica.

## 4. Architettura dei repository

### 4.1 `PhotoPortfolioTemplate`: upstream generico

Il template resta proprietario del sottosistema fotografico e dei meccanismi di estensione condivisi:

- album, galleria, lightbox e provider fotografico;
- componenti globali realmente riusabili;
- navigazione configurabile;
- registro delle pagine statiche;
- calcolo e validazione degli slug riservati;
- documentazione per integrare aggiornamenti nei siti derivati.

Il template non deve conoscere `Software`, i progetti di Davide o la gerarchia editoriale del sito personale.

### 4.2 `PhotoPortfolio`: downstream personale

Il sito personale resta proprietario di:

- landing page ibrida con priorità ai prodotti;
- indice Software;
- pagine di dettaglio dei progetti;
- file `content/projects/*.md` e relativi asset;
- testi, call to action e selezione editoriale;
- adattamenti visivi specifici dell'identità personale;
- configurazione delle voci Software, Fotografia, About e Contatti.

### 4.3 Flusso degli aggiornamenti

`PhotoPortfolioTemplate` viene configurato come remote `upstream` del sito personale. Una modifica al template non cambia direttamente il sito personale. L'aggiornamento avviene in un branch dedicato tramite fetch e merge, quindi test, anteprima e integrazione.

Questo vincolo è intenzionale: il sito personale può divergere senza bloccare l'evoluzione del template, mentre ogni aggiornamento upstream resta controllabile e reversibile.

## 5. Architettura dell'informazione

La navigazione pubblica di primo livello è:

- **Software** → `/software`
- **Fotografia** → `/fotografia`
- **About** → `/about`
- **Contatti** → `/contatti`

Il brand porta alla home `/`.

Struttura minima delle pagine:

```text
/
├── software
│   └── <project-slug>
├── fotografia
│   └── <album-slug>
├── about
└── contatti
```

La home deve contenere, in quest'ordine logico:

1. proposta professionale sintetica;
2. progetti software selezionati con una CTA primaria verso prodotto o demo;
3. accesso all'indice completo Software;
4. introduzione alla fotografia e selezione di album;
5. profilo sintetico e contatti.

Le pagine di dettaglio Software e Fotografia usano template distinti. Condividono header, footer, token visivi e identità, ma non forzano lo stesso modello editoriale.

## 6. Estensioni generiche nel template

### 6.1 Navigazione configurabile

La navigazione non deve più essere hardcoded in `Nav.js`. Il template espone una lista ordinata di voci, per esempio:

```js
export const navigation = [
  { label: 'Fotografia', href: '/fotografia' },
  { label: 'Contatti', href: '/contatti' },
]
```

Il componente Nav si limita a renderizzare e validare la lista. I link esterni, se introdotti, devono essere dichiarati esplicitamente; non vanno dedotti dalla stringa URL.

### 6.2 Registro delle pagine statiche

Il routing del Worker usa oggi una mappa statica interna. Questa mappa diventa una configurazione importabile e validata, contenente soltanto le pagine fisiche prodotte da Vite:

```js
export const staticPages = [
  { path: '/contatti', asset: '/contatti.html' },
  { path: '/fotografia', asset: '/fotografia.html' },
]
```

Il registro non è un CMS né un generatore universale di pagine. Serve a evitare che Worker, build e validazione degli slug mantengano elenchi divergenti.

### 6.3 Slug riservati

Gli slug riservati vengono calcolati a partire da:

- namespace tecnici fissi, come `api`, `admin` e `assets`;
- primi segmenti delle pagine registrate;
- namespace applicativi aggiunti dal sito personale, come `software`.

La stessa funzione pura viene usata nella validazione dei contenuti fotografici e software. Un conflitto deve fallire prima del deploy con un errore che indica slug e proprietario della rotta.

## 7. Contenuti dei progetti software

### 7.1 Fonte autorevole

Ogni progetto pubblicato corrisponde a un file:

```text
content/projects/<slug>.md
```

Il Markdown e il suo front matter sono l'unica fonte autorevole. L'assenza del file implica che il progetto non compare nel sito, anche se esiste su GitHub.

### 7.2 Schema minimo

Campi obbligatori:

- `title`: nome pubblico;
- `slug`: identificatore URL stabile;
- `summary`: descrizione breve per card e metadati;
- `status`: almeno `active`, `completed` oppure `archived`;
- `featured`: inclusione o esclusione dalla selezione in home;
- `order`: ordinamento editoriale deterministico;
- `cover`: immagine o visual principale;
- `technologies`: elenco curato delle tecnologie rilevanti.

Campi opzionali:

- `productUrl`: prodotto o demo utilizzabile;
- `repositoryUrl`: link a un repository GitHub pubblico;
- `storeUrl`: pagina App Store, Play Store o altra distribuzione;
- `caseStudyUrl`: eventuale approfondimento esterno;
- `startedAt` e `completedAt`: informazioni temporali, se utili;
- `role`: ruolo svolto nel progetto.

Il corpo Markdown racconta problema, soluzione, scelte tecniche, vincoli e risultato. Il README del repository non viene importato automaticamente.

### 7.3 Regole editoriali

- La CTA primaria è `productUrl`, `storeUrl` o un'altra esperienza utilizzabile.
- `repositoryUrl` è secondaria e non è richiesta.
- Un progetto closed source può essere completo quanto uno open source.
- `featured: true` controlla la home; l'indice Software mostra tutti i progetti pubblicati, con gli archiviati eventualmente separati.
- Il sito non mostra metriche decorative prive di contesto, come stelle o fork, nell'MVP.

## 8. Flusso dei dati e build

1. La build legge tutti i file `content/projects/*.md`.
2. Front matter e slug vengono validati prima di generare le pagine.
3. Viene prodotto un indice ordinato per la pagina `/software`.
4. Per ogni progetto viene prodotta o risolta una pagina `/software/<slug>`.
5. La home riceve solo i progetti con `featured: true`.
6. Il sottosistema fotografico continua a leggere i propri dati attraverso il provider esistente; non dipende dai contenuti software.
7. La build genera metadati SEO e Open Graph specifici per le pagine software quando i dati necessari sono presenti.

Il parser Markdown e la strategia concreta di generazione delle pagine saranno scelti nel piano di implementazione, dopo aver verificato la soluzione più semplice compatibile con Vite multipagina e Cloudflare Workers. Non è approvata una migrazione a framework.

## 9. GitHub opzionale

### 9.1 MVP

Nell'MVP `repositoryUrl` è un semplice link opzionale con questi vincoli:

- protocollo HTTPS;
- host `github.com`;
- repository pubblico;
- nessun controllo remoto durante build o runtime;
- nessun errore se il campo manca.

La pubblicità effettiva del repository non viene verificata automaticamente nell'MVP: il contenuto resta responsabilità dell'autore. Il sito non richiede credenziali GitHub.

### 9.2 Possibile fase futura

Un arricchimento futuro potrà essere abilitato progetto per progetto e soltanto per repository pubblici. Potrà acquisire dati secondari come linguaggi, ultima release e data dell'ultimo aggiornamento.

Se verrà implementato:

- il Markdown continuerà ad avere precedenza;
- l'acquisizione produrrà uno snapshot versionato, non chiamate API dal browser;
- un errore GitHub non bloccherà la pubblicazione se esiste uno snapshot valido;
- non verranno introdotti repository privati o token con accesso ai contenuti privati;
- README e descrizioni GitHub non sostituiranno automaticamente il case study curato.

## 10. Gestione errori

- Front matter invalido, slug duplicato o conflitto di rotta: build fallita con messaggio puntuale.
- File Markdown assente: progetto non pubblicato; nessun fallback da GitHub.
- `repositoryUrl` assente: link Repository omesso senza placeholder.
- URL opzionale malformato: build fallita indicando file e campo.
- Cover dichiarata ma non caricabile: visual di fallback coerente e layout integro; la mancanza del campo obbligatorio blocca invece la build.
- Dati fotografici non disponibili: resta attivo il comportamento di errore/fallback del sottosistema fotografico; la sezione Software deve continuare a funzionare.
- Progetto inesistente: risposta 404, non fallback silenzioso alla pagina Software.

## 11. Strategia di test

### Test unitari

- validazione dello schema dei progetti;
- parsing e normalizzazione degli URL opzionali;
- ordinamento e filtro `featured`;
- calcolo degli slug riservati;
- rilevamento dei conflitti fra pagine, album e progetti;
- rendering della navigazione configurata.

### Test di integrazione/build

- build con progetto completo, progetto senza repository e progetto closed source;
- generazione di indice, dettaglio e metadati;
- routing di `/software`, `/software/<slug>`, `/fotografia` e pagine statiche;
- 404 per slug inesistente;
- compatibilità delle pagine fotografiche esistenti dopo l'introduzione del registro.

### Verifica manuale

- gerarchia visiva Software primaria/Fotografia secondaria su desktop e mobile;
- navigazione da tastiera, focus visibile e rispetto di `prefers-reduced-motion`;
- card e CTA comprensibili anche senza repository;
- anteprime social delle pagine progetto;
- procedura reale di merge upstream dal template in un branch del sito personale.

## 12. Sequenza di implementazione

L'implementazione deve procedere in tranche verificabili:

1. **Template:** estrarre navigazione, registro statico e slug riservati senza cambiare l'esperienza fotografica preesistente.
2. **Integrazione:** importare la versione aggiornata del template nel sito personale tramite branch dedicato e risolvere le divergenze.
3. **Fondamenta Software:** parser dei file progetto, validazione, indice e pagine dettaglio.
4. **Composizione personale:** nuova home, pagina Fotografia, About e navigazione definitiva.
5. **Qualità:** accessibilità, responsive, SEO, 404, build e verifica end-to-end.

Ogni tranche deve lasciare build e test verdi. Le modifiche generiche nate nel sito personale devono tornare nel template solo se non dipendono dai suoi contenuti o dalla sua identità.

## 13. Criteri di accettazione

La prima versione è completa quando:

- la home presenta i prodotti prima della fotografia;
- Software e Fotografia sono raggiungibili come aree autonome dalla navigazione principale;
- aggiungere un file Markdown valido crea un progetto senza modificare componenti applicativi;
- un progetto senza repository pubblico è pienamente rappresentabile;
- un repository pubblico, se presente, è soltanto un link secondario;
- nessuna credenziale GitHub è necessaria in locale, CI o produzione;
- album, dashboard e provider fotografico continuano a superare i test esistenti;
- conflitti di slug e configurazioni invalide bloccano la build con errori leggibili;
- gli aggiornamenti del template possono essere integrati nel sito personale con una procedura documentata e testata.

## 14. Decisioni rinviate

Restano intenzionalmente aperte per una fase successiva:

- eventuale arricchimento automatico dai repository pubblici;
- campi GitHub da mostrare e loro utilità editoriale;
- estrazione della sezione Software in un template autonomo;
- analytics e metriche di conversione;
- tassonomie, filtri e ricerca nell'indice Software;
- supporto multilingua;
- strategia di hosting delle immagini dei progetti software.

Queste decisioni non devono essere anticipate nell'MVP con astrazioni o dipendenze inutilizzate.
