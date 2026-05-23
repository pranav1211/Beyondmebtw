// index.js — Manage page client logic
// Three sections: Homepage, Blog, Projects

const BASE_URL = "https://manage.beyondmebtw.com";

const PROJECTS_URL = 'https://beyondmebtw.com/projects/project-data.json';
const BLOG_BASE_URL = 'https://beyondmebtw.com/blog';
const CATEGORIES_MANIFEST_URL = 'https://beyondmebtw.com/blog/categories.json';
const PHOTOS_URL = 'https://beyondmebtw.com/photos/photos.json';

// ─── State ────────────────────────────────────────────────────────────────────
let state = {
  latestData: null,          // from latest.json
  blogData: null,            // from direct blog JSON URLs
  projects: [],              // from project-data.json
  minisMetadata: [],         // from https://minis.beyondmebtw.com/content/metadata.json (proxied)
  categories: {},            // from blog/categories.json manifest
  currentBlogCategory: 'all',
  blogSearch: '',
  editingBlogPost: null,     // { category, uid } when editing
  editingProjectId: null,    // id when editing
  projectImagesDraft: [],
  editingProjectImageIndex: null,
  projectCoverImageDraft: '',   // explicit cover image URL (empty = use first image)
  dragImageIndex: null,         // index of image currently being dragged
  confirmCallback: null,
  latestConfirmCallback: null,
  catDeleteTarget: null,     // key of category being deleted
  subcatEditTarget: null,    // { key, from } when renaming
  photosData: null,          // working draft of photos.json (may include unsaved layout edits)
  photosDataClean: null,     // last-saved snapshot (used to compute dirty state / discard)
  photosLayoutDirty: false,  // true when local layout differs from photosDataClean
  expandedSeriesIds: new Set() // which series cards are expanded in the list
};

async function fetchCategoriesManifest() {
  const url = `${CATEGORIES_MANIFEST_URL}?t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load categories manifest (${res.status})`);
  const manifest = await res.json();
  state.categories = manifest && typeof manifest === 'object' ? manifest : {};
  return state.categories;
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function getKey() {
  return window.authSystem ? window.authSystem.getAuthKey() : '';
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.style.display = 'block';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.display = 'none'; }, 3500);
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function normalizeProjectImages(images) {
  if (typeof images === 'string') {
    return images.split(',').map(url => url.trim()).filter(Boolean).map(url => ({ url, description: '' }));
  }
  if (!Array.isArray(images)) return [];

  return images.map(image => {
    if (typeof image === 'string') {
      return { url: image.trim(), description: '' };
    }
    if (image && typeof image === 'object') {
      return {
        url: String(image.url || image.src || '').trim(),
        description: String(image.description || '').trim()
      };
    }
    return { url: '', description: '' };
  }).filter(image => image.url);
}

function resetProjectImageEditor() {
  state.editingProjectImageIndex = null;
  const urlInput = document.getElementById('proj-image-url');
  const descInput = document.getElementById('proj-image-description');
  const button = document.getElementById('proj-image-add-btn');
  if (urlInput) urlInput.value = '';
  if (descInput) descInput.value = '';
  if (button) button.textContent = 'Add Image';
}

function getEffectiveCoverUrl() {
  const explicit = (state.projectCoverImageDraft || '').trim();
  if (explicit) {
    const stillExists = state.projectImagesDraft.some(img => img.url === explicit);
    if (stillExists) return explicit;
  }
  return state.projectImagesDraft[0]?.url || '';
}

function setProjectCoverImage(index) {
  const image = state.projectImagesDraft[index];
  if (!image || !image.url) return;
  state.projectCoverImageDraft = image.url;
  renderProjectImagesList();
}

function renderProjectImagesList() {
  const container = document.getElementById('project-images-list');
  if (!container) return;

  if (state.projectImagesDraft.length === 0) {
    container.innerHTML = '<p class="empty-msg project-images-empty">No images added yet.</p>';
    return;
  }

  const coverUrl = getEffectiveCoverUrl();

  container.innerHTML = state.projectImagesDraft.map((image, index) => {
    const isEditing = state.editingProjectImageIndex === index;
    const isCover = image.url && image.url === coverUrl;
    return `
      <div class="project-image-item ${isEditing ? 'editing' : ''} ${isCover ? 'is-cover' : ''}" draggable="true" data-index="${index}">
        <div class="project-image-drag-handle" title="Drag to reorder" aria-label="Drag to reorder">&#x2630;</div>
        <div class="project-image-thumb-wrap">
          <img class="project-image-thumb" src="${esc(image.url)}" alt="" onerror="this.src='https://beyondmebtw.com/assets/images/favicon.ico'">
          ${isCover ? '<span class="project-image-cover-badge">&#9733; Cover</span>' : ''}
        </div>
        <div class="project-image-meta">
          ${isEditing ? `
            <div class="project-image-edit-fields">
              <input type="text" class="project-image-inline-url" data-role="inline-image-url" data-index="${index}" value="${esc(image.url)}" placeholder="https://...">
              <input type="text" class="project-image-inline-description" data-role="inline-image-description" data-index="${index}" value="${esc(image.description || '')}" placeholder="Optional image description">
            </div>
          ` : `
            <div class="project-image-url">${esc(image.url)}</div>
            <div class="project-image-description">${esc(image.description || 'No description')}</div>
          `}
        </div>
        <div class="project-image-actions">
          ${isEditing ? `
            <button type="button" class="btn-icon edit" data-action="save-project-image" data-index="${index}">Save</button>
            <button type="button" class="btn-icon" data-action="cancel-project-image-edit" data-index="${index}">Cancel</button>
          ` : `
            ${isCover
              ? '<button type="button" class="btn-icon" disabled title="This image is the current cover">&#9733; Cover</button>'
              : `<button type="button" class="btn-icon" data-action="set-cover-image" data-index="${index}">Set as Cover</button>`}
            <button type="button" class="btn-icon edit" data-action="edit-project-image" data-index="${index}">Edit</button>
          `}
          <button type="button" class="btn-icon danger" data-action="delete-project-image" data-index="${index}">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-action="edit-project-image"]').forEach(btn => {
    btn.addEventListener('click', () => startEditProjectImage(parseInt(btn.dataset.index, 10)));
  });
  container.querySelectorAll('[data-action="save-project-image"]').forEach(btn => {
    btn.addEventListener('click', () => saveProjectImageEdit(parseInt(btn.dataset.index, 10)));
  });
  container.querySelectorAll('[data-action="cancel-project-image-edit"]').forEach(btn => {
    btn.addEventListener('click', resetProjectImageEditor);
  });
  container.querySelectorAll('[data-action="delete-project-image"]').forEach(btn => {
    btn.addEventListener('click', () => removeProjectImage(parseInt(btn.dataset.index, 10)));
  });
  container.querySelectorAll('[data-action="set-cover-image"]').forEach(btn => {
    btn.addEventListener('click', () => setProjectCoverImage(parseInt(btn.dataset.index, 10)));
  });
  container.querySelectorAll('.project-image-inline-description').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveProjectImageEdit(parseInt(input.dataset.index, 10));
      }
    });
  });

  container.querySelectorAll('.project-image-item').forEach(item => {
    item.addEventListener('dragstart', handleProjectImageDragStart);
    item.addEventListener('dragover', handleProjectImageDragOver);
    item.addEventListener('dragleave', handleProjectImageDragLeave);
    item.addEventListener('drop', handleProjectImageDrop);
    item.addEventListener('dragend', handleProjectImageDragEnd);
  });
}

function handleProjectImageDragStart(e) {
  const idx = parseInt(this.dataset.index, 10);
  if (Number.isNaN(idx)) return;
  state.dragImageIndex = idx;
  this.classList.add('dragging');
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(idx)); } catch (_) {}
  }
}

function handleProjectImageDragOver(e) {
  if (state.dragImageIndex === null) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over');
}

function handleProjectImageDragLeave() {
  this.classList.remove('drag-over');
}

function handleProjectImageDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  const from = state.dragImageIndex;
  const to = parseInt(this.dataset.index, 10);
  if (from === null || Number.isNaN(to) || from === to) return;
  const [moved] = state.projectImagesDraft.splice(from, 1);
  state.projectImagesDraft.splice(to, 0, moved);

  // Keep the editing-row pointer aligned with the moved row, if applicable
  if (state.editingProjectImageIndex === from) {
    state.editingProjectImageIndex = to;
  } else if (state.editingProjectImageIndex !== null) {
    const editing = state.editingProjectImageIndex;
    if (from < editing && to >= editing) state.editingProjectImageIndex = editing - 1;
    else if (from > editing && to <= editing) state.editingProjectImageIndex = editing + 1;
  }

  renderProjectImagesList();
}

function handleProjectImageDragEnd() {
  state.dragImageIndex = null;
  const container = document.getElementById('project-images-list');
  if (container) {
    container.querySelectorAll('.project-image-item').forEach(el => {
      el.classList.remove('dragging');
      el.classList.remove('drag-over');
    });
  }
}

function startEditProjectImage(index) {
  const image = state.projectImagesDraft[index];
  if (!image) return;
  state.editingProjectImageIndex = index;
  renderProjectImagesList();
}

function saveProjectImageEdit(index) {
  const urlInput = document.querySelector(`[data-role="inline-image-url"][data-index="${index}"]`);
  const descInput = document.querySelector(`[data-role="inline-image-description"][data-index="${index}"]`);
  const url = urlInput ? urlInput.value.trim() : '';
  const description = descInput ? descInput.value.trim() : '';

  if (!url) {
    toast('Image URL is required', 'warning');
    return;
  }

  state.projectImagesDraft[index] = { url, description };
  resetProjectImageEditor();
  renderProjectImagesList();
}

function removeProjectImage(index) {
  if (Number.isNaN(index) || index < 0) return;
  const removed = state.projectImagesDraft[index];
  state.projectImagesDraft.splice(index, 1);
  if (state.editingProjectImageIndex === index) resetProjectImageEditor();
  if (state.editingProjectImageIndex !== null && state.editingProjectImageIndex > index) {
    state.editingProjectImageIndex -= 1;
  }
  // If the explicit cover was the removed image, clear it so it falls back to the new first image
  if (removed && removed.url && removed.url === state.projectCoverImageDraft) {
    state.projectCoverImageDraft = '';
  }
  renderProjectImagesList();
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function apiCall(method, endpoint, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify({ ...body, key: getKey() });
  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Server error ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

// ─── Sidebar hamburger toggle ─────────────────────────────────────────────────
function initSidebarToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  const nav = document.getElementById('sidebar-nav');
  if (!toggle || !nav) return;

  const syncSidebarState = isOpen => {
    nav.classList.toggle('open', isOpen);
    toggle.innerHTML = isOpen ? '&times;' : '&#9776;';
    toggle.setAttribute('aria-expanded', String(isOpen));
  };

  syncSidebarState(false);

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    syncSidebarState(!nav.classList.contains('open'));
  });

  nav.addEventListener('click', e => {
    e.stopPropagation();
  });

  document.addEventListener('click', () => {
    if (window.innerWidth <= 700 && nav.classList.contains('open')) {
      syncSidebarState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 700) {
      syncSidebarState(false);
    }
  });
}

// ─── Tab navigation ───────────────────────────────────────────────────────────
function initTabs() {
  const nav = document.getElementById('sidebar-nav');
  const toggle = document.getElementById('sidebar-toggle');

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');

      // Close mobile menu on tab switch
      if (nav) nav.classList.remove('open');
      if (toggle) {
        toggle.innerHTML = '&#9776;';
        toggle.setAttribute('aria-expanded', 'false');
      }

      // Lazy-load tab data on first visit; reuse cache if available
      if (tab === 'blog') {
        if (!state.blogData) loadBlogTab();
        else { buildCategoryTabs(); buildBlogCategorySelect(); renderPostsList(); }
      }
      if (tab === 'categories') {
        loadCategoriesTab();
      }
      if (tab === 'projects') {
        if (state.projects.length === 0) loadProjectsTab();
        else renderProjectsList();
      }
      if (tab === 'photos') {
        if (!state.photosData) loadPhotosTab();
        else renderPhotosTab();
      }
    });
  });
}

// ─── Modal close buttons ──────────────────────────────────────────────────────
function initModalClose() {
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });
}

// ─── Collapsible forms ────────────────────────────────────────────────────────
function initToggleForms() {
  document.querySelectorAll('.toggle-form-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const expanded = target.classList.contains('expanded');
      target.classList.toggle('expanded', !expanded);
      target.classList.toggle('collapsed', expanded);
      btn.textContent = expanded ? 'Edit' : 'Close';
    });
  });
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
function confirm(msg, cb) {
  document.getElementById('confirm-msg').textContent = msg;
  state.confirmCallback = cb;
  openModal('confirm-modal');
}

function initConfirmModal() {
  document.getElementById('confirm-ok').addEventListener('click', () => {
    closeModal('confirm-modal');
    if (state.confirmCallback) state.confirmCallback();
    state.confirmCallback = null;
  });
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    closeModal('confirm-modal');
    state.confirmCallback = null;
  });
}

function initLatestConfirmModal() {
  document.querySelectorAll('#latest-confirm-modal .set-slot-options button[data-slot]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = btn.dataset.slot;
      closeModal('latest-confirm-modal');
      if (state.latestConfirmCallback) state.latestConfirmCallback(slot);
      state.latestConfirmCallback = null;
    });
  });
  document.getElementById('latest-confirm-cancel').addEventListener('click', () => {
    closeModal('latest-confirm-modal');
    state.latestConfirmCallback = null;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOMEPAGE TAB
// ═══════════════════════════════════════════════════════════════════════════════

async function loadHomepageTab() {
  try {
    // Reuse cached data if available, otherwise fetch
    if (!state.latestData) {
      state.latestData = await fetch('https://beyondmebtw.com/manage/latest.json').then(r => r.json());
    }
    const data = state.latestData;
    renderLatestPost(data.mainPost);
    renderFeaturedPosts(data.featured || []);
    renderLatestByCategory(data.categories || {});

    // Reuse cached projects if available
    if (state.projects.length === 0) {
      state.projects = await fetch(PROJECTS_URL).then(r => r.json()) || [];
    }
    renderFeaturedProjects(data.featuredProjects || [1,2,3,4], state.projects);

    // Load minis metadata + render featured minis dropdowns
    if (state.minisMetadata.length === 0) {
      try {
        state.minisMetadata = await fetchMinisMetadata();
      } catch (e) {
        console.warn('Failed to fetch minis metadata:', e);
        state.minisMetadata = [];
      }
    }
    renderFeaturedMinis(data.featuredMinis || [{},{},{}], state.minisMetadata);
  } catch (e) {
    console.error('Homepage load error:', e);
    toast('Failed to load homepage data', 'error');
  }
}

async function fetchMinisMetadata() {
  // Try the proxied endpoint first (avoids CORS); fall back to direct fetch
  try {
    const r = await apiCall('GET', '/minismetadata');
    if (Array.isArray(r)) return r;
  } catch (_) {}
  const direct = await fetch('https://minis.beyondmebtw.com/content/metadata.json').then(r => r.json());
  return Array.isArray(direct) ? direct : [];
}

function renderLatestPost(post) {
  const el = document.getElementById('latest-display');
  if (!el) return;
  if (!post || !post.title) {
    el.innerHTML = '<p style="color:var(--text-dim);font-size:13px">No post set</p>';
    return;
  }
  const date = post.date ? new Date(post.date).toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}) : '';
  el.innerHTML = `
    <img src="${esc(post.thumbnail)}" alt="" onerror="this.style.display='none'">
    <div class="post-info">
      <h4>${esc(post.title)}</h4>
      <p>${esc(date)} &mdash; ${esc(post.excerpt || '').slice(0,80)}${(post.excerpt||'').length>80?'…':''}</p>
    </div>
    <a href="${esc(post.link)}" target="_blank" rel="noopener">View &#8599;</a>
  `;

  // Pre-fill the edit form
  const form = document.getElementById('latest');
  if (form) {
    if (post.title) form.querySelector('[name="name"]').value = post.title;
    if (post.date) form.querySelector('[name="date"]').value = post.date.slice(0,10);
    if (post.excerpt) form.querySelector('[name="excerpt"]').value = post.excerpt;
    if (post.thumbnail) form.querySelector('[name="thumbnail"]').value = post.thumbnail;
    if (post.link) form.querySelector('[name="link"]').value = post.link;
  }
}

function renderFeaturedPosts(posts) {
  const container = document.getElementById('featured-posts-container');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 4; i++) {
    const post = posts[i] || {};
    const date = post.date ? new Date(post.date).toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}) : '';
    const formId = `featured${i+1}`;

    const div = document.createElement('div');
    div.className = 'featured-post-card';
    div.innerHTML = `
      <div class="slot-label">Featured ${i+1}</div>
      ${post.title ? `
        <div class="current-post">
          <img src="${esc(post.thumbnail)}" alt="" onerror="this.style.display='none'">
          <div class="info">
            <h5>${esc(post.title)}</h5>
            <p>${esc(date)}</p>
          </div>
        </div>
      ` : '<div class="empty-slot">No post assigned</div>'}
      <form id="${formId}" class="inline-form">
        <div class="form-group">
          <label>Title</label>
          <input type="text" name="name" value="${esc(post.title||'')}" placeholder="Post title">
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="date" name="date" value="${esc(post.date ? post.date.slice(0,10) : '')}">
        </div>
        <div class="form-group">
          <label>Excerpt</label>
          <textarea name="excerpt" rows="4" placeholder="Excerpt...">${esc(post.excerpt||'')}</textarea>
        </div>
        <div class="form-group">
          <label>Thumbnail URL</label>
          <input type="text" name="thumbnail" value="${esc(post.thumbnail||'')}" placeholder="https://...">
        </div>
        <div class="form-group">
          <label>Post Link</label>
          <input type="text" name="link" value="${esc(post.link||'')}" placeholder="https://...">
        </div>
        <input type="hidden" name="instance" value="${formId}">
        <button type="submit" class="btn-primary" style="width:100%;margin-top:6px">Save Featured ${i+1}</button>
      </form>
    `;
    container.appendChild(div);

    div.querySelector('form').addEventListener('submit', async e => {
      e.preventDefault();
      await submitContentForm(e.target, formId);
    });
  }
}

async function submitContentForm(form, formId) {
  const fd = new FormData(form);
  const body = {};
  fd.forEach((v, k) => { if (v.trim()) body[k] = v.trim(); });
  body.formid = formId;

  try {
    await apiCall('POST', '/latestdata', body);
    toast(`${formId} updated`);
    loadHomepageTab();
  } catch (e) {
    toast(`Error: ${e.message}`, 'error');
  }
}

function renderFeaturedProjects(featuredIds, projects) {
  const container = document.getElementById('featured-projects-container');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 4; i++) {
    const currentId = featuredIds[i] || null;
    const currentProj = projects.find(p => p.id === currentId);

    const slot = document.createElement('div');
    slot.className = 'featured-proj-slot';
    slot.innerHTML = `
      <div class="slot-label">Slot ${i+1}</div>
      <select class="feat-proj-select" data-slot="${i}">
        <option value="">— None —</option>
        ${projects.map(p => `<option value="${p.id}" ${p.id===currentId?'selected':''}>${esc(p.title)}</option>`).join('')}
      </select>
      <div class="proj-preview">${currentProj ? esc(currentProj.shortDescription||'') : ''}</div>
    `;
    container.appendChild(slot);

    slot.querySelector('select').addEventListener('change', e => {
      const projId = parseInt(e.target.value, 10);
      const proj = projects.find(p => p.id === projId);
      slot.querySelector('.proj-preview').textContent = proj ? (proj.shortDescription || '') : '';
    });
  }
}

function initFeaturedProjectsForm() {
  const form = document.getElementById('featured-projects-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const selects = document.querySelectorAll('.feat-proj-select');
    const ids = Array.from(selects).map(s => parseInt(s.value, 10) || null);

    if (ids.some(id => !id)) {
      toast('Please select a project for all 4 slots', 'warning');
      return;
    }

    try {
      await apiCall('POST', '/latestdata', { formid: 'featuredProjects', projectIds: ids });
      toast('Featured projects saved');
      state.latestData.featuredProjects = ids;
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
    }
  });
}

function initLatestForm() {
  const form = document.getElementById('latest');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    await submitContentForm(e.target, 'latest');
  });
}

function initSubtabs() {
  const buttons = document.querySelectorAll('.subtab-btn');
  if (!buttons.length) return;
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.subtab;
      buttons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.subtab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.querySelector(`.subtab-panel[data-subpanel="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

function renderFeaturedMinis(featuredMinis, allMinis) {
  const container = document.getElementById('featured-minis-container');
  if (!container) return;
  container.innerHTML = '';

  const slots = (featuredMinis && featuredMinis.length === 3)
    ? featuredMinis
    : [featuredMinis?.[0] || {}, featuredMinis?.[1] || {}, featuredMinis?.[2] || {}];

  if (!Array.isArray(allMinis) || allMinis.length === 0) {
    container.innerHTML = '<p class="empty-msg">No minis available. Check the minis source.</p>';
    return;
  }

  for (let i = 0; i < 3; i++) {
    const current = slots[i] || {};
    const currentId = current.id || '';
    const slot = document.createElement('div');
    slot.className = 'featured-proj-slot';
    slot.innerHTML = `
      <div class="slot-label">Slot ${i+1}</div>
      <select class="feat-mini-select" data-slot="${i}">
        <option value="">— None —</option>
        ${allMinis.map(m => `<option value="${esc(m.id)}" ${m.id===currentId?'selected':''}>${esc(m.title || m.id)}</option>`).join('')}
      </select>
      <div class="proj-preview" data-role="mini-preview">${esc((allMinis.find(m => m.id === currentId) || current).featuredExcerpt || '')}</div>
    `;
    container.appendChild(slot);

    slot.querySelector('select').addEventListener('change', e => {
      const m = allMinis.find(x => x.id === e.target.value);
      slot.querySelector('[data-role="mini-preview"]').textContent = m ? (m.featuredExcerpt || '') : '';
    });
  }
}

function initFeaturedMinisForm() {
  const form = document.getElementById('featured-minis-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const selects = document.querySelectorAll('.feat-mini-select');
    const ids = Array.from(selects).map(s => s.value);

    if (ids.some(id => !id)) {
      toast('Please select a mini for all 3 slots', 'warning');
      return;
    }

    const minis = ids.map(id => {
      const m = state.minisMetadata.find(x => x.id === id);
      if (!m) return { id };
      return {
        id: m.id,
        title: m.title || '',
        date: m.date || '',
        featuredExcerpt: m.featuredExcerpt || ''
      };
    });

    try {
      await apiCall('POST', '/latestdata', { formid: 'featuredMinis', minis });
      toast('Featured minis saved');
      if (state.latestData) state.latestData.featuredMinis = minis;
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOG TAB
// ═══════════════════════════════════════════════════════════════════════════════

async function loadBlogTab() {
  try {
    if (!state.latestData) {
      state.latestData = await fetch('https://beyondmebtw.com/manage/latest.json').then(r => r.json());
    }
    if (!state.categories || Object.keys(state.categories).length === 0) {
      await fetchCategoriesManifest();
    }

    if (!state.blogData) {
      const catKeys = Object.keys(state.categories);
      const fetched = await Promise.allSettled(
        catKeys.map(key => fetch(`${BLOG_BASE_URL}/${key}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }))
      );
      state.blogData = {};
      catKeys.forEach((key, i) => {
        if (fetched[i].status === 'fulfilled') {
          state.blogData[key] = fetched[i].value;
        } else {
          console.warn(`Could not load ${key}.json:`, fetched[i].reason);
          state.blogData[key] = { subcategories: [], posts: [] };
        }
      });
    }

    buildCategoryTabs();
    buildBlogCategorySelect();
    buildSubcategoryChips();
    buildSecondaryCategoryChips();
    renderPostsList();
    renderLatestByCategory(state.latestData.categories || {});
  } catch (e) {
    console.error('Blog tab load error:', e);
    document.getElementById('blog-posts-list').innerHTML = '<div class="empty-msg">Failed to load blog data.</div>';
    toast('Failed to load blog data', 'error');
  }
}

function buildCategoryTabs() {
  const bar = document.getElementById('blog-category-tabs');
  if (!bar) return;
  bar.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = `cat-tab-btn ${state.currentBlogCategory === 'all' ? 'active' : ''}`;
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => switchBlogCategory('all'));
  bar.appendChild(allBtn);

  Object.keys(state.categories).forEach(key => {
    const cat = state.categories[key];
    const btn = document.createElement('button');
    btn.className = `cat-tab-btn ${state.currentBlogCategory === key ? 'active' : ''}`;
    btn.textContent = cat.name || key;
    btn.addEventListener('click', () => switchBlogCategory(key));
    bar.appendChild(btn);
  });
}

function switchBlogCategory(key) {
  state.currentBlogCategory = key;
  state.blogSearch = '';
  const searchInput = document.getElementById('blog-search');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.cat-tab-btn').forEach(b => {
    b.classList.toggle('active', b.textContent === (key === 'all' ? 'All' : (state.categories[key]?.name || key)));
  });
  renderPostsList();
}

// Render posts: first 4 per category by default, or search results across all categories
function renderPostsList() {
  const container = document.getElementById('blog-posts-list');
  if (!container || !state.blogData) return;

  const query = (state.blogSearch || '').toLowerCase().trim();
  const isSearching = query.length >= 2;

  // Which categories to show
  const categoriesToShow = state.currentBlogCategory === 'all'
    ? Object.keys(state.blogData)
    : [state.currentBlogCategory].filter(k => state.blogData[k]);

  if (categoriesToShow.length === 0) {
    container.innerHTML = '<div class="empty-msg">No posts found.</div>';
    return;
  }

  // Search mode: find matching posts across all shown categories
  if (isSearching) {
    let html = '<div class="posts-list-header"><span>Thumb</span><span>Title / UID</span><span></span><span>Category</span><span>Date</span><span>Actions</span></div>';
    let totalMatches = 0;

    categoriesToShow.forEach(catKey => {
      const catData = state.blogData[catKey];
      if (!catData) return;
      const catName = state.categories[catKey]?.name || catKey;

      (catData.posts || []).forEach(post => {
        if ((post.title || '').toLowerCase().includes(query) || (post.uid || '').toLowerCase().includes(query)) {
          html += renderPostRow(post, catKey, catName);
          totalMatches++;
        }
      });
    });

    if (totalMatches === 0) {
      container.innerHTML = `<div class="empty-msg">No posts matching "${esc(query)}".</div>`;
    } else {
      container.innerHTML = `<div class="search-result-count">${totalMatches} result${totalMatches !== 1 ? 's' : ''} for "${esc(query)}"</div>` + html;
      attachPostRowHandlers(container);
    }
    return;
  }

  // Default mode: first 4 per category
  let html = '<div class="posts-list-header"><span>Thumb</span><span>Title / UID</span><span></span><span>Subcategory</span><span>Date</span><span>Actions</span></div>';

  categoriesToShow.forEach(catKey => {
    const catData = state.blogData[catKey];
    if (!catData) return;

    const catConfig = state.categories[catKey] || {};
    const posts = catData.posts || [];
    const preview = posts.slice(-4).reverse(); // last 4 = most recent

    html += `
      <div class="category-section-header">
        <span class="cat-name">${esc(catConfig.name || catKey)}</span>
        <span class="post-count">${posts.length} post${posts.length !== 1 ? 's' : ''} — showing ${preview.length}</span>
        ${posts.length > 4 ? '<span class="search-hint">Search to find older posts</span>' : ''}
      </div>
    `;

    if (posts.length === 0) {
      html += '<div class="empty-msg" style="padding:16px">No posts in this category.</div>';
      return;
    }

    preview.forEach(post => { html += renderPostRow(post, catKey); });
  });

  container.innerHTML = html;
  attachPostRowHandlers(container);
}

function attachPostRowHandlers(container) {
  container.querySelectorAll('[data-action="set-post"]').forEach(btn => {
    btn.addEventListener('click', () => openSetPostModal(btn));
  });
  container.querySelectorAll('[data-action="edit-post"]').forEach(btn => {
    btn.addEventListener('click', () => openEditBlogPost(btn.dataset.category, btn.dataset.uid));
  });
  container.querySelectorAll('[data-action="delete-post"]').forEach(btn => {
    btn.addEventListener('click', () => promptDeleteBlogPost(btn.dataset.category, btn.dataset.uid, btn.dataset.title));
  });
}

async function openSetPostModal(btn) {
  const category = btn.dataset.category;
  const uid = btn.dataset.uid;
  const catData = state.blogData[category];
  if (!catData) return;
  const post = catData.posts.find(p => p.uid === uid);
  if (!post) return;

  document.getElementById('latest-confirm-title').textContent = post.title;
  state.latestConfirmCallback = async (slot) => {
    try {
      await apiCall('POST', '/latestdata', {
        formid: slot,
        name: post.title,
        date: post.date || '',
        excerpt: post.excerpt || '',
        thumbnail: post.thumbnail || '',
        link: post.link || ''
      });
      state.latestData = null;
      loadHomepageTab();
      const label = slot === 'latest' ? 'Latest post' : `Featured ${slot.slice(-1)}`;
      toast(`${label} updated`);
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
    }
  };
  openModal('latest-confirm-modal');
}

function initBlogSearch() {
  const input = document.getElementById('blog-search');
  if (!input) return;
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.blogSearch = input.value;
      renderPostsList();
    }, 250);
  });
}

// displayLabel: optional override for the subcategory/category column (used in search results)
function renderPostRow(post, catKey, displayLabel) {
  const date = post.date ? post.date : '';
  const label = displayLabel || post.subcategory || '—';
  return `
    <div class="post-row">
      <img class="thumb" src="${esc(post.thumbnail)}" alt="" onerror="this.style.display='none'">
      <div>
        <div class="post-title">${esc(post.title)}</div>
        <div class="post-uid">${esc(post.uid)}</div>
      </div>
      <button class="btn-icon latest" data-action="set-post" data-category="${esc(catKey)}" data-uid="${esc(post.uid)}" title="Set post placement">Set</button>
      <div class="post-subcat">${esc(label)}</div>
      <div class="post-date">${esc(date)}</div>
      <div class="post-actions">
        <button class="btn-icon edit" data-action="edit-post" data-category="${esc(catKey)}" data-uid="${esc(post.uid)}" title="Edit">Edit</button>
        <button class="btn-icon danger" data-action="delete-post" data-category="${esc(catKey)}" data-uid="${esc(post.uid)}" data-title="${esc(post.title)}" title="Delete">Del</button>
      </div>
    </div>
  `;
}

function buildBlogCategorySelect() {
  const select = document.getElementById('blog-category');
  if (!select) return;
  select.innerHTML = '<option value="">Select Category</option>';
  Object.keys(state.categories).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = state.categories[key].name || key;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    buildSubcategoryChips(select.value);
  });
}

// initialValue: if provided, pre-selects that chip and preserves the hidden value
function buildSubcategoryChips(selectedCategory, initialValue) {
  const container = document.getElementById('subcategory-buttons');
  const hidden = document.getElementById('blog-subcategory');
  if (!container || !hidden) return;

  container.innerHTML = '';
  // Only reset if no initial value is being restored
  if (initialValue === undefined) hidden.value = '';
  else hidden.value = initialValue || '';

  const catKey = selectedCategory || document.getElementById('blog-category')?.value;
  const catData = catKey ? state.categories[catKey] : null;
  const subcats = catData ? (catData.subcategories || []) : [];

  if (subcats.length === 0) {
    container.innerHTML = '<span style="color:var(--text-dim);font-size:12px">No subcategories</span>';
    return;
  }

  subcats.forEach(subcat => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = subcat;
    // Mark selected immediately — no setTimeout needed
    if (hidden.value && hidden.value.toLowerCase() === subcat.toLowerCase()) {
      chip.classList.add('selected');
    }
    chip.addEventListener('click', () => {
      hidden.value = chip.classList.contains('selected') ? '' : subcat;
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      if (hidden.value) chip.classList.add('selected');
    });
    container.appendChild(chip);
  });

  const clearChip = document.createElement('button');
  clearChip.type = 'button';
  clearChip.className = 'chip clear-chip';
  clearChip.textContent = 'Clear';
  clearChip.addEventListener('click', () => {
    hidden.value = '';
    container.querySelectorAll('.chip:not(.clear-chip)').forEach(c => c.classList.remove('selected'));
  });
  container.appendChild(clearChip);
}

// initialCatKey / initialSubcat: if provided, pre-selects the matching chips
function buildSecondaryCategoryChips(initialCatKey, initialSubcat) {
  const container = document.getElementById('secondary-category-buttons');
  const hidden = document.getElementById('blog-secondary-category');
  const subContainer = document.getElementById('secondary-subcategory-buttons');
  const subHidden = document.getElementById('blog-secondary-subcategory');
  if (!container || !hidden) return;

  container.innerHTML = '';
  if (initialCatKey === undefined) {
    if (subContainer) subContainer.innerHTML = '<span style="color:var(--text-dim);font-size:12px">Select category first</span>';
    hidden.value = '';
    if (subHidden) subHidden.value = '';
  } else {
    hidden.value = initialCatKey || '';
    if (subHidden) subHidden.value = initialSubcat || '';
  }

  Object.keys(state.categories).forEach(key => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = state.categories[key].name || key;
    chip.dataset.key = key;
    // Mark selected immediately if this matches the initial value
    if (hidden.value === key) chip.classList.add('selected');
    chip.addEventListener('click', () => {
      const wasSelected = chip.classList.contains('selected');
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      hidden.value = wasSelected ? '' : key;
      if (!wasSelected) {
        chip.classList.add('selected');
        buildSecondarySubcatChips(key);
      } else {
        if (subContainer) subContainer.innerHTML = '<span style="color:var(--text-dim);font-size:12px">Select category first</span>';
        if (subHidden) subHidden.value = '';
      }
    });
    container.appendChild(chip);
  });

  // If restoring an initial secondary category, also build its subcategory chips
  if (initialCatKey) buildSecondarySubcatChips(initialCatKey, initialSubcat);

  const clearChip = document.createElement('button');
  clearChip.type = 'button';
  clearChip.className = 'chip clear-chip';
  clearChip.textContent = 'Clear';
  clearChip.addEventListener('click', () => {
    hidden.value = '';
    if (subHidden) subHidden.value = '';
    container.querySelectorAll('.chip:not(.clear-chip)').forEach(c => c.classList.remove('selected'));
    if (subContainer) subContainer.innerHTML = '<span style="color:var(--text-dim);font-size:12px">Select category first</span>';
  });
  container.appendChild(clearChip);
}

function buildSecondarySubcatChips(catKey, initialValue) {
  const container = document.getElementById('secondary-subcategory-buttons');
  const hidden = document.getElementById('blog-secondary-subcategory');
  if (!container || !hidden) return;

  container.innerHTML = '';
  if (initialValue === undefined) hidden.value = '';
  else hidden.value = initialValue || '';

  const subcats = state.categories[catKey]?.subcategories || [];
  if (subcats.length === 0) {
    container.innerHTML = '<span style="color:var(--text-dim);font-size:12px">No subcategories</span>';
    return;
  }

  subcats.forEach(subcat => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = subcat;
    // Mark selected immediately if this matches the initial value
    if (hidden.value && hidden.value.toLowerCase() === subcat.toLowerCase()) {
      chip.classList.add('selected');
    }
    chip.addEventListener('click', () => {
      hidden.value = chip.classList.contains('selected') ? '' : subcat;
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      if (hidden.value) chip.classList.add('selected');
    });
    container.appendChild(chip);
  });

  const clearChip = document.createElement('button');
  clearChip.type = 'button';
  clearChip.className = 'chip clear-chip';
  clearChip.textContent = 'Clear';
  clearChip.addEventListener('click', () => {
    hidden.value = '';
    container.querySelectorAll('.chip:not(.clear-chip)').forEach(c => c.classList.remove('selected'));
  });
  container.appendChild(clearChip);
}

function openEditBlogPost(category, uid) {
  const catData = state.blogData[category];
  if (!catData) return;
  const post = catData.posts.find(p => p.uid === uid);
  if (!post) return;

  state.editingBlogPost = { category, uid };

  document.getElementById('blog-modal-title').textContent = 'Edit Blog Post';
  document.getElementById('blog-submit-btn').textContent = 'Save Changes';
  document.getElementById('blog-edit-mode').value = 'edit';

  // Fill form
  document.getElementById('blog-category').value = post.subcategory ? category : category;
  document.getElementById('blog-uid').value = post.uid;
  document.getElementById('blog-uid').readOnly = true;
  document.getElementById('blog-title').value = post.title || '';
  document.getElementById('blog-date').value = (post.date || '').slice(0,10);
  document.getElementById('blog-excerpt').value = post.excerpt || '';
  document.getElementById('blog-thumbnail').value = post.thumbnail || '';
  document.getElementById('blog-link').value = post.link || '';
  // Build chips with initial values — selection is marked immediately, no setTimeout needed
  buildSubcategoryChips(category, post.subcategory || '');
  buildSecondaryCategoryChips(post.secondaryCategory || undefined, post.secondarySubcategory || undefined);

  openModal('blog-modal');
}

function promptDeleteBlogPost(category, uid, title) {
  confirm(`Delete "${title}"? This cannot be undone.`, async () => {
    try {
      await apiCall('DELETE', '/blogdata', { category, uid });
      // Remove from local state
      state.blogData[category].posts = state.blogData[category].posts.filter(p => p.uid !== uid);
      renderPostsList(state.currentBlogCategory);
      toast('Post deleted');
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
    }
  });
}

function initBlogForm() {
  const form = document.getElementById('blog-form');
  const clearBtn = document.getElementById('clear-blog-form');
  const newPostBtn = document.getElementById('new-post-btn');

  if (newPostBtn) {
    newPostBtn.addEventListener('click', () => {
      resetBlogForm();
      openModal('blog-modal');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', resetBlogForm);
  }

  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const mode = document.getElementById('blog-edit-mode').value;
    const category = document.getElementById('blog-category').value.trim();
    const uid = document.getElementById('blog-uid').value.trim();
    const title = document.getElementById('blog-title').value.trim();
    const date = document.getElementById('blog-date').value.trim();
    const excerpt = document.getElementById('blog-excerpt').value.trim();
    const thumbnail = document.getElementById('blog-thumbnail').value.trim();
    const link = document.getElementById('blog-link').value.trim();
    const subcategory = document.getElementById('blog-subcategory').value.trim();
    const secondaryCategory = document.getElementById('blog-secondary-category').value.trim();
    const secondarySubcategory = document.getElementById('blog-secondary-subcategory').value.trim();

    if (!category || !title || !date || !excerpt || !thumbnail || !link) {
      toast('Please fill all required fields', 'warning');
      return;
    }

    const btn = document.getElementById('blog-submit-btn');
    btn.disabled = true;

    try {
      if (mode === 'edit') {
        const { category: editCat, uid: editUid } = state.editingBlogPost;
        const body = { category: editCat, uid: editUid, title, date, excerpt, thumbnail, link, subcategory };
        if (secondaryCategory) body.secondaryCategory = secondaryCategory;
        if (secondarySubcategory) body.secondarySubcategory = secondarySubcategory;
        await apiCall('PUT', '/blogdata', body);

        // Update local state
        const posts = state.blogData[editCat].posts;
        const idx = posts.findIndex(p => p.uid === editUid);
        if (idx !== -1) Object.assign(posts[idx], { title, date, excerpt, thumbnail, link, subcategory });

        toast('Post updated');
      } else {
        const body = { category, uid, title, date, excerpt, thumbnail, link, subcategory };
        if (secondaryCategory) body.secondaryCategory = secondaryCategory;
        if (secondarySubcategory) body.secondarySubcategory = secondarySubcategory;
        await apiCall('POST', '/blogdata', body);

        // Add to local state (approximate — server adds actual uid)
        if (!state.blogData[category]) state.blogData[category] = { subcategories: [], posts: [] };
        state.blogData[category].posts.push({ uid: uid || `${category}_new`, title, date, excerpt, thumbnail, link, subcategory });

        toast('Post added');
      }

      closeModal('blog-modal');
      renderPostsList(state.currentBlogCategory);
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function resetBlogForm() {
  state.editingBlogPost = null;
  document.getElementById('blog-modal-title').textContent = 'New Blog Post';
  document.getElementById('blog-submit-btn').textContent = 'Add Post';
  document.getElementById('blog-edit-mode').value = 'create';
  document.getElementById('blog-form').reset();
  document.getElementById('blog-uid').readOnly = false;
  document.getElementById('blog-subcategory').value = '';
  document.getElementById('blog-secondary-category').value = '';
  document.getElementById('blog-secondary-subcategory').value = '';

  buildSubcategoryChips();
  buildSecondaryCategoryChips();
}

// ─── Latest by category ───────────────────────────────────────────────────────
function renderLatestByCategory(categories) {
  const container = document.getElementById('latest-by-category');
  if (!container || !categories) return;

  let html = '';

  Object.keys(categories).forEach(catKey => {
    const catData = categories[catKey];
    const catConfig = state.categories[catKey] || {};
    const catName = catConfig.name || catKey;

    if (catData.subcategories && Object.keys(catData.subcategories).length > 0) {
      Object.keys(catData.subcategories).forEach(subKey => {
        const sub = catData.subcategories[subKey];
        if (sub.mainPost) {
          html += renderLatestCatCard(catName, subKey, sub.mainPost);
        }
      });
    } else if (catData.mainPost) {
      html += renderLatestCatCard(catName, null, catData.mainPost);
    }
  });

  container.innerHTML = html || '<div class="empty-msg">No category data found.</div>';
}

function renderLatestCatCard(catName, subcatName, post) {
  return `
    <div class="latest-cat-card">
      <div class="lc-cat">${esc(catName)}</div>
      ${subcatName ? `<div class="lc-subcat">${esc(subcatName)}</div>` : ''}
      <img class="lc-thumb" src="${esc(post.thumbnail)}" alt="" onerror="this.style.display='none'">
      <div class="lc-title">${esc(post.title)}</div>
      <div class="lc-uid">${esc(post.uid)}</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES TAB
// ═══════════════════════════════════════════════════════════════════════════════

async function loadCategoriesTab() {
  try {
    await fetchCategoriesManifest();
    if (!state.blogData) {
      const catKeys = Object.keys(state.categories);
      const fetched = await Promise.allSettled(
        catKeys.map(key => fetch(`${BLOG_BASE_URL}/${key}.json?t=${Date.now()}`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }))
      );
      state.blogData = {};
      catKeys.forEach((key, i) => {
        state.blogData[key] = fetched[i].status === 'fulfilled' ? fetched[i].value : { subcategories: [], posts: [] };
      });
    }
    renderCategoriesList();
  } catch (e) {
    console.error('Categories load error:', e);
    document.getElementById('categories-list').innerHTML = '<div class="empty-msg">Failed to load categories.</div>';
    toast('Failed to load categories', 'error');
  }
}

function renderCategoriesList() {
  const container = document.getElementById('categories-list');
  if (!container) return;

  const keys = Object.keys(state.categories);
  if (keys.length === 0) {
    container.innerHTML = '<div class="empty-msg">No categories yet. Click "+ New Category" to create one.</div>';
    return;
  }

  container.innerHTML = keys.map(key => {
    const cat = state.categories[key];
    const postCount = (state.blogData && state.blogData[key] && Array.isArray(state.blogData[key].posts))
      ? state.blogData[key].posts.length
      : 0;
    const iconClass = cat.icon || 'fas fa-folder';
    const subs = Array.isArray(cat.subcategories) ? cat.subcategories : [];

    const subsHtml = subs.length
      ? subs.map(s => `
          <li class="subcat-row">
            <span class="subcat-name">${esc(s)}</span>
            <span class="subcat-actions">
              <button type="button" class="btn-icon edit" data-action="rename-subcat" data-cat="${esc(key)}" data-sub="${esc(s)}">Rename</button>
              <button type="button" class="btn-icon danger" data-action="remove-subcat" data-cat="${esc(key)}" data-sub="${esc(s)}">Remove</button>
            </span>
          </li>`).join('')
      : '<li class="empty-msg" style="padding:6px 0">No subcategories</li>';

    return `
      <div class="category-card">
        <div class="category-card-head">
          <div class="category-card-icon"><i class="${esc(iconClass)}"></i></div>
          <div class="category-card-meta">
            <h3>${esc(cat.name || key)}</h3>
            <div class="category-card-sub">
              <span class="cat-key-tag">${esc(key)}</span>
              <span class="post-count-tag">${postCount} post${postCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div class="category-card-actions">
            <button type="button" class="btn-icon edit" data-action="edit-cat" data-cat="${esc(key)}">Edit</button>
            <button type="button" class="btn-icon danger" data-action="delete-cat" data-cat="${esc(key)}">Delete</button>
          </div>
        </div>
        <div class="category-card-subs">
          <div class="subcat-header">
            <span class="subcat-heading">Subcategories</span>
            <button type="button" class="btn-ghost btn-small" data-action="add-subcat" data-cat="${esc(key)}">+ Add</button>
          </div>
          <ul class="subcat-list">${subsHtml}</ul>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-action="edit-cat"]').forEach(btn => {
    btn.addEventListener('click', () => openEditCategoryModal(btn.dataset.cat));
  });
  container.querySelectorAll('[data-action="delete-cat"]').forEach(btn => {
    btn.addEventListener('click', () => openCategoryDeleteModal(btn.dataset.cat));
  });
  container.querySelectorAll('[data-action="add-subcat"]').forEach(btn => {
    btn.addEventListener('click', () => openSubcatModal('add', btn.dataset.cat));
  });
  container.querySelectorAll('[data-action="rename-subcat"]').forEach(btn => {
    btn.addEventListener('click', () => openSubcatModal('rename', btn.dataset.cat, btn.dataset.sub));
  });
  container.querySelectorAll('[data-action="remove-subcat"]').forEach(btn => {
    btn.addEventListener('click', () => promptRemoveSubcategory(btn.dataset.cat, btn.dataset.sub));
  });
}

function openNewCategoryModal() {
  document.getElementById('category-modal-title').textContent = 'New Category';
  document.getElementById('cat-submit-btn').textContent = 'Create';
  document.getElementById('cat-edit-mode').value = 'create';
  document.getElementById('cat-key').value = '';
  document.getElementById('cat-key').readOnly = false;
  document.getElementById('cat-name').value = '';
  document.getElementById('cat-icon').value = '';
  openModal('category-modal');
}

function openEditCategoryModal(key) {
  const cat = state.categories[key];
  if (!cat) return;
  document.getElementById('category-modal-title').textContent = 'Edit Category';
  document.getElementById('cat-submit-btn').textContent = 'Save';
  document.getElementById('cat-edit-mode').value = 'edit';
  document.getElementById('cat-key').value = key;
  document.getElementById('cat-key').readOnly = true;
  document.getElementById('cat-name').value = cat.name || '';
  document.getElementById('cat-icon').value = cat.icon || '';
  openModal('category-modal');
}

function initCategoryModal() {
  const newBtn = document.getElementById('new-category-btn');
  if (newBtn) newBtn.addEventListener('click', openNewCategoryModal);

  const form = document.getElementById('category-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const mode = document.getElementById('cat-edit-mode').value;
    const keyInput = document.getElementById('cat-key').value.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const name = document.getElementById('cat-name').value.trim();
    const icon = document.getElementById('cat-icon').value.trim();

    if (!keyInput || !name) { toast('Key and name are required', 'warning'); return; }

    try {
      if (mode === 'create') {
        await apiCall('POST', '/category', { action: 'addCategory', categoryKey: keyInput, name, icon });
        toast(`Category "${name}" created`);
      } else {
        await apiCall('POST', '/category', { action: 'updateCategory', categoryKey: keyInput, name, icon });
        toast(`Category "${name}" updated`);
      }
      closeModal('category-modal');
      state.blogData = null;
      state.categories = {};
      await loadCategoriesTab();
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    }
  });
}

// ─── Subcategory add/rename modal ─────────────────────────────────────────────
function openSubcatModal(mode, categoryKey, fromName) {
  const cat = state.categories[categoryKey];
  if (!cat) return;
  state.subcatEditTarget = { key: categoryKey, from: fromName || null };
  document.getElementById('subcat-modal-title').textContent = mode === 'rename' ? 'Rename Subcategory' : 'Add Subcategory';
  document.getElementById('subcat-submit-btn').textContent = mode === 'rename' ? 'Rename' : 'Add';
  document.getElementById('subcat-mode').value = mode;
  document.getElementById('subcat-parent-key').value = categoryKey;
  document.getElementById('subcat-parent-display').value = `${cat.name || categoryKey} (${categoryKey})`;
  document.getElementById('subcat-name-label').innerHTML = mode === 'rename'
    ? 'Rename to <span class="req">*</span>'
    : 'Subcategory name <span class="req">*</span>';

  const fromGroup = document.getElementById('subcat-from-group');
  if (mode === 'rename') {
    fromGroup.style.display = '';
    document.getElementById('subcat-from').value = fromName || '';
    document.getElementById('subcat-name').value = fromName || '';
  } else {
    fromGroup.style.display = 'none';
    document.getElementById('subcat-from').value = '';
    document.getElementById('subcat-name').value = '';
  }
  openModal('subcat-modal');
}

function initSubcatModal() {
  const form = document.getElementById('subcat-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const mode = document.getElementById('subcat-mode').value;
    const categoryKey = document.getElementById('subcat-parent-key').value;
    const name = document.getElementById('subcat-name').value.trim();
    if (!name) { toast('Name is required', 'warning'); return; }

    try {
      if (mode === 'rename') {
        const from = document.getElementById('subcat-from').value;
        if (from === name) { closeModal('subcat-modal'); return; }
        await apiCall('POST', '/category', { action: 'renameSubcategory', categoryKey, from, to: name });
        toast(`Renamed "${from}" to "${name}"`);
      } else {
        await apiCall('POST', '/category', { action: 'addSubcategory', categoryKey, subcategoryName: name });
        toast(`Subcategory "${name}" added`);
      }
      closeModal('subcat-modal');
      state.blogData = null;
      state.categories = {};
      await loadCategoriesTab();
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    }
  });
}

function promptRemoveSubcategory(categoryKey, subName) {
  confirm(`Remove subcategory "${subName}" from "${state.categories[categoryKey]?.name || categoryKey}"? Posts already tagged with this subcategory keep the value until edited manually.`, async () => {
    try {
      await apiCall('POST', '/category', { action: 'removeSubcategory', categoryKey, subcategoryName: subName });
      toast(`Subcategory "${subName}" removed`);
      state.blogData = null;
      state.categories = {};
      await loadCategoriesTab();
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    }
  });
}

// ─── 3-step category delete ───────────────────────────────────────────────────
function countOrphans(targetKey) {
  if (!state.blogData) return 0;
  let n = 0;
  Object.keys(state.blogData).forEach(cat => {
    if (cat === targetKey) return;
    const posts = state.blogData[cat]?.posts || [];
    posts.forEach(p => { if (p.secondaryCategory === targetKey) n++; });
  });
  return n;
}

function openCategoryDeleteModal(key) {
  const cat = state.categories[key];
  if (!cat) return;
  state.catDeleteTarget = key;
  const displayName = cat.name || key;
  document.getElementById('cat-delete-title').textContent = `Delete ${displayName}`;
  document.getElementById('cat-delete-name-1').textContent = displayName;
  document.getElementById('cat-delete-name-3').textContent = displayName;
  document.getElementById('cat-delete-key-display').textContent = key;
  document.getElementById('cat-delete-key-input').value = '';
  document.getElementById('cat-delete-step2-next').disabled = true;

  const postCount = state.blogData?.[key]?.posts?.length || 0;
  const orphans = countOrphans(key);
  const note = document.getElementById('cat-delete-orphan-note');
  if (postCount > 0 || orphans > 0) {
    note.style.display = '';
    note.innerHTML = `This will delete <strong>${postCount}</strong> post${postCount === 1 ? '' : 's'} in this category and clear the secondary-category reference on <strong>${orphans}</strong> other post${orphans === 1 ? '' : 's'}.`;
  } else {
    note.style.display = 'none';
  }

  showDeleteStep(1);
  openModal('cat-delete-modal');
}

function showDeleteStep(n) {
  document.querySelectorAll('#cat-delete-modal .cat-delete-step').forEach(el => {
    el.style.display = parseInt(el.dataset.step, 10) === n ? '' : 'none';
  });
}

function initCategoryDeleteModal() {
  document.getElementById('cat-delete-step1-next').addEventListener('click', () => showDeleteStep(2));
  document.getElementById('cat-delete-step2-back').addEventListener('click', () => showDeleteStep(1));
  document.getElementById('cat-delete-step3-back').addEventListener('click', () => showDeleteStep(2));

  const input = document.getElementById('cat-delete-key-input');
  input.addEventListener('input', () => {
    const expected = state.catDeleteTarget || '';
    document.getElementById('cat-delete-step2-next').disabled = input.value.trim() !== expected;
  });

  document.getElementById('cat-delete-step2-next').addEventListener('click', () => showDeleteStep(3));

  document.getElementById('cat-delete-destroy').addEventListener('click', async () => {
    const key = state.catDeleteTarget;
    if (!key) return;
    try {
      await apiCall('POST', '/category', { action: 'deleteCategory', categoryKey: key });
      toast(`Category "${key}" destroyed`);
      closeModal('cat-delete-modal');
      state.catDeleteTarget = null;
      state.blogData = null;
      state.categories = {};
      state.latestData = null;
      await loadCategoriesTab();
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS TAB
// ═══════════════════════════════════════════════════════════════════════════════

async function loadProjectsTab() {
  try {
    // Reuse cached projects if already fetched (e.g. from homepage tab)
    if (state.projects.length === 0) {
      state.projects = await fetch(PROJECTS_URL).then(r => r.json()) || [];
    }
    renderProjectsList();
  } catch (e) {
    document.getElementById('projects-list').innerHTML = '<div class="empty-msg">Failed to load projects.</div>';
    toast('Failed to load projects', 'error');
  }
}

function renderProjectsList() {
  const container = document.getElementById('projects-list');
  if (!container) return;

  if (state.projects.length === 0) {
    container.innerHTML = '<div class="empty-msg">No projects found.</div>';
    return;
  }

  container.innerHTML = state.projects.map(proj => `
    <div class="project-card">
      <div class="project-card-top">
        <img src="${esc(proj.logo)}" alt="" onerror="this.src='https://beyondmebtw.com/assets/images/favicon.ico'">
        <div class="project-info">
          <h3>${esc(proj.title)}</h3>
          <div class="proj-cat">${esc(proj.category || '')}</div>
        </div>
      </div>
      <div class="proj-desc">${esc(proj.shortDescription || '')}</div>
      <div class="proj-tags">
        ${(proj.tags || []).slice(0,5).map(t => `<span class="tag-chip">${esc(t)}</span>`).join('')}
        ${(proj.tags||[]).length > 5 ? `<span class="tag-chip">+${proj.tags.length-5}</span>` : ''}
      </div>
      <div class="proj-actions">
        <button class="btn-icon edit" data-action="edit-project" data-id="${proj.id}">Edit</button>
        <button class="btn-icon danger" data-action="delete-project" data-id="${proj.id}" data-title="${esc(proj.title)}">Delete</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-action="edit-project"]').forEach(btn => {
    btn.addEventListener('click', () => openEditProject(parseInt(btn.dataset.id, 10)));
  });
  container.querySelectorAll('[data-action="delete-project"]').forEach(btn => {
    btn.addEventListener('click', () => promptDeleteProject(parseInt(btn.dataset.id, 10), btn.dataset.title));
  });
}

function openEditProject(id) {
  const proj = state.projects.find(p => p.id === id);
  if (!proj) return;

  state.editingProjectId = id;
  document.getElementById('project-modal-title').textContent = 'Edit Project';
  document.getElementById('project-submit-btn').textContent = 'Save Changes';
  document.getElementById('proj-edit-id').value = id;

  document.getElementById('proj-title').value = proj.title || '';
  document.getElementById('proj-category').value = proj.category || '';
  document.getElementById('proj-short-desc').value = proj.shortDescription || '';
  document.getElementById('proj-full-desc').value = proj.fullDescription || '';
  document.getElementById('proj-logo').value = proj.logo || '';
  document.getElementById('proj-link').value = proj.link || '';
  document.getElementById('proj-github').value = proj.githubLink || '';
  document.getElementById('proj-tags').value = (proj.tags || []).join(', ');
  state.projectImagesDraft = normalizeProjectImages(proj.images);
  state.projectCoverImageDraft = typeof proj.coverImage === 'string' ? proj.coverImage.trim() : '';
  resetProjectImageEditor();
  renderProjectImagesList();

  openModal('project-modal');
}

function promptDeleteProject(id, title) {
  confirm(`Delete project "${title}"? This cannot be undone.`, async () => {
    try {
      await apiCall('POST', '/blogdata', { action: 'projectDelete', id });
      state.projects = state.projects.filter(p => p.id !== id);
      renderProjectsList();
      toast('Project deleted');
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
    }
  });
}

function initProjectForm() {
  const newBtn = document.getElementById('new-project-btn');
  const clearBtn = document.getElementById('clear-project-form');
  const form = document.getElementById('project-form');
  const addImageBtn = document.getElementById('proj-image-add-btn');
  const imageUrlInput = document.getElementById('proj-image-url');
  const imageDescInput = document.getElementById('proj-image-description');

  if (newBtn) {
    newBtn.addEventListener('click', () => {
      resetProjectForm();
      openModal('project-modal');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', resetProjectForm);
  }

  if (addImageBtn) {
    addImageBtn.addEventListener('click', () => {
      const url = imageUrlInput.value.trim();
      const description = imageDescInput.value.trim();
      if (!url) {
        toast('Image URL is required', 'warning');
        return;
      }

      const imageData = { url, description };
      if (state.editingProjectImageIndex !== null) {
        state.projectImagesDraft[state.editingProjectImageIndex] = imageData;
      } else {
        state.projectImagesDraft.push(imageData);
      }

      resetProjectImageEditor();
      renderProjectImagesList();
    });
  }

  if (imageDescInput && addImageBtn) {
    imageDescInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addImageBtn.click();
      }
    });
  }

  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const title = document.getElementById('proj-title').value.trim();
    if (!title) { toast('Title is required', 'warning'); return; }

    const editId = document.getElementById('proj-edit-id').value;
    const isEdit = !!editId;

    const body = {
      title,
      category: document.getElementById('proj-category').value.trim(),
      shortDescription: document.getElementById('proj-short-desc').value.trim(),
      fullDescription: document.getElementById('proj-full-desc').value.trim(),
      logo: document.getElementById('proj-logo').value.trim(),
      link: document.getElementById('proj-link').value.trim(),
      githubLink: document.getElementById('proj-github').value.trim(),
      tags: document.getElementById('proj-tags').value,
      images: state.projectImagesDraft,
      coverImage: getEffectiveCoverUrl()
    };

    const btn = document.getElementById('project-submit-btn');
    btn.disabled = true;

    try {
      if (isEdit) {
        const res = await apiCall('POST', '/blogdata', { action: 'projectUpdate', id: parseInt(editId, 10), ...body });
        const idx = state.projects.findIndex(p => p.id === parseInt(editId, 10));
        if (idx !== -1 && res.project) state.projects[idx] = res.project;
        toast('Project updated');
      } else {
        const res = await apiCall('POST', '/blogdata', { action: 'projectCreate', ...body });
        if (res.project) state.projects.push(res.project);
        toast('Project created');
      }

      closeModal('project-modal');
      renderProjectsList();
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function resetProjectForm() {
  state.editingProjectId = null;
  state.projectImagesDraft = [];
  state.projectCoverImageDraft = '';
  state.dragImageIndex = null;
  document.getElementById('project-modal-title').textContent = 'New Project';
  document.getElementById('project-submit-btn').textContent = 'Add Project';
  document.getElementById('proj-edit-id').value = '';
  document.getElementById('project-form').reset();
  resetProjectImageEditor();
  renderProjectImagesList();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHOTOS TAB
// ═══════════════════════════════════════════════════════════════════════════════

const PHOTOS_BENTO_COLS = 4;
const PHOTOS_BENTO_MAX_SPAN = 4;

function clampPhotoSpan(n) {
  const v = parseInt(n, 10);
  if (!Number.isFinite(v)) return 1;
  return Math.max(1, Math.min(PHOTOS_BENTO_MAX_SPAN, v));
}

async function loadPhotosTab() {
  try {
    const url = `${PHOTOS_URL}?t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.photosData = (data && Array.isArray(data.series)) ? data : { series: [] };
    sortPhotosSeries();
    state.photosDataClean = JSON.parse(JSON.stringify(state.photosData));
    state.photosLayoutDirty = false;
    renderPhotosTab();
    updatePhotosLayoutButtons();
  } catch (e) {
    console.error('Photos load error:', e);
    state.photosData = { series: [] };
    state.photosDataClean = { series: [] };
    state.photosLayoutDirty = false;
    toast(`Failed to load photos: ${e.message}`, 'error');
    renderPhotosTab();
    updatePhotosLayoutButtons();
  }
}

function markPhotosLayoutDirty() {
  state.photosLayoutDirty = true;
  updatePhotosLayoutButtons();
}

function updatePhotosLayoutButtons() {
  const saveBtn = document.getElementById('save-bento-btn');
  const discardBtn = document.getElementById('discard-bento-btn');
  const flag = document.getElementById('bento-dirty-flag');
  const dirty = !!state.photosLayoutDirty;
  if (saveBtn) saveBtn.disabled = !dirty;
  if (discardBtn) discardBtn.disabled = !dirty;
  if (flag) flag.hidden = !dirty;
}

async function savePhotosLayout() {
  if (!state.photosLayoutDirty || !state.photosData) return;
  const saveBtn = document.getElementById('save-bento-btn');
  if (saveBtn) saveBtn.disabled = true;

  const layout = state.photosData.series.map(s => ({
    seriesId: s.id,
    colSpan: clampPhotoSpan(s.grid && s.grid.colSpan),
    rowSpan: clampPhotoSpan(s.grid && s.grid.rowSpan)
  }));

  try {
    await apiCall('POST', '/photosdata', { action: 'updateLayout', layout });
    toast('Layout saved');
    await loadPhotosTab();
  } catch (e) {
    toast(`Error saving layout: ${e.message}`, 'error');
    updatePhotosLayoutButtons();
  }
}

function discardPhotosLayout() {
  if (!state.photosDataClean) return;
  state.photosData = JSON.parse(JSON.stringify(state.photosDataClean));
  state.photosLayoutDirty = false;
  renderPhotosTab();
  updatePhotosLayoutButtons();
  toast('Layout changes discarded', 'warning');
}

function sortPhotosSeries() {
  if (!state.photosData) return;
  state.photosData.series.sort((a, b) => {
    const oa = Number.isFinite(a.order) ? a.order : 999;
    const ob = Number.isFinite(b.order) ? b.order : 999;
    if (oa !== ob) return oa - ob;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

function renderPhotosTab() {
  renderPhotosBentoPreview();
  renderPhotosSeriesList();
  updatePhotosLayoutButtons();
}

function initPhotosLayoutControls() {
  const saveBtn = document.getElementById('save-bento-btn');
  const discardBtn = document.getElementById('discard-bento-btn');
  if (saveBtn) saveBtn.addEventListener('click', savePhotosLayout);
  if (discardBtn) discardBtn.addEventListener('click', discardPhotosLayout);
}

function renderPhotosBentoPreview() {
  const grid = document.getElementById('photos-bento-preview');
  if (!grid) return;

  const series = (state.photosData && state.photosData.series) || [];
  if (series.length === 0) {
    grid.innerHTML = '<p class="loading-msg">No series yet. Click + New Series to add one.</p>';
    return;
  }

  grid.innerHTML = series.map(s => {
    const colSpan = clampPhotoSpan(s.grid && s.grid.colSpan);
    const rowSpan = clampPhotoSpan(s.grid && s.grid.rowSpan);
    const thumb = s.thumbnail
      || (s.images && s.images[0] && s.images[0].url)
      || '';
    const bgLayer = thumb ? `<div class="ph-bento-tile-bg" style="background-image: url('${esc(thumb)}');"></div>` : '';
    const imgLayer = thumb ? `<img class="ph-bento-tile-img" src="${esc(thumb)}" alt="" onerror="this.style.display='none'">` : '';
    return `
      <div class="ph-bento-tile" data-series-id="${esc(s.id)}" draggable="true"
           style="grid-column: span ${colSpan}; grid-row: span ${rowSpan};">
        ${bgLayer}
        ${imgLayer}
        <div class="ph-bento-tile-shade"></div>
        <span class="ph-bento-tile-label">${esc(s.title || s.id)}</span>
        <div class="ph-bento-tile-controls">
          <span class="ph-span-ctrl" title="Column span">
            <button type="button" data-span="col" data-delta="-1" data-id="${esc(s.id)}" ${colSpan<=1?'disabled':''}>&minus;</button>
            <span class="ph-span-ctrl-label">${colSpan}w</span>
            <button type="button" data-span="col" data-delta="1" data-id="${esc(s.id)}" ${colSpan>=PHOTOS_BENTO_MAX_SPAN?'disabled':''}>+</button>
          </span>
          <span class="ph-span-ctrl" title="Row span">
            <button type="button" data-span="row" data-delta="-1" data-id="${esc(s.id)}" ${rowSpan<=1?'disabled':''}>&minus;</button>
            <span class="ph-span-ctrl-label">${rowSpan}h</span>
            <button type="button" data-span="row" data-delta="1" data-id="${esc(s.id)}" ${rowSpan>=PHOTOS_BENTO_MAX_SPAN?'disabled':''}>+</button>
          </span>
        </div>
      </div>
    `;
  }).join('');

  // Span buttons — also stop drag from starting on the controls so a
  // click isn't interpreted as the beginning of a drag-reorder gesture.
  grid.querySelectorAll('.ph-span-ctrl').forEach(ctrl => {
    ctrl.addEventListener('mousedown', e => e.stopPropagation());
    ctrl.addEventListener('dragstart', e => { e.preventDefault(); e.stopPropagation(); });
  });
  grid.querySelectorAll('.ph-span-ctrl button').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      const axis = btn.dataset.span;
      const delta = parseInt(btn.dataset.delta, 10);
      adjustPhotoSpan(id, axis, delta);
    });
  });

  // Drag-to-reorder
  let dragId = null;
  grid.querySelectorAll('.ph-bento-tile').forEach(tile => {
    tile.addEventListener('dragstart', e => {
      dragId = tile.dataset.seriesId;
      tile.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', dragId); } catch (_) { /* ignore */ }
    });
    tile.addEventListener('dragend', () => {
      tile.classList.remove('dragging');
      grid.querySelectorAll('.ph-bento-tile').forEach(t => t.classList.remove('drag-over'));
      dragId = null;
    });
    tile.addEventListener('dragover', e => {
      e.preventDefault();
      if (tile.dataset.seriesId !== dragId) tile.classList.add('drag-over');
    });
    tile.addEventListener('dragleave', () => tile.classList.remove('drag-over'));
    tile.addEventListener('drop', async e => {
      e.preventDefault();
      tile.classList.remove('drag-over');
      const sourceId = dragId;
      const targetId = tile.dataset.seriesId;
      if (!sourceId || !targetId || sourceId === targetId) return;
      await reorderPhotoSeries(sourceId, targetId);
    });
  });
}

function adjustPhotoSpan(seriesId, axis, delta) {
  const series = state.photosData.series.find(s => s.id === seriesId);
  if (!series) return;
  if (!series.grid) series.grid = { colSpan: 1, rowSpan: 1 };
  const key = axis === 'col' ? 'colSpan' : 'rowSpan';
  const next = clampPhotoSpan((series.grid[key] || 1) + delta);
  if (next === series.grid[key]) return;
  series.grid[key] = next;
  markPhotosLayoutDirty();
  renderPhotosBentoPreview();
}

function reorderPhotoSeries(sourceId, targetId) {
  const list = state.photosData.series.slice();
  const fromIdx = list.findIndex(s => s.id === sourceId);
  const toIdx = list.findIndex(s => s.id === targetId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
  const [moved] = list.splice(fromIdx, 1);
  list.splice(toIdx, 0, moved);
  state.photosData.series = list;
  list.forEach((s, i) => { s.order = i + 1; });
  markPhotosLayoutDirty();
  renderPhotosTab();
}

function renderPhotosSeriesList() {
  const container = document.getElementById('photos-series-list');
  if (!container) return;

  const series = (state.photosData && state.photosData.series) || [];
  if (series.length === 0) {
    container.innerHTML = '<p class="empty-msg">No series yet.</p>';
    return;
  }

  container.innerHTML = series.map(s => {
    const expanded = state.expandedSeriesIds.has(s.id);
    const thumb = s.thumbnail
      || (s.images && s.images[0] && s.images[0].url)
      || 'https://beyondmebtw.com/assets/images/favicon.ico';
    const count = (s.images || []).length;
    const colSpan = clampPhotoSpan(s.grid && s.grid.colSpan);
    const rowSpan = clampPhotoSpan(s.grid && s.grid.rowSpan);

    const imagesHtml = (s.images || []).map(img => `
      <div class="ph-image-tile" data-image-id="${esc(img.id)}">
        <img src="${esc(img.url)}" alt="" onerror="this.src='https://beyondmebtw.com/assets/images/favicon.ico'">
        <div class="ph-image-tile-meta">${esc(img.description || 'No description')}</div>
        <div class="ph-image-tile-actions">
          <button type="button" data-photos-action="edit-image" data-series-id="${esc(s.id)}" data-image-id="${esc(img.id)}">Edit</button>
          <button type="button" class="danger" data-photos-action="delete-image" data-series-id="${esc(s.id)}" data-image-id="${esc(img.id)}">Delete</button>
        </div>
      </div>
    `).join('');

    return `
      <div class="ph-series-card ${expanded ? 'expanded' : ''}" data-series-id="${esc(s.id)}">
        <div class="ph-series-head">
          <img class="ph-series-thumb" src="${esc(thumb)}" alt="" onerror="this.src='https://beyondmebtw.com/assets/images/favicon.ico'">
          <div class="ph-series-meta">
            <h3>${esc(s.title)}</h3>
            <div class="ph-series-id">${esc(s.id)}</div>
            <div class="ph-series-stats">${count} ${count === 1 ? 'image' : 'images'} &middot; ${colSpan}&times;${rowSpan} bento</div>
          </div>
          <div class="ph-series-actions">
            <button type="button" class="btn-secondary" data-photos-action="toggle-series" data-series-id="${esc(s.id)}">${expanded ? 'Collapse' : 'Manage Images'}</button>
            <button type="button" class="btn-secondary" data-photos-action="edit-series" data-series-id="${esc(s.id)}">Edit</button>
            <button type="button" class="btn-danger" data-photos-action="delete-series" data-series-id="${esc(s.id)}">Delete</button>
          </div>
        </div>
        <div class="ph-series-body">
          ${s.description ? `<p style="color:var(--text-muted);font-size:13px;margin-bottom:10px;">${esc(s.description)}</p>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h4 style="font-size:13px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Images</h4>
            <button type="button" class="btn-primary" data-photos-action="add-image" data-series-id="${esc(s.id)}">+ Add Image</button>
          </div>
          ${count === 0
            ? '<p class="empty-msg" style="padding:20px 0;">No images yet.</p>'
            : `<div class="ph-images-grid">${imagesHtml}</div>`}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-photos-action]').forEach(btn => {
    btn.addEventListener('click', handlePhotosListAction);
  });
}

function handlePhotosListAction(e) {
  const btn = e.currentTarget;
  const action = btn.dataset.photosAction;
  const seriesId = btn.dataset.seriesId;
  const imageId = btn.dataset.imageId;

  switch (action) {
    case 'toggle-series':
      if (state.expandedSeriesIds.has(seriesId)) state.expandedSeriesIds.delete(seriesId);
      else state.expandedSeriesIds.add(seriesId);
      renderPhotosSeriesList();
      break;
    case 'edit-series':
      openPhotosSeriesModal(seriesId);
      break;
    case 'delete-series':
      confirmDeleteSeries(seriesId);
      break;
    case 'add-image':
      openPhotosImageModal(seriesId, null);
      break;
    case 'edit-image':
      openPhotosImageModal(seriesId, imageId);
      break;
    case 'delete-image':
      confirmDeleteImage(seriesId, imageId);
      break;
  }
}

function confirmDeleteSeries(seriesId) {
  const series = state.photosData.series.find(s => s.id === seriesId);
  if (!series) return;
  confirm(`Delete series "${series.title}" and all its image references? This cannot be undone.`, async () => {
    try {
      await apiCall('POST', '/photosdata', { action: 'deleteSeries', seriesId });
      toast('Series deleted');
      loadPhotosTab();
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
    }
  });
}

function confirmDeleteImage(seriesId, imageId) {
  confirm('Delete this image reference?', async () => {
    try {
      await apiCall('POST', '/photosdata', { action: 'deleteImage', seriesId, imageId });
      toast('Image deleted');
      loadPhotosTab();
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
    }
  });
}

// ── Series modal ──────────────────────────────────────────────────────────────
function openPhotosSeriesModal(seriesId) {
  const form = document.getElementById('photos-series-form');
  if (!form) return;
  form.reset();

  const idInput = document.getElementById('ph-series-id');
  const modeInput = document.getElementById('ph-series-edit-mode');
  const editIdInput = document.getElementById('ph-series-edit-id');
  const submitBtn = document.getElementById('ph-series-submit-btn');
  const modalTitle = document.getElementById('photos-series-modal-title');
  const thumbPick = document.getElementById('ph-series-thumb-pick');

  if (seriesId) {
    const s = state.photosData.series.find(x => x.id === seriesId);
    if (!s) return;
    modalTitle.textContent = 'Edit Series';
    submitBtn.textContent = 'Save Series';
    modeInput.value = 'edit';
    editIdInput.value = s.id;
    idInput.value = s.id;
    idInput.disabled = true;
    document.getElementById('ph-series-title').value = s.title || '';
    document.getElementById('ph-series-description').value = s.description || '';
    document.getElementById('ph-series-thumbnail').value = s.thumbnail || '';
    document.getElementById('ph-series-order').value = s.order || '';
    document.getElementById('ph-series-rawlink').value = s.rawLink || '';
    document.getElementById('ph-series-rawlabel').value = s.rawLinkLabel || '';
    document.getElementById('ph-series-colspan').value = clampPhotoSpan(s.grid && s.grid.colSpan);
    document.getElementById('ph-series-rowspan').value = clampPhotoSpan(s.grid && s.grid.rowSpan);

    // Populate thumb picker with existing image urls
    const options = ['<option value="">— Pick from images / paste below —</option>']
      .concat((s.images || []).map(img => `<option value="${esc(img.url)}">${esc(img.description || img.id || img.url)}</option>`));
    thumbPick.innerHTML = options.join('');
  } else {
    modalTitle.textContent = 'New Series';
    submitBtn.textContent = 'Create Series';
    modeInput.value = 'create';
    editIdInput.value = '';
    idInput.disabled = false;
    document.getElementById('ph-series-colspan').value = 1;
    document.getElementById('ph-series-rowspan').value = 1;
    thumbPick.innerHTML = '<option value="">— No images yet, paste URL below —</option>';
  }

  openModal('photos-series-modal');
}

function initPhotosSeriesModal() {
  const form = document.getElementById('photos-series-form');
  const newBtn = document.getElementById('new-photos-series-btn');
  const thumbPick = document.getElementById('ph-series-thumb-pick');

  if (newBtn) newBtn.addEventListener('click', () => openPhotosSeriesModal(null));

  if (thumbPick) {
    thumbPick.addEventListener('change', () => {
      if (thumbPick.value) {
        document.getElementById('ph-series-thumbnail').value = thumbPick.value;
      }
    });
  }

  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const mode = document.getElementById('ph-series-edit-mode').value;
    const id = document.getElementById('ph-series-id').value.trim();
    const title = document.getElementById('ph-series-title').value.trim();

    if (!id || !title) { toast('ID and title are required', 'warning'); return; }

    const payload = {
      id,
      seriesId: id,
      title,
      description: document.getElementById('ph-series-description').value.trim(),
      thumbnail: document.getElementById('ph-series-thumbnail').value.trim(),
      rawLink: document.getElementById('ph-series-rawlink').value.trim(),
      rawLinkLabel: document.getElementById('ph-series-rawlabel').value.trim(),
      order: parseInt(document.getElementById('ph-series-order').value, 10) || undefined,
      grid: {
        colSpan: clampPhotoSpan(document.getElementById('ph-series-colspan').value),
        rowSpan: clampPhotoSpan(document.getElementById('ph-series-rowspan').value)
      }
    };

    const submitBtn = document.getElementById('ph-series-submit-btn');
    submitBtn.disabled = true;
    try {
      if (mode === 'edit') {
        await apiCall('POST', '/photosdata', { action: 'updateSeries', ...payload });
        toast('Series updated');
      } else {
        await apiCall('POST', '/photosdata', { action: 'createSeries', ...payload });
        toast('Series created');
      }
      closeModal('photos-series-modal');
      loadPhotosTab();
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ── Image modal ───────────────────────────────────────────────────────────────
function openPhotosImageModal(seriesId, imageId) {
  const form = document.getElementById('photos-image-form');
  if (!form) return;
  form.reset();

  document.getElementById('ph-image-series-id').value = seriesId;
  const modeInput = document.getElementById('ph-image-edit-mode');
  const editIdInput = document.getElementById('ph-image-edit-id');
  const submitBtn = document.getElementById('ph-image-submit-btn');
  const modalTitle = document.getElementById('photos-image-modal-title');

  if (imageId) {
    const series = state.photosData.series.find(s => s.id === seriesId);
    const img = series && (series.images || []).find(i => i.id === imageId);
    if (!img) return;
    modalTitle.textContent = 'Edit Image';
    submitBtn.textContent = 'Save Image';
    modeInput.value = 'edit';
    editIdInput.value = img.id;
    document.getElementById('ph-image-url').value = img.url || '';
    document.getElementById('ph-image-description').value = img.description || '';
    document.getElementById('ph-image-alt').value = img.alt || '';
    document.getElementById('ph-image-orientation').value = (img.orientation || 'landscape');
  } else {
    modalTitle.textContent = 'Add Image';
    submitBtn.textContent = 'Add Image';
    modeInput.value = 'create';
    editIdInput.value = '';
    document.getElementById('ph-image-orientation').value = 'landscape';
  }

  openModal('photos-image-modal');
}

function initPhotosImageModal() {
  const form = document.getElementById('photos-image-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const mode = document.getElementById('ph-image-edit-mode').value;
    const seriesId = document.getElementById('ph-image-series-id').value;
    const imageId = document.getElementById('ph-image-edit-id').value;
    const url = document.getElementById('ph-image-url').value.trim();
    const description = document.getElementById('ph-image-description').value.trim();
    const alt = document.getElementById('ph-image-alt').value.trim();
    const orientation = document.getElementById('ph-image-orientation').value || 'landscape';

    if (!url) { toast('Image URL is required', 'warning'); return; }

    const submitBtn = document.getElementById('ph-image-submit-btn');
    submitBtn.disabled = true;
    try {
      if (mode === 'edit') {
        await apiCall('POST', '/photosdata', {
          action: 'updateImage', seriesId, imageId,
          image: { id: imageId, url, description, alt, orientation }
        });
        toast('Image updated');
      } else {
        await apiCall('POST', '/photosdata', {
          action: 'addImage', seriesId,
          image: { url, description, alt, orientation }
        });
        toast('Image added');
      }
      closeModal('photos-image-modal');
      loadPhotosTab();
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Auth system
  window.authSystem.init();

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  if (currentPage === 'index.html') {
    window.authSystem.setupIndexPageAuth();
    return;
  }

  if (currentPage !== 'manage.html') return;

  // Show the app
  const authLoading = document.getElementById('auth-loading');
  const contentContainer = document.getElementById('content-container');
  if (authLoading) authLoading.style.display = 'none';
  if (contentContainer) contentContainer.style.display = 'flex';

  // Wire up everything
  initSidebarToggle();
  initTabs();
  initModalClose();
  initToggleForms();
  initConfirmModal();
  initLatestConfirmModal();
  initLatestForm();
  initFeaturedProjectsForm();
  initFeaturedMinisForm();
  initSubtabs();
  initBlogForm();
  initBlogSearch();
  initCategoryModal();
  initSubcatModal();
  initCategoryDeleteModal();
  initProjectForm();
  initPhotosSeriesModal();
  initPhotosImageModal();
  initPhotosLayoutControls();
  buildSecondaryCategoryChips();

  // Load homepage tab by default
  loadHomepageTab();
});
