/* ============================================================
   AVCare - Gallery Page JavaScript
   Automatically loads ALL images from /images/gallery/
   No configuration needed — just drop images in the folder.
   ============================================================ */

(function () {
  'use strict';

  var GALLERY_PATH = 'images/gallery/';
  var IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

  /* State */
  var loadedImages = [];
  var currentLightboxIndex = 0;

  /* DOM */
  var DOM = {
    navbar: document.getElementById('navbar'),
    navMenu: document.getElementById('navMenu'),
    navToggle: document.getElementById('navToggle'),
    navLinks: document.querySelectorAll('.nav-link'),
    galleryMasonry: document.getElementById('galleryMasonry'),
    galleryEmpty: document.getElementById('galleryEmpty'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxClose: document.getElementById('lightboxClose'),
    lightboxPrev: document.getElementById('lightboxPrev'),
    lightboxNext: document.getElementById('lightboxNext'),
    lightboxCounter: document.getElementById('lightboxCounter'),
    backToTop: document.getElementById('backToTop'),
  };

  /* ----------------------------------------------------------
     MOBILE NAVIGATION
     ---------------------------------------------------------- */
  function initMobileNav() {
    DOM.navToggle.addEventListener('click', function () {
      DOM.navToggle.classList.toggle('active');
      DOM.navMenu.classList.toggle('active');
      document.body.style.overflow = DOM.navMenu.classList.contains('active') ? 'hidden' : '';
    });

    DOM.navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        DOM.navToggle.classList.remove('active');
        DOM.navMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', function (e) {
      if (
        DOM.navMenu.classList.contains('active') &&
        !DOM.navMenu.contains(e.target) &&
        !DOM.navToggle.contains(e.target)
      ) {
        DOM.navToggle.classList.remove('active');
        DOM.navMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  /* ----------------------------------------------------------
     AUTO-DETECT IMAGES FROM GITHUB API
     ---------------------------------------------------------- */
  function getGitHubInfo() {
    var hostname = window.location.hostname;
    var pathname = window.location.pathname;

    // Check if hosted on GitHub Pages (username.github.io)
    if (hostname.endsWith('.github.io')) {
      var owner = hostname.replace('.github.io', '');
      // For project pages: username.github.io/repo-name/
      var pathParts = pathname.split('/').filter(function (p) { return p.length > 0; });

      if (pathParts.length > 0) {
        // Project site: first path segment is the repo name
        var repo = pathParts[0];
        return { owner: owner, repo: repo };
      } else {
        // User/org site: repo is username.github.io
        return { owner: owner, repo: owner + '.github.io' };
      }
    }

    return null;
  }

  function fetchGalleryFromGitHub() {
    var info = getGitHubInfo();
    if (!info) return Promise.resolve(null);

    var apiUrl = 'https://api.github.com/repos/' + info.owner + '/' + info.repo + '/contents/images/gallery';

    return fetch(apiUrl)
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (files) {
        if (!files || !Array.isArray(files)) return null;

        // Filter only image files
        return files
          .filter(function (file) {
            if (file.type !== 'file') return false;
            var ext = file.name.split('.').pop().toLowerCase();
            return IMAGE_EXTENSIONS.indexOf(ext) !== -1;
          })
          .map(function (file) {
            return file.name;
          });
      })
      .catch(function () {
        return null;
      });
  }

  /* ----------------------------------------------------------
     FALLBACK: SCAN KNOWN PATTERNS
     ---------------------------------------------------------- */
  function scanForImages() {
    // Try common naming patterns when not on GitHub Pages
    var candidates = [];

    // Try gallery-N pattern (1 to 50)
    for (var i = 1; i <= 50; i++) {
      candidates.push('gallery-' + i + '.jpg');
      candidates.push('gallery-' + i + '.jpeg');
      candidates.push('gallery-' + i + '.png');
      candidates.push('gallery-' + i + '.webp');
      candidates.push(i + '.jpg');
      candidates.push(i + '.jpeg');
      candidates.push(i + '.png');
    }

    // Try IMG/DSC/photo patterns
    var prefixes = ['IMG_', 'DSC_', 'DSC', 'IMG', 'photo', 'Photo', 'image', 'pic'];
    prefixes.forEach(function (prefix) {
      for (var j = 1; j <= 30; j++) {
        candidates.push(prefix + j + '.jpg');
        candidates.push(prefix + j + '.jpeg');
        candidates.push(prefix + j + '.png');
        var padded = ('0000' + j).slice(-4);
        candidates.push(prefix + padded + '.jpg');
        candidates.push(prefix + padded + '.jpeg');
        candidates.push(prefix + padded + '.png');
      }
    });

    // Attempt to load each and collect successes
    var promises = candidates.map(function (filename) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () { resolve(filename); };
        img.onerror = function () { resolve(null); };
        img.src = GALLERY_PATH + filename;
      });
    });

    return Promise.all(promises).then(function (results) {
      return results.filter(function (r) { return r !== null; });
    });
  }

  /* ----------------------------------------------------------
     GALLERY LOADING (AUTO)
     ---------------------------------------------------------- */
  function initGallery() {
    // Step 1: Try GitHub API (works on GitHub Pages)
    fetchGalleryFromGitHub().then(function (githubFiles) {
      if (githubFiles && githubFiles.length > 0) {
        loadAndRender(githubFiles);
      } else {
        // Step 2: Fallback — scan for known patterns locally
        scanForImages().then(function (scannedFiles) {
          if (scannedFiles.length > 0) {
            loadAndRender(scannedFiles);
          } else {
            DOM.galleryEmpty.style.display = 'flex';
          }
        });
      }
    });
  }

  function loadAndRender(filenames) {
    DOM.galleryEmpty.style.display = 'none';
    loadedImages = filenames.map(function (f) { return { filename: f }; });
    renderGallery(loadedImages);
  }

  function renderGallery(images) {
    DOM.galleryMasonry.innerHTML = '';

    images.forEach(function (item, index) {
      var el = document.createElement('div');
      el.className = 'gallery-card';
      el.style.animationDelay = (index * 0.08) + 's';

      el.innerHTML =
        '<div class="gallery-card-inner">' +
        '<img src="' + GALLERY_PATH + item.filename + '" alt="AVCare Gallery" loading="lazy">' +
        '<div class="gallery-card-overlay">' +
        '<div class="gallery-card-info"></div>' +
        '<button class="gallery-card-expand" aria-label="View full size">' +
        '<i class="fas fa-expand"></i>' +
        '</button>' +
        '</div>' +
        '</div>';

      el.addEventListener('click', function () {
        openLightbox(index);
      });

      DOM.galleryMasonry.appendChild(el);

      requestAnimationFrame(function () {
        el.classList.add('visible');
      });
    });
  }

  /* ----------------------------------------------------------
     LIGHTBOX
     ---------------------------------------------------------- */
  function initLightbox() {
    DOM.lightboxClose.addEventListener('click', closeLightbox);

    DOM.lightboxPrev.addEventListener('click', function (e) {
      e.stopPropagation();
      navigateLightbox(-1);
    });

    DOM.lightboxNext.addEventListener('click', function (e) {
      e.stopPropagation();
      navigateLightbox(1);
    });

    DOM.lightbox.addEventListener('click', function (e) {
      if (e.target === DOM.lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (!DOM.lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    var touchStartX = 0;
    DOM.lightbox.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    DOM.lightbox.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        navigateLightbox(diff > 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  function openLightbox(index) {
    if (loadedImages.length === 0) return;
    currentLightboxIndex = index;
    updateLightboxImage();
    DOM.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    DOM.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigateLightbox(direction) {
    currentLightboxIndex += direction;
    if (currentLightboxIndex < 0) currentLightboxIndex = loadedImages.length - 1;
    if (currentLightboxIndex >= loadedImages.length) currentLightboxIndex = 0;
    updateLightboxImage();
  }

  function updateLightboxImage() {
    var item = loadedImages[currentLightboxIndex];
    DOM.lightboxImg.src = GALLERY_PATH + item.filename;
    DOM.lightboxCounter.textContent = (currentLightboxIndex + 1) + ' / ' + loadedImages.length;
  }

  /* ----------------------------------------------------------
     BACK TO TOP
     ---------------------------------------------------------- */
  function initBackToTop() {
    window.addEventListener('scroll', function () {
      DOM.backToTop.classList.add(window.scrollY > 300 ? 'visible' : '');
      if (window.scrollY <= 300) DOM.backToTop.classList.remove('visible');
    });

    DOM.backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  function init() {
    initMobileNav();
    initGallery();
    initLightbox();
    initBackToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
