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
| 1 | Aprire e mergiare la PR del bootstrap | niente — ma vedi nota | consigliata prima del punto 1 |
| 2 | Decidere cosa fare di `docs/` prima della pubblicazione | la pubblicazione | prima di rendere pubblico |
| 3 | Rendere pubblico il repo template | la condivisione con gli amici | prima di distribuire |
| 4 | Togliere la spunta "Template repository" | niente | insieme al punto 3 |
| 5 | Primo merge sito ← template, con precauzioni | niente | quando vuoi aggiornare il sito |
| 6 | Accesso in scrittura alla deploy key di `photoportfolio` | niente | opzionale |

**Nessuna di queste blocca il punto 1** (Terraform, CSP generata a build time,
`wrangler.json` parametrico, runbook). Il punto 1 si può iniziare subito.

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

Il merge passa senza conflitti, e **proprio per questo è rischioso**: il sito non è
divergente, quindi non negozia nulla e accetta in blocco ciò che il template ha
cambiato. Senza precauzioni cancellerebbe `wrangler.json` dal disco (contiene bucket,
team Access e AUD reali) e riporterebbe `public/_headers` ai segnaposto, rompendo la
CSP in produzione.

```bash
cd photoportfolio
cp wrangler.json /tmp/wrangler.json.bak
cp public/_headers /tmp/_headers.bak
git remote add upstream git@github.com:davidetarsi/PhotoPortfolioTemplate.git
git fetch upstream && git merge upstream/main
cp /tmp/wrangler.json.bak wrangler.json        # ora non più versionato
cp /tmp/_headers.bak public/_headers           # finché non è generato a build time
npm test && npm run build
```

I file in `config/` torneranno al seed neutro: **è innocuo**, perché a runtime la
verità è su R2. Ma non rilanciare `npm run migrate` dopo, o sovrascriveresti i
contenuti reali col seed vuoto.

Dal secondo merge in poi `wrangler.json` non dà più problemi, perché resta ignorato
da git. `public/_headers` smetterà di darne quando il punto 1 lo farà generare a
build time.

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

Nulla, per ora.
