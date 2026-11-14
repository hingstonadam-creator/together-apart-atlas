/* Deterrents for casual copying only; public image files remain retrievable. */
(() => {
  const imageSelector = 'img, picture, svg, canvas';
  const isImage = target => target instanceof Element && target.closest(imageSelector) !== null;
  document.addEventListener('contextmenu', event => {
    if (isImage(event.target)) event.preventDefault();
  });
  document.addEventListener('dragstart', event => {
    if (isImage(event.target)) event.preventDefault();
  });
})();
