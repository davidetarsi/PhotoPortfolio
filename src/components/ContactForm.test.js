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
      errorMessage: "Errore durante l'invio. Riprova più tardi.",
    },
  },
};

describe('createContactForm', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { vi.unstubAllGlobals(); });

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
