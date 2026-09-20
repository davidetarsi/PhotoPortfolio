export function topBarHtml({ showBackLink }) {
  return `
    <header class="admin-topbar">
      <span class="admin-topbar__icon">📷</span>
      ${showBackLink ? '<a class="admin-back" href="#/">← Tutti gli album</a>' : ''}
    </header>
  `;
}
