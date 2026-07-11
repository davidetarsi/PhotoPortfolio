import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { showPreview, hidePreview } from './preview.js';

// NOTA: rispetto al brief originale, aggiunto `footer.copyright` — showPreview
// chiama anche renderFooter(), che accede a texts.footer.copyright senza
// optional chaining (src/components/Footer.js:11). Il fixture del brief
// aveva solo `landing`, causando un TypeError in ogni test. Placeholder
// '© 2026' allineato alla convenzione già usata in Footer.test.js.
const texts = { landing: { heroSubtitle: 'Sottotitolo statico.' }, footer: { copyright: '© 2026' } };
const pending = { name: 'Davide', bio: 'La mia bio', heroUrl: 'https://x/img.webp', social: { instagram: 'https://instagram.com/x' } };

describe('showPreview / hidePreview', () => {
  let container;
  beforeEach(() => {
    container = document.createElement('div');
    // NOTA: rispetto al brief originale, aggiunta la classe admin-preview.
    // currentPreviewEl() in preview.js cerca deliberatamente il contenitore
    // vivo via document.querySelector('.admin-preview') ad ogni keydown
    // (invece di chiudersi su un riferimento stantio — vedi commento in
    // preview.js). In produzione questa classe sta già nel markup che
    // home.js (Task 3) renderizza; qui va replicata sul contenitore di
    // test, altrimenti la query non trova mai nulla e Escape/Tab non
    // intervengono mai.
    container.className = 'admin-preview';
    container.hidden = true;
    document.body.replaceChildren(container);
  });
  afterEach(() => { document.body.replaceChildren(); });

  it('mostra il contenitore e renderizza titolo, sottotitolo (bio) e link social', () => {
    showPreview(container, pending, texts);
    expect(container.hidden).toBe(false);
    expect(container.querySelector('.hero__title').textContent).toBe('Davide');
    expect(container.querySelector('.hero__subtitle').textContent).toBe('La mia bio');
    expect(container.querySelector('.site-footer__link').getAttribute('href')).toBe('https://instagram.com/x');
  });

  it('sposta il focus sul tasto Chiudi', () => {
    showPreview(container, pending, texts);
    expect(document.activeElement).toBe(container.querySelector('.admin-preview__close'));
  });

  it('hidePreview nasconde e svuota il contenitore', () => {
    showPreview(container, pending, texts);
    hidePreview(container);
    expect(container.hidden).toBe(true);
    expect(container.innerHTML).toBe('');
  });

  it('click sul tasto Chiudi chiama hidePreview', () => {
    showPreview(container, pending, texts);
    container.querySelector('.admin-preview__close').click();
    expect(container.hidden).toBe(true);
  });

  it('Escape chiude solo quando il contenitore è visibile', () => {
    // overlay chiuso: Escape non deve fare nulla (niente da verificare se non l'assenza di errori)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.hidden).toBe(true);

    showPreview(container, pending, texts);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container.hidden).toBe(true);
    expect(container.innerHTML).toBe('');
  });

  it('il listener keydown è agganciato una sola volta anche dopo molte show/hide ripetute', () => {
    const spy = vi.spyOn(document, 'addEventListener');
    showPreview(container, pending, texts);
    hidePreview(container);
    showPreview(container, pending, texts);
    hidePreview(container);
    showPreview(container, pending, texts);
    const keydownCalls = spy.mock.calls.filter(([type]) => type === 'keydown');
    expect(keydownCalls.length).toBeLessThanOrEqual(1);
    spy.mockRestore();
  });

  it('Tab sull\'ultimo elemento focusabile (link social) torna al primo (Chiudi) — anello, non snap-back', () => {
    showPreview(container, pending, texts); // pending ha instagram → un link social presente
    const closeBtn = container.querySelector('.admin-preview__close');
    const link = container.querySelector('.site-footer__link');
    expect(link).not.toBeNull(); // pre-condizione: il test non ha senso senza un link da raggiungere

    link.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(tabEvent);
    expect(document.activeElement).toBe(closeBtn);
    expect(tabEvent.defaultPrevented).toBe(true);
  });

  it('Shift+Tab sul primo elemento (Chiudi) va all\'ultimo (link social) — anello nell\'altra direzione', () => {
    showPreview(container, pending, texts);
    const closeBtn = container.querySelector('.admin-preview__close');
    const link = container.querySelector('.site-footer__link');

    closeBtn.focus();
    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(shiftTabEvent);
    expect(document.activeElement).toBe(link);
    expect(shiftTabEvent.defaultPrevented).toBe(true);
  });

  it('Tab NON ai bordi (nessun social, solo il tasto Chiudi) non interviene — non c\'è nulla da ciclare', () => {
    const noSocial = { ...pending, social: {} };
    showPreview(container, noSocial, texts);
    expect(container.querySelector('.site-footer__link')).toBeNull(); // un solo elemento focusabile: Chiudi

    const closeBtn = container.querySelector('.admin-preview__close');
    closeBtn.focus();
    // Chiudi è sia primo che ultimo: Tab in avanti deve comunque tenerlo lì (anello di un solo elemento)
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(tabEvent);
    expect(document.activeElement).toBe(closeBtn);
  });
});
