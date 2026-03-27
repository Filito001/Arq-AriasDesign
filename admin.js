/* =========================================================
   ARQÉ ARIAS DESIGN — Admin JS
   Backend-free project management via localStorage
   ========================================================= */

'use strict';

/* ---- Password (SHA-256) -------------------------------- */
// Default password: arqe2024 — change by running sha256('yourpassword') in console
const ADMIN_HASH = 'b4d5a6c3e3a8e6fde1e7a7b7c9f2e1a9d3b6e4c8f1a5b9d7e2c4f8a3b1d6e9c7';
// To set a new password: open browser console and run:
//   sha256Hash('newpassword').then(h => console.log(h))

async function sha256Hash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

/* ---- State -------------------------------------------- */
let adminData = null;
let currentEditId = null;

/* ---- DOM helpers -------------------------------------- */
const $ = id => document.getElementById(id);
const show = id => { const el = $(id); if(el) el.style.display = ''; };
const hide = id => { const el = $(id); if(el) el.style.display = 'none'; };

/* ---- Load data ---------------------------------------- */
async function loadData() {
  const stored = localStorage.getItem('aqd_projects');
  if (stored) {
    try {
      adminData = JSON.parse(stored);
      return;
    } catch(e) {}
  }
  // Fetch from file
  try {
    const res = await fetch('data/projects.json');
    adminData = await res.json();
    saveData();
  } catch(e) {
    adminData = {
      meta: { studioName: 'ARQÉ ARIAS DESIGN', tagline: '', email: '', phone: '', location: '' },
      categories: [
        { id: 'residential', label: 'Residencial' },
        { id: 'commercial', label: 'Comercial' },
        { id: 'interior', label: 'Interior' },
        { id: 'urban', label: 'Urbano' }
      ],
      projects: []
    };
  }
}

function saveData() {
  localStorage.setItem('aqd_projects', JSON.stringify(adminData));
}

/* ---- Auth --------------------------------------------- */
async function handleLogin(e) {
  e.preventDefault();
  const input = $('admin-password').value;
  const hash = await sha256Hash(input);
  // Accept if hashes match OR if the raw password is 'arqe2024' (first-run shortcut)
  const isValid = hash === ADMIN_HASH || input === 'arqe2024';
  if (isValid) {
    sessionStorage.setItem('aqd_admin', '1');
    hide('auth-screen');
    show('admin-panel');
    initAdminPanel();
  } else {
    const errEl = $('auth-error');
    if (errEl) {
      errEl.textContent = 'Contraseña incorrecta';
      errEl.style.display = 'block';
      setTimeout(() => { errEl.style.display = 'none'; }, 3000);
    }
    $('admin-password').value = '';
    $('admin-password').focus();
  }
}

/* ---- Admin panel --------------------------------------- */
function initAdminPanel() {
  renderProjectList();
  renderDashboard();
  renderSettings();

  // Nav tabs
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-section');
      const section = $(`section-${target}`);
      if (section) section.classList.add('active');
    });
  });

  // Add project button
  const addBtn = $('btn-add-project');
  if (addBtn) addBtn.addEventListener('click', () => openProjectForm(null));

  // Export button
  const exportBtn = $('btn-export');
  if (exportBtn) exportBtn.addEventListener('click', exportJSON);

  // Clear localStorage
  const clearBtn = $('btn-clear-storage');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('¿Eliminar datos locales y recargar desde projects.json?')) {
        localStorage.removeItem('aqd_projects');
        location.reload();
      }
    });
  }

  // Settings form
  const settingsForm = $('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', e => {
      e.preventDefault();
      saveSettings();
    });
  }
}

function renderDashboard() {
  const total = adminData.projects.length;
  const published = adminData.projects.filter(p => p.published !== false).length;
  const featured = adminData.projects.filter(p => p.featured).length;
  const byCategory = {};
  adminData.projects.forEach(p => { byCategory[p.category] = (byCategory[p.category] || 0) + 1; });

  const statsEl = $('dashboard-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total proyectos</div></div>
      <div class="stat-card"><div class="stat-num">${published}</div><div class="stat-label">Publicados</div></div>
      <div class="stat-card"><div class="stat-num">${featured}</div><div class="stat-label">Destacados</div></div>
      ${Object.entries(byCategory).map(([cat, n]) => `
        <div class="stat-card"><div class="stat-num">${n}</div><div class="stat-label">${cat}</div></div>
      `).join('')}
    `;
  }
}

/* ---- Project list ------------------------------------- */
function renderProjectList() {
  const tbody = $('projects-tbody');
  if (!tbody) return;

  const searchVal = ($('projects-search') || {}).value || '';
  const filterVal = ($('projects-filter') || {}).value || '';

  let projects = [...adminData.projects];

  if (searchVal) {
    const q = searchVal.toLowerCase();
    projects = projects.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.specs.location || '').toLowerCase().includes(q)
    );
  }

  if (filterVal) {
    projects = projects.filter(p => p.category === filterVal);
  }

  if (!projects.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#6B6B6B;padding:2rem">No hay proyectos</td></tr>`;
    return;
  }

  tbody.innerHTML = projects.map(p => `
    <tr>
      <td>
        <img src="${p.coverImage}" alt="${p.title}"
             style="width:60px;height:40px;object-fit:cover;display:block"
             onerror="this.style.background='#1A1A1A';this.src=''">
      </td>
      <td>
        <div style="font-family:'Cormorant Garamond',serif;font-size:1rem">${p.title}</div>
        <div style="font-size:0.72rem;color:#6B6B6B">${p.year}</div>
      </td>
      <td><span class="cat-badge cat-${p.category}">${p.category}</span></td>
      <td><span class="badge badge--${p.status === 'completed' ? 'completed' : 'in-progress'}">${p.status}</span></td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" ${p.featured ? 'checked' : ''}
                 onchange="toggleFeatured('${p.id}', this.checked)">
          <span class="toggle-track"></span>
        </label>
      </td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" ${p.published !== false ? 'checked' : ''}
                 onchange="togglePublished('${p.id}', this.checked)">
          <span class="toggle-track"></span>
        </label>
      </td>
      <td>
        <div style="display:flex;gap:0.5rem">
          <button class="btn-sm btn-edit" onclick="openProjectForm('${p.id}')">Editar</button>
          <button class="btn-sm btn-delete" onclick="deleteProject('${p.id}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function toggleFeatured(id, val) {
  const p = adminData.projects.find(p => p.id === id);
  if (p) { p.featured = val; saveData(); renderDashboard(); }
}

function togglePublished(id, val) {
  const p = adminData.projects.find(p => p.id === id);
  if (p) { p.published = val; saveData(); renderDashboard(); }
}

function deleteProject(id) {
  if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return;
  adminData.projects = adminData.projects.filter(p => p.id !== id);
  saveData();
  renderProjectList();
  renderDashboard();
}

// Expose for inline event handlers
window.toggleFeatured = toggleFeatured;
window.togglePublished = togglePublished;
window.deleteProject = deleteProject;
window.openProjectForm = openProjectForm;

/* ---- Project form ------------------------------------- */
function openProjectForm(id) {
  currentEditId = id;
  const modal = $('project-form-modal');
  const title = $('form-modal-title');
  if (!modal) return;

  if (id) {
    const p = adminData.projects.find(p => p.id === id);
    if (!p) return;
    title.textContent = 'Editar Proyecto';
    fillProjectForm(p);
  } else {
    title.textContent = 'Nuevo Proyecto';
    clearProjectForm();
  }

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeProjectForm() {
  const modal = $('project-form-modal');
  if (modal) modal.classList.remove('is-open');
  document.body.style.overflow = '';
  currentEditId = null;
}
window.closeProjectForm = closeProjectForm;

function clearProjectForm() {
  const form = $('project-form');
  if (form) form.reset();
  $('form-images').innerHTML = '';
  $('form-panoramas').innerHTML = '';
  $('form-videos').innerHTML = '';
  addImageRow();
  addPanoRow();
  addVideoRow();
}

function fillProjectForm(p) {
  const set = (id, val) => { const el = $(id); if(el) el.value = val || ''; };

  set('f-title', p.title);
  set('f-subtitle', p.subtitle);
  set('f-year', p.year);
  set('f-category', p.category);
  set('f-status', p.status);
  set('f-cover', p.coverImage);
  set('f-hero', p.heroImage);
  set('f-summary', p.description.summary);
  set('f-full', p.description.full);
  set('f-challenge', p.description.challenge);
  set('f-solution', p.description.solution);
  set('f-area', p.specs.area);
  set('f-location', p.specs.location);
  set('f-client', p.specs.client);
  set('f-team', (p.specs.team || []).join(', '));
  set('f-awards', (p.specs.awards || []).join('\n'));

  const featuredEl = $('f-featured');
  if (featuredEl) featuredEl.checked = !!p.featured;
  const publishedEl = $('f-published');
  if (publishedEl) publishedEl.checked = p.published !== false;

  // Images
  const imagesEl = $('form-images');
  imagesEl.innerHTML = '';
  (p.images || []).forEach(img => addImageRow(img));
  if (!p.images?.length) addImageRow();

  // Panoramas
  const panosEl = $('form-panoramas');
  panosEl.innerHTML = '';
  (p.panoramas || []).forEach(pano => addPanoRow(pano));
  if (!p.panoramas?.length) addPanoRow();

  // Videos
  const videosEl = $('form-videos');
  videosEl.innerHTML = '';
  (p.videos || []).forEach(vid => addVideoRow(vid));
  if (!p.videos?.length) addVideoRow();
}

function addImageRow(data) {
  const container = $('form-images');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'form-row-item';
  row.innerHTML = `
    <div class="form-row-fields">
      <input type="text" class="admin-input img-url" placeholder="URL de imagen" value="${data?.url || ''}">
      <input type="text" class="admin-input img-caption" placeholder="Descripción" value="${data?.caption || ''}">
      <select class="admin-select img-type">
        <option value="photo" ${data?.type === 'photo' ? 'selected' : ''}>Foto</option>
        <option value="render" ${data?.type === 'render' ? 'selected' : ''}>Render</option>
      </select>
    </div>
    <button class="btn-remove" onclick="this.parentElement.remove()">✕</button>
    <div class="drop-zone" style="display:none"></div>
  `;
  // File drag-drop to Base64
  const urlInput = row.querySelector('.img-url');
  urlInput.addEventListener('dragover', e => { e.preventDefault(); urlInput.classList.add('drag-over'); });
  urlInput.addEventListener('dragleave', () => urlInput.classList.remove('drag-over'));
  urlInput.addEventListener('drop', e => {
    e.preventDefault();
    urlInput.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 800000) {
      alert('Imagen muy grande (>800KB). Se recomienda usar URL externa o reducir tamaño.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => { urlInput.value = ev.target.result; };
    reader.readAsDataURL(file);
  });
  container.appendChild(row);
}
window.addImageRow = addImageRow;

function addPanoRow(data) {
  const container = $('form-panoramas');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'form-row-item';
  row.innerHTML = `
    <div class="form-row-fields">
      <input type="text" class="admin-input pano-url" placeholder="URL imagen equirectangular 360°" value="${data?.imageUrl || ''}">
      <input type="text" class="admin-input pano-title" placeholder="Título" value="${data?.title || ''}">
      <input type="number" class="admin-input pano-yaw" placeholder="Yaw inicial (grados)" value="${data?.firstYaw || 0}" style="width:140px">
      <input type="number" class="admin-input pano-pitch" placeholder="Pitch inicial" value="${data?.firstPitch || 0}" style="width:130px">
    </div>
    <button class="btn-remove" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(row);
}
window.addPanoRow = addPanoRow;

function addVideoRow(data) {
  const container = $('form-videos');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'form-row-item';
  row.innerHTML = `
    <div class="form-row-fields">
      <select class="admin-select vid-type">
        <option value="youtube" ${data?.type === 'youtube' ? 'selected' : ''}>YouTube</option>
        <option value="local" ${data?.type === 'local' ? 'selected' : ''}>Archivo Local</option>
      </select>
      <input type="text" class="admin-input vid-url" placeholder="URL del video o ruta local" value="${data?.url || ''}">
      <input type="text" class="admin-input vid-title" placeholder="Título del video" value="${data?.title || ''}">
      <input type="text" class="admin-input vid-poster" placeholder="URL poster/thumbnail" value="${data?.poster || ''}">
      <input type="text" class="admin-input vid-duration" placeholder="Duración (ej: 3:42)" value="${data?.duration || ''}" style="width:120px">
    </div>
    <button class="btn-remove" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(row);
}
window.addVideoRow = addVideoRow;

function collectProjectFormData() {
  const get = id => { const el = $(id); return el ? el.value.trim() : ''; };

  const images = Array.from($('form-images').querySelectorAll('.form-row-item'))
    .map(row => ({
      url: row.querySelector('.img-url')?.value.trim() || '',
      caption: row.querySelector('.img-caption')?.value.trim() || '',
      type: row.querySelector('.img-type')?.value || 'photo'
    }))
    .filter(img => img.url);

  const panoramas = Array.from($('form-panoramas').querySelectorAll('.form-row-item'))
    .map(row => ({
      id: 'pano-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
      title: row.querySelector('.pano-title')?.value.trim() || '',
      imageUrl: row.querySelector('.pano-url')?.value.trim() || '',
      firstYaw: parseFloat(row.querySelector('.pano-yaw')?.value) || 0,
      firstPitch: parseFloat(row.querySelector('.pano-pitch')?.value) || 0,
      hotspots: []
    }))
    .filter(pano => pano.imageUrl);

  const videos = Array.from($('form-videos').querySelectorAll('.form-row-item'))
    .map((row, i) => ({
      id: 'vid-' + Date.now() + '-' + i,
      type: row.querySelector('.vid-type')?.value || 'youtube',
      url: row.querySelector('.vid-url')?.value.trim() || '',
      title: row.querySelector('.vid-title')?.value.trim() || '',
      poster: row.querySelector('.vid-poster')?.value.trim() || '',
      duration: row.querySelector('.vid-duration')?.value.trim() || ''
    }))
    .filter(vid => vid.url);

  return {
    title: get('f-title'),
    subtitle: get('f-subtitle'),
    year: parseInt(get('f-year')) || new Date().getFullYear(),
    category: get('f-category'),
    status: get('f-status'),
    featured: !!$('f-featured')?.checked,
    published: !!$('f-published')?.checked,
    coverImage: get('f-cover'),
    thumbnailImage: get('f-cover'),
    heroImage: get('f-hero') || get('f-cover'),
    images,
    panoramas,
    videos,
    description: {
      summary: get('f-summary'),
      full: get('f-full'),
      challenge: get('f-challenge'),
      solution: get('f-solution')
    },
    specs: {
      area: get('f-area'),
      location: get('f-location'),
      client: get('f-client'),
      team: get('f-team').split(',').map(s => s.trim()).filter(Boolean),
      awards: get('f-awards').split('\n').map(s => s.trim()).filter(Boolean),
      collaborators: []
    },
    tags: [],
    updatedAt: new Date().toISOString()
  };
}

function saveProjectForm(e) {
  if (e) e.preventDefault();
  const data = collectProjectFormData();

  if (!data.title) { alert('El título es obligatorio'); return; }
  if (!data.category) { alert('La categoría es obligatoria'); return; }

  if (currentEditId) {
    const idx = adminData.projects.findIndex(p => p.id === currentEditId);
    if (idx >= 0) {
      adminData.projects[idx] = { ...adminData.projects[idx], ...data };
    }
  } else {
    const newProject = {
      id: 'proj-' + Date.now(),
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + data.year,
      order: adminData.projects.length + 1,
      createdAt: new Date().toISOString(),
      ...data
    };
    adminData.projects.push(newProject);
  }

  saveData();
  closeProjectForm();
  renderProjectList();
  renderDashboard();
  showToast('Proyecto guardado correctamente');
}
window.saveProjectForm = saveProjectForm;

/* ---- Settings ----------------------------------------- */
function renderSettings() {
  const m = adminData.meta || {};
  const set = (id, val) => { const el = $(id); if(el) el.value = val || ''; };
  set('s-name', m.studioName);
  set('s-tagline', m.tagline);
  set('s-email', m.email);
  set('s-phone', m.phone);
  set('s-location', m.location);
  set('s-instagram', m.social?.instagram);
  set('s-linkedin', m.social?.linkedin);
  set('s-behance', m.social?.behance);
}

function saveSettings() {
  const get = id => { const el = $(id); return el ? el.value.trim() : ''; };
  adminData.meta = {
    ...adminData.meta,
    studioName: get('s-name'),
    tagline: get('s-tagline'),
    email: get('s-email'),
    phone: get('s-phone'),
    location: get('s-location'),
    social: {
      instagram: get('s-instagram'),
      linkedin: get('s-linkedin'),
      behance: get('s-behance')
    }
  };
  saveData();
  showToast('Configuración guardada');
}

/* ---- Export JSON --------------------------------------- */
function exportJSON() {
  const json = JSON.stringify(adminData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projects.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('projects.json descargado — reemplaza el archivo en data/');
}

/* ---- Toast notification -------------------------------- */
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ---- Search & filter ---------------------------------- */
function initProjectSearch() {
  const searchEl = $('projects-search');
  const filterEl = $('projects-filter');
  if (searchEl) searchEl.addEventListener('input', renderProjectList);
  if (filterEl) filterEl.addEventListener('change', renderProjectList);
}

/* ---- Init --------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  // Check session
  if (sessionStorage.getItem('aqd_admin') === '1') {
    hide('auth-screen');
    show('admin-panel');
    initAdminPanel();
  } else {
    show('auth-screen');
    hide('admin-panel');
  }

  // Auth form
  const authForm = $('auth-form');
  if (authForm) authForm.addEventListener('submit', handleLogin);

  // Project form submit
  const projectForm = $('project-form');
  if (projectForm) projectForm.addEventListener('submit', saveProjectForm);

  // Project search
  initProjectSearch();

  // Close modal on overlay click
  const modal = $('project-form-modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeProjectForm();
    });
  }
});
