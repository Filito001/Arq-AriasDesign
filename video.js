/* =========================================================
   ARQÉ ARIAS DESIGN — Video JS
   Custom video player + YouTube embed modal
   ========================================================= */

'use strict';

let videoModal = null;

/* ---- Format time helper -------------------------------- */
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ---- Create video modal -------------------------------- */
function createVideoModal() {
  if (document.getElementById('video-modal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div id="video-modal" class="video-modal" role="dialog" aria-modal="true" aria-label="Reproductor de video">
      <div class="video-modal__inner">
        <button class="video-modal__close" id="vm-close" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <div id="vm-player" class="video-player"></div>
        <div id="vm-info" style="padding:1rem 0;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div id="vm-title" style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:#F5F5F0"></div>
            <div id="vm-duration" style="font-size:0.72rem;color:#6B6B6B;margin-top:0.2rem;letter-spacing:0.05em"></div>
          </div>
        </div>
      </div>
    </div>
  `);

  videoModal = document.getElementById('video-modal');

  document.getElementById('vm-close').addEventListener('click', closeVideoModal);

  // Click overlay to close
  videoModal.addEventListener('click', e => {
    if (e.target === videoModal) closeVideoModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && videoModal.classList.contains('is-open')) {
      closeVideoModal();
    }
  });
}

function openVideoModal(videoData) {
  createVideoModal();

  const player = document.getElementById('vm-player');
  const titleEl = document.getElementById('vm-title');
  const durationEl = document.getElementById('vm-duration');

  // Clear previous
  player.innerHTML = '';

  titleEl.textContent = videoData.title || '';
  durationEl.textContent = videoData.duration ? `Duración: ${videoData.duration}` : '';

  if (videoData.type === 'youtube') {
    // YouTube embed
    player.innerHTML = `
      <div class="video-poster" style="background-image:url('${videoData.poster || ''}')">
        <button class="video-play-large" aria-label="Reproducir">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
    `;
    const playBtn = player.querySelector('.video-play-large');
    playBtn.addEventListener('click', () => {
      const poster = player.querySelector('.video-poster');
      const sep = videoData.url.includes('?') ? '&' : '?';
      player.innerHTML = `<iframe src="${videoData.url}${sep}autoplay=1&rel=0" allow="autoplay;fullscreen" allowfullscreen></iframe>`;
    });
  } else {
    // Local MP4
    player.innerHTML = `
      <video id="vm-video" preload="metadata" playsinline>
        <source src="${videoData.url}" type="video/mp4">
        Tu navegador no soporta video HTML5.
      </video>
      <div class="video-poster" style="background-image:url('${videoData.poster || ''}')">
        <button class="video-play-large" aria-label="Reproducir">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="video-controls">
        <button class="vc-btn" id="vc-play" aria-label="Reproducir/Pausar">
          <svg id="vc-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="vc-progress" id="vc-progress">
          <div class="vc-progress-bar" id="vc-bar"></div>
          <div class="vc-progress-thumb" id="vc-thumb"></div>
        </div>
        <span class="vc-time" id="vc-time">0:00 / 0:00</span>
        <button class="vc-btn" id="vc-mute" aria-label="Silenciar">
          <svg id="vc-vol-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
          </svg>
        </button>
        <input type="range" class="vc-volume" id="vc-volume" min="0" max="1" step="0.05" value="1">
        <button class="vc-btn" id="vc-fs" aria-label="Pantalla completa">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3m10 0h3a2 2 0 002-2v-3"/>
          </svg>
        </button>
      </div>
    `;

    const video = player.querySelector('#vm-video');
    const poster = player.querySelector('.video-poster');
    const playBtn = poster.querySelector('.video-play-large');

    // Start playing
    playBtn.addEventListener('click', () => {
      poster.classList.add('hidden');
      video.play();
      initVideoControls(video, player);
    });
  }

  videoModal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  if (!videoModal) return;
  videoModal.classList.remove('is-open');
  document.body.style.overflow = '';

  // Stop video/iframe
  setTimeout(() => {
    const player = document.getElementById('vm-player');
    if (player) {
      const video = player.querySelector('video');
      if (video) { video.pause(); video.src = ''; }
      const iframe = player.querySelector('iframe');
      if (iframe) iframe.src = '';
    }
  }, 300);
}

function initVideoControls(video, player) {
  const playBtn = player.querySelector('#vc-play');
  const playIcon = player.querySelector('#vc-play-icon');
  const progressWrap = player.querySelector('#vc-progress');
  const bar = player.querySelector('#vc-bar');
  const thumb = player.querySelector('#vc-thumb');
  const timeEl = player.querySelector('#vc-time');
  const muteBtn = player.querySelector('#vc-mute');
  const volumeSlider = player.querySelector('#vc-volume');
  const fsBtn = player.querySelector('#vc-fs');

  if (!playBtn) return;

  const PLAY_SVG  = `<path d="M8 5v14l11-7z"/>`;
  const PAUSE_SVG = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
  const MUTE_SVG  = `<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`;
  const VOL_SVG   = `<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>`;

  // Play/Pause toggle
  playBtn.addEventListener('click', () => {
    if (video.paused) { video.play(); }
    else { video.pause(); }
  });

  video.addEventListener('play', () => {
    playIcon.innerHTML = PAUSE_SVG;
  });

  video.addEventListener('pause', () => {
    playIcon.innerHTML = PLAY_SVG;
  });

  // Time update
  video.addEventListener('timeupdate', () => {
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    bar.style.width = pct + '%';
    thumb.style.left = pct + '%';
    timeEl.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration || 0)}`;
  });

  // Progress click/drag
  let isDragging = false;

  const seekTo = (e) => {
    const rect = progressWrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (video.duration) video.currentTime = pct * video.duration;
  };

  progressWrap.addEventListener('mousedown', e => {
    isDragging = true;
    seekTo(e);
  });

  document.addEventListener('mousemove', e => {
    if (isDragging) seekTo(e);
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  // Mute toggle
  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    const volIcon = muteBtn.querySelector('#vc-vol-icon');
    if (volIcon) volIcon.innerHTML = video.muted ? MUTE_SVG : VOL_SVG;
    if (volumeSlider) volumeSlider.value = video.muted ? 0 : video.volume;
  });

  // Volume slider
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      video.volume = parseFloat(volumeSlider.value);
      video.muted = video.volume === 0;
      const volIcon = muteBtn.querySelector('#vc-vol-icon');
      if (volIcon) volIcon.innerHTML = video.muted ? MUTE_SVG : VOL_SVG;
    });
  }

  // Fullscreen
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        player.requestFullscreen && player.requestFullscreen();
      } else {
        document.exitFullscreen && document.exitFullscreen();
      }
    });
  }

  // Ended
  video.addEventListener('ended', () => {
    playIcon.innerHTML = PLAY_SVG;
  });
}

/* ---- Inline video players (project detail page) -------- */
function initInlinePlayers() {
  document.querySelectorAll('.video-player[data-inline]').forEach(player => {
    const video = player.querySelector('video');
    const poster = player.querySelector('.video-poster');
    if (!video || !poster) return;

    const playBtn = poster.querySelector('.video-play-large');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        poster.classList.add('hidden');
        video.play();
        initVideoControls(video, player);
      });
    }
  });
}

// Expose globally
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;

document.addEventListener('DOMContentLoaded', () => {
  initInlinePlayers();
});
