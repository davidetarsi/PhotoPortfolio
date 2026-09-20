import '../styles/hero.css';

export function renderHero(container, { name, bio, heroUrl }, texts) {
  const imgHtml = heroUrl ? `<img class="hero__bg" alt="" fetchpriority="high" decoding="sync">` : '';
  container.innerHTML = `
    <div class="hero__inner">
      ${imgHtml}
      <div class="hero__content">
        <h1 class="hero__title"></h1>
        <p class="hero__subtitle"></p>
      </div>
    </div>
  `;
  if (heroUrl) {
    container.querySelector('.hero__bg').setAttribute('src', heroUrl);
  }
  container.querySelector('.hero__title').textContent = name;
  container.querySelector('.hero__subtitle').textContent = bio?.trim() ? bio : texts.landing.heroSubtitle;
}
