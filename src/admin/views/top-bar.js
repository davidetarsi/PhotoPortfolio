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
