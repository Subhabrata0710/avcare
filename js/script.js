/* ============================================================
   AVCare - Premium Audio Visual Services
   Main JavaScript (Homepage)
   ============================================================ */

(function () {
  'use strict';

  var GALLERY_PATH = 'images/gallery/';
  var PREVIEW_COUNT = 3;
  var PARTICLE_COUNT = 30;
  var IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

  /* ----------------------------------------------------------
     DOM References
     ---------------------------------------------------------- */
  var DOM = {
    preloader: document.getElementById('preloader'),
    navbar: document.getElementById('navbar'),
    navMenu: document.getElementById('navMenu'),
    navToggle: document.getElementById('navToggle'),
    navLinks: document.querySelectorAll('.nav-link'),
    heroParticles: document.getElementById('heroParticles'),
    galleryPreviewGrid: document.getElementById('galleryPreviewGrid'),
    backToTop: document.getElementById('backToTop'),
    revealElements: document.querySelectorAll('.reveal'),
  };

  /* ----------------------------------------------------------
     1. PRELOADER
     ---------------------------------------------------------- */
  function initPreloader() {
    window.addEventListener('load', function () {
      setTimeout(function () {
        DOM.preloader.classList.add('hidden');
        setTimeout(triggerHeroReveal, 200);
      }, 800);
    });
  }

  function triggerHeroReveal() {
    var heroReveals = document.querySelectorAll('.hero .reveal');
    heroReveals.forEach(function (el) {
      el.classList.add('active');
    });
  }

  /* ----------------------------------------------------------
     2. STICKY NAVIGATION
     ---------------------------------------------------------- */
  function initNavbar() {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        DOM.navbar.classList.add('scrolled');
      } else {
        DOM.navbar.classList.remove('scrolled');
      }
    });
  }

  /* ----------------------------------------------------------
     3. MOBILE NAVIGATION
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
     4. ACTIVE NAV LINK ON SCROLL
     ---------------------------------------------------------- */
  function initActiveNavLink() {
    var sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY + 120;

      sections.forEach(function (section) {
        var sectionTop = section.offsetTop;
        var sectionHeight = section.offsetHeight;
        var sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          DOM.navLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
              link.classList.add('active');
            }
          });
        }
      });
    });
  }

  /* ----------------------------------------------------------
     5. SCROLL REVEAL ANIMATIONS
     ---------------------------------------------------------- */
  function initScrollReveal() {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    DOM.revealElements.forEach(function (el) {
      if (!el.closest('.hero')) {
        observer.observe(el);
      }
    });
  }

  /* ----------------------------------------------------------
     6. HERO PARTICLES
     ---------------------------------------------------------- */
  function initParticles() {
    if (!DOM.heroParticles) return;

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var particle = document.createElement('div');
      particle.classList.add('particle');
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = 6 + Math.random() * 10 + 's';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.width = 1 + Math.random() * 3 + 'px';
      particle.style.height = particle.style.width;
      particle.style.opacity = 0.1 + Math.random() * 0.4;
      DOM.heroParticles.appendChild(particle);
    }
  }

  /* ----------------------------------------------------------
     7. GALLERY PREVIEW (Auto-detect images)
     ---------------------------------------------------------- */
  function getGitHubInfo() {
    var hostname = window.location.hostname;
    var pathname = window.location.pathname;

    if (hostname.endsWith('.github.io')) {
      var owner = hostname.replace('.github.io', '');
      var pathParts = pathname.split('/').filter(function (p) { return p.length > 0; });

      if (pathParts.length > 0) {
        return { owner: owner, repo: pathParts[0] };
      } else {
        return { owner: owner, repo: owner + '.github.io' };
      }
    }
    return null;
  }

  function fetchPreviewFromGitHub() {
    var info = getGitHubInfo();
    if (!info) return Promise.resolve(null);

    var apiUrl = 'https://api.github.com/repos/' + info.owner + '/' + info.repo + '/contents/images/gallery';

    return fetch(apiUrl)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (files) {
        if (!files || !Array.isArray(files)) return null;
        return files
          .filter(function (f) {
            if (f.type !== 'file') return false;
            var ext = f.name.split('.').pop().toLowerCase();
            return IMAGE_EXTENSIONS.indexOf(ext) !== -1;
          })
          .map(function (f) { return f.name; })
          .slice(0, PREVIEW_COUNT);
      })
      .catch(function () { return null; });
  }

  function scanPreviewImages() {
    var candidates = [];
    for (var i = 1; i <= 20; i++) {
      candidates.push('gallery-' + i + '.jpg');
      candidates.push('gallery-' + i + '.jpeg');
      candidates.push('gallery-' + i + '.png');
      candidates.push(i + '.jpg');
      candidates.push(i + '.png');
    }

    var promises = candidates.map(function (filename) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () { resolve(filename); };
        img.onerror = function () { resolve(null); };
        img.src = GALLERY_PATH + filename;
      });
    });

    return Promise.all(promises).then(function (results) {
      return results.filter(function (r) { return r !== null; }).slice(0, PREVIEW_COUNT);
    });
  }

  function initGalleryPreview() {
    if (!DOM.galleryPreviewGrid) return;

    fetchPreviewFromGitHub().then(function (githubFiles) {
      if (githubFiles && githubFiles.length > 0) {
        renderPreview(githubFiles);
      } else {
        scanPreviewImages().then(function (scanned) {
          if (scanned.length > 0) {
            renderPreview(scanned);
          }
        });
      }
    });
  }

  function renderPreview(filenames) {
    filenames.forEach(function (filename) {
      var el = document.createElement('a');
      el.href = 'gallery.html';
      el.className = 'gallery-preview-item reveal';

      el.innerHTML =
        '<img src="' + GALLERY_PATH + filename + '" alt="AVCare Gallery" loading="lazy">' +
        '<div class="gallery-preview-item-overlay">' +
        '<span>View Gallery</span>' +
        '</div>';

      DOM.galleryPreviewGrid.appendChild(el);
    });

    // Observe reveals
    var newReveals = DOM.galleryPreviewGrid.querySelectorAll('.reveal');
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('active');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    newReveals.forEach(function (el) { observer.observe(el); });
  }

  /* ----------------------------------------------------------
     8. BACK TO TOP
     ---------------------------------------------------------- */
  function initBackToTop() {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) {
        DOM.backToTop.classList.add('visible');
      } else {
        DOM.backToTop.classList.remove('visible');
      }
    });

    DOM.backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ----------------------------------------------------------
     9. SMOOTH SCROLL
     ---------------------------------------------------------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;

        var target = document.querySelector(targetId);
        if (target) {
          var navHeight = DOM.navbar.offsetHeight;
          var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
      });
    });
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  function init() {
    initPreloader();
    initNavbar();
    initMobileNav();
    initActiveNavLink();
    initScrollReveal();
    initParticles();
    initGalleryPreview();
    initBackToTop();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
