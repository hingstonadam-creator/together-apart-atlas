const rail = document.querySelector('.index-rail');
const toggle = rail.querySelector('.index-toggle');
const compact = matchMedia('(max-width: 820px)');

function closeIndex() {
  toggle.setAttribute('aria-expanded', 'false');
}

function syncLayout() {
  closeIndex();
  toggle.hidden = !compact.matches;
}
syncLayout();
compact.addEventListener('change', syncLayout);
toggle.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
});
document.addEventListener('click', event => {
  if (!rail.contains(event.target) || event.target.closest('a')) closeIndex();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeIndex();
    toggle.focus();
  }
});
