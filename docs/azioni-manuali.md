# Azioni che spettano a te

Cose che un agente non può fare al posto tuo: perché richiedono i tuoi permessi,
perché sono scelte tue, o perché sono irreversibili e vanno decise da una persona.

**Come si usa.** Alla fine di ogni punto dell'ordine dei lavori — dopo che è stato
pianificato, implementato e verificato — ti verrà ricordato che questo documento
esiste e che qui c'è qualcosa in sospeso. Le voci non bloccanti si possono
accumulare senza danno; quelle bloccanti fermano il lavoro e sono segnate come tali.

Ordine dei lavori di riferimento: [analisi §7](superpowers/specs/2026-09-20-template-distribuibile-analisi.md).

---

## In sospeso

### 🔧 Infrastruttura — la configurazione è provata contro l'API vera (22/09/2026)

| # | Azione | Blocca |
|---|---|---|
| 7B | Decidere se il sito vero passa sotto Terraform (con `import`) | niente, rimandabile |
| 8 | Dominio custom per le foto | niente d'altro, ma `r2.dev` è rate-limited |
| **9** | **I due secret del form, più il widget Turnstile da creare a mano** | la protezione antispam e le notifiche |

### 📢 Pubblicazione — la strada per darlo agli amici

| # | Azione | Blocca |
|---|---|---|

### 🖼️ Vetrina — quello che manca a chi arriva sul repo

| # | Azione | Blocca |
|---|---|---|
| 10 | Screenshot di home, album e dashboard | niente, ma è ciò che pesa di più |
| 11 | Link alla demo dal vivo | niente |

### 👀 Da guardare e decidere

| # | Azione | Blocca |
|---|---|---|
| 12 | Guardare le tre varianti di card e scegliere il default | niente |

### 🔄 Il tuo sito

| # | Azione | Blocca |
|---|---|---|
| 5 | Primo merge sito ← template (**riscritta**: è un fast-forward, non un merge) | niente |
| 6 | Deploy key dedicata a `photoportfolio` (**diagnosi corretta**) | niente, opzionale |

**Nessuna blocca la scrittura di altro codice.** La voce 7, che era la più urgente, è
chiusa: la configurazione Cloudflare non è più solo validata, è stata creata e distrutta
contro l'API vera. Resta la 9, che è l'unica con una conseguenza silenziosa — senza
`TURNSTILE_SECRET` il form non si rompe, accetta tutto.

---

### 3. Rendere pubblico il repo template

**Dove:** GitHub → `PhotoPortfolioTemplate` → Settings → Danger Zone → Change visibility.

**Perché serve:** un repo privato non si può forkare da fuori il tuo account. Senza
questo, la decisione "si entra col fork" non funziona per nessuno dei tuoi amici.

**Prerequisito:** il punto 2 deciso e applicato.

**Fatto quando:** il repo è raggiungibile da un browser in incognito.

---

### 4. Togliere la spunta "Template repository"

**Dove:** GitHub → `PhotoPortfolioTemplate` → Settings → General → deseleziona
*Template repository*.

**Perché:** finché è attiva, GitHub mostra il bottone verde "Use this template", che
è esattamente la strada che abbiamo deciso di non far prendere a nessuno — crea repo
senza antenati comuni, incapaci di ricevere aggiornamenti. È la stessa cosa che ha
lasciato questo template indietro di un'architettura intera.

Il README spiega di forkare, ma un bottone verde vince su un paragrafo.

---

### 5. Primo merge sito ← template, con precauzioni

**Dove:** sul tuo computer, nel repo `photoportfolio`.

> ⚠️ **Questa voce è stata riscritta il 22 settembre 2026, dopo aver provato il merge
> per davvero** in un clone usa-e-getta. La versione precedente descriveva un conflitto
> su `wrangler.json` che **non avviene**, e la procedura che suggeriva avrebbe messo in
> produzione i segnaposto del template. Sotto c'è quello che succede davvero.

**Il primo merge è un fast-forward, non un merge.** Verificato: `photoportfolio` non ha
nessun commit che il template non abbia già, ed è 205 commit indietro. Il bootstrap della
storia comune ha funzionato fin troppo bene — i due rami non sono divergenti, sono in fila.

Ne segue la cosa importante: **niente va in conflitto, quindi niente ti avvisa**. Git
sposta l'etichetta in avanti e i file del sito diventano quelli del template, in silenzio.
Su 139 file la maggior parte è lavoro nuovo che vuoi, ma tre casi vanno gestiti a mano:

| File | Cosa succede | Va bene? |
|---|---|---|
| `wrangler.json` | i tuoi valori reali vengono **sostituiti dai segnaposto** | **no, va ripristinato** |
| `public/_headers` | viene cancellato | sì: dal punto 1 la CSP si genera a build time |
| `config/*.config.js` | tornano al seed neutro | sì: a runtime la verità è su R2 |

La procedura corretta, quindi, è mettere da parte la tua configurazione **prima** e
rimetterla **dopo**:

```bash
cd photoportfolio
git remote add upstream git@github.com:davidetarsi/PhotoPortfolioTemplate.git
git fetch upstream

cp wrangler.json ~/wrangler.sito.json          # i tuoi valori veri, fuori dal repo
git merge upstream/main                        # fast-forward: sovrascrive senza chiedere
cp ~/wrangler.sito.json wrangler.json          # rimetti i tuoi valori
git add wrangler.json
git commit -m "chore: ripristina la configurazione reale del sito"
```

**Quel commit finale non è cosmetico: è quello che rende il sito un ramo suo.** Da lì in
poi `photoportfolio` ha almeno un commit che il template non ha, i merge successivi
saranno merge veri, e `wrangler.json` andrà in conflitto davvero. Solo **da quel momento**
vale la vecchia ricetta, che ora è giusto tenere per il futuro:

```bash
git checkout --ours wrangler.json && git add wrangler.json    # dal secondo merge in poi
```

Non rilanciare `npm run migrate` dopo il merge, o sovrascriveresti i contenuti reali col
seed vuoto.

**Due cambi di comportamento che questo merge porta con sé**, e che prima non c'erano:

- **Il form di contatto passa da Web3Forms al Worker.** Oggi il sito usa Web3Forms
  (`src/components/ContactForm.js`, `config/site.config.js`); dopo il merge i messaggi
  vengono scritti sul tuo bucket R2 e letti in `/admin`. Perché funzioni davvero serve la
  [voce 9](#9-i-due-secret-del-form-di-contatto): senza `TURNSTILE_SECRET` il form accetta
  comunque tutto, senza `CONTACT_NOTIFY_URL` i messaggi arrivano ma non te lo dice nessuno.
- **`/contatti` diventa `/about`.** I link già condivisi non si rompono: il Worker
  risponde `301` su `/contatti` (`src/worker.js:32`).

Chiudi verificando che il sito regga ancora:

```bash
npm test && npm run build && head -2 dist/_headers
```

La riga CSP deve contenere i tuoi URL R2 veri. Se contiene `pub-xxxxxxxx`, la
risoluzione del conflitto è andata storta.

---

### 6. Una deploy key dedicata a `photoportfolio`

**Dove:** GitHub → `photoportfolio` → Settings → Deploy keys → **Add deploy key**.

> Il titolo di questa voce diceva "accesso in scrittura alla deploy key". Era la
> diagnosi sbagliata, e l'ho corretta il 22 settembre 2026.

**Cosa succede davvero.** La chiave SSH di questa VPS è una deploy key **di
`PhotoPortfolioTemplate`**, non di `photoportfolio`. Lo dice GitHub stesso:

```
$ ssh -T git@github.com-photoportfolio
Hi davidetarsi/PhotoPortfolioTemplate! You've successfully authenticated...
```

Una deploy key appartiene a **un solo repository**. I permessi di scrittura che le hai
dato sono reali e funzionano — infatti da qui i branch sul template si pushano senza
problemi. Ma su `photoportfolio` quella chiave non è autorizzata e non potrà esserlo:
non è una spunta da attivare, è un'altra chiave che manca.

**Quindi, se un giorno servirà**, la strada è generare una seconda coppia di chiavi,
registrarne la pubblica su `photoportfolio` con "Allow write access", e dare a questa
VPS un alias SSH separato che la usi per quel remote. È lavoro tuo: la configurazione
SSH di questa macchina è fuori dalla mia portata, ed è giusto che lo sia.

**Perché resta opzionale:** i documenti che non si erano potuti pushare sono comunque
arrivati su GitHub passando dal template, di cui sono diventati antenati. Non si è perso
nulla. E per la decisione presa — il template è upstream, il sito è a valle — il lavoro
sul sito lo fai tu dal tuo computer, che la chiave ce l'ha già.

---

### 7. ✅ `terraform apply`: la configurazione funziona davvero — fatto il 22/09/2026

Lo smoke test isolato è stato eseguito con Terraform 1.16.3 e provider Cloudflare
5.13.0: ha creato tutte e otto le risorse attese, è arrivato a `No changes`, ha
generato `wrangler.json`, ha passato la build di produzione e ha distrutto tutto senza
lasciare residui. Il resoconto sta nel [runbook](runbook-cloudflare.md), sezione 3.5.

**Cosa dimostra e cosa no.** La domanda che contava — *l'API Cloudflare accetta questa
configurazione?* — ha risposta sì, provata. Resta aperta una domanda diversa, che è la
7B qui sotto: *la tua infrastruttura vera va messa sotto Terraform?*

---

### 7B. Decidere se il sito vero passa sotto Terraform

**Dove:** sul tuo computer. Rimandabile senza costi.

La tua infrastruttura di produzione **esiste già** (bucket e applicazioni Access creati
a mano a luglio) e continua a funzionare senza Terraform. Metterla sotto significa
`terraform import` di ogni risorsa esistente — sezione 7 del runbook — non un `apply`.

> ⚠️ **Un `apply` senza `import` creerebbe duplicati.** Il piano proporrebbe di *creare*
> risorse che già esistono, e il sito finirebbe a puntare a quella sbagliata. Se decidi
> di farlo, la regola è: `import` di tutto, poi `plan` finché non dice `No changes`, e
> solo allora `apply`.

**Il pezzo che lo smoke test si è portato via:** creando e distruggendo tutto, il widget
Turnstile del tuo sito non esiste. Finché non fai la 7B, crealo a mano — è la
[voce 9](#9-i-due-secret-del-form-di-contatto).

**Fatto quando:** `terraform plan` sulla tua infrastruttura vera risponde `No changes`.

---

### 8. Attivare il dominio custom delle foto

Task 4 del [piano del punto 2](superpowers/plans/2026-09-20-punto2-dominio-custom-foto.md).
Richiede la voce 7 e un dominio su una zona Cloudflare.

In sintesi: scegliere il sottodominio (es. `img.tuodominio.com`), riscrivere il
`heroImage` nel tuo `config/site.config.js` nella nuova forma `{ album, name }`,
applicare seguendo i sette passi della sezione 8 del runbook, **verificare
l'anteprima social** condividendo il link in una chat, e solo alla fine spegnere
`r2.dev` con `keep_managed_domain = false`.

La verifica dell'anteprima social non è un vezzo: `og:image` è l'unico percorso che
non si vede navigando il sito, ed è proprio quello che il punto 2 serviva a sistemare.

---

### 9. I due secret del form di contatto

**Dove:** sul tuo computer, dopo la voce 7.

Il form scrive i messaggi su R2 da solo, ma due cose restano da configurare, **entrambe
come secret e non come `vars`**:

```bash
npx wrangler secret put TURNSTILE_SECRET      # dal pannello Turnstile
npx wrangler secret put CONTACT_NOTIFY_URL    # dove vuoi ricevere le notifiche
```

> **Il widget Turnstile del tuo sito non esiste ancora.** Lo smoke test della voce 7 ha
> creato le otto risorse e poi le ha distrutte, widget compreso. Finché non decidi la
> 7B — se mettere l'infrastruttura vera sotto Terraform — la strada è quella manuale:
> [sezione 5 del runbook, "Turnstile widget"](runbook-cloudflare.md#turnstile-widget).

> ⚠️ **Se salti `TURNSTILE_SECRET`, il form non si blocca: accetta tutto.** Senza secret
> `verifyTurnstile` legge "Turnstile non è in uso qui" e lascia passare ogni invio
> (`src/worker/turnstile.js:17`). Fallisce aperto, non chiuso, e il widget resta disegnato
> sulla pagina come se controllasse qualcosa. Vale per ogni ambiente separatamente: il
> secret va messo sia in produzione sia con `--env staging`.

> ⚠️ **Non metterli in `wrangler.json`**, che è versionato: un URL Telegram contiene il
> token del bot, e finirebbe su GitHub.

Per le notifiche la via più rapida è [ntfy.sh](https://ntfy.sh/): nessun account, scegli
un nome di topic **lungo e casuale** e installi l'app. Le tre ricette stanno nella
[sezione 9 del runbook](runbook-cloudflare.md#9-contact-form-notifications-and-spam-protection).

**Fatto quando:** invii un messaggio dal sito vero, arriva la notifica, e lo vedi in `/admin`.

**E la verifica che nessun test può fare al posto tuo:** controlla che la notifica
ricevuta **non contenga il testo del messaggio**. C'è un test automatico che lo
garantisce, ma questa è l'unica prova sul canale reale.

---

### 10. Gli screenshot

**Dove:** tre immagini in `docs/`, e quattro punti da aggiornare.

Servono: la **home**, una **vista album** con la lightbox, e la **dashboard** di
caricamento. Falle a finestra larga e con foto vere — uno screenshot col seed vuoto
racconta il contrario di quello che vuoi dire.

Poi vanno inserite in quattro punti: l'immagine in testa e la sezione Screenshot, in
`README.md` e `README.it.md`. I segnaposto sono già lì, marcati `TODO` e *(coming soon)*.

**Perché pesa più delle altre voci di questo gruppo:** un portfolio fotografico si
giudica guardandolo. Finché mancano, i due README descrivono a parole una cosa che si
capisce in un secondo vedendola.

Mandami i file e li inserisco io.

---

### 11. Il link alla demo

**Dove:** in testa a entrambi i README, riga `🔗 Live demo`.

È il tuo sito, quando sarà online sul dominio definitivo. Un template che mostra un
esempio funzionante convince più di qualsiasi elenco di funzionalità.

---

### 12. Guardare le tre varianti di card

**Dove:** `npm run dev`, e una riga da cambiare in `theme/card.css`.

È il Task 5 del punto 4, e nessun test può sostituirlo: **nessun test dice se una card
è bella.**

Attiva una variante alla volta — `cinematic`, `editorial`, `minimal` — commentando e
decommentando le `@import`. Il dev server ricarica da solo. Guardale anche da telefono:
`editorial` passa a colonna singola sotto i 600px, `minimal` diventa molto alta perché
conserva le proporzioni originali delle foto.

Poi decidi **quale resta il default del template**. Ora è `cinematic` perché era
l'aspetto già esistente, non perché qualcuno l'abbia scelta.

Se una non convince, dimmelo: sono tre file CSS indipendenti, si correggono o si
eliminano senza toccare altro.

---

## Decisioni ancora aperte

Non sono azioni da fare, ma scelte che prima o poi vanno prese. Le prime tre servono a
lavori già pianificati; le ultime due sono stonature note di cui hai il diritto di
decidere che non ti importano.

- **Nome del repo template** una volta pubblico. `PhotoPortfolioTemplate` va bene, ma è
  il momento buono per cambiarlo: dopo, gli URL nel README e nei fork sarebbero da
  aggiornare.
- **Quale dominio** per le foto (`img.tuodominio.it` o simile) e su quale zona
  Cloudflare. Serve alla voce 8.
- **Stato Terraform**: locale, come raccomandato, oppure backend su R2. Serve alla
  voce 7; in assenza di indicazioni si procede con quello locale.
- **I commenti nel codice sono in italiano.** In un template rivolto a sviluppatori
  internazionali è una stonatura vera, ma tradurli tutti significa toccare codice
  funzionante per una ragione estetica. Se si fa, è un punto a sé con revisione seria.

---

## Decise, e chiuse

- **Niente link di donazione, per ora** (21 settembre 2026). Un progetto senza
  utenti e senza costi ricorrenti che elenca tre modi per donare dice di sé qualcosa
  che non è ancora vero. In questa fase il segnale utile non sono i soldi: sono una
  stella, una segnalazione, e qualcuno che racconta cosa ci ha costruito. La sezione
  del README chiede quelli. Rimessi i link, se mai servirà, sono cinque minuti:
  `.github/FUNDING.yml` è stato rimosso e va ricreato.
- **URL pubblico `/about`** (21 settembre 2026). `/contatti` resta un redirect 301
  per i collegamenti esistenti; navigazione, testi e test usano `/about`.

---

## Fatte

- **Voce 1 — PR del bootstrap**, mergiata il 2026-09-20. Ha richiesto una
  seconda PR perché la prima era stata unita con uno squash, che aveva
  scartato la parentela git col sito.
- **Voce 2 — documentazione pronta alla pubblicazione** (21 settembre 2026).
  I riferimenti personali a domini, bucket, team Access, email, repository del sito
  e sessioni di lavoro sono stati sostituiti da segnaposto; la storia tecnica resta
  nel template. Il repository del template resta l'upstream canonico dei fork.
- **Voce 3 — repository pubblico** (21 settembre 2026). Completata da Davide;
  il template può ora essere forkato da altri account GitHub.
- **Voce 4 — opzione Template repository disattivata** (21 settembre 2026).
  Completata da Davide: il flusso presentato da GitHub resta il fork, che conserva
  la parentela necessaria per ricevere aggiornamenti dall'upstream.

---
