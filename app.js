const CATEGORIES = ['World', 'Technology', 'Business', 'Sports', 'Culture', 'Science'];

const PALETTES = {
  World: ['#1e3a8a', '#38bdf8'],
  Technology: ['#3b0764', '#2563eb'],
  Business: ['#064e3b', '#f59e0b'],
  Sports: ['#7f1d1d', '#fb923c'],
  Culture: ['#831843', '#fbbf24'],
  Science: ['#134e4a', '#22d3ee']
};

const LEGAL_PAGES = {
  about: {
    title: 'About The Meridian',
    body: `<p>The Meridian is an independent digital publication covering global affairs, technology, business, science, and culture.</p><p>Our newsroom focuses on clear, context-driven journalism designed for readers who want depth without noise.</p>`
  },
  editorial: {
    title: 'Editorial Policy',
    body: `<p>Every story published on The Meridian is reviewed for accuracy, clarity, and primary-source verification. Corrections are issued transparently at the top of any updated report.</p>`
  },
  privacy: {
    title: 'Privacy Policy',
    body: `<p>We respect reader privacy. Your saved reading list and theme preference are stored locally in your browser. Third-party advertising partners such as Google AdSense may use cookies to serve relevant ads.</p>`
  },
  contact: {
    title: 'Contact the Newsroom',
    body: `<p>Have a news tip, correction, or advertising inquiry? Reach our editorial desk at <strong>editorial@themeridian-news.example</strong>.</p>`
  }
};

let articles = [];
let activeCategory = 'All';
let searchQuery = '';
let savedIds = [];
let svgCounter = 0;

try {
  savedIds = JSON.parse(localStorage.getItem('meridian_saved') || '[]');
} catch (e) {
  savedIds = [];
}

const $ = (sel) => document.querySelector(sel);

function showToast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.style.opacity = '0'; }, 2200);
}

/* Generates either a real image or a seeded editorial SVG artwork */
function renderArtwork(article, index) {
  if (article.image && /^https?:\/\//i.test(article.image.trim())) {
    return `<img src="${article.image.trim()}" alt="${article.title.replace(/"/g, '&quot;')}" loading="lazy">`;
  }
  const [c1, c2] = PALETTES[article.category] || PALETTES.World;
  const gradId = 'grad_' + (++svgCounter);
  const seed = (n) => ((index * 37 + n * 91) % 100) / 100;
  return `
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#${gradId})"/>
      <circle cx="${80 + seed(1) * 240}" cy="${40 + seed(2) * 160}" r="${65 + seed(3) * 55}" fill="#fff" opacity="0.14"/>
      <circle cx="${seed(4) * 400}" cy="${seed(5) * 240}" r="${35 + seed(6) * 45}" fill="#000" opacity="0.18"/>
      <path d="M0 ${150 + seed(7) * 55} Q${120 + seed(8) * 90} ${95 + seed(9) * 50} 400 ${170 + seed(10) * 45} V240 H0 Z" fill="#000" opacity="0.26"/>
    </svg>
  `;
}

function bookmarkButton(id) {
  const isSaved = savedIds.includes(id);
  return `<button type="button" class="bookmark-btn ${isSaved ? 'saved' : ''}" data-save="${id}">${isSaved ? 'Saved' : 'Save'}</button>`;
}

function renderNav() {
  const html = ['All', ...CATEGORIES]
    .map(cat => `<button type="button" data-cat="${cat}" class="${cat === activeCategory ? 'active' : ''}">${cat}</button>`)
    .join('');
  $('#mainNav').innerHTML = html;
  $('#categoryTabs').innerHTML = html;
  $('#footerSections').innerHTML = CATEGORIES
    .map(cat => `<button type="button" data-cat="${cat}">${cat}</button>`)
    .join('');
}

function renderHero() {
  if (!articles.length) return;
  const lead = articles[0];
  const sideList = articles.slice(1, 5);

  $('#heroSection').innerHTML = `
    <article class="lead-story" data-open="${lead.id}">
      <div class="cover-box">${renderArtwork(lead, 0)}</div>
      <span class="tag">${lead.category}</span>
      <h1>${lead.title}</h1>
      <p>${lead.excerpt}</p>
      <div class="meta">
        <b>${lead.author}</b>
        <span>${lead.readTime} min read</span>
        <span>${lead.date}</span>
        ${bookmarkButton(lead.id)}
      </div>
    </article>
    <aside class="top-sidebar">
      <h2>Top Stories</h2>
      ${sideList.map((item, idx) => `
        <div class="side-item" data-open="${item.id}">
          <div class="thumb">${renderArtwork(item, idx + 1)}</div>
          <div>
            <h3>${item.title}</h3>
            <span>${item.category} &bull; ${item.date}</span>
          </div>
        </div>
      `).join('')}
    </aside>
  `;
}

function renderFeed() {
  const filtered = articles.filter(art => {
    const matchCat = activeCategory === 'All' || art.category === activeCategory;
    const hay = `${art.title} ${art.excerpt} ${art.category} ${art.author}`.toLowerCase();
    const matchQuery = !searchQuery || hay.includes(searchQuery);
    return matchCat && matchQuery;
  });

  $('#emptyMsg').hidden = filtered.length > 0;
  $('#articlesGrid').innerHTML = filtered.map((art, idx) => `
    <article class="news-card">
      <div class="card-img" data-open="${art.id}">${renderArtwork(art, idx + 10)}</div>
      <div class="card-body">
        <span class="tag">${art.category}</span>
        <h3 data-open="${art.id}">${art.title}</h3>
        <p>${art.excerpt}</p>
        <div class="meta">
          <span>${art.author}</span>
          <span>${art.readTime} min</span>
          ${bookmarkButton(art.id)}
        </div>
      </div>
    </article>
  `).join('');
}

function renderTrendingAndTicker() {
  const trending = articles.filter(a => a.trending).slice(0, 5);
  const list = trending.length ? trending : articles.slice(0, 5);

  $('#trendingList').innerHTML = list.map((art, idx) => `
    <li data-open="${art.id}">
      <span class="rank-num">0${idx + 1}</span>
      <div>
        <h3>${art.title}</h3>
        <span>${art.category}</span>
      </div>
    </li>
  `).join('');

  const headlines = articles.slice(0, 6).map(a => `<span data-open="${a.id}">${a.title}</span>`).join('');
  $('#breakingTrack').innerHTML = headlines + headlines;
}

function renderSavedDrawer() {
  const validSaved = savedIds.map(id => articles.find(a => a.id === id)).filter(Boolean);
  $('#savedCount').textContent = validSaved.length;

  if (!validSaved.length) {
    $('#savedList').innerHTML = `<p style="color:var(--mute)">No saved articles yet. Click "Save" on any story to bookmark it here.</p>`;
    return;
  }

  $('#savedList').innerHTML = validSaved.map((art, idx) => `
    <div class="side-item" data-open="${art.id}">
      <div class="thumb">${renderArtwork(art, idx + 40)}</div>
      <div style="flex:1">
        <h3>${art.title}</h3>
        <span>${art.category}</span>
      </div>
      <button type="button" class="bookmark-btn saved" data-save="${art.id}">Remove</button>
    </div>
  `).join('');
}

function toggleSave(id) {
  const pos = savedIds.indexOf(id);
  if (pos === -1) {
    savedIds.push(id);
    showToast('Saved to Reading List');
  } else {
    savedIds.splice(pos, 1);
    showToast('Removed from Reading List');
  }
  try { localStorage.setItem('meridian_saved', JSON.stringify(savedIds)); } catch (e) {}
  renderHero();
  renderFeed();
  renderSavedDrawer();
}

function openArticle(id) {
  const idx = articles.findIndex(a => a.id === id);
  if (idx === -1) return;
  const art = articles[idx];

  closeDrawers();
  $('#readerBookmarkSlot').innerHTML = bookmarkButton(art.id);
  $('#readerBody').innerHTML = `
    <span class="tag">${art.category}</span>
    <h1>${art.title}</h1>
    <p class="reader-excerpt">${art.excerpt}</p>
    <div class="meta">
      <b>${art.author}</b>
      <span>${art.readTime} min read</span>
      <span>${art.date}</span>
    </div>
    <div class="cover-box" style="margin-top:20px">${renderArtwork(art, idx)}</div>
    ${(art.paragraphs || []).map(p => `<p>${p}</p>`).join('')}
    <div class="ad-slot ad-banner" style="margin-top:32px">
      <span>Advertisement — In-Article AdSense Unit</span>
    </div>
    <div class="author-card">
      <b>About ${art.author}</b>
      <p>${art.authorBio || 'Staff reporter at The Meridian.'}</p>
    </div>
  `;

  const overlay = $('#readerOverlay');
  overlay.classList.add('open');
  overlay.scrollTop = 0;
  $('#readProgress').style.width = '0%';
  document.body.style.overflow = 'hidden';
}

function closeDrawers() {
  $('#readerOverlay').classList.remove('open');
  $('#savedDrawer').classList.remove('open');
  $('#backdrop').classList.remove('open');
  $('#infoModal').classList.remove('open');
  document.body.style.overflow = '';
}

/* Load articles from news.json */
async function init() {
  try {
    const response = await fetch('./news.json?v=' + Date.now());
    if (!response.ok) throw new Error('Could not load news.json');
    articles = await response.json();
  } catch (err) {
    console.error(err);
    $('#heroSection').innerHTML = `
      <div style="padding:24px;border:1px solid var(--line);border-radius:8px;grid-column:1/-1">
        <h2>Unable to load news.json</h2>
        <p style="color:var(--mute);margin-top:8px">
          If you opened index.html directly from your folder (file://), right-click index.html in VS Code and choose <strong>Open with Live Server</strong>, or upload all 4 files to GitHub Pages.
        </p>
      </div>
    `;
    return;
  }

  renderNav();
  renderHero();
  renderFeed();
  renderTrendingAndTicker();
  renderSavedDrawer();
}

/* Event Listeners */
document.addEventListener('click', (e) => {
  const saveBtn = e.target.closest('[data-save]');
  if (saveBtn) {
    e.stopPropagation();
    toggleSave(saveBtn.dataset.save);
    if ($('#readerOverlay').classList.contains('open')) {
      $('#readerBookmarkSlot').innerHTML = bookmarkButton(saveBtn.dataset.save);
    }
    return;
  }

  const openEl = e.target.closest('[data-open]');
  if (openEl) {
    openArticle(openEl.dataset.open);
    return;
  }

  const catBtn = e.target.closest('[data-cat]');
  if (catBtn) {
    activeCategory = catBtn.dataset.cat;
    renderNav();
    renderFeed();
    $('#feedSection').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const infoBtn = e.target.closest('[data-info]');
  if (infoBtn) {
    const page = LEGAL_PAGES[infoBtn.dataset.info];
    if (page) {
      $('#infoTitle').textContent = page.title;
      $('#infoContent').innerHTML = page.body;
      $('#infoModal').classList.add('open');
    }
  }
});

$('#searchToggle').onclick = () => {
  const open = $('#searchDrawer').classList.toggle('open');
  if (open) $('#searchInput').focus();
  else {
    $('#searchInput').value = '';
    searchQuery = '';
    renderFeed();
  }
};

$('#searchInput').oninput = (e) => {
  searchQuery = e.target.value.trim().toLowerCase();
  renderFeed();
};

$('#savedToggle').onclick = () => {
  $('#savedDrawer').classList.add('open');
  $('#backdrop').classList.add('open');
};

$('#closeSaved').onclick = closeDrawers;
$('#closeReader').onclick = closeDrawers;
$('#closeInfo').onclick = closeDrawers;
$('#backdrop').onclick = closeDrawers;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawers(); });

$('#readerOverlay').onscroll = (e) => {
  const el = e.target;
  const pct = (el.scrollTop / ((el.scrollHeight - el.clientHeight) || 1)) * 100;
  $('#readProgress').style.width = pct + '%';
};

/* Theme Toggle */
function syncThemeLabel() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  $('#themeToggle').textContent = isDark ? 'Light' : 'Dark';
}
$('#themeToggle').onclick = () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('meridian_theme', next); } catch (e) {}
  syncThemeLabel();
};

/* Newsletter Form */
$('#newsletterForm').onsubmit = (e) => {
  e.preventDefault();
  const email = $('#newsletterEmail').value.trim();
  const msg = $('#newsletterMsg');
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    msg.style.color = '#4ade80';
    msg.textContent = 'Subscribed! Watch your inbox on Monday.';
    $('#newsletterEmail').value = '';
  } else {
    msg.style.color = '#f87171';
    msg.textContent = 'Please enter a valid email address.';
  }
};

/* Live Date */
$('#liveDate').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
});

syncThemeLabel();
init();