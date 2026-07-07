import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createContactForm } from './ContactForm.js';

const siteConfig = { web3formsAccessKey: 'test-key-123' };
const texts = {
  contatti: {
    form: {
      namePlaceholder: 'Nome',
      emailPlaceholder: 'Email',
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
    expect(form.querySelector('[name="access_key"]')).not.toBeNull();
    expect(form.querySelector('[name="botcheck"]')).not.toBeNull();
  });

  it('honeypot is a checkbox with class contact-form__honeypot', () => {
    const form = createContactForm(siteConfig, texts);
    const honeypot = form.querySelector('[name="botcheck"]');
    expect(honeypot.type).toBe('checkbox');
    expect(honeypot.classList.contains('contact-form__honeypot')).toBe(true);
  });

  it('access_key hidden input value matches siteConfig.web3formsAccessKey', () => {
    const form = createContactForm(siteConfig, texts);
    expect(form.querySelector('[name="access_key"]').getAttribute('value')).toBe('test-key-123');
  });

  it('submit calls fetch with correct URL and FormData body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const form = createContactForm(siteConfig, texts);
    document.body.appendChild(form);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.web3forms.com/submit',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
    );
  });

  it('shows successMessage in feedback element on data.success true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    }));

    const form = createContactForm(siteConfig, texts);
    document.body.appendChild(form);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(form.querySelector('.contact-form__feedback').textContent)
      .toBe(texts.contatti.form.successMessage);
  });

  it('calls form.reset() on data.success true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    }));

    const form = createContactForm(siteConfig, texts);
    document.body.appendChild(form);
    const resetSpy = vi.spyOn(form, 'reset');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(resetSpy).toHaveBeenCalledOnce();
  });

  it('shows errorMessage in feedback element on data.success false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    }));

    const form = createContactForm(siteConfig, texts);
    document.body.appendChild(form);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 0));

    expect(form.querySelector('.contact-form__feedback').textContent)
      .toBe(texts.contatti.form.errorMessage);
  });

  it('inputs have aria-label attributes matching placeholders', () => {
    const form = createContactForm(siteConfig, texts);
    expect(form.querySelector('[name="name"]').getAttribute('aria-label'))
      .toBe(texts.contatti.form.namePlaceholder);
    expect(form.querySelector('[name="email"]').getAttribute('aria-label'))
      .toBe(texts.contatti.form.emailPlaceholder);
    expect(form.querySelector('[name="message"]').getAttribute('aria-label'))
      .toBe(texts.contatti.form.messagePlaceholder);
  });
});
