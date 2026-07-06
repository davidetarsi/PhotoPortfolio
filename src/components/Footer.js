import '../styles/footer.css';

export function renderFooter(container, texts) {
  container.innerHTML = `
    <footer class="site-footer">
      <span class="site-footer__copyright"></span>
    </footer>
  `;
  container.querySelector('.site-footer__copyright').textContent = texts.footer.copyright;
}
