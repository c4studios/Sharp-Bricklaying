(function () {
  'use strict';

  var lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;
  var figure = lightbox.querySelector('.gallery-lightbox__figure');
  var lightboxImage = document.getElementById('gallery-lightbox-image');
  var lightboxClose = document.getElementById('gallery-lightbox-close');
  var prevBtn = lightbox.querySelector('[data-lightbox-prev]');
  var nextBtn = lightbox.querySelector('[data-lightbox-next]');
  if (!figure || !lightboxImage || !lightboxClose) return;

  var lastTrigger = null;
  var group = [];      // ordered list of item descriptors for the panel in view
  var index = -1;      // current position within group
  var activeVideo = null;

  // Describe a trigger node as a navigable lightbox item.
  function describe(node) {
    if (node.hasAttribute('data-lightbox-video')) {
      return {
        el: node,
        type: 'video',
        videoSrc: node.getAttribute('data-lightbox-video'),
        poster: node.getAttribute('data-lightbox-poster') || '',
        alt: node.getAttribute('aria-label') || 'Site footage'
      };
    }
    return { el: node, type: 'image', imgEl: node, alt: node.alt || 'Expanded gallery image' };
  }

  // Destroy the on-demand video so at most one <video> ever exists, only while watched.
  function teardownVideo() {
    if (!activeVideo) return;
    try { activeVideo.pause(); } catch (e) {}
    while (activeVideo.firstChild) activeVideo.removeChild(activeVideo.firstChild);
    activeVideo.removeAttribute('src');
    try { activeVideo.load(); } catch (e) {}
    if (activeVideo.parentNode) activeVideo.parentNode.removeChild(activeVideo);
    activeVideo = null;
  }

  function updateNav() {
    var multi = group.length > 1;
    if (prevBtn) prevBtn.hidden = !multi;
    if (nextBtn) nextBtn.hidden = !multi;
  }

  function render() {
    var item = group[index];
    if (!item) return;
    teardownVideo();

    if (item.type === 'video') {
      lightboxImage.hidden = true;
      lightboxImage.removeAttribute('src');
      lightboxImage.removeAttribute('alt');

      var video = document.createElement('video');
      video.className = 'gallery-lightbox__video';
      video.setAttribute('controls', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('preload', 'metadata');
      if (item.poster) video.setAttribute('poster', item.poster);
      var source = document.createElement('source');
      source.src = item.videoSrc;
      source.type = 'video/mp4';
      video.appendChild(source);
      figure.appendChild(video);
      activeVideo = video;
    } else {
      lightboxImage.hidden = false;
      lightboxImage.src = item.imgEl.currentSrc || item.imgEl.src;
      lightboxImage.alt = item.alt;
    }
    updateNav();
  }

  function open(list, i, trigger) {
    group = list;
    index = i;
    lastTrigger = trigger || (list[i] && list[i].el);
    render();
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    lightboxClose.focus();
  }

  function close() {
    if (lightbox.hidden) return;
    teardownVideo();
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lightboxImage.hidden = false;
    lightboxImage.removeAttribute('src');
    lightboxImage.removeAttribute('alt');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    lastTrigger = null;
    group = [];
    index = -1;
  }

  function go(delta) {
    if (group.length < 2) return;
    index = (index + delta + group.length) % group.length;
    render();
  }

  // Each job panel (and legacy #before-after) is its own navigable group,
  // so prev/next stays within one job's photos + footage.
  function collect(container) {
    var triggers = Array.prototype.slice
      .call(container.querySelectorAll('img, [data-lightbox-video]'))
      .filter(function (node) {
        if (node.id === 'gallery-lightbox-image') return false;
        // Poster <img> inside a video facade is not its own item.
        if (node.tagName === 'IMG' && node.closest('[data-lightbox-video]')) return false;
        return true;
      });
    if (!triggers.length) return;

    var list = triggers.map(describe);
    triggers.forEach(function (node, i) {
      if (node.tagName === 'IMG') {
        node.setAttribute('tabindex', '0');
        node.setAttribute('role', 'button');
        node.setAttribute('aria-label', (node.alt || 'Open image') + ' - open expanded view');
        node.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open(list, i, node);
          }
        });
      }
      // <button> facades activate natively on Enter/Space via click.
      node.addEventListener('click', function (event) {
        event.preventDefault();
        open(list, i, node);
      });
    });
  }

  Array.prototype.slice
    .call(document.querySelectorAll('#gallery .gallery-job-panel'))
    .forEach(collect);
  var beforeAfter = document.getElementById('before-after');
  if (beforeAfter) collect(beforeAfter);

  // Controls
  if (prevBtn) prevBtn.addEventListener('click', function () { go(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { go(1); });
  lightboxClose.addEventListener('click', close);
  Array.prototype.slice.call(lightbox.querySelectorAll('[data-lightbox-close]')).forEach(function (node) {
    node.addEventListener('click', close);
  });

  function focusable() {
    return Array.prototype.slice
      .call(lightbox.querySelectorAll('button, [href], video, [tabindex]:not([tabindex="-1"])'))
      .filter(function (el) { return !el.hidden && el.offsetParent !== null; });
  }

  document.addEventListener('keydown', function (event) {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') { close(); return; }
    if (event.key === 'ArrowLeft') { go(-1); return; }
    if (event.key === 'ArrowRight') { go(1); return; }
    if (event.key === 'Tab') {
      var items = focusable();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // Touch swipe to move through the sequence.
  var touchX = null;
  figure.addEventListener('touchstart', function (event) {
    touchX = event.changedTouches[0].clientX;
  }, { passive: true });
  figure.addEventListener('touchend', function (event) {
    if (touchX === null) return;
    var dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });
}());
