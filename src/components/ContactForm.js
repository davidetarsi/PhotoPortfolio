import '../styles/contact-form.css';

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

export function createContactForm(siteConfig, texts) {
  const form = document.createElement('form');
  form.className = 'contact-form';
  form.innerHTML = `
    <div class="contact-form__fields">
      <input class="contact-form__input" type="text" name="name" required>
      <input class="contact-form__input" type="email" name="email" required>
      <textarea class="contact-form__textarea" name="message" required></textarea>
      <input type="hidden" name="access_key">
      <input class="contact-form__honeypot" type="checkbox" name="botcheck">
      <button class="contact-form__submit" type="submit"></button>
    </div>
    <p class="contact-form__feedback" aria-live="polite"></p>
  `;

  form.querySelector('[name="name"]').setAttribute('placeholder', texts.contatti.form.namePlaceholder);
  form.querySelector('[name="email"]').setAttribute('placeholder', texts.contatti.form.emailPlaceholder);
  form.querySelector('[name="message"]').setAttribute('placeholder', texts.contatti.form.messagePlaceholder);
  form.querySelector('[name="name"]').setAttribute('aria-label', texts.contatti.form.namePlaceholder);
  form.querySelector('[name="email"]').setAttribute('aria-label', texts.contatti.form.emailPlaceholder);
  form.querySelector('[name="message"]').setAttribute('aria-label', texts.contatti.form.messagePlaceholder);
  const submitBtn = form.querySelector('.contact-form__submit');
  submitBtn.textContent = texts.contatti.form.submitLabel;
  form.querySelector('[name="access_key"]').setAttribute('value', siteConfig.web3formsAccessKey);

  const feedbackEl = form.querySelector('.contact-form__feedback');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    feedbackEl.textContent = '';
    submitBtn.disabled = true;
    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        body: new FormData(form),
      });
      const data = await res.json();
      if (data.success) {
        feedbackEl.textContent = texts.contatti.form.successMessage;
        form.reset();
      } else {
        feedbackEl.textContent = texts.contatti.form.errorMessage;
      }
    } catch (err) {
      console.error('[ContactForm] submit error:', err);
      feedbackEl.textContent = texts.contatti.form.errorMessage;
    } finally {
      submitBtn.disabled = false;
    }
  });

  return form;
}
