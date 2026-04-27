(function () {
  'use strict';

  var lightbox = document.getElementById('gallery-lightbox');
  var lightboxImage = document.getElementById('gallery-lightbox-image');
  var lightboxClose = document.getElementById('gallery-lightbox-close');
  var lastTrigger = null;

  if (!lightbox || !lightboxImage || !lightboxClose) return;

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lightboxImage.removeAttribute('src');
    lightboxImage.removeAttribute('alt');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    lastTrigger = null;
  }

  function openLightbox(trigger, image) {
    if (!image) return;
    lastTrigger = trigger || image;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || 'Expanded gallery image';
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    lightboxClose.focus();
  }

  Array.prototype.slice.call(document.querySelectorAll('#gallery img, #before-after img')).forEach(function (image) {
    if (image.id === 'gallery-lightbox-image') return;
    image.setAttribute('tabindex', '0');
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', (image.alt || 'Open image') + ' - open expanded view');
    image.addEventListener('click', function () {
      openLightbox(image, image);
    });
    image.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(image, image);
      }
    });
  });

  Array.prototype.slice.call(lightbox.querySelectorAll('[data-lightbox-close]')).forEach(function (node) {
    node.addEventListener('click', closeLightbox);
  });
  lightboxClose.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeLightbox();
  });
}());
