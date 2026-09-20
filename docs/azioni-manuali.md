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

| # | Azione | Blocca | Urgenza |
|---|---|---|---|
| 1 | ~~Aprire e mergiare la PR del bootstrap~~ | — | **fatta** |
| 2 | Decidere cosa fare di `docs/` prima della pubblicazione | la pubblicazione | prima di rendere pubblico |
| 3 | Rendere pubblico il repo template | la condivisione con gli amici | prima di distribuire |
| 4 | Togliere la spunta "Template repository" | niente | insieme al punto 3 |
| 5 | Primo merge sito ← template, con precauzioni | niente | quando vuoi aggiornare il sito |
| 6 | Accesso in scrittura alla deploy key di `photoportfolio` | niente | opzionale |
| 7 | **`terraform apply`: applicare l'infrastruttura del punto 1** | la verifica di punto 1 e punto 2 | **la più urgente** |
| 8 | Attivare il dominio custom delle foto (punto 2) | niente d'altro | dopo la 7 |

**Nessuna blocca la scrittura di altro codice**, ma la voce 7 è diversa dalle altre:
finché non viene eseguita, la configurazione Terraform dei punti 1 e 2 è **scritta e
validata ma mai provata contro l'API vera**. Ogni punto costruito sopra aumenta ciò
che si scoprirebbe tutto insieme al primo `apply`.

---

### 1. Aprire e mergiare la PR del bootstrap

**Dove:** https://github.com/davidetarsi/PhotoPortfolioTemplate/pull/new/bootstrap-architettura-r2

Il branch `bootstrap-architettura-r2` è pushato e contiene sei commit: il merge che
crea l'antenato comune con il sito, la neutralizzazione dei valori personali, il
flusso fork nel README e la documentazione.

**Perché non è bloccante:** il lavoro del punto 1 può partire da un branch che nasce
da `bootstrap-architettura-r2` invece che da `main`. Git gestisce la cosa senza
attriti.

**Perché conviene comunque farlo prima:** se in revisione decidi di cambiare qualcosa
del bootstrap, tutto ciò che ci è stato costruito sopra va rifatto. Mergiare prima
elimina quel rischio.

**Fatto quando:** `main` contiene il commit di merge e `git merge-base main <sito>`
restituisce un commit.

---

### 2. Decidere cosa fare di `docs/` prima della pubblicazione

**Il fatto:** i documenti in `docs/superpowers/` citano il nome del tuo team Access,
gli identificativi AUD delle due applicazioni Access e gli URL pubblici dei tuoi due
bucket R2.

**Non sono credenziali.** L'AUD è un identificativo pubblico e gli URL `r2.dev` sono
endpoint già raggiungibili da chiunque. Nessuno di questi valori permette di fare
qualcosa che non si potrebbe fare senza. Ma legano in modo permanente un repo
pubblico al tuo account Cloudflare, e finiscono nei motori di ricerca.

**Tre vie:**

- **Lasciarli.** Zero lavoro. I documenti restano leggibili come storia del progetto,
  che è parte del valore per chi clona.
- **Sostituirli con segnaposto anche nei documenti.** Mezz'ora. I documenti perdono
  un po' di concretezza (le spiegazioni citano valori veri come evidenza) ma restano
  comprensibili.
- **Tenere `docs/superpowers/` fuori dal template.** I documenti restano solo nel tuo
  repo privato. Il template perde la sua storia progettuale, che per un pubblico di
  sviluppatori è probabilmente la parte più interessante.

**Da decidere prima del punto 3**, perché rendere pubblico non si annulla: ciò che è
stato visto resta visto.

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

Il merge non è pericoloso come sembrava in una versione precedente di questo
documento, ma due file vanno guardati a mano.

```bash
cd photoportfolio
git remote add upstream git@github.com:davidetarsi/PhotoPortfolioTemplate.git
git fetch upstream && git merge upstream/main
```

**`wrangler.json` andrà in conflitto**, ed è voluto: il template porta i segnaposto,
tu hai i tuoi valori reali. Risolvi **tenendo la tua versione**:

```bash
git checkout --ours wrangler.json && git add wrangler.json
```

**`public/_headers` viene eliminato**, ed è giusto: dal punto 1 la CSP si genera a
build time da `wrangler.json`. Non ripristinarlo — se resta, Vite lo copierebbe
sopra quello generato, rimettendo in produzione URL fissi.

I file in `config/` torneranno al seed neutro: **è innocuo**, perché a runtime la
verità è su R2. Ma non rilanciare `npm run migrate` dopo, o sovrascriveresti i
contenuti reali col seed vuoto.

Chiudi verificando che il sito regga ancora:

```bash
npm test && npm run build && head -2 dist/_headers
```

La riga CSP deve contenere i tuoi URL R2 veri. Se contiene `pub-xxxxxxxx`, la
risoluzione del conflitto è andata storta.

---

### 6. Accesso in scrittura alla deploy key di `photoportfolio`

**Dove:** GitHub → `photoportfolio` → Settings → Deploy keys → "Allow write access".

**Perché è solo opzionale:** la chiave di questa VPS ha accesso in sola lettura a
`photoportfolio`, e il push dei documenti è stato rifiutato. Ma quei commit sono
comunque arrivati su GitHub passando dal template, di cui sono diventati antenati.
Non si è perso nulla.

Serve solo se in futuro vorrai che il lavoro sul *sito* venga fatto da questa VPS.
Per la decisione presa — il template è upstream, il sito è a valle — non dovrebbe
servire quasi mai.

---

### 7. `terraform apply`: applicare l'infrastruttura

**Dove:** sul tuo computer, non su questa VPS: serve un token API Cloudflare che
l'agente non deve possedere.

È il Task 8 del [piano del punto 1](superpowers/plans/2026-09-20-punto1-terraform-e-configurazione.md).
La procedura completa, con i permessi esatti del token, sta nel
[runbook](runbook-cloudflare.md) sezioni 2 e 3.

**Perché è la più urgente.** `terraform validate` verifica che la configurazione sia
sintatticamente valida e che i nomi dei campi esistano nello schema del provider. Non
verifica che l'API Cloudflare accetti quei valori, che i permessi del token bastino,
che le risorse si creino davvero. Quella prova è solo l'`apply`.

**Attenzione al `plan` prima dell'`apply`:** la tua infrastruttura **esiste già**
(bucket e applicazioni Access create a mano a luglio). Se il piano propone di
**creare** risorse che già esistono, servono gli `import` della sezione 7 del
runbook. Applicare senza guardare produrrebbe risorse duplicate e un sito che punta
a quella sbagliata.

**Fatto quando:** `terraform plan` risponde `No changes`, e `npm run infra:sync`
rigenera un `wrangler.json` con i valori reali.

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

## Decisioni ancora aperte

Non sono azioni, ma scelte che serviranno lungo la strada. Da
[analisi §8.2](superpowers/specs/2026-09-20-template-distribuibile-analisi.md):

- **Nome del repo template** una volta pubblico. `PhotoPortfolioTemplate` va bene,
  ma è il momento buono per cambiarlo. Se lo cambi, vanno aggiornati gli URL nel
  README (sezione fork).
- **Quale dominio** per le foto, quando arriverà il punto 2 (`img.tuodominio.it` o
  simile) e su quale zona Cloudflare. Serve al punto 2, non al punto 1.
- **Stato Terraform**: locale (raccomandato in analisi §3.3) o backend su R2. Serve
  al punto 1: in assenza di una tua indicazione si procede con lo stato locale.

---

## Fatte

- **Voce 1 — PR del bootstrap**, mergiata il 2026-09-20. Ha richiesto una
  seconda PR perché la prima era stata unita con uno squash, che aveva
  scartato la parentela git col sito.

---
