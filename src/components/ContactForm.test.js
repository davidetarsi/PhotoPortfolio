import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createContactForm } from './ContactForm.js';

const siteConfig = { turnstileSitekey: '' };
const texts = {
  about: {
    form: {
      namePlaceholder: 'Nome',
      emailPlaceholder: 'Email',
      subjectPlaceholder: 'Soggetto',
      messagePlaceholder: 'Messaggio',
      submitLabel: 'Invia',
      successMessage: 'Messaggio inviato. Ti risponderò presto.',
      challengeErrorMessage: 'Verifica anti-spam non riuscita. Ricarica la pagina e riprova.',
      challengeExpiredMessage: 'Verifica anti-spam scaduta. Attendi un istante e riprova.',
      errorMessage: "Errore durante l'invio. Riprova più tardi.",
    },
  },
};

describe('createContactForm', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => {
    document.head.querySelectorAll('script[src*="challenges.cloudflare.com/turnstile"]')
      .forEach(script => script.remove());
    vi.unstubAllGlobals();
  });

  it('renders all required named fields', () => {
    const form = createContactForm(siteConfig, texts);
    expect(form.querySelector('[name="name"]')).not.toBeNull();
    expect(form.querySelector('[name="email"]')).not.toBeNull();
    expect(form.querySelector('[name="message"]')).not.toBeNull();
    expect(form.querySelector('[name="botcheck"]')).not.toBeNull();
  });

  it('renders subject field when needed', () => {
    const form = createContactForm(siteConfig, texts);
    expect(form.querySelector('[name="subject"]')).not.toBeNull();
  });

  it('honeypot is a checkbox with class contact-form__honeypot', () => {
    const form = createContactForm(siteConfig, texts);
    const honeypot = form.querySelector('[name="botcheck"]');
    expect(honeypot.type).toBe('checkbox');
    expect(honeypot.classList.contains('contact-form__honeypot')).toBe(true);
  });

  it('carica Turnstile nella modalita di rendering esplicita', () => {
    createContactForm({ turnstileSitekey: 'test-sitekey' }, texts);

    const script = document.head.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]',
    );
    expect(script).not.toBeNull();
    expect(script.src).toBe(
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
    );
  });

  it('invia a /api/contact, non a un servizio esterno', async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', fetchSpy);

    const form = createContactForm(siteConfig, texts);
    document.body.appendChild(form);
    form.querySelector('[name="name"]').value = 'Mario';
    form.querySelector('[name="email"]').value = 'm@e.it';
    form.querySelector('[name="message"]').value = 'Ciao';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(fetchSpy.mock.calls[0][0]).toBe('/api/contact');
  });

  it('manda anche il campo subject quando compilato', async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', fetchSpy);

    const form = createContactForm(siteConfig, texts);
    document.body.appendChild(form);
    form.querySelector('[name="name"]').value = 'Mario';
    form.querySelector('[name="email"]').value = 'm@e.it';
    form.querySelector('[name="subject"]').value = 'Matrimonio';
    form.querySelector('[name="message"]').value = 'Ciao';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(JSON.parse(fetchSpy.mock.calls[0][1].body).subject).toBe('Matrimonio');
  });

  it('non manda subject quando vuoto', async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', fetchSpy);

    const form = createContactForm(siteConfig, texts);
    document.body.appendChild(form);
    form.querySelector('[name="name"]').value = 'Mario';
    form.querySelector('[name="email"]').value = 'm@e.it';
    form.querySelector('[name="message"]').value = 'Ciao';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect('subject' in JSON.parse(fetchSpy.mock.calls[0][1].body)).toBe(false);
  });

  it('shows successMessage in feedback element on ok true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: true }),
    }));

    const form = createContactForm(siteConfig, texts);
    document.body.appendChild(form);
    form.querySelector('[name="name"]').value = 'Mario';
    form.querySelector('[name="email"]').value = 'm@e.it';
    form.querySelector('[name="message"]').value = 'Ciao';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(form.querySelector('.contact-form__feedback').textContent)
      .toBe(texts.about.form.successMessage);
  });

  it('calls form.reset() on ok true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: true }),
    }));

    const form = createContactForm(siteConfig, texts);
    document.body.appendChild(form);
    const resetSpy = vi.spyOn(form, 'reset');
    form.querySelector('[name="name"]').value = 'Mario';
    form.querySelector('[name="email"]').value = 'm@e.it';
    form.querySelector('[name="message"]').value = 'Ciao';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(resetSpy).toHaveBeenCalledOnce();
  });

  it('shows errorMessage in feedback element on ok false or error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: false }),
    }));

    const form = createContactForm(siteConfig, texts);
    document.body.appendChild(form);
    form.querySelector('[name="name"]').value = 'Mario';
    form.querySelector('[name="email"]').value = 'm@e.it';
    form.querySelector('[name="message"]').value = 'Ciao';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(form.querySelector('.contact-form__feedback').textContent)
      .toBe(texts.about.form.errorMessage);
  });

  it('invia il token del widget Turnstile renderizzato', async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('turnstile', {
      render: vi.fn(() => 'widget-123'),
      getResponse: vi.fn(widgetId => widgetId === 'widget-123' ? 'token-abc' : ''),
      reset: vi.fn(),
    });

    const form = createContactForm({ turnstileSitekey: 'test-sitekey' }, texts);
    document.body.appendChild(form);
    await new Promise(r => setTimeout(r, 0));
    form.querySelector('[name="name"]').value = 'Mario';
    form.querySelector('[name="email"]').value = 'm@e.it';
    form.querySelector('[name="message"]').value = 'Ciao';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(payload['cf-turnstile-response']).toBe('token-abc');
  });

  it('non invia senza token Turnstile e mostra un errore specifico', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('turnstile', {
      render: vi.fn(() => 'widget-123'),
      getResponse: vi.fn(() => ''),
      reset: vi.fn(),
    });

    const form = createContactForm({ turnstileSitekey: 'test-sitekey' }, texts);
    document.body.appendChild(form);
    await new Promise(r => setTimeout(r, 0));
    form.querySelector('[name="name"]').value = 'Mario';
    form.querySelector('[name="email"]').value = 'm@e.it';
    form.querySelector('[name="message"]').value = 'Ciao';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(form.querySelector('.contact-form__feedback').textContent)
      .toBe(texts.about.form.challengeErrorMessage);
  });

  it('mostra un errore specifico quando il Worker rifiuta la challenge', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ error: 'CHALLENGE_FAILED' }),
      { status: 403 },
    )));
    vi.stubGlobal('turnstile', {
      render: vi.fn(() => 'widget-123'),
      getResponse: vi.fn(() => 'token-abc'),
      reset: vi.fn(),
    });

    const form = createContactForm({ turnstileSitekey: 'test-sitekey' }, texts);
    document.body.appendChild(form);
    await new Promise(r => setTimeout(r, 0));
    form.querySelector('[name="name"]').value = 'Mario';
    form.querySelector('[name="email"]').value = 'm@e.it';
    form.querySelector('[name="message"]').value = 'Ciao';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(form.querySelector('.contact-form__feedback').textContent)
      .toBe(texts.about.form.challengeErrorMessage);
  });

  it('reimposta lo stesso widget Turnstile dopo un invio riuscito', async () => {
    const reset = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true }))));
    vi.stubGlobal('turnstile', {
      render: vi.fn(() => 'widget-123'),
      getResponse: vi.fn(() => 'token-abc'),
      reset,
    });

    const form = createContactForm({ turnstileSitekey: 'test-sitekey' }, texts);
    document.body.appendChild(form);
    await new Promise(r => setTimeout(r, 0));
    form.querySelector('[name="name"]').value = 'Mario';
    form.querySelector('[name="email"]').value = 'm@e.it';
    form.querySelector('[name="message"]').value = 'Ciao';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(reset).toHaveBeenCalledWith('widget-123');
  });

  it('mostra un errore specifico quando Turnstile segnala un errore client', async () => {
    vi.stubGlobal('turnstile', {
      render: vi.fn((_element, options) => {
        options['error-callback']('110200');
        return 'widget-123';
      }),
      getResponse: vi.fn(() => ''),
      reset: vi.fn(),
    });

    const form = createContactForm({ turnstileSitekey: 'test-sitekey' }, texts);
    document.body.appendChild(form);
    await new Promise(r => setTimeout(r, 0));

    expect(form.querySelector('.contact-form__feedback').textContent)
      .toBe(texts.about.form.challengeErrorMessage);
  });

  it('rinnova lo stesso widget quando il token Turnstile scade', async () => {
    let renderOptions;
    const reset = vi.fn();
    vi.stubGlobal('turnstile', {
      render: vi.fn((_element, options) => {
        renderOptions = options;
        return 'widget-123';
      }),
      getResponse: vi.fn(() => ''),
      reset,
    });

    const form = createContactForm({ turnstileSitekey: 'test-sitekey' }, texts);
    document.body.appendChild(form);
    await new Promise(r => setTimeout(r, 0));
    renderOptions['expired-callback']();

    expect(reset).toHaveBeenCalledWith('widget-123');
    expect(form.querySelector('.contact-form__feedback').textContent)
      .toBe(texts.about.form.challengeExpiredMessage);
  });

  it('inputs have aria-label attributes matching placeholders', () => {
    const form = createContactForm(siteConfig, texts);
    expect(form.querySelector('[name="name"]').getAttribute('aria-label'))
      .toBe(texts.about.form.namePlaceholder);
    expect(form.querySelector('[name="email"]').getAttribute('aria-label'))
      .toBe(texts.about.form.emailPlaceholder);
    expect(form.querySelector('[name="message"]').getAttribute('aria-label'))
      .toBe(texts.about.form.messagePlaceholder);
  });
});
