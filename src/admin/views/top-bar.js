/**
 * Generates HTML for the admin top bar with optional navigation or back link.
 * @param {Object} config - Configuration object.
 * @param {boolean} config.showBackLink - If true, show back link; if false, show nav buttons.
 * @returns {string} HTML string for the top bar header.
 */
export function topBarHtml({ showBackLink }) {
  const navButtons = !showBackLink ? `
    <nav class="admin-topbar__nav">
      <a href="#/" class="admin-topbar__nav-link">Album</a>
      <a href="#/messages" class="admin-topbar__nav-link">Messaggi</a>
    </nav>
  ` : '';
  return `
    <header class="admin-topbar">
      <span class="admin-topbar__icon">📷</span>
      ${showBackLink ? '<a class="admin-back" href="#/">← Tutti gli album</a>' : ''}
      ${navButtons}
    </header>
  `;
}
