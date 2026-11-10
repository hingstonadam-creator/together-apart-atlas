// Native disclosure works without JavaScript. Dismiss it after a chapter jump.
const menu = document.querySelector('.reader-bar details');
if (menu) {
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) || event.target.closest('a')) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
}
