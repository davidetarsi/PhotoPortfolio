# F0 — Installazione a freddo e destinatario reale (design)

**Data:** 20 settembre 2026
**Fase:** F0 di `docs/platform-roadmap.md`
**Premessa:** `docs/platform-direction.md`

---

## 1. Problema

L'intera roadmap assume che `PhotoPortfolioTemplate` sia installabile da qualcun altro. Nessuno l'ha mai verificato.

Un difetto è già emerso senza nemmeno provare: **`SETUP.md` non è tracciato in git**. Chi crea un repo da "Use this template" non lo riceve — ed è l'unico documento che spiega come arrivare da zero a un sito online. Se un difetto di questa gravità è rimasto invisibile, ce ne sono altri.

F0 non scrive funzionalità. Verifica un'assunzione, e corregge ciò che trova solo dove la correzione non verrà buttata via dalle fasi successive.

## 2. Decisioni di scope

Prese in fase di brainstorming, vincolano tutto il resto:

1. **Si corregge solo ciò che sopravvive a F1/F2.** Il percorso di setup attuale (Drive, API key, restrizioni referrer) verrà sostituito da R2 + Worker + dashboard. Gli attriti specifici di quel percorso si **registrano**, non si riscrivono. Si correggono i difetti strutturali, che resteranno veri anche dopo.
2. **L'audit meccanico è delegato; il percorso con account no.** Clone, build, test, verifica dei claim e dei residui personali non richiedono credenziali. Il cammino su GCP, Web3Forms e Cloudflare richiede Davide e slitta a F8, dove lo percorre comunque una persona con occhi davvero freschi.
3. **I destinatari sono un binario parallelo.** F0 chiude con l'audit tecnico. L'individuazione dei due destinatari e la prima conversazione devono atterrare **prima dell'inizio di F2** — è lì che la risposta cambia qualcosa, perché vincola lo scope della dashboard — ma non bloccano la chiusura di F0.

## 3. Approccio

Tre alternative considerate:

| | Approccio | Perché sì | Perché no |
|---|---|---|---|
| **A** | Simulazione fedele del destinatario: seguire README/SETUP alla lettera, in ordine | Trova ciò che una checklist non avrebbe previsto; l'ordine dà gratis la gravità | Copre solo il percorso principale |
| **B** | Checklist di conformità per categoria | Copertura più sistematica | Lista piatta, nessun segnale di priorità |
| **C** | Guardie automatiche permanenti in CI | La classe di difetto non torna più | Costo iniziale maggiore |

**Scelto: A, più il seme di C.**

La simulazione produce risultati ordinati per gravità reale. Ma due classi di difetto qui torneranno da sole, e per quelle una guardia vale più di una correzione una tantum. Non è scope aggiuntivo: direzione §15 e fase F9 richiedono già un controllo automatico contro i riferimenti personali; F0 lo anticipa nella forma minima.

### Criterio per decidere cosa merita una guardia

Una guardia si giustifica quando il difetto è **silenzioso**, **ricorrente** ed **economico da asserire** — tutti e tre.

- *Silenzioso*: non si manifesta da solo. Un difetto che fa esplodere la build al primo tentativo non ha bisogno di sentinelle.
- *Ricorrente*: ha una sorgente che continua a produrlo. Il porting di 18 file dal sito personale (F1, F2) è una sorgente attiva di riferimenti personali; rinomine e spostamenti sono una sorgente attiva di documentazione che punta a file inesistenti.
- *Economico*: asseribile in poche righe, senza infrastruttura nuova.

Il criterio esclude deliberatamente due claim del README:

- **Versione di Node** — non è silenzioso: se il minimo dichiarato è sbagliato, `npm install` o la build falliscono rumorosamente. E la correzione giusta è un meccanismo diverso: dichiarare `engines` in `package.json` e lasciare che sia npm ad avvisare. Un test che confronta README e `package.json` verificherebbe solo che due frasi concordino.
- **Conteggio dei test ("86 test")** — sarebbe banale da sorvegliare, ma una guardia che fallisce ogni volta che aggiungi un test non protegge: assegna un compito. E il numero non è azionabile per chi legge. Si **cancella il claim**, non lo si sorveglia.

Regola generale che ne deriva: *le guardie si mettono sui claim che vale la pena tenere; gli altri si tolgono.*

## 4. Design

### 4.1 Simulazione

Clonare il repo in una directory temporanea fuori dall'albero di lavoro. `git clone` restituisce esattamente il contenuto tracciato di `HEAD`, che è ciò che "Use this template" consegna.

Seguire `README.md` e poi `SETUP.md` **alla lettera e nell'ordine scritto**, senza usare conoscenza pregressa del progetto.

I passi che richiedono un account esterno (Google Cloud, Web3Forms, Cloudflare) non vengono eseguiti, ma **non interrompono la simulazione**: si annota cosa avrebbero richiesto e si prosegue con i passi successivi che restano verificabili. Fermarsi al primo di essi significherebbe non arrivare mai ai passi di configurazione, build e deploy, dove stanno i difetti che questa fase può effettivamente trovare. Dove un passo successivo dipende davvero da un valore ottenibile solo con un account, si usa un valore fittizio e si registra fin dove il percorso regge.

Per ogni intoppo registrare:

| Campo | Contenuto |
|---|---|
| Passo | Il punto esatto di README/SETUP |
| Atteso | Cosa dicevano le istruzioni |
| Osservato | Cosa è successo davvero |
| Gravità | *blocca* / *rallenta* / *confonde* |
| Sopravvive a F1/F2? | sì → si corregge · no → si registra soltanto |

L'ultima colonna è quella che separa le correzioni dalle annotazioni.

### 4.2 Correzioni

Solo difetti strutturali:

- file che la documentazione presuppone ma che non sono tracciati (a partire da `SETUP.md`);
- claim falsificabili nel README;
- residui personali nel template;
- disallineamento fra `.env.example` e le variabili d'ambiente realmente lette dal codice;
- `engines` in `package.json`, come correzione strutturale del claim sulla versione di Node.

Fuori: riscrittura delle istruzioni Drive, GCP, Web3Forms.

### 4.3 Guardie

Due test, in vitest come il resto della suite.

**`no-personal-data`** — il repo non contiene nome, email, domini o ID personali.
Allowlist ristretta ed esplicita per i riferimenti legittimi: il README cita `davidetarsi/PhotoPortfolio` come repo sorgente del template, ed è corretto che lo faccia. L'allowlist elenca percorso e stringa ammessa, non un pattern generico, così un nuovo riferimento personale non passa per somiglianza.

**`docs-reference-existing-files`** — ogni percorso di file citato in `README.md`, `SETUP.md` e `CUSTOMIZING.md` esiste nel repo.
Copre sia i file non tracciati sia quelli rinominati o spostati.

### 4.4 Output

- **Lista degli attriti** in `docs/cold-install-audit.md`, ordinata per gravità, con la colonna "sopravvive a F1/F2". È il backlog di dettaglio delle fasi successive.
- **Un commit** con le correzioni strutturali e le due guardie.

## 5. Testing

Le guardie sono test veri e vanno **viste fallire prima di essere considerate finite**: introdurre deliberatamente una stringa personale e un riferimento a un file inesistente, verificare che i due test se ne accorgano e che il messaggio di errore dica quale stringa e quale percorso, poi rimuovere le violazioni e verificare il verde.

Una guardia mai vista fallire non è una guardia: è codice che si presume funzioni.

Il resto della verifica è la simulazione stessa: `npm install`, `npm test`, `npm run build` e `npm run dev` eseguiti dal clone pulito, non dall'albero di lavoro.

## 6. Definition of done

- Un clone pulito arriva a `npm run dev` funzionante seguendo **solo** la documentazione tracciata.
- `npm test` e `npm run build` sono verdi dal clone pulito.
- Le due guardie passano, e ognuna è stata vista fallire per il motivo giusto.
- `docs/cold-install-audit.md` esiste, ordinato per gravità, con la colonna di sopravvivenza compilata.
- I difetti strutturali sono corretti; quelli Drive-era sono registrati e **non** corretti.
- Il claim sul numero di test non è più nel README; `package.json` dichiara `engines`.

## 7. Limiti noti

La simulazione da clone locale non riproduce del tutto "Use this template": GitHub non copia allo stesso modo workflow, impostazioni del repo e branch protection. Il limite va **annotato nell'audit**, non nascosto. La verifica completa di quel percorso avviene in F8, con un destinatario reale su un account reale.

## 8. Fuori scope

- Qualunque modifica al percorso Drive/GCP/Web3Forms oltre alla registrazione degli attriti.
- Il cammino con account esterni (→ F8).
- Una terza guardia, salvo che l'audit non riveli una terza classe silenziosa e ricorrente.
- Il porting di codice dal sito personale (→ F1, F2).

## 9. Binario parallelo — destinatari

Non blocca F0, ma ha una scadenza reale: **prima dell'inizio di F2**.

- Individuare **due** amici sviluppatori che fotografano: nome, tipo di fotografia, dominio già posseduto o no, account Cloudflare già attivo o no. Due, perché il secondo è la riserva se il primo si smarca — e se si smarca a F8 il progetto resta senza la sua verifica.
- Sentire il primo e chiedergli cosa si aspetta di poter fare **da solo** dopo la consegna. La risposta vincola lo scope della dashboard in F2.
