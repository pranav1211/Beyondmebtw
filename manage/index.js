// index.js — Manage page client logic
// Three sections: Homepage, Blog, Projects

const BASE_URL = "https://manage.beyondmebtw.com";

const PROJECTS_URL = 'https://beyondmebtw.com/projects/project-data.json';
const BLOG_BASE_URL = 'https://beyondmebtw.com/blog';

// ─── State ────────────────────────────────────────────────────────────────────
let state = {
  latestData: null,          // from latest.json
  blogData: null,            // from direct blog JSON URLs
  projects: [],              // from project-data.json
  categories: {},            // from /categories
  currentBlogCategory: 'all',
  blogSearch: '',
  editingBlogPost: null,     // { category, uid } when editing
  editingProjectId: null,    // id when editing
  catModalAction: 'addCategory',
  confirmCallback: null,
  latestConfirmCallback: null
};

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

// ─── Tab navigation ───────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');

      // Lazy-load tab data on first visit; reuse cache if available
      if (tab === 'blog') {
        if (!state.blogData) loadBlogTab();
        else { buildCategoryTabs(); buildBlogCategorySelect(); renderPostsList(); }
      }
      if (tab === 'projects') {
        if (state.projects.length === 0) loadProjectsTab();
        else renderProjectsList();
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
  document.getElementById('latest-confirm-ok').addEventListener('click', () => {
    closeModal('latest-confirm-modal');
    if (state.latestConfirmCallback) state.latestConfirmCallback();
    state.latestConfirmCallback = null;
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
  } catch (e) {
    console.error('Homepage load error:', e);
    toast('Failed to load homepage data', 'error');
  }
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

// ═══════════════════════════════════════════════════════════════════════════════
// BLOG TAB
// ═══════════════════════════════════════════════════════════════════════════════

// Known category keys — these map directly to blog JSON filenames
const KNOWN_BLOG_CATEGORIES = {
  f1arti:     { name: 'F1 Articles',    subcategories: ['2025 Season', 'General'] },
  movietv:    { name: 'Movie/TV',       subcategories: ['Movies', 'TV Shows'] },
  experience: { name: 'Experience',     subcategories: [] },
  techart:    { name: 'Tech Articles',  subcategories: [] }
};

async function loadBlogTab() {
  try {
    // Categories come from KNOWN_BLOG_CATEGORIES (no manage server read needed).
    // latest.json is served directly from the public URL.
    if (!state.latestData) {
      state.latestData = await fetch('https://beyondmebtw.com/manage/latest.json').then(r => r.json());
    }
    // Only fetch blog JSONs if not already cached
    if (!state.blogData) {
      const catKeys = Object.keys(KNOWN_BLOG_CATEGORIES);
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

    // Build state.categories from KNOWN_BLOG_CATEGORIES + actual subcategories from the JSON files
    if (!state.categories || Object.keys(state.categories).length === 0) {
      state.categories = {};
      Object.keys(KNOWN_BLOG_CATEGORIES).forEach(key => {
        const subcatsFromJson = (state.blogData[key] && state.blogData[key].subcategories) || [];
        state.categories[key] = {
          name: KNOWN_BLOG_CATEGORIES[key].name,
          subcategories: subcatsFromJson.length > 0 ? subcatsFromJson : KNOWN_BLOG_CATEGORIES[key].subcategories
        };
      });
    }

    buildCategoryTabs();
    buildBlogCategorySelect();
    buildSubcategoryChips();
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
  container.querySelectorAll('[data-action="make-latest"]').forEach(btn => {
    btn.addEventListener('click', () => makeLatestPost(btn));
  });
  container.querySelectorAll('[data-action="edit-post"]').forEach(btn => {
    btn.addEventListener('click', () => openEditBlogPost(btn.dataset.category, btn.dataset.uid));
  });
  container.querySelectorAll('[data-action="delete-post"]').forEach(btn => {
    btn.addEventListener('click', () => promptDeleteBlogPost(btn.dataset.category, btn.dataset.uid, btn.dataset.title));
  });
}

async function makeLatestPost(btn) {
  const category = btn.dataset.category;
  const uid = btn.dataset.uid;
  const catData = state.blogData[category];
  if (!catData) return;
  const post = catData.posts.find(p => p.uid === uid);
  if (!post) return;

  // Use the dedicated latest confirm modal
  document.getElementById('latest-confirm-title').textContent = post.title;
  state.latestConfirmCallback = async () => {
    try {
      await apiCall('POST', '/latestdata', {
        formid: 'latest',
        name: post.title,
        date: post.date || '',
        excerpt: post.excerpt || '',
        thumbnail: post.thumbnail || '',
        link: post.link || ''
      });
      state.latestData = null;
      loadHomepageTab();
      toast('Latest post updated');
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
      <button class="btn-icon latest" data-action="make-latest" data-category="${esc(catKey)}" data-uid="${esc(post.uid)}" title="Make Latest Post">Latest</button>
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

  document.querySelectorAll('#subcategory-buttons .chip, #secondary-category-buttons .chip, #secondary-subcategory-buttons .chip')
    .forEach(c => c.classList.remove('selected'));
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

// ─── New Category modal ───────────────────────────────────────────────────────
function initCategoryModal() {
  const newCatBtn = document.getElementById('new-category-btn');
  const form = document.getElementById('category-form');
  const toggleBtns = document.querySelectorAll('#cat-action-toggle .toggle-btn');

  if (newCatBtn) {
    newCatBtn.addEventListener('click', () => {
      form.reset();
      // Populate parent select
      const parentSelect = document.getElementById('subcat-parent');
      if (parentSelect) {
        parentSelect.innerHTML = Object.keys(state.categories).map(k =>
          `<option value="${esc(k)}">${esc(state.categories[k].name || k)}</option>`
        ).join('');
      }
      openModal('category-modal');
    });
  }

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.catModalAction = btn.dataset.action;
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('new-category-fields').style.display = state.catModalAction === 'addCategory' ? '' : 'none';
      document.getElementById('new-subcat-fields').style.display = state.catModalAction === 'addSubcategory' ? '' : 'none';
    });
  });

  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      if (state.catModalAction === 'addCategory') {
        const categoryKey = document.getElementById('new-cat-key').value.trim().toLowerCase().replace(/\s+/g,'');
        const categoryName = document.getElementById('new-cat-name').value.trim();
        if (!categoryKey || !categoryName) { toast('Fill all fields', 'warning'); return; }

        // category key goes in `category` field; server creates the JSON file
        await apiCall('POST', '/blogdata', { action: 'addCategory', category: categoryKey, categoryName });
        // Invalidate cache so blog tab re-fetches fresh data on next visit
        state.blogData = null;
        state.categories = {};
        toast(`Category "${categoryName}" created`);
      } else {
        const parentKey = document.getElementById('subcat-parent').value;
        const subcategoryName = document.getElementById('new-subcat-name').value.trim();
        if (!parentKey || !subcategoryName) { toast('Fill all fields', 'warning'); return; }

        // Write subcategory directly into the blog JSON via /blogdata
        await apiCall('POST', '/blogdata', { action: 'addSubcategory', category: parentKey, subcategoryName });
        // Update in-memory cache immediately so subcategory is available for new posts in this session
        if (state.categories[parentKey]) state.categories[parentKey].subcategories.push(subcategoryName);
        if (state.blogData && state.blogData[parentKey]) state.blogData[parentKey].subcategories.push(subcategoryName);
        toast(`Subcategory "${subcategoryName}" added`);
      }
      closeModal('category-modal');
      buildCategoryTabs();
      buildBlogCategorySelect();
      buildSubcategoryChips();
      renderPostsList();
    } catch (e) {
      toast(`Error: ${e.message}`, 'error');
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
  document.getElementById('proj-images').value = (proj.images || []).join(', ');

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

  if (newBtn) {
    newBtn.addEventListener('click', () => {
      resetProjectForm();
      openModal('project-modal');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', resetProjectForm);
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
      images: document.getElementById('proj-images').value
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
  document.getElementById('project-modal-title').textContent = 'New Project';
  document.getElementById('project-submit-btn').textContent = 'Add Project';
  document.getElementById('proj-edit-id').value = '';
  document.getElementById('project-form').reset();
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
  initTabs();
  initModalClose();
  initToggleForms();
  initConfirmModal();
  initLatestConfirmModal();
  initLatestForm();
  initFeaturedProjectsForm();
  initBlogForm();
  initBlogSearch();
  initCategoryModal();
  initProjectForm();
  buildSecondaryCategoryChips();

  // Load homepage tab by default
  loadHomepageTab();
});
