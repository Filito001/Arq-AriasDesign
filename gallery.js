/* =========================================================
   ARQÉ ARIAS DESIGN — Gallery JS
   Isotope grid, card rendering, lightbox
   ========================================================= */

'use strict';

/* ---- Category labels ------------------------------------ */
const CAT_LABELS = {
  residential: 'Residencial',
  commercial:  'Comercial',
  interior:    'Interior',
  urban:       'Urbano'
};

/* ---- Card rendering ------------------------------------ */
function buildCardHTML(project) {
  const hasPano  = project.panoramas && project.panoramas.length > 0;
  const hasVideo = project.videos && project.videos.length > 0;
  const isWide   = project.order % 5 === 0;
  const catLabel = CAT_LABELS[project.category] || project.category;
  const statusLabel = project.status === 'in-progress' ? 'En progreso' : '';

  return `
    <article class="gallery-item cat-${project.category}${isWide ? ' item--wide' : ''}"
             data-id="${project.id}">
      <div class="card-inner border-reveal">
        <span class="border-reveal__left"></span>
        <span class="border-reveal__right"></span>
        ${statusLabel ? `<div class="card-status"><span class="card-status--wip">${statusLabel}</span></div>` : ''}
        <div class="card-image-wrap img-zoom">
          <img src="${project.coverImage}" alt="${project.title}" loading="lazy" class="card-img">
          <div class="card-overlay">
            <div class="card-meta">
              <span class="card-cat">${catLabel}</span>
              <span class="card-year">${project.year}</span>
            </div>
            <div class="card-actions">
              <button class="card-action-btn btn-view-gallery"
                      data-id="${project.id}" aria-label="Ver imágenes" title="Ver galería">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
              ${hasPano ? `
              <button class="card-action-btn btn-view-pano"
                      data-id="${project.id}" data-cursor-pano aria-label="Vista 360°" title="Vista 360°">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="9"/>
                  <ellipse cx="12" cy="12" rx="4" ry="9"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                </svg>
              </button>` : ''}
              ${hasVideo ? `
              <button class="card-action-btn btn-view-video"
                      data-id="${project.id}" data-cursor-media aria-label="Ver video" title="Ver video">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>` : ''}
              <a href="project.html?id=${project.id}" class="card-action-btn" aria-label="Ver proyecto">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div>
            <h3 class="card-title">${project.title}</h3>
            <p class="card-sub">${project.specs.location}</p>
          </div>
          <span class="card-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </span>
        </div>
      </div>
    </article>
  `;
}

/* ---- Isotope gallery init ------------------------------ */
let isoInstance = null;

async function initGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  await window.AQD.loadProjects();
  const projects = window.AQD.getPublished();

  if (!projects.length) {
    const empty = document.querySelector('.gallery-empty');
    if (empty) empty.classList.add('visible');
    return;
  }

  // Render cards
  const sizer = grid.querySelector('.gallery-sizer');
  grid.innerHTML = '';
  if (sizer) grid.appendChild(sizer.cloneNode());
  grid.insertAdjacentHTML('beforeend', projects.map(buildCardHTML).join(''));

  // Update count
  const countEl = document.querySelector('.portfolio-header__count');
  if (countEl) countEl.textContent = `${projects.length} proyectos`;

  // Init Isotope after images load
  imagesLoaded(grid, () => {
    isoInstance = new Isotope(grid, {
      itemSelector: '.gallery-item',
      layoutMode: 'masonry',
      masonry: {
        columnWidth: '.gallery-sizer',
        gutter: 2
      },
      percentPosition: true,
      transitionDuration: '0.5s',
      hiddenStyle: { opacity: 0, transform: 'scale(0.94)' },
      visibleStyle:  { opacity: 1, transform: 'scale(1)' }
    });

    // Animate cards in
    gsap.from('.gallery-item', {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.06
    });
  });

  // Filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.querySelector('.filter-btn.active');
      if (current) current.classList.remove('active');
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      if (isoInstance) {
        isoInstance.arrange({ filter });
        // Update count
        if (countEl) {
          const visible = filter === '*' ? projects.length :
            projects.filter(p => `cat-${p.category}` === filter.slice(1)).length;
          countEl.textContent = `${visible} proyecto${visible !== 1 ? 's' : ''}`;
        }
      }
    });
  });

  // Card click events (delegation)
  grid.addEventListener('click', e => {
    const galleryBtn = e.target.closest('.btn-view-gallery');
    const panoBtn    = e.target.closest('.btn-view-pano');
    const videoBtn   = e.target.closest('.btn-view-video');

    if (galleryBtn) {
      e.preventDefault();
      e.stopPropagation();
      const project = window.AQD.getById(galleryBtn.dataset.id);
      if (project) openLightbox(project.images, 0);
    } else if (panoBtn) {
      e.preventDefault();
      e.stopPropagation();
      const project = window.AQD.getById(panoBtn.dataset.id);
      if (project && project.panoramas.length) {
        window.openPanorama && window.openPanorama(project.panoramas[0]);
      }
    } else if (videoBtn) {
      e.preventDefault();
      e.stopPropagation();
      const project = window.AQD.getById(videoBtn.dataset.id);
      if (project && project.videos.length) {
        window.openVideoModal && window.openVideoModal(project.videos[0]);
      }
    }
  });
}

/* ---- Lightbox ------------------------------------------ */
let lightboxImages = [];
let lightboxIndex = 0;
let lightboxEl = null;

function createLightbox() {
  if (document.getElementById('lightbox')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div id="lightbox" class="lightbox" role="dialog" aria-modal="true" aria-label="Galería de imágenes">
      <div class="lightbox__overlay"></div>
      <button class="lightbox__close" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <button class="lightbox__prev" aria-label="Anterior">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button class="lightbox__next" aria-label="Siguiente">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
      <div class="lightbox__content">
        <div class="lightbox__media"></div>
        <div class="lightbox__info">
          <span class="lightbox__counter">1 / 1</span>
          <p class="lightbox__caption"></p>
          <span class="lightbox__type"></span>
        </div>
      </div>
    </div>
  `);

  lightboxEl = document.getElementById('lightbox');

  // Events
  lightboxEl.querySelector('.lightbox__overlay').addEventListener('click', closeLightbox);
  lightboxEl.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  lightboxEl.querySelector('.lightbox__prev').addEventListener('click', () => navigateLightbox(-1));
  lightboxEl.querySelector('.lightbox__next').addEventListener('click', () => navigateLightbox(1));

  document.addEventListener('keydown', e => {
    if (!lightboxEl.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  // Touch swipe
  let touchStartX = 0;
  lightboxEl.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lightboxEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) navigateLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });
}

function openLightbox(images, startIndex = 0) {
  createLightbox();
  lightboxImages = images;
  lightboxIndex = startIndex;
  renderLightboxSlide();
  lightboxEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove('is-open');
  document.body.style.overflow = '';
}

function navigateLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
  renderLightboxSlide();
}

function renderLightboxSlide() {
  if (!lightboxEl) return;
  const img = lightboxImages[lightboxIndex];
  const media = lightboxEl.querySelector('.lightbox__media');
  const counter = lightboxEl.querySelector('.lightbox__counter');
  const caption = lightboxEl.querySelector('.lightbox__caption');
  const typeBadge = lightboxEl.querySelector('.lightbox__type');

  // Animate out current
  gsap.to(media, {
    opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.in',
    onComplete: () => {
      media.innerHTML = `<img src="${img.url}" alt="${img.caption || ''}" />`;
      gsap.to(media, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
    }
  });

  counter.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
  caption.textContent = img.caption || '';
  typeBadge.textContent = img.type === 'render' ? 'RENDER' : 'FOTO';
}

// Expose globally
window.openLightbox = openLightbox;

/* ---- Init ---------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initGallery();
});
