// Navigation active state
const homelink = document.querySelector('#home');
const bloglink = document.querySelector('#blog');
const projlink = document.querySelector('#projects');
const aboutlink = document.querySelector('#about');

homelink.style.backgroundColor = '#F4F2EF';

homelink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com";
});

bloglink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com/blog";
});

projlink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com/projects";
});

aboutlink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com/about";
});

// ── Email: click copies the address (works whatever mail provider the
// visitor uses); the small ↗ button next to it is a plain mailto link.
function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        ok ? resolve() : reject(new Error('copy failed'));
    });
}

(function setupEmailCopy() {
    const btn = document.getElementById('copy-email');
    const label = document.getElementById('email-label');
    const status = document.getElementById('email-status');
    if (!btn || !label) return;
    const email = btn.dataset.email;
    const original = label.innerHTML;
    let timer;

    btn.addEventListener('click', () => {
        copyText(email).then(() => {
            label.textContent = 'Copied ✓';
            btn.classList.add('is-copied');
            if (status) status.textContent = 'Email address copied to clipboard';
            clearTimeout(timer);
            timer = setTimeout(() => {
                label.innerHTML = original;
                btn.classList.remove('is-copied');
                if (status) status.textContent = '';
            }, 2200);
        }).catch(() => {
            // Clipboard blocked: fall back to the visitor's mail app.
            window.location.href = `mailto:${email}`;
        });
    });
})();

// ── Data (canonical in bmb-data, served by Manage) ───────────────────────
const DATA_API = 'https://manage.beyondmebtw.com/api/v1/data/resources/';

function fetchResource(key) {
    return fetch(DATA_API + key)
        .then(r => { if (!r.ok) throw new Error(`${key}: ${r.status}`); return r.json(); })
        .then(b => b.data);
}

// ── Helpers ───────────────────────────────────────────────────────────────
// Everything from Manage is treated as untrusted text.
function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Only http(s) URLs make it into href/src attributes.
function safeUrl(value) {
    try {
        const u = new URL(String(value || ''), window.location.href);
        return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
    } catch {
        return '';
    }
}

function parseDate(value) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

function formatDate(value, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
    const d = parseDate(value);
    return d ? new Intl.DateTimeFormat('en-US', opts).format(d) : '';
}

function formatMiniDate(value) {
    const d = parseDate(value);
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}.${mm}.${yy}`;
}

function truncate(text, limit) {
    const trimmed = String(text || '').trim();
    if (trimmed.length <= limit) return trimmed;
    const slice = trimmed.slice(0, limit);
    const lastSpace = slice.lastIndexOf(' ');
    const cut = lastSpace > limit - 30 ? slice.slice(0, lastSpace) : slice;
    return cut.replace(/[.,;:!?\-—\s]+$/, '') + '…';
}

// Same post can be linked with different casing/trailing bits; compare loosely.
function linkKey(link) {
    return String(link || '').toLowerCase().replace(/[?#].*$/, '').replace(/\/+$/, '');
}

function meta(...parts) {
    return parts.filter(Boolean).map(p => `<span class="meta-part">${esc(p)}</span>`).join('<span class="meta-dot" aria-hidden="true">&middot;</span>');
}

// ── Latest post (hand-picked in Manage) ──────────────────────────────────
function renderLatestPost(post, categoryName) {
    const link = safeUrl(post.link);
    const anchor = document.querySelector('.latest-post-content');
    if (link) anchor.href = link;
    const img = document.querySelector('.latest-post-img');
    const thumb = safeUrl(post.thumbnail);
    if (thumb) img.src = thumb;
    document.querySelector('.latest-post-title').textContent = post.title || '';
    document.querySelector('.latest-post-meta').innerHTML = meta(formatDate(post.date), categoryName);
    document.querySelector('.latest-post-excerpt').textContent = post.excerpt || '';
}

// ── Recent posts (automatic: newest across all categories) ───────────────
function renderRecentPosts(posts) {
    const container = document.getElementById('recent-grid');
    if (!container) return;
    container.innerHTML = posts.map(p => `
        <a class="recent-card" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener">
            <div class="recent-thumb">
                <img src="${esc(safeUrl(p.thumbnail))}" alt="" loading="lazy">
            </div>
            <div class="recent-body">
                <p class="card-meta">${meta(formatDate(p.date), p.categoryName)}</p>
                <h3 class="recent-title">${esc(p.title)}</h3>
            </div>
        </a>
    `).join('');
}

// ── Featured posts (hand-picked) ─────────────────────────────────────────
function renderFeaturedPosts(posts, categoryOf) {
    const container = document.getElementById('featured-posts-container');
    if (!container) return;
    container.innerHTML = (posts || []).map(p => `
        <a class="featured-card" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener">
            <div class="featured-thumb">
                <img src="${esc(safeUrl(p.thumbnail))}" alt="" loading="lazy">
            </div>
            <div class="featured-body">
                <p class="card-meta">${meta(formatDate(p.date), categoryOf(p))}</p>
                <h3 class="featured-title">${esc(p.title)}</h3>
                <p class="featured-excerpt">${esc(p.excerpt)}</p>
                <span class="card-cta">Read <span aria-hidden="true">&rarr;</span></span>
            </div>
        </a>
    `).join('');
}

// ── Featured minis: one lead, the rest alongside ─────────────────────────
function renderFeaturedMinis(minis) {
    const container = document.getElementById('featured-minis-container');
    if (!container) return;
    const list = (minis || []).filter(m => m && (m.title || m.id));
    container.innerHTML = list.map((m, i) => {
        const lead = i === 0;
        const href = m.id ? `https://minis.beyondmebtw.com/post/${encodeURIComponent(m.id)}/` : 'https://minis.beyondmebtw.com';
        const date = formatMiniDate(m.date);
        return `
        <a class="mini-card${lead ? ' mini-lead' : ''}" href="${esc(href)}" target="_blank" rel="noopener">
            <div class="mini-hero">
                <span class="mini-eyebrow">Mini${date ? ` &middot; ${esc(date)}` : ''}</span>
                <h3 class="mini-title">${esc(m.title || 'Untitled')}</h3>
            </div>
            <div class="mini-body">
                <p class="mini-excerpt">${esc(truncate(m.featuredExcerpt, lead ? 460 : 170))}</p>
                <span class="card-cta">Keep reading <span aria-hidden="true">&rarr;</span></span>
            </div>
        </a>`;
    }).join('');
}

// ── Featured projects ────────────────────────────────────────────────────
function renderFeaturedProjects(projects) {
    const container = document.getElementById('projects-grid');
    if (!container || !projects || projects.length === 0) return;
    container.innerHTML = projects.map(proj => {
        const href = safeUrl(proj.link) || safeUrl(proj.githubLink);
        const cover = safeUrl(proj.coverImage);
        const logo = safeUrl(proj.logo);
        const tags = (proj.tags || []).slice(0, 3);
        return `
        <a class="project-card" ${href ? `href="${esc(href)}"` : ''} target="_blank" rel="noopener">
            <div class="project-cover">
                ${cover ? `<img src="${esc(cover)}" alt="" loading="lazy">` : ''}
            </div>
            <div class="project-body">
                ${logo ? `<span class="project-logo-badge"><img src="${esc(logo)}" alt=""></span>` : ''}
                ${proj.category ? `<p class="card-meta">${esc(proj.category)}</p>` : ''}
                <h3 class="project-title">${esc(proj.title)}</h3>
                <p class="project-desc">${esc(proj.shortDescription)}</p>
                ${tags.length ? `<ul class="project-tags">${tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
            </div>
        </a>`;
    }).join('');

    // A logo that fails to load drops its badge rather than showing a broken image.
    container.querySelectorAll('.project-logo-badge img').forEach(img => {
        const drop = () => img.parentElement && img.parentElement.remove();
        if (img.complete && img.naturalWidth === 0) drop();
        else img.addEventListener('error', drop);
    });
}

// ── Recent posts: picked from a list, minus anything already on the page ─
const RECENT_COUNT = 4;

function pickRecent(posts, data) {
    // Skip the promoted Latest post and the Featured posts so nothing shows twice.
    const skip = new Set(
        [data.mainPost, ...(data.featured || [])]
            .filter(Boolean)
            .map(p => linkKey(p.link))
    );
    return (posts || [])
        .filter(p => p && parseDate(p.date) && !skip.has(linkKey(p.link)))
        .sort((a, b) => parseDate(b.date) - parseDate(a.date))
        .slice(0, RECENT_COUNT);
}

// Fallback only: every post across every category, labelled with its
// category name. Used while Manage doesn't yet precompute `recent` and
// `categoryName` into home.latest. Fetched at most once.
let allPostsPromise = null;
function loadAllPosts() {
    if (!allPostsPromise) {
        allPostsPromise = fetchResource('blog.categories').then(cats =>
            Promise.all(Object.keys(cats || {}).map(key =>
                fetchResource(`blog.posts.${key}`)
                    .then(d => (d && d.posts) || [])
                    .catch(() => [])
                    .then(posts => posts.map(p => ({ ...p, categoryName: cats[key].name || key })))
            )).then(groups => groups.flat())
        );
    }
    return allPostsPromise;
}

function hideRecent() {
    const section = document.querySelector('.recent-posts');
    if (section) section.hidden = true;
}

// ── Boot ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const homeReq = fetchResource('home.latest');

    homeReq.then(data => {
        const main = data.mainPost || {};
        const featured = data.featured || [];

        renderLatestPost(main, main.categoryName || '');
        renderFeaturedPosts(featured, p => p.categoryName || '');
        renderFeaturedMinis(data.featuredMinis);

        // Preferred path: Manage precomputes `recent` (and `categoryName` on
        // mainPost/featured) whenever blog or home data is saved.
        const hasRecent = Array.isArray(data.recent) && data.recent.length > 0;
        // Once Manage has derived the fields (recentGeneratedAt), a card without categoryName is
        // deliberate: an empty slot or a link to something that isn't a blog post. Only fetch
        // labels before that, and only for cards that actually link somewhere.
        const needsLabels = !data.recentGeneratedAt && [main, ...featured].some(p => p && p.link && !p.categoryName);

        if (hasRecent) renderRecentPosts(pickRecent(data.recent, data));
        if (hasRecent && !needsLabels) return;

        // Fallback: work it out here from the full post lists.
        loadAllPosts().then(all => {
            if (!hasRecent) renderRecentPosts(pickRecent(all, data));
            if (needsLabels) {
                const names = new Map(all.map(p => [linkKey(p.link), p.categoryName]));
                const categoryOf = p => p.categoryName || names.get(linkKey(p.link)) || '';
                document.querySelector('.latest-post-meta').innerHTML = meta(formatDate(main.date), categoryOf(main));
                document.querySelectorAll('#featured-posts-container .card-meta').forEach((el, i) => {
                    if (featured[i]) el.innerHTML = meta(formatDate(featured[i].date), categoryOf(featured[i]));
                });
            }
        }).catch(err => {
            console.error('Error loading posts:', err);
            if (!hasRecent) hideRecent();
        });
    }).catch(err => {
        console.error('Error loading home data:', err);
        hideRecent();
    });

    Promise.all([homeReq, fetchResource('projects')]).then(([data, allProjects]) => {
        const featured = (data.featuredProjects || [])
            .map(id => (allProjects || []).find(p => p.id === id))
            .filter(Boolean);
        renderFeaturedProjects(featured);
    }).catch(err => console.error('Error loading projects:', err));
});
