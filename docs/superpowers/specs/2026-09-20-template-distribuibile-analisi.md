# Da sito personale a template distribuibile — Analisi

**Data**: 2026-09-20
**Stato**: da discutere
**Origine**: conversazione sulla direzione da dare al progetto — Terraform per l'infrastruttura, centralizzazione della personalizzazione, dashboard con anteprima. Obiettivo dichiarato: un template che amici sviluppatori-fotografi possano clonare da GitHub e usare subito.

Questo documento **non è un piano**. Serve a stabilire cosa esiste davvero, cosa manca, cosa è fattibile e a che prezzo, prima di decidere l'ordine dei lavori.

Prosegue [2026-07-12-boilerplate-template-audit.md](2026-07-12-boilerplate-template-audit.md), che resta valido nei suoi quattro punti.

---

## 1. Stato reale, verificato

Verificato sul branch `staging` di `davidetarsi/photoportfolio` (33 commit avanti rispetto a `main`) il 2026-09-20.

| Capacità | Stato | Dove |
|---|---|---|
| Storage su R2 al posto di Google Drive | fatto | `src/providers/r2.js`, `src/providers/data.js` |
| Worker con API dati e API admin | fatto | `src/worker/data-routes.js`, `admin-routes.js` |
| Autenticazione via Cloudflare Access | fatto, prod + staging | `src/worker/access-jwt.js` |
| Dashboard: upload, ordinamento, cover, creazione album | fatto | `src/admin/` (16 moduli) |
| Compressione nel browser prima dell'upload | fatto | `src/admin/pipeline.js` — 1900px, WebP q85 |
| Compressione da CLI | fatto, coesiste | `scripts/compress.js` |
| Token di tema condivisi tra sito e dashboard | fatto | `src/styles/admin.css` importa `theme/tokens.css` |
| Anteprima prima del salvataggio | **parziale** | solo nome, bio, Instagram |
| Terraform | **assente** | nessun `.tf` in nessuno dei due repo |
| Stringhe dashboard in `texts.config.js` | **assente** | hardcoded in italiano nei JS |

Copertura test: 268 test.

**Conseguenza**: tre delle quattro direzioni che volevi prendere sono già costruite. Quello che resta non è un progetto nuovo, è un lavoro di completamento e di confezionamento. Questo cambia molto la stima complessiva, in meglio.

### 1.1 La correzione sull'anteprima

Nella conversazione l'anteprima è stata descritta come "si vedono le modifiche fatte al sito prima di salvare". Il codice fa meno di così, e per scelta esplicita documentata in [2026-07-11-admin-preview-design.md](2026-07-11-admin-preview-design.md):

> **Fuori** (deciso esplicitamente): **Album** (riordino foto, cover, elimina, nuovo album): tutte le azioni restano a salvataggio istantaneo. Un'anteprima per gli album richiederebbe prima trasformarli in "modifica poi salva" — fuori scope, eventualmente un progetto a parte in futuro.

Oggi l'anteprima copre tre campi di testo. Tutto ciò che riguarda le foto scrive su R2 al click, senza stato intermedio. **L'anteprima completa è ancora tutta da fare**, ed è il pezzo di codice più consistente tra quelli rimasti (§5).

---

## 2. Il problema strutturale: in che direzione si propaga il lavoro

Questo viene prima di ogni altra cosa, perché è già fallito una volta.

**I fatti.** `PhotoPortfolioTemplate` è fermo all'8 luglio, architettura Google Drive, 68 commit, zero commit da allora. `photoportfolio` ha **117 commit**, tutti dall'8 luglio in poi, e un'intera migrazione architetturale. I due repo hanno **storie git completamente separate**: `git merge-base` non trova alcun antenato comune. Non c'è modo di allinearli con un merge o un rebase, oggi.

**La causa immediata, e perché conta più di quanto sembri.** Il primo commit di `photoportfolio` è un `Initial commit` datato 2026-07-08: il repo è nato con **"Use this template" di GitHub**, che crea deliberatamente una storia nuova senza alcun legame con il repo d'origine. La separazione non è una svista: è il comportamento documentato di quella funzione.

Questo ha una conseguenza che va molto oltre il tuo caso. L'audit di luglio si chiudeva con *"Repo → «Use this template» su GitHub"*. Se i tuoi amici partono così, **ognuno di loro si troverà esattamente dove sei tu adesso**: un repo senza antenati comuni con il template, incapace di ricevere qualsiasi aggiornamento futuro con un merge. Il template diventerebbe un punto di partenza usa-e-getta, non una base da cui si continua a ricevere migliorie.

Se vuoi che i cloni possano aggiornarsi, la via d'ingresso non può essere "Use this template". Deve essere un **fork**, oppure un `git clone` seguito dal cambio di `origin` — entrambi conservano la storia e rendono possibile `git merge template/main` per sempre. Costa una riga in più nel README e cambia la natura del progetto: da template morto a base viva.

**La causa di fondo.** Al di là del meccanismo git, il lavoro vero accade nel sito e il template è a valle: qualsiasi cosa a valle di dove si lavora, e che va aggiornata a mano, prima o poi resta indietro. La roadmap originale (Fase 8) prescriveva già il rapporto giusto — *"migliorie al template nel repo base; i siti derivati le recuperano con un merge dal template"* — ma la pratica ha fatto il contrario.

**La raccomandazione: invertire la direzione.** Il template diventa il repo dove si sviluppa (*upstream*); il tuo sito diventa il primo dei cloni, che accoglie le migliorie con un merge e aggiunge solo configurazione e contenuti propri.

Perché questo risolve il problema alla radice:

- Il template non può invecchiare, perché è il posto dove si lavora.
- Il tuo sito diventa la prova che il template funziona: se una modifica rompe il tuo sito, rompe anche quello dei tuoi amici, e lo scopri subito.
- I tuoi amici stanno verso il template nella stessa identica relazione in cui ci stai tu. Una sola cosa da documentare invece di due.

**Il bootstrap.** Serve creare un antenato comune, una volta sola: si porta l'albero attuale del sito dentro il template con un merge `--allow-unrelated-histories`, su un branch dedicato e via PR. Da quel punto in avanti i due repo condividono storia e i merge successivi sono ordinari. È un'operazione singola, reversibile perché non riscrive niente, e non richiede force push.

**Nota sulla scelta fatta in conversazione.** Hai scelto "template separato che si risincronizza", e questa raccomandazione la rispetta: i repo restano due. Quello che propongo di cambiare non è il numero di repo, ma **da che parte scorre il lavoro**. Se invece preferisci continuare a sviluppare nel sito, allora il bootstrap va fatto lo stesso e serve in più una disciplina esplicita — per esempio, nessuna feature si considera chiusa finché non è stata portata nel template — altrimenti fra sei mesi siamo di nuovo a centinaia di commit di distanza.

---

## 3. Punto 1 — Terraform per l'infrastruttura Cloudflare

### 3.1 Cosa è gestibile da Terraform, davvero

Il provider `cloudflare/cloudflare` v5 copre quasi tutto quello che ti serve:

| Risorsa | Resource Terraform | Note |
|---|---|---|
| Bucket R2 | `cloudflare_r2_bucket` | stabilizzata |
| URL pubblico `r2.dev` | `cloudflare_r2_managed_domain` | **espone il dominio come output** |
| Dominio custom sul bucket | `cloudflare_r2_custom_domain` | richiede zone_id |
| Applicazione Access | `cloudflare_zero_trust_access_application` | ⚠ segnalata come non idempotente |
| Policy Access | `cloudflare_zero_trust_access_policy` | |
| Identity provider | `cloudflare_zero_trust_access_identity_provider` | |
| DNS e dominio del sito | `cloudflare_dns_record` | |
| Worker | `cloudflare_workers_script` | ⚠ vedi §3.2 |

Il fatto che `cloudflare_r2_managed_domain` restituisca il dominio come output è il pezzo che rende Terraform utile qui e non solo elegante: **è esattamente il valore che oggi è scolpito a mano** in `wrangler.json` (`R2_PUBLIC_URL`) e in `public/_headers` (la CSP). Terraform lo produce, e da lì si generano entrambi i file. Lo stesso vale per l'AUD dell'applicazione Access.

Questo fa convergere il punto Terraform con i punti 2 e 3 dell'audit di luglio, che erano proprio "CSP hardcodata" e "wrangler.json da sistematizzare". Non sono tre lavori: è uno.

### 3.2 La tensione da risolvere: chi possiede il Worker

`wrangler deploy` pubblica il Worker. Anche `cloudflare_workers_script` vuole pubblicarlo. Se li lasciamo entrambi padroni della stessa risorsa, si sovrascrivono a vicenda a ogni deploy e lo stato Terraform diverge di continuo.

**Divisione proposta**: Terraform possiede le risorse d'account che cambiano di rado — bucket, domini, Access, DNS. Wrangler possiede il deploy del codice, che cambia a ogni push. Terraform *non* dichiara `cloudflare_workers_script`.

È una divisione che si spiega in una riga nel README e che elimina la classe di problemi peggiore di questo setup.

### 3.3 Dove vive lo stato Terraform

Per un template che altri clonano, lo stato remoto condiviso non ha senso: ogni clone ha la propria infrastruttura. Due opzioni ragionevoli:

- **Stato locale** più `.gitignore`. Semplicissimo, zero setup. Rischio: se perdi il file perdi la mappa, e devi reimportare.
- **Backend S3-compatibile su R2.** Terraform supporta il backend S3 e R2 ne espone l'API. Lo stato vive nel bucket che Terraform stesso ha creato — il che introduce un problema dell'uovo e della gallina al primo `apply`, risolvibile ma da documentare.

Raccomandazione: **stato locale**, documentato. L'infrastruttura qui è cinque o sei risorse; il costo di ricostruirla è basso e il costo cognitivo del backend remoto è più alto del rischio che copre.

### 3.4 Il prezzo, detto chiaro

Terraform aggiunge una dipendenza al setup di chi clona: installare il CLI e creare un API token Cloudflare con permessi ampi (R2, Workers, Access, DNS). Per un fotografo-sviluppatore è alla portata, ma non è gratis in termini di attrito, e va contro l'obiettivo "usabile subito".

L'alternativa onesta è uno **script di setup** che chiama l'API Cloudflare via `wrangler` e `curl`, fa le stesse cose e non richiede Terraform. Più semplice da usare una volta, peggiore da mantenere e senza idempotenza.

Raccomandazione: **Terraform**, ma con il `terraform apply` posizionato come percorso principale documentato e non come prerequisito assoluto — chi vuole può ancora creare le risorse a mano seguendo il runbook. Il valore di Terraform qui non è tanto l'automazione quanto il fatto che **descrive** l'infrastruttura: oggi quella conoscenza esiste solo nella tua testa e in un documento di deploy.

### 3.5 Scoperta collaterale: `r2.dev` non va bene in produzione

Verificando i resource Terraform è emerso un problema che riguarda il tuo sito **adesso**, non il template.

`wrangler.json` serve le foto di produzione da un URL `pub-….r2.dev`. La documentazione Cloudflare è esplicita:

> Public access through `r2.dev` subdomains is rate-limited and should only be used for development purposes.

Su `r2.dev` non hai cache, né WAF, né controlli d'accesso. Per un sito che è fatto al 95% di immagini, e che vuoi dare ad amici che ci metteranno i loro portfoli, questo è il collo di bottiglia più serio dell'architettura attuale — e non è visibile finché il traffico è basso.

**La correzione** è un dominio custom sul bucket (`cloudflare_r2_custom_domain`), per esempio `img.tuodominio.it`. Richiede che il dominio sia su Cloudflare, il che è già vero per il sito. Va nello stesso lavoro di Terraform, perché è la stessa risorsa.

Per il template questo diventa una decisione da esporre: o si impone il dominio custom (setup più lungo, ma corretto), o si accetta `r2.dev` come default con un avviso chiaro e il custom domain documentato come passo consigliato. Propendo per la seconda: abbassa la barriera d'ingresso e non mente a chi lo usa.

---

## 4. Punto 2 — Centralizzazione della personalizzazione

### 4.1 Cosa è già a posto

Meglio di quanto pensassi. `src/styles/admin.css` importa gli stessi token di `theme/tokens.css`: cambiare `--color-accent` ricolora sito pubblico **e** dashboard insieme. Questa è la parte difficile della centralizzazione, ed è già fatta.

### 4.2 La distinzione che va difesa

L'audit di luglio la formula bene e va portata in cima a `CUSTOMIZING.md`, perché è la cosa che confonde chiunque arrivi nuovo:

- **Contenuto** (nome, bio, hero, album, foto) → la verità è **R2**. I file in `config/` sono solo il *seed* iniziale: `npm run migrate` li trasforma in JSON su R2 una volta sola. Rilanciare `migrate` dopo aver usato la dashboard **sovrascrive** il lavoro fatto dalla dashboard.
- **Aspetto e testi di interfaccia** (colori, font, spaziature, copy) → la verità sono i **file**: `theme/`, `config/texts.config.js`.

Il trabocchetto di `migrate` è una trappola reale per chi clona. Va documentato in grassetto, e il comando dovrebbe rifiutarsi di procedere se trova dati già scritti dalla dashboard, a meno di un `--force` esplicito.

### 4.3 Cosa manca

1. **Stringhe della dashboard**, oggi hardcoded in italiano in `views/home.js`, `views/album.js`, `status.js`, `preview.js`. Vanno sotto `texts.admin.*`. Lavoro meccanico ed esteso.
2. **Varianti di card e bordi**, che è la parte nuova rispetto a quanto documentato finora.

### 4.4 Un avvertimento sul punto "card e bordi"

Hai chiesto che siano personalizzabili "i font, i testi, le card utilizzate, i bordi, i colori". Font, testi e colori sono già token: nessun problema.

"Le card utilizzate" è una richiesta di natura diversa: non è un valore, è una **scelta di struttura**. Renderla configurabile significa scrivere più varianti di layout e un meccanismo per selezionarle — e qui c'è un rischio noto: si finisce per costruire un piccolo framework di theming, che moltiplica le combinazioni da testare e che nessuno userà davvero, perché chi clona il repo e sa programmare preferirà modificare il CSS.

Il tuo pubblico sono **sviluppatori**. Per loro, un CSS pulito, ben commentato e con confini chiari vale più di un sistema di varianti.

Raccomandazione: **due o tre varianti di card, nominate e concrete** (per esempio `minimal`, `editoriale`, `cinematic` — hai già i mockup da cui derivarle), selezionabili con un token. Non un sistema generico. Se dopo che tre amici l'hanno usato emerge una quarta esigenza reale, si aggiunge allora.

---

## 5. Punto 3 — Anteprima completa

È il pezzo di codice più grosso rimasto, ed è un cambio di modello di interazione, non una feature additiva.

**Oggi**: ogni azione sugli album (riordino, cover, eliminazione, nuovo album) scrive su R2 immediatamente. Non esiste uno stato "modificato ma non salvato".

**Per avere l'anteprima** serve introdurre quello stato: le modifiche si accumulano in una bozza, l'anteprima la legge, e un'azione esplicita la pubblica.

Conseguenze da mettere in conto, perché toccano tutta la dashboard:

- Serve un manifest **bozza** distinto dal **pubblicato** su R2, e la promozione dell'uno sull'altro.
- Serve gestire lo stato "sporco": indicatore, conferma prima di uscire, possibilità di annullare le modifiche.
- Le foto già caricate sono un caso ibrido: il file binario è per forza già su R2 (l'upload è avvenuto), ma la sua *presenza nell'album* può restare in bozza. Serve poi una pulizia dei file caricati e mai pubblicati.
- Il sito pubblico va istruito a leggere il manifest bozza quando richiesto in anteprima, autenticato.

Non è difficile, ma non è piccolo, e tocca quasi ogni vista della dashboard. È anche l'unico dei quattro punti che **non blocca** la distribuzione del template: il template funziona benissimo con il salvataggio istantaneo attuale.

---

## 6. Punto 4 — Igiene del template

Dall'audit di luglio, ancora tutto aperto e ancora valido:

1. `CUSTOMIZING.md` riscritto — parla ancora di Google Drive, `driveApiKey`, `driveFolderId`, `lh3.googleusercontent.com`. Architettura che non esiste più.
2. CSP generata a build time invece che scolpita in `public/_headers`.
3. `wrangler.json` con placeholder coerenti su tutti i campi.
4. Runbook Cloudflare consolidato.

I punti 2 e 3 si risolvono da soli se si fa Terraform (§3.1): sono gli output di Terraform scritti nei file.

---

## 7. Ordine consigliato

| # | Lavoro | Perché qui | Grandezza |
|---|---|---|---|
| 0 | Bootstrap della storia comune tra i due repo | senza, ogni lavoro successivo nasce già divergente | mezza giornata |
| 1 | Terraform + CSP generata + wrangler parametrico + runbook | un lavoro solo, stessi valori; sblocca la distribuzione | 2–3 giorni |
| 2 | Dominio custom sul bucket | corregge un problema di produzione già attivo; stessa area di 1 | mezza giornata |
| 3 | `CUSTOMIZING.md` riscritto + guardia su `migrate` | senza, il template è inutilizzabile da altri | 1 giorno |
| 4 | Stringhe admin in `texts.config.js` + varianti di card | completa la centralizzazione | 2 giorni |
| 5 | Anteprima completa con bozza/pubblicato | il più grosso, il meno bloccante | 3–5 giorni |

Stime grossolane, da rivedere quando ciascun punto avrà il suo piano.

**Dopo il punto 3 il template è già condivisibile.** I punti 4 e 5 lo migliorano, ma non bloccano i tuoi amici. Se l'obiettivo è "dare il repo a qualcuno entro poco", la linea di arrivo è il punto 3, non il 5.

---

## 8. Decisioni aperte

1. **Direzione di propagazione** (§2): il template diventa upstream, oppure resta a valle con una disciplina esplicita?
2. **Via d'ingresso per chi clona** (§2): fork/clone con storia conservata — i cloni possono ricevere aggiornamenti — oppure "Use this template", più comodo ma definitivo? Questa decisione va presa **prima** di dare il repo a chiunque: cambiarla dopo significa chiedere agli amici di rifare il repo da capo.
3. **Dominio custom sul bucket** (§3.5): obbligatorio nel template, o default `r2.dev` con avviso?
4. **Terraform obbligatorio o consigliato** (§3.4) nel percorso di setup?
5. **Quante varianti di card** (§4.4), e da quali dei quattro mockup esistenti derivarle?
6. **L'anteprima completa serve davvero?** (§5) È il lavoro più grosso. Vale la pena prima di aver dato il template a qualcuno e aver sentito se il salvataggio istantaneo dà fastidio?

---

## 9. Nota di metodo

Questa analisi è stata scritta dopo aver letto il codice su `staging`, non ricostruita a memoria dalla conversazione. Dove la conversazione e il codice divergevano (§1.1) ho seguito il codice.

Non è stata scritta né modificata alcuna riga di codice dell'applicazione.
