/* =========================================================
   ARQÉ ARIAS DESIGN — Panorama JS
   Pannellum 360° viewer
   ========================================================= */

'use strict';

let currentViewer = null;
let panoModal = null;

function createPanoModal() {
  if (document.getElementById('pano-modal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div id="pano-modal" class="pano-modal" role="dialog" aria-modal="true" aria-label="Vista 360°">
      <div id="panorama-container"></div>
      <button class="pano-modal__close" id="pano-close" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div class="pano-modal__hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
        </svg>
        Arrastra para explorar
      </div>
      <div class="pano-modal__title" id="pano-title"></div>
    </div>
  `);

  panoModal = document.getElementById('pano-modal');

  document.getElementById('pano-close').addEventListener('click', closePanorama);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panoModal.classList.contains('is-open')) {
      closePanorama();
    }
  });
}

function openPanorama(panoData) {
  createPanoModal();

  // Cleanup previous viewer
  if (currentViewer) {
    try { currentViewer.destroy(); } catch(e) {}
    currentViewer = null;
    document.getElementById('panorama-container').innerHTML = '';
  }

  // Show modal
  panoModal.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  // Set title
  const titleEl = document.getElementById('pano-title');
  if (titleEl) titleEl.textContent = panoData.title || 'Vista 360°';

  // Build hotspots array for Pannellum
  const hotSpots = (panoData.hotspots || []).map(h => ({
    pitch: h.pitch,
    yaw: h.yaw,
    type: h.type || 'info',
    text: h.text,
    cssClass: 'pano-hotspot'
  }));

  // Init Pannellum
  try {
    currentViewer = pannellum.viewer('panorama-container', {
      type: 'equirectangular',
      panorama: panoData.imageUrl,
      autoLoad: true,
      autoRotate: -1.5,
      autoRotateInactivityDelay: 3000,
      compass: false,
      showControls: true,
      showFullscreenCtrl: true,
      showZoomCtrl: true,
      friction: 0.15,
      hfov: 100,
      minHfov: 50,
      maxHfov: 120,
      firstPitch: panoData.firstPitch || 0,
      firstYaw: panoData.firstYaw || 0,
      hotSpots: hotSpots,
      strings: {
        loadingLabel: 'Cargando panorama...',
        bylineLabel: ''
      }
    });
  } catch (err) {
    console.error('Pannellum init error:', err);
    // Show fallback image
    const container = document.getElementById('panorama-container');
    container.innerHTML = `
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;color:#C9A465;font-family:sans-serif;font-size:0.9rem;letter-spacing:0.1em;text-align:center;padding:2rem">
        <div>
          <div style="font-size:2rem;margin-bottom:1rem">360°</div>
          <div style="color:#6B6B6B">${panoData.title || 'Vista panorámica'}</div>
          <div style="margin-top:0.5rem;font-size:0.75rem;color:#444">Pannellum no disponible en modo file://</div>
          <img src="${panoData.imageUrl}" alt="${panoData.title}" style="max-width:100%;margin-top:1.5rem;opacity:0.7">
        </div>
      </div>
    `;
  }
}

function closePanorama() {
  if (!panoModal) return;
  panoModal.classList.remove('is-open');
  document.body.style.overflow = '';

  if (currentViewer) {
    setTimeout(() => {
      try { currentViewer.destroy(); } catch(e) {}
      currentViewer = null;
      const container = document.getElementById('panorama-container');
      if (container) container.innerHTML = '';
    }, 300);
  }
}

// Expose globally
window.openPanorama = openPanorama;
window.closePanorama = closePanorama;

/* ---- Project page panorama list ------------------------ */
function initProjectPanoramas() {
  const thumbsContainer = document.querySelector('.pano-thumbs');
  if (!thumbsContainer) return;

  thumbsContainer.addEventListener('click', e => {
    const thumb = e.target.closest('.pano-thumb');
    if (!thumb) return;
    const panoData = JSON.parse(thumb.getAttribute('data-pano') || '{}');
    if (panoData.imageUrl) openPanorama(panoData);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProjectPanoramas();
});
