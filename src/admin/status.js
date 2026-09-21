import { texts } from '../../config/texts.config.js';
import { siteConfig } from '../../config/site.config.js';

// Shared state helper between home.js and album.js: a badge ("Last action" /
// "Error") followed by message and timestamp, so the result of the last action
// is visually distinct at a glance, not just from text.

/**
 * Creates a status display interface for showing operation results.
 * Returns functions to update status badge, message, and timestamp.
 * Note: say() closure captures DOM refs that may be recreated on re-render.
 * @param {HTMLElement} el - The status container element.
 * @returns {{say: Function, run: Function}} Object with say(msg, isError) and run(fn) methods.
 */
export function createStatus(el) {
  const badge = el.querySelector('.admin-status__badge');
  const text = el.querySelector('.admin-status__text');
  const time = el.querySelector('.admin-status__time');

  const say = (msg, isError = false) => {
    badge.textContent = isError ? texts.admin.status.error : texts.admin.status.lastAction;
    badge.classList.toggle('admin-status__badge--error', isError);
    text.textContent = msg;
    time.textContent = new Date().toLocaleString(siteConfig.language || 'it', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const run = fn => fn().catch(err => say(err.message, true));

  return { say, run };
}
