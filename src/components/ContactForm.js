import '../styles/contact-form.css';

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

let turnstileLoaded = false;

async function loadTurnstile() {
  if (turnstileLoaded) return;
  if (window.turnstile) { turnstileLoaded = true; return; }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => { turnstileLoaded = true; resolve(); };
    script.onerror = () => { turnstileLoaded = true; resolve(); };
    document.head.appendChild(script);
  });
}

export function createContactForm(siteConfig, texts) {
  const form = document.createElement('form');
  form.className = 'contact-form';

  const hasTurnstile = siteConfig.turnstileSitekey?.trim();

  form.innerHTML = `
    <div class="contact-form__fields">
      <input class="contact-form__input" type="text" name="name" required>
      <input class="contact-form__input" type="email" name="email" required>
      <input class="contact-form__input" type="text" name="subject">
      <textarea class="contact-form__textarea" name="message" required></textarea>
      <input class="contact-form__honeypot" type="checkbox" name="botcheck">
      ${hasTurnstile ? '<div class="contact-form__turnstile" data-sitekey="' + siteConfig.turnstileSitekey + '" data-theme="auto"></div>' : ''}
      <button class="contact-form__submit" type="submit"></button>
    </div>
    <p class="contact-form__feedback" aria-live="polite"></p>
  `;

  form.querySelector('[name="name"]').setAttribute('placeholder', texts.about.form.namePlaceholder);
  form.querySelector('[name="email"]').setAttribute('placeholder', texts.about.form.emailPlaceholder);
  form.querySelector('[name="subject"]').setAttribute('placeholder', texts.about.form.subjectPlaceholder);
  form.querySelector('[name="message"]').setAttribute('placeholder', texts.about.form.messagePlaceholder);
  form.querySelector('[name="name"]').setAttribute('aria-label', texts.about.form.namePlaceholder);
  form.querySelector('[name="email"]').setAttribute('aria-label', texts.about.form.emailPlaceholder);
  form.querySelector('[name="message"]').setAttribute('aria-label', texts.about.form.messagePlaceholder);

  const submitBtn = form.querySelector('.contact-form__submit');
  submitBtn.textContent = texts.about.form.submitLabel;

  const feedbackEl = form.querySelector('.contact-form__feedback');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    feedbackEl.textContent = '';
    submitBtn.disabled = true;
    try {
      // Prepara il payload
      const payload = {
        name: form.querySelector('[name="name"]').value,
        email: form.querySelector('[name="email"]').value,
        message: form.querySelector('[name="message"]').value,
      };

      // Aggiunge subject se compilato
      const subjectVal = form.querySelector('[name="subject"]').value.trim();
      if (subjectVal) payload.subject = subjectVal;

      // Aggiunge Turnstile token se disponibile
      if (window.turnstile && hasTurnstile) {
        const token = window.turnstile.getResponse();
        if (token) payload['cf-turnstile-response'] = token;
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        feedbackEl.textContent = texts.about.form.successMessage;
        form.reset();
        // Resetta Turnstile se disponibile
        if (window.turnstile && hasTurnstile) {
          window.turnstile.reset();
        }
      } else {
        feedbackEl.textContent = texts.about.form.errorMessage;
      }
    } catch (err) {
      console.error('[ContactForm] submit error:', err);
      feedbackEl.textContent = texts.about.form.errorMessage;
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Carica Turnstile se necessario
  if (hasTurnstile) {
    loadTurnstile().then(() => {
      const turnstileDiv = form.querySelector('.contact-form__turnstile');
      if (turnstileDiv && window.turnstile) {
        window.turnstile.render(turnstileDiv, {
          sitekey: siteConfig.turnstileSitekey,
          theme: 'auto',
          appearance: 'interaction-only',
        });
      }
    });
  }

  return form;
}
