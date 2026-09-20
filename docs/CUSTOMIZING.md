# Personalizzazione del Template

## Aspetto

| **Voglio cambiare** | **Tocco** | **Opzioni/Note** |
|---|---|---|
| Colori, font, spaziatura | `theme/tokens.css` | Token CSS — tutti i colori nel template usano variabili |
| Aspetto delle card degli album | `theme/card.css`: attiva una delle tre `@import` | `cinematic` (default), `editoriale`, `minimal`. Solo CSS, stesso HTML. |

### Varianti delle card degli album

Tre scelte già pronte, derivate dai mockup nel repository:

- **`cinematic`** (default): Card 4:5, immagine a pieno riquadro, testo sopra un gradiente in basso, zoom lieve allo hover, angoli arrotondati.
- **`editoriale`**: Impianto da rivista, immagine e testo affiancati, filetto di separazione tra gli album, niente riquadri arrotondati.
- **`minimal`**: Nessun riquadro, nessun arrotondamento, testo sotto l'immagine centrato, molta aria intorno.

Per cambiare variante, modifica `theme/card.css` commentando e decommentando la riga `@import` corrispondente. Il dev server ricarica da solo.

Tutte le tre varianti usano lo stesso HTML (nessun ramo condizionale nel JavaScript): differiscono solo per CSS. Se una non convince, sono tre file CSS indipendenti, facilmente personalizzabili o eliminabili.

## Contenuto

| **Voglio cambiare** | **Tocco** |
|---|---|
| Nome, bio, social, foto hero | Dashboard admin (`/admin`), oppure `config/site.config.js` al primo setup |
| Testi d'interfaccia | `config/texts.config.js` — supporta segnaposti `{nome}`, traducibili senza scrivere JavaScript |
| Lingua delle date | `config/site.config.js`: `language: 'it'` |
