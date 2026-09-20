# Runbook Cloudflare — Configurazione manuale dell'infrastruttura

Questo documento descrive come configurare l'infrastruttura Cloudflare per il portafoglio fotografico manualmente dalla dashboard, senza usare Terraform. È il percorso equivalente al file di configurazione `infra/` — produce lo stesso risultato, ed è supportato come alternativa permanente.

Chi preferisce Terraform può saltare questo documento e seguire il percorso automatico in `README.md`. Chi ha già creato le risorse a mano seguirà la sezione [Importare risorse preesistenti](#infrastruttura-preesistente-terraform-import).

## 1. Prerequisiti

Devi avere:

- **Account Cloudflare attivo** con accesso alla dashboard e permessi per creare bucket R2, domini pubblici e applicazioni Access (Zero Trust).
- **Dominio di produzione** (opzionale al primo deploy, obbligatorio prima di andare in produzione). Nel nostro esempio useremo un dominio custom come `davidetarsi.com`, già una zona Cloudflare attiva. Se non hai un dominio, nei primi test puoi usare il dominio `workers.dev` fornito da Cloudflare (di sola lettura, con limitazioni di rate).
- **Zone ID** del dominio custom, se lo usi per le foto. Trovalo in Cloudflare dashboard → seleziona il dominio → copia lo Zone ID dalla barra laterale destra.

## 2. Token API Cloudflare

Le operazioni di Terraform richiedono un token API con permessi specifici. Se non usi Terraform, non hai bisogno di questo token: salta a [Percorso manuale](#percorso-manuale). Se lo usi in futuro, il token deve avere:

- **Workers R2 Storage: Edit** — permette di creare e modificare bucket R2.
- **Access: Apps and Policies: Edit** — permette di creare applicazioni Access e policy.
- **Zone: DNS: Edit** (solo se usi un dominio custom per le foto) — permette di configurare record DNS sul dominio.

Crea il token in Cloudflare dashboard → **Account → API Tokens → Create Token** e assegnagli questi permessi. **Importantissimo:** non scrivere mai il token in un file versionato (non andrà mai in `.env`, `wrangler.json`, o `terraform.tfvars`). Esportalo soltanto come variabile d'ambiente nel tuo shell:

```bash
export CLOUDFLARE_API_TOKEN="il-tuo-token-qui"
```

Se accidentalmente lo scrivi in un file, invalida il token su Cloudflare subito e creane uno nuovo.

## 3. Percorso Terraform

Se usi Terraform, il flusso è:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# Ora compila terraform.tfvars con i tuoi valori:
# - account_id: trovalo in Cloudflare dashboard → Account → barra laterale destra
# - project_name: prefisso dei bucket, es. 'mario-portfolio'
# - access_team_domain: il team domain Zero Trust dell'account, formato team.cloudflareaccess.com
# - prod_hostname: il tuo dominio, es. 'mario.com'
# - staging_hostname: lo riempirai dopo il primo deploy (vedi prossima sezione)
# - admin_emails: email autorizzate alla dashboard admin

export CLOUDFLARE_API_TOKEN="..."
terraform init
terraform apply
terraform -chdir=. output -json > outputs.json
cd ..
npm run infra:sync
```

Questo crea tutti i bucket, i domini pubblici e le applicazioni Access in un unico comando. Se tutto va bene, `wrangler.json` è già pronto e sincronizzato.

## 4. Vincolo d'ordine: `staging_hostname` non si conosce prima del primo deploy

Cloudflare assegna un hostname `workers.dev` (es. `mario-portfolio-staging.xxxxx.workers.dev`) solo dopo il primo deploy del Worker. Quindi al primo deploy non conosci ancora questo valore — non puoi scriverlo in `terraform.tfvars` e lanciare `terraform apply` diritto.

Soluzione: applicare **solo i bucket** al primo giro:

```bash
terraform apply -target=cloudflare_r2_bucket.prod -target=cloudflare_r2_bucket.staging
```

Poi fai il primo deploy (vedi [Git integration](#git-integration) qui sotto). Dopo il deploy, leggi il dominio `workers.dev` assegnato dal dashboard Cloudflare:

```bash
# Cloudflare dashboard → Workers & Pages → photo-portfolio-staging → Settings → Domains & Routes
# Copia l'URL nel formato mario-portfolio-staging.xxxxx.workers.dev
```

Riempi il valore in `terraform.tfvars` e rilancia l'apply completo:

```bash
terraform apply  # Adesso applica tutto, incluse Access e domini gestiti r2.dev
```

Se usi il percorso manuale (senza Terraform), questo vincolo non ti riguarda — le applicazioni Access si creano manualmente passo per passo.

## 5. Percorso manuale — Creare le risorse da Cloudflare dashboard

### Bucket R2

1. Cloudflare dashboard → **R2 → Create Bucket**
2. Nome: `{project_name}` (es. `mario-portfolio`)
3. Replica region: no (opzionale, serve solo per ridondanza geografica)
4. Create

Ripeti il processo per il bucket di staging, con nome `{project_name}-staging` (es. `mario-portfolio-staging`).

### Domini gestiti R2 (r2.dev)

1. Dashboard → **R2 → seleziona il bucket prod → Settings → Public access → Edit**
2. Abilita l'accesso pubblico
3. Copia il dominio mostrato (formato `pub-xxxxxxxx.r2.dev`)

Ripeti per il bucket di staging. Questi domini sono usati per esporre le foto — sono rate-limited e senza cache, adatti solo per sviluppo. Prima di andare in produzione, valuta un dominio custom (vedi sezione 8).

### Applicazione Access per `/admin` (solo su dominio reale)

Se usi un dominio reale (non `workers.dev`), Access su Cloudflare sa limitarsi ai percorsi specifici. Configura così:

1. Cloudflare dashboard → **Zero Trust → Access → Applications → Create new application**
2. Seleziona **Self-hosted and private**
3. Nome: es. `mario-portfolio admin (prod)`
4. **Add public hostname:**
   - Domain: il tuo dominio (es. `mario.com`)
   - Path: `admin`
   - Repeat per aggiungere `/api/admin`
5. Access policies → **Create new policy**:
   - Name: `Solo io`
   - Decision: **Allow**
   - Include → **Emails** → la tua email (es. `mario@mario.com`)
6. Identity providers: lascia **One-time PIN** (è il default, non richiede setup aggiuntivo)
7. Save and create application
8. Copia il valore **Audience (AUD) Tag** dalla pagina dell'applicazione

Se usi `workers.dev` per lo staging, Access non sa fare path-scoping su quel dominio — protegge l'intero sottodominio. Crea un'applicazione separata che proteggono tutto `mario-portfolio-staging.xxxxx.workers.dev`.

### Team domain Zero Trust

Il team domain è fornito da Cloudflare con il primo account Zero Trust — formato `{team}.cloudflareaccess.com` (es. `mario.cloudflareaccess.com`). Non lo crei, esiste già. È usato dal Worker per validare i JWT emessi da Access — vedi `ACCESS_TEAM_DOMAIN` in `wrangler.json`.

Trovalo in: Cloudflare dashboard → **Zero Trust → Settings → Custom domain**. Se non lo vedi, navigando a **Access → Applications** troverai il team domain nella URL del browser (`https://{team}.cloudflareaccess.com/...`).

## 6. Git integration — Collegare il repository

Cloudflare ti consente di deployare il Worker direttamente da Git — non serve GitHub Actions, è nativa.

1. Cloudflare dashboard → **Workers & Pages → Create application → Pages**
2. Connetti il tuo GitHub account (se non già fatto)
3. Seleziona il repository del portafoglio
4. Configura il build:
   - **Build command:** `npm test && npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (lascia il default)
5. Ambiente: aggiungi le variabili d'ambiente se necessarie (nel tuo caso, probabilmente nessuna — `wrangler.json` è nel repo)
6. **Production branch:** `main` (per il Worker di produzione)
7. **Staging branch:** `staging` (per il Worker di staging)

Cloudflare creerà due Worker automaticamente:
- `{project-name}` da branch `main` (raggiungibile su `{project-name}.{account-subdomain}.workers.dev` e collegato al dominio custom se lo hai configurato)
- `{project-name}-staging` da branch `staging` (raggiungibile su `{project-name}-staging.{account-subdomain}.workers.dev`)

Ogni push triggerera un nuovo deploy automaticamente.

## 7. Infrastruttura preesistente — terraform import

Se hai già creato bucket, domini pubblici o applicazioni Access manualmente (come nel caso del sito di Davide), puoi importarli in Terraform anziché ricrearli. Usa `terraform import`:

```bash
# Importa il bucket di produzione
terraform import cloudflare_r2_bucket.prod {account_id}/{bucket-name}

# Importa il bucket di staging
terraform import cloudflare_r2_bucket.staging {account_id}/{bucket-name}-staging

# Importa il dominio gestito di produzione (trova l'ID sul dashboard R2, campo "Public access domain ID")
terraform import cloudflare_r2_managed_domain.prod {account_id}/{domain-id}

# Importa il dominio gestito di staging
terraform import cloudflare_r2_managed_domain.staging {account_id}/{domain-id}

# Importa l'applicazione Access di produzione (copia l'ID dalla dashboard Access → Applications → Settings)
terraform import cloudflare_zero_trust_access_application.prod {account_id}/{app-id}

# Importa l'applicazione Access di staging
terraform import cloudflare_zero_trust_access_application.staging {account_id}/{app-id}

# Importa la policy Access (copia l'ID dalla pagina dell'applicazione → Access policies)
terraform import cloudflare_zero_trust_access_policy.solo_admin {account_id}/{policy-id}
```

Dopo gli `import`, verifica che `terraform plan` non proponga ulteriori modifiche. Se propone campi che non hai specificato in `.tf`, aggiungerli ai file di configurazione per farli convergere.

Se preferisci restare sul percorso manuale senza Terraform, non hai bisogno di importare — le risorse sono già live e il Worker legge da `wrangler.json`, che compili a mano.

## 8. Dominio custom per le foto

Per la produzione, Cloudflare consiglia **fortemente** un dominio custom per le foto invece di usare `r2.dev`. Il motivo: `r2.dev` è rate-limited (Cloudflare lo dichiara da sé), senza cache, senza WAF. Un dominio custom (es. `img.mario.com`) su una zona Cloudflare reale ti dà:

- Cache edge di Cloudflare (immagini servite più veloce)
- WAF (protezione da attacchi)
- Controlli d'accesso e rate-limiting via Firewall Rules

Se usi Terraform, attiva il dominio custom valorizzando `custom_photo_domain` e `photo_domain_zone_id` in `terraform.tfvars`:

```hcl
custom_photo_domain  = "img.mario.com"
photo_domain_zone_id = "il-tuo-zone-id"
```

Se procedi manualmente:

1. Crea un CNAME record nel DNS del dominio (`mario.com`):
   - Host: `img`
   - Target: `mario-portfolio.s.cloudflarestorage.com` (sostituisci `mario-portfolio` con il tuo bucket name)
   - (Cloudflare ti mostrerà il target esatto quando crei il dominio custom nel passo 2)
2. Cloudflare dashboard → **R2 → seleziona il bucket prod → Settings → Public access → Add custom domain**
3. Digita `img.mario.com`
4. Copia il target CNAME mostrato e completalo nel DNS di mario.com

### Procedura d'ordine: attivare il custom e poi spegnere r2.dev

Una volta che il DNS propaga (pochi minuti), segui questi passi **nell'ordine esatto**: l'ordine non è arbitrario, poiché spegnere r2.dev prima di aver verificato il custom lascerebbe il sito senza foto.

1. **Verifica che il dominio custom sia disponibile** sulla zona Cloudflare che lo contiene. Sulla dashboard R2 → seleziona il bucket prod → Settings → Public access → dovresti vedere il dominio custom accanto a `r2.dev`.

2. **Abilita il dominio custom in Terraform** (se usi Terraform) — valorizza `custom_photo_domain` e `photo_domain_zone_id` in `terraform.tfvars`:
   ```hcl
   custom_photo_domain  = "img.mario.com"
   photo_domain_zone_id = "il-tuo-zone-id"
   # Ancora true — verifichiamo il custom prima di spegnere r2.dev
   keep_managed_domain = true
   ```

   **Se usi il percorso manuale,** salta questo passo — il custom esiste già dalla sezione precedente.

3. **Applica le modifiche** e sincronizza il config:
   ```bash
   cd infra
   terraform apply
   cd ..
   terraform -chdir=infra output -json > infra/outputs.json
   npm run infra:sync
   ```
   
   Questo aggiorna `wrangler.json` e la build inizia a includere il dominio custom nella CSP di `dist/_headers`.

4. **Attendi il DNS e verifica che il dominio custom serva le foto**, con un test dal terminale:
   ```bash
   curl -sI https://img.mario.com/sport/foto.webp
   # Atteso: HTTP/2 200 (non 404, non 403)
   ```
   
   Se vedi `404 Not Found`, il DNS non è ancora propagato o Cloudflare non sa dove trovare il bucket. Attendi e riprova.

5. **Deployare e verificare i meta social** (og:image, og:title):
   ```bash
   # Build locale per verificare che og:image usi il dominio custom
   npm run build
   # Se il sito ha un eroe configurato, il meta og:image contiene il dominio custom.
   # Se l'eroe è vuoto (template seed), il meta og:image non esiste (comportamento atteso).
   grep -o 'og:image[^>]*' dist/index.html
   ```
   
   Condividi l'URL del sito su una chat o usa un [validatore Open Graph](https://www.opengraphcheck.com/) per verificare che i crawler vedano titolo e immagine. È il percorso che questo punto ha sistemato.

6. **Solo dopo aver verificato che il custom funziona**, spegni il dominio `r2.dev` in Terraform:
   ```hcl
   keep_managed_domain = false
   ```
   
   Applica:
   ```bash
   cd infra
   terraform apply
   cd ..
   ```
   
   Da questo momento il dominio `r2.dev` sul bucket di produzione non è più raggiungibile. **Attenzione:** qualsiasi URL `r2.dev` già condiviso (su social, email, forum) smetterà di funzionare.

7. **Se hai link r2.dev che circolano**, valuta di rimandare il passo 6 fino a quando non è sicuro lasciarli morire (per es. dopo 1-3 mesi). Puoi tenerlo acceso fin quando ti pare — `keep_managed_domain` lo permette.

Lo staging non cambia: non ha un dominio custom, quindi il suo `r2.dev` resta sempre acceso.

---

## Riassunto del flusso manuale

1. Crea i due bucket R2 e i loro domini gestiti r2.dev dalla dashboard.
2. Crea l'applicazione Access (`/admin` + `/api/admin/*`) con policy Allow per le tue email.
3. Copia team domain + AUD dalla dashboard.
4. Compila `wrangler.json` manualmente (copia `wrangler.example.json`, compila bucket name, R2 URL pubblico, team domain, AUD).
5. Collega il repository a Cloudflare Workers & Pages con branch `main` e `staging`.
6. Fai un push per triggare il primo deploy. Leggi l'hostname `workers.dev` assegnato.
7. Se usi Terraform in seguito, importa le risorse esistenti con `terraform import`.
8. (Opzionale) Attiva un dominio custom per le foto per andare in produzione.

Sia con Terraform che manualmente, la CSP in `dist/_headers` si genera da `wrangler.json` durante la build — non è hardcodificata, quindi resta corretta qualunque percorso tu scelga.
