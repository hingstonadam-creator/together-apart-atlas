const rail = document.querySelector('.index-rail');
const toggle = rail.querySelector('.index-toggle');
const currentLabel = toggle.querySelector('.current-label');
const compact = matchMedia('(max-width: 820px)');
const links = Array.from(rail.querySelectorAll('[data-chapter]'));
const chapters = links.map(link => document.getElementById(link.dataset.chapter));
const continuous = chapters.every(Boolean);

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

if (continuous) {
  function updateChapter() {
    const boundary = compact.matches ? Math.max(toggle.offsetHeight + 28, 98) : 40;
    let active = -1;
    for (let i = 0; i < chapters.length; i++) {
      if (chapters[i].getBoundingClientRect().top > boundary) break;
      active = i;
    }
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) active = links.length - 1;
    links.forEach((link, i) => {
      if (i === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    currentLabel.textContent = active < 0 ? 'Introduction' :
      Array.from(links[active].children, el => el.textContent).join(' / ');
  }
  let pending = false;
  function scheduleUpdate() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      updateChapter();
    });
  }
  window.addEventListener('scroll', scheduleUpdate, {passive:true});
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  document.addEventListener('load', scheduleUpdate, true);
  updateChapter();
}
