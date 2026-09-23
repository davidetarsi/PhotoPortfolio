# Protezione Turnstile e notifiche ntfy per il form contatti

**Data:** 2026-09-23  
**Stato:** design approvato; implementazione da pianificare  
**Repository coinvolti:** `PhotoPortfolioTemplate` (upstream generico) e `PhotoPortfolio` (downstream personale)

## 1. Obiettivo

Chiudere l'azione manuale 9 attivando sul sito personale:

- verifica Cloudflare Turnstile lato client e lato Worker;
- notifica ntfy quando un messaggio viene salvato;
- link assoluto alla dashboard corretta nella notifica;
- configurazione equivalente sulla produzione e sulla versione di staging;
- verifica live senza esporre credenziali o dati personali reali.

Il form deve continuare a salvare il messaggio su R2 prima di notificare. Un errore del
webhook non deve trasformarsi in un errore visibile al visitatore.

## 2. Stato attuale verificato

Il flusso applicativo esiste già:

- `ContactForm.js` invia il token Turnstile, quando disponibile;
- `turnstile.js` verifica il token con Siteverify e fallisce chiuso in caso di errore;
- `contact-routes.js` valida, salva su R2 e poi invia una notifica best-effort;
- `notifyBody.js` esclude intenzionalmente email e testo del messaggio;
- produzione e staging hanno `TURNSTILE_SITEKEY` presente ma vuota;
- nessun segreto è versionato.

Sono emersi due difetti generici da correggere nell'upstream:

1. la notifica costruisce il link da `env.SITE_URL`, ma questa variabile non viene
   configurata o generata; oggi il link risultante è soltanto `/admin`;
2. il client usa rendering esplicito ma carica lo script senza il parametro
   `?render=explicit` indicato dalla documentazione Turnstile.

La baseline prima del lavoro passa 50 file di test e 405 test.

## 3. Decisioni

### 3.1 Widget Turnstile

Si usa un solo widget **Managed** con hostname autorizzati per:

- il dominio pubblico di produzione;
- l'alias stabile della versione di staging.

La sitekey e il secret sono quindi condivisi dai due ambienti. È la soluzione coerente
con l'attuale configurazione, che genera la stessa sitekey nelle variabili Wrangler di
produzione e staging. Widget distinti richiederebbero nuovi output Terraform e una
diversa struttura della configurazione; non portano un beneficio proporzionato per
questo sito personale.

### 3.2 Canale ntfy

Si usa un solo topic ntfy, lungo e casuale, sottoscritto dal proprietario nell'app ntfy.
L'URL del topic è trattato come una capability segreta e non deve comparire in Git,
documentazione, chat, output o log.

La notifica contiene esclusivamente:

- nome del mittente, troncato al limite già previsto;
- URL assoluto della dashboard dell'host che ha ricevuto il messaggio.

Email, oggetto e testo del messaggio non devono lasciare il Worker.

### 3.3 URL della dashboard

Non si aggiunge `SITE_URL` alla configurazione. Il Worker deriva l'URL con
`new URL('/admin', request.url)`, così produzione, staging e futuri domini usano
automaticamente l'origine corretta senza mantenere una nuova variabile duplicata.

### 3.4 Modello dei secret

Produzione e staging sono versioni dello stesso Worker con binding differenti, non due
Worker autonomi. I secret vengono quindi configurati sul Worker con nome esplicito e
senza `--env staging`.

Durante la preparazione si usa `wrangler versions secret put`, non `wrangler secret put`:
il primo crea una nuova versione senza distribuirla immediatamente, mentre il secondo
crea e attiva subito una versione. Questo evita di attivare `TURNSTILE_SECRET` quando la
sitekey non è ancora servita dal client.

I valori vengono inseriti esclusivamente dall'utente in un terminale interattivo:

- `TURNSTILE_SECRET`;
- `CONTACT_NOTIFY_URL`.

L'agente può controllare soltanto i nomi dei binding o lo stato risultante, mai leggere,
stampare o conservare i valori.

## 4. Strategia upstream/downstream

Le correzioni riutilizzabili nascono in `PhotoPortfolioTemplate`:

- derivazione dell'URL admin dalla richiesta;
- caricamento esplicito ufficiale di Turnstile;
- test di regressione;
- correzione dei runbook sul modello dei secret della versione preview.

Dopo revisione e merge dell'upstream, il downstream importa il commit con un merge
esplicito. Nel downstream si aggiunge soltanto la sitekey pubblica reale alle variabili
Wrangler di produzione e staging. Il secret e l'URL ntfy non entrano mai nella storia
Git.

## 5. Sequenza di attivazione

1. Implementare e verificare le correzioni generiche nell'upstream.
2. Creare il widget Turnstile manuale e autorizzare i due hostname.
3. Importare l'upstream nel downstream e inserire la sitekey pubblica in entrambi i
   blocchi Wrangler.
4. Eseguire test completi, build reale e controllo CSP: quando la sitekey è presente,
   `challenges.cloudflare.com` deve comparire nella policy generata.
5. L'utente crea e sottoscrive il topic ntfy casuale.
6. L'utente inserisce interattivamente entrambi i secret con il comando versionato e il
   nome Worker esplicito.
7. Caricare la versione di staging; verificare che erediti entrambi i secret senza
   promuovere traffico di produzione.
8. Inviare dallo staging un canary neutro, verificare salvataggio in `/admin`, ricezione
   ntfy e assenza di email/testo del messaggio nella notifica.
9. Promuovere in produzione lo stesso tree Git già verificato.
10. Inviare un secondo canary neutro in produzione e ripetere i controlli.
11. Chiudere l'azione 9 nella documentazione upstream e riportare la chiusura nel
    downstream.

I messaggi canary rimangono identificabili come test. Non vengono cancellati senza
un'autorizzazione esplicita dell'utente.

## 6. Test e gate

### Automatici

- test che prova che il notifier riceve un URL assoluto derivato da `request.url`;
- test che la notifica non contiene email né testo del messaggio;
- test che un errore del webhook non annulla il salvataggio;
- test del caricamento Turnstile in modalità esplicita;
- suite completa;
- build con configurazione reale;
- controllo CSP senza stampare sitekey, URL R2 o altri identificatori.

### Live, prima staging e poi produzione

- form renderizzato con Turnstile configurato;
- invio accettato con token valido;
- messaggio presente in `/admin`;
- notifica ricevuta su ntfy;
- notifica priva di email e testo del messaggio;
- link della notifica diretto alla dashboard dell'ambiente corretto;
- nessuna chiave o URL ntfy presente nei file tracciati.

## 7. Responsabilità

### Agente

- implementazione, test, documentazione, PR e revisioni;
- configurazione della sitekey pubblica;
- navigazione Cloudflare per predisporre il widget, senza divulgare il secret;
- verifica dei binding per nome e smoke test neutri;
- promozione dello stesso tree da staging a produzione dopo i gate.

### Davide

- installare ntfy e sottoscrivere un topic lungo e casuale;
- conservare il secret Turnstile;
- inserire `TURNSTILE_SECRET` e `CONTACT_NOTIFY_URL` nei prompt interattivi;
- confermare sul proprio dispositivo la ricezione e il contenuto sicuro della notifica.

## 8. Criteri di completamento

L'azione 9 è chiusa soltanto quando:

- test, build e CSP passano;
- staging e produzione servono lo stesso tree verificato;
- Turnstile valida realmente i token sui due hostname;
- un messaggio neutro viene salvato e notificato in entrambi gli ambienti;
- Davide conferma che la notifica non contiene email né corpo del messaggio;
- i segreti non sono comparsi in Git, chat, log o documentazione;
- runbook e azioni manuali descrivono il modello realmente verificato.
