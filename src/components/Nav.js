import '../styles/nav.css';

export function renderNav(container, siteConfig, texts) {
  container.innerHTML = `
    <nav class="site-nav">
      <a href="/" class="site-nav__brand"></a>
      <div class="site-nav__links">
        <a href="/contatti.html"></a>
      </div>
    </nav>
  `;
  container.querySelector('.site-nav__brand').textContent = siteConfig.name;
  container.querySelector('.site-nav__links a').textContent = texts.nav.contattiLabel;
}
