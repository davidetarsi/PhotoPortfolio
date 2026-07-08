import '../styles/hero.css';

export function renderHero(container, siteConfig, texts) {
  const hasImg = Boolean(siteConfig.heroImageUrl);
  const imgHtml = hasImg ? `<img class="hero__bg" alt="" fetchpriority="high" decoding="sync">` : '';
  container.innerHTML = `
    <div class="hero__inner">
      ${imgHtml}
      <div class="hero__content">
        <h1 class="hero__title"></h1>
        <p class="hero__subtitle"></p>
      </div>
    </div>
  `;
  if (hasImg) {
    container.querySelector('.hero__bg').setAttribute('src', siteConfig.heroImageUrl);
  }
  container.querySelector('.hero__title').textContent = siteConfig.name;
  container.querySelector('.hero__subtitle').textContent = texts.landing.heroSubtitle;
}
