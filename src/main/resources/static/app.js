/* ═══════════════════════════════════════════════
   ConstiConnect — Frontend JS
   ═══════════════════════════════════════════════ */
const API = 'http://localhost:8081';

/* ── STATE ── */
let currentUser = null;
let token = null;
let allComplaints = [];

/* ── AUTH DOM ── */
const authScreen   = document.getElementById('auth-screen');
const loginCard    = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const loginForm    = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

document.getElementById('show-register').addEventListener('click', e => { e.preventDefault(); loginCard.classList.add('hidden'); registerCard.classList.remove('hidden'); });
document.getElementById('show-login').addEventListener('click', e => { e.preventDefault(); registerCard.classList.add('hidden'); loginCard.classList.remove('hidden'); });

/* ── APP DOM ── */
const app          = document.getElementById('app');
const sidebar      = document.getElementById('sidebar');
const menuToggle   = document.getElementById('menu-toggle');
const navItems     = document.querySelectorAll('.nav-item');
const views        = document.querySelectorAll('.view');
const pageTitle    = document.getElementById('page-title');
const globalSearch = document.getElementById('global-search');

/* ═══════  HELPERS  ═══════ */
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function badge(text, type) {
  return `<span class="badge badge-${(type || text).toLowerCase().replace(/ /g, '-')}">${text}</span>`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ═══════  AUTH  ═══════ */
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const data = await api('/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      })
    });
    currentUser = data.user;
    token = data.token;
    enterApp();
    toast('Welcome back, ' + currentUser.name + '!', 'success');
  } catch(err) {
    toast(err.message || 'Login failed', 'error');
  }
});

registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const user = await api('/users/register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
      })
    });
    toast('Account created! Please sign in.', 'success');
    registerCard.classList.add('hidden');
    loginCard.classList.remove('hidden');
  } catch(err) {
    toast(err.message || 'Registration failed', 'error');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  currentUser = null;
  token = null;
  app.classList.add('hidden');
  authScreen.classList.remove('hidden');
  loginForm.reset();
  registerForm.reset();
  toast('Signed out', 'info');
});

function enterApp() {
  authScreen.classList.add('hidden');
  app.classList.remove('hidden');
  document.getElementById('user-name-display').textContent = currentUser.name;
  document.getElementById('user-email-display').textContent = currentUser.email;
  document.getElementById('user-avatar').textContent = (currentUser.name || 'U')[0].toUpperCase();
  switchView('dashboard');
}

/* ═══════  NAVIGATION  ═══════ */
const viewTitles = {
  dashboard: 'Dashboard',
  complaints: 'All Complaints',
  'my-complaints': 'My Complaints',
  'new-complaint': 'New Complaint',
  'ai-chat': 'AI Assistant'
};

function switchView(viewName) {
  navItems.forEach(n => n.classList.toggle('active', n.dataset.view === viewName));
  views.forEach(v => {
    const id = v.id.replace('view-', '');
    v.classList.toggle('hidden', id !== viewName);
    v.classList.toggle('active', id === viewName);
  });
  pageTitle.textContent = viewTitles[viewName] || 'Dashboard';
  sidebar.classList.remove('open');

  if (viewName === 'dashboard') loadDashboard();
  if (viewName === 'complaints') loadAllComplaints();
  if (viewName === 'my-complaints') loadMyComplaints();
}

navItems.forEach(n => n.addEventListener('click', e => {
  e.preventDefault();
  switchView(n.dataset.view);
}));

menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

/* ═══════  DASHBOARD  ═══════ */
async function loadDashboard() {
  try {
    const [stats, complaints] = await Promise.all([
      api('/complaints/stats'),
      api('/complaints/all')
    ]);
    document.getElementById('stat-total').textContent = stats.total || 0;
    document.getElementById('stat-open').textContent = stats.open || 0;
    document.getElementById('stat-progress').textContent = stats.progress || 0;
    document.getElementById('stat-closed').textContent = stats.closed || 0;

    allComplaints = complaints;
    const recent = complaints.slice(-10).reverse();
    renderDashboardTable(recent);
  } catch(err) {
    toast('Failed to load dashboard: ' + err.message, 'error');
  }
}

function renderDashboardTable(list) {
  const tbody = document.getElementById('dashboard-tbody');
  const empty = document.getElementById('dashboard-empty');
  if (!list.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  tbody.innerHTML = list.map(c => `
    <tr data-id="${c.id}">
      <td>#${c.id}</td>
      <td>${esc(c.title)}</td>
      <td>${c.category || '—'}</td>
      <td>${c.priority ? badge(c.priority, c.priority) : '—'}</td>
      <td>${badge(statusText(c.status), c.status)}</td>
      <td>${fmtDate(c.createdDate)}</td>
    </tr>
  `).join('');
  tbody.querySelectorAll('tr').forEach(tr => tr.addEventListener('click', () => showDetail(+tr.dataset.id)));
}

/* ═══════  ALL COMPLAINTS  ═══════ */
let currentFilter = '';

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    loadAllComplaints();
  });
});

async function loadAllComplaints() {
  try {
    let url = '/complaints';
    if (currentFilter) url += '?status=' + currentFilter;
    const list = await api(url);
    allComplaints = list;
    renderComplaintsTable(list);
  } catch(err) {
    toast('Failed to load complaints', 'error');
  }
}

function renderComplaintsTable(list) {
  const tbody = document.getElementById('complaints-tbody');
  const empty = document.getElementById('complaints-empty');
  if (!list.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  tbody.innerHTML = list.map(c => `
    <tr data-id="${c.id}">
      <td>#${c.id}</td>
      <td>${esc(c.title)}</td>
      <td>${c.category || '—'}</td>
      <td>${c.department || '—'}</td>
      <td>${c.priority ? badge(c.priority, c.priority) : '—'}</td>
      <td>${badge(statusText(c.status), c.status)}</td>
      <td class="action-btns" onclick="event.stopPropagation()">
        ${c.status !== 'IN_PROGRESS' ? `<button class="btn-sm" onclick="updateStatus(${c.id},'IN_PROGRESS')">▶ Progress</button>` : ''}
        ${c.status !== 'CLOSED' ? `<button class="btn-sm" onclick="updateStatus(${c.id},'CLOSED')">✓ Close</button>` : ''}
        <button class="btn-sm btn-danger" onclick="deleteComplaint(${c.id})">🗑</button>
      </td>
    </tr>
  `).join('');
  tbody.querySelectorAll('tr').forEach(tr => tr.addEventListener('click', () => showDetail(+tr.dataset.id)));
}

/* ═══════  MY COMPLAINTS  ═══════ */
async function loadMyComplaints() {
  if (!currentUser) return;
  try {
    const list = await api('/complaints/my?userId=' + currentUser.id);
    const tbody = document.getElementById('my-complaints-tbody');
    const empty = document.getElementById('my-complaints-empty');
    if (!list.length) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    tbody.innerHTML = list.map(c => `
      <tr data-id="${c.id}">
        <td>#${c.id}</td>
        <td>${esc(c.title)}</td>
        <td>${c.category || '—'}</td>
        <td>${c.priority ? badge(c.priority, c.priority) : '—'}</td>
        <td>${badge(statusText(c.status), c.status)}</td>
        <td>${fmtDate(c.createdDate)}</td>
      </tr>
    `).join('');
    tbody.querySelectorAll('tr').forEach(tr => tr.addEventListener('click', () => showDetail(+tr.dataset.id)));
  } catch(err) {
    toast('Failed to load your complaints', 'error');
  }
}

/* ═══════  CREATE COMPLAINT  ═══════ */
document.getElementById('analyze-btn').addEventListener('click', async () => {
  const desc = document.getElementById('c-description').value.trim();
  if (!desc) { toast('Enter a description first', 'error'); return; }
  try {
    const res = await api('/complaints/analyze', {
      method: 'POST',
      body: JSON.stringify({ description: desc })
    });
    document.getElementById('ai-category').textContent = res.category || '—';
    document.getElementById('ai-department').textContent = res.department || '—';
    document.getElementById('ai-priority').textContent = res.priority || '—';
    document.getElementById('ai-analysis-box').classList.remove('hidden');
    toast('AI analysis complete!', 'success');
  } catch(err) {
    toast('Analysis failed: ' + err.message, 'error');
  }
});

document.getElementById('complaint-form').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('c-title').value.trim();
  const description = document.getElementById('c-description').value.trim();
  if (!title || !description) { toast('Fill in all fields', 'error'); return; }
  try {
    await api('/complaints', {
      method: 'POST',
      body: JSON.stringify({ title, description, userId: currentUser.id })
    });
    toast('Complaint submitted!', 'success');
    document.getElementById('complaint-form').reset();
    document.getElementById('ai-analysis-box').classList.add('hidden');
    switchView('my-complaints');
  } catch(err) {
    toast('Submit failed: ' + err.message, 'error');
  }
});

/* ═══════  STATUS UPDATE / DELETE  ═══════ */
async function updateStatus(id, status) {
  try {
    await api(`/complaints/${id}?status=${status}`, { method: 'PUT' });
    toast('Status updated!', 'success');
    loadAllComplaints();
  } catch(err) {
    toast('Update failed: ' + err.message, 'error');
  }
}

async function deleteComplaint(id) {
  if (!confirm('Delete this complaint?')) return;
  try {
    await api(`/complaints/${id}`, { method: 'DELETE' });
    toast('Complaint deleted', 'success');
    loadAllComplaints();
  } catch(err) {
    toast('Delete failed: ' + err.message, 'error');
  }
}

/* ═══════  DETAIL MODAL  ═══════ */
function showDetail(id) {
  const c = allComplaints.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-title').textContent = '#' + c.id + ' — ' + c.title;
  document.getElementById('modal-meta').innerHTML = [
    c.category ? badge(c.category, 'open') : '',
    c.department ? `<span class="badge" style="background:var(--bg-surface);color:var(--text-muted);">${c.department}</span>` : '',
    c.priority ? badge(c.priority, c.priority) : '',
    badge(statusText(c.status), c.status),
  ].filter(Boolean).join('');
  document.getElementById('modal-desc').textContent = c.description;

  const bar = document.getElementById('modal-status-bar');
  bar.innerHTML = '';
  if (c.status !== 'IN_PROGRESS') {
    const b1 = document.createElement('button');
    b1.className = 'btn-sm'; b1.textContent = '▶ Move to In Progress';
    b1.onclick = () => { updateStatus(c.id, 'IN_PROGRESS'); closeModal(); };
    bar.appendChild(b1);
  }
  if (c.status !== 'CLOSED') {
    const b2 = document.createElement('button');
    b2.className = 'btn-sm'; b2.textContent = '✓ Close';
    b2.onclick = () => { updateStatus(c.id, 'CLOSED'); closeModal(); };
    bar.appendChild(b2);
  }

  document.getElementById('detail-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('detail-modal').classList.add('hidden');
}
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('detail-modal').addEventListener('click', e => {
  if (e.target.id === 'detail-modal') closeModal();
});

/* ═══════  SEARCH  ═══════ */
let searchTimer;
globalSearch.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const q = globalSearch.value.trim();
    if (!q) { loadAllComplaints(); return; }
    try {
      const list = await api('/complaints?search=' + encodeURIComponent(q));
      allComplaints = list;
      switchView('complaints');
      renderComplaintsTable(list);
    } catch(err) {
      toast('Search failed', 'error');
    }
  }, 400);
});

/* ═══════  AI CHAT  ═══════ */
const chatMessages = document.getElementById('chat-messages');
const chatForm     = document.getElementById('chat-form');
const chatInput    = document.getElementById('chat-input');

chatForm.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;

  appendChat(msg, 'user');
  chatInput.value = '';

  const thinkingEl = appendChat('Thinking…', 'bot');
  try {
    const reply = await api('/complaints/chat-ai', {
      method: 'POST',
      body: JSON.stringify({ message: msg })
    });
    thinkingEl.querySelector('p').textContent = reply || 'No response';
  } catch(err) {
    thinkingEl.querySelector('p').textContent = '⚠️ ' + (err.message || 'Failed to get response');
  }
});

function appendChat(text, who) {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + who;
  bubble.innerHTML = '<p>' + esc(text) + '</p>';
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

/* ═══════  UTILS  ═══════ */
function statusText(s) {
  if (s === 'IN_PROGRESS') return 'IN PROGRESS';
  return s || 'UNKNOWN';
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
