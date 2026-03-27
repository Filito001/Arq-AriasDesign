/* =========================================================
   ARQÉ ARIAS DESIGN — Main JS
   GSAP animations, cursor, page transitions, hero
   ========================================================= */

'use strict';

/* ---- Data loader ---------------------------------------- */
const AQD = {
  data: null,

  async loadProjects() {
    // 1. Try localStorage first (admin edits)
    const stored = localStorage.getItem('aqd_projects');
    if (stored) {
      try {
        this.data = JSON.parse(stored);
        return this.data;
      } catch (e) {
        localStorage.removeItem('aqd_projects');
      }
    }
    // 2. Fetch from JSON file
    try {
      const res = await fetch('data/projects.json');
      if (!res.ok) throw new Error('Failed to fetch projects.json');
      this.data = await res.json();
      return this.data;
    } catch (e) {
      console.warn('Could not load projects.json:', e.message);
      this.data = { meta: {}, categories: [], projects: [] };
      return this.data;
    }
  },

  getPublished() {
    if (!this.data) return [];
    return this.data.projects.filter(p => p.published !== false);
  },

  getFeatured() {
    return this.getPublished().filter(p => p.featured === true);
  },

  getById(id) {
    if (!this.data) return null;
    return this.data.projects.find(p => p.id === id || p.slug === id) || null;
  },

  getByCategory(cat) {
    return this.getPublished().filter(p => p.category === cat);
  }
};

// Expose globally
window.AQD = AQD;

/* ---- Custom Cursor -------------------------------------- */
function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  const outline = document.querySelector('.cursor-outline');
  if (!dot || !outline) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let outlineX = mouseX;
  let outlineY = mouseY;
  let animFrameId = null;

  const lerp = (a, b, t) => a + (b - a) * t;

  const moveCursor = e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  };

  const animateOutline = () => {
    outlineX = lerp(outlineX, mouseX, 0.09);
    outlineY = lerp(outlineY, mouseY, 0.09);
    outline.style.transform = `translate(${outlineX}px, ${outlineY}px) translate(-50%, -50%)`;
    animFrameId = requestAnimationFrame(animateOutline);
  };

  document.addEventListener('mousemove', moveCursor);
  animFrameId = requestAnimationFrame(animateOutline);

  // State management
  const hoverTargets = 'a, button, .filter-btn, .card-inner, .btn, [data-cursor-hover]';
  const mediaTargets = 'video, .video-player, .video-poster, [data-cursor-media]';
  const panoTargets = '.btn-view-pano, [data-cursor-pano]';

  document.addEventListener('mouseover', e => {
    const el = e.target;
    if (el.closest(panoTargets)) {
      document.body.classList.add('cursor--pano');
      document.body.classList.remove('cursor--hover', 'cursor--media');
    } else if (el.closest(mediaTargets)) {
      document.body.classList.add('cursor--media');
      document.body.classList.remove('cursor--hover', 'cursor--pano');
    } else if (el.closest(hoverTargets)) {
      document.body.classList.add('cursor--hover');
      document.body.classList.remove('cursor--media', 'cursor--pano');
    }
  });

  document.addEventListener('mouseout', e => {
    if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
      document.body.classList.add('cursor--hidden');
    }
    document.body.classList.remove('cursor--hover', 'cursor--media', 'cursor--pano');
  });

  document.addEventListener('mouseenter', () => {
    document.body.classList.remove('cursor--hidden');
  });
}

/* ---- Page Transition ------------------------------------ */
function initPageTransition() {
  const overlay = document.querySelector('.page-transition');
  if (!overlay) return;

  // Animate in on page load (reverse the transition)
  gsap.to(overlay, {
    scaleY: 0,
    duration: 0.8,
    ease: 'power3.out',
    transformOrigin: 'top center',
    delay: 0.1
  });

  // Intercept all internal links
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Skip external, hash-only, javascript: and admin links
    if (!href || href.startsWith('http') || href.startsWith('#') ||
        href.startsWith('javascript') || href.startsWith('mailto') ||
        href.startsWith('tel')) return;

    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.href;
      gsap.to(overlay, {
        scaleY: 1,
        duration: 0.55,
        ease: 'power2.inOut',
        transformOrigin: 'bottom center',
        onComplete: () => { window.location.href = target; }
      });
    });
  });
}

/* ---- Navigation ---------------------------------------- */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  // Scroll state
  const updateNav = () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Active link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || href.includes(currentPath))) {
      link.classList.add('active');
    }
  });

  // Mobile menu
  const burger = document.querySelector('.nav__burger');
  const mobileNav = document.querySelector('.nav__mobile');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      document.body.style.overflow = isOpen ? 'hidden' : '';
      // Animate burger lines
      const spans = burger.querySelectorAll('span');
      if (isOpen) {
        gsap.to(spans[0], { y: 6, rotation: 45, duration: 0.3 });
        gsap.to(spans[1], { opacity: 0, duration: 0.2 });
        gsap.to(spans[2], { y: -6, rotation: -45, duration: 0.3 });
      } else {
        gsap.to(spans[0], { y: 0, rotation: 0, duration: 0.3 });
        gsap.to(spans[1], { opacity: 1, duration: 0.2 });
        gsap.to(spans[2], { y: 0, rotation: 0, duration: 0.3 });
      }
    });
    // Close on link click
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ---- Hero Section --------------------------------------- */
function initHero() {
  const hero = document.querySelector('#hero');
  if (!hero) return;

  // Parallax on scroll
  const heroBg = hero.querySelector('.hero__bg');
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 25,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  // Master timeline
  const tl = gsap.timeline({ delay: 0.3 });

  // SVG line drawing
  const archLines = hero.querySelectorAll('.arch-line');
  archLines.forEach(line => {
    const len = line.getTotalLength ? line.getTotalLength() : 600;
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  });

  if (archLines.length) {
    tl.to(archLines, {
      strokeDashoffset: 0,
      duration: 2,
      ease: 'power2.inOut',
      stagger: 0.3
    }, 0);
  }

  // Hero label
  const heroLabel = hero.querySelector('[data-hero-label]');
  if (heroLabel) {
    tl.from(heroLabel, { opacity: 0, x: -20, duration: 0.7, ease: 'power3.out' }, 0.5);
  }

  // Hero title letters
  const heroTitle = hero.querySelector('[data-hero-title]');
  if (heroTitle) {
    // Split into characters
    const text = heroTitle.innerHTML;
    const chars = text.split('').map(char =>
      char === ' ' ? '<span style="display:inline-block;width:0.3em"> </span>' :
      `<span class="hero-char" style="display:inline-block;overflow:hidden"><span style="display:inline-block">${char}</span></span>`
    );
    heroTitle.innerHTML = chars.join('');
    const innerSpans = heroTitle.querySelectorAll('.hero-char > span');
    tl.from(innerSpans, {
      y: '100%',
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.04
    }, 0.6);
  }

  // Hero subtitle
  const heroSub = hero.querySelector('[data-hero-sub]');
  if (heroSub) {
    tl.from(heroSub, {
      opacity: 0,
      y: 16,
      duration: 0.9,
      ease: 'power3.out'
    }, 1.2);
  }

  // Hero CTA
  const heroCta = hero.querySelector('[data-hero-cta]');
  if (heroCta) {
    tl.from(heroCta, {
      opacity: 0,
      y: 12,
      duration: 0.7,
      ease: 'power3.out'
    }, 1.5);
  }

  // Gold line
  const heroLine = hero.querySelector('[data-hero-line]');
  if (heroLine) {
    tl.from(heroLine, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.2,
      ease: 'power3.inOut'
    }, 0.8);
  }

  // Scroll indicator
  const scrollInd = hero.querySelector('.scroll-indicator');
  if (scrollInd) {
    tl.from(scrollInd, { opacity: 0, duration: 0.6 }, 2.0);
  }
}

/* ---- Scroll Animations ---------------------------------- */
function initScrollAnimations() {
  if (typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // Fade up
  ScrollTrigger.batch('[data-fade-up]', {
    onEnter: els => gsap.from(els, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.12
    }),
    start: 'top 88%',
    once: true
  });

  // Fade left
  ScrollTrigger.batch('[data-fade-left]', {
    onEnter: els => gsap.from(els, {
      x: -50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.12
    }),
    start: 'top 88%',
    once: true
  });

  // Fade right
  ScrollTrigger.batch('[data-fade-right]', {
    onEnter: els => gsap.from(els, {
      x: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.12
    }),
    start: 'top 88%',
    once: true
  });

  // Scale in
  ScrollTrigger.batch('[data-scale-in]', {
    onEnter: els => gsap.from(els, {
      scale: 0.88,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.1
    }),
    start: 'top 88%',
    once: true
  });

  // Text reveal (wraps in mask automatically)
  document.querySelectorAll('[data-reveal]').forEach(el => {
    // Wrap in reveal mask
    const wrapper = document.createElement('div');
    wrapper.className = 'reveal-mask';
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    gsap.from(el, {
      y: '105%',
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: wrapper,
        start: 'top 88%',
        once: true
      }
    });
  });

  // Stagger children
  document.querySelectorAll('[data-stagger]').forEach(parent => {
    const children = parent.querySelectorAll('[data-child]');
    gsap.from(children, {
      opacity: 0,
      y: 30,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: parent,
        start: 'top 85%',
        once: true
      }
    });
  });

  // Parallax on images
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
    gsap.to(el, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });

  // Gold line reveal on scroll
  document.querySelectorAll('.gold-line[data-animate]').forEach(line => {
    gsap.from(line, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.2,
      ease: 'power3.inOut',
      scrollTrigger: {
        trigger: line,
        start: 'top 90%',
        once: true
      }
    });
  });
}

/* ---- Loader -------------------------------------------- */
function initLoader() {
  const loader = document.querySelector('.loader');
  if (!loader) return;

  // Hide loader after minimum display time
  const minTime = 2200;
  const start = Date.now();

  const hideLoader = () => {
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minTime - elapsed);
    setTimeout(() => {
      gsap.to(loader, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
          loader.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    }, remaining);
  };

  // Lock scroll during load
  document.body.style.overflow = 'hidden';

  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
  }
}

/* ---- Counter animation ---------------------------------- */
function animateCounter(el, target, duration = 2000) {
  let start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

function initCounters() {
  document.querySelectorAll('[data-counter]').forEach(el => {
    const target = parseInt(el.getAttribute('data-counter'), 10);
    if (isNaN(target)) return;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => animateCounter(el, target)
    });
  });
}

/* ---- Featured Swiper (index.html) ---------------------- */
async function initFeaturedSwiper() {
  const swiperEl = document.querySelector('.featured-swiper');
  if (!swiperEl) return;

  await AQD.loadProjects();
  const featured = AQD.getFeatured();
  if (!featured.length) return;

  const wrapper = swiperEl.querySelector('.swiper-wrapper');
  wrapper.innerHTML = featured.map(p => `
    <div class="swiper-slide">
      <a href="project.html?id=${p.id}" class="featured-slide" data-transition>
        <div class="featured-slide__image parallax-wrap">
          <img src="${p.coverImage}" alt="${p.title}" loading="lazy" class="parallax-img">
        </div>
        <div class="featured-slide__content">
          <span class="t-label">${p.category}</span>
          <div class="gold-line" style="margin: 1rem 0"></div>
          <h2 class="t-h1">${p.title}</h2>
          <p class="t-body" style="margin-top: 1rem; max-width: 380px">${p.description.summary}</p>
          <div style="margin-top: 2rem">
            <span class="btn btn--primary">Ver Proyecto</span>
          </div>
          <div class="featured-slide__meta">
            <span>${p.specs.location}</span>
            <span>${p.year}</span>
          </div>
        </div>
      </a>
    </div>
  `).join('');

  new Swiper(swiperEl, {
    loop: true,
    speed: 1000,
    autoplay: { delay: 5000, disableOnInteraction: false },
    effect: 'fade',
    fadeEffect: { crossFade: true },
    pagination: {
      el: '.featured-pagination',
      clickable: true,
      renderBullet: (i, cls) => `<span class="${cls}"></span>`
    },
    navigation: {
      nextEl: '.featured-next',
      prevEl: '.featured-prev'
    },
    on: {
      slideChange: (swiper) => {
        const num = document.querySelector('.featured-slide-num');
        if (num) num.textContent = String(swiper.realIndex + 1).padStart(2, '0');
      }
    }
  });
}

/* ---- Init ---------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  initLoader();
  initCursor();
  initNav();
  initPageTransition();
  initHero();

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    initScrollAnimations();
    initCounters();
  }

  await initFeaturedSwiper();

  // Re-init page transitions after dynamic content
  setTimeout(initPageTransition, 500);
});
