const API = '/api';

function token() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }
function clearToken() { localStorage.removeItem('token'); }
function authHeaders() {
  const t = token();
  return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function api(url, opts = {}) {
  const res = await fetch(API + url, { ...opts, headers: { ...authHeaders(), ...(opts.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function timeAgo(dt) {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dt).toLocaleDateString('zh-CN');
}

// ===== Auth =====
let currentUser = null;

function updateAuthUI() {
  const u = currentUser;
  document.getElementById('user-status').textContent = u ? u.username : '未登录';
  document.getElementById('btn-login').style.display = u ? 'none' : '';
  document.getElementById('btn-user').style.display = u ? '' : 'none';
  document.getElementById('unread-badge').style.display = u ? '' : 'none';
}

async function checkLogin() {
  const t = token();
  if (!t) return;
  try {
    const data = await api('/auth/me');
    currentUser = data.user;
    updateAuthUI();
    pollUnread();
  } catch (e) { clearToken(); }
}

async function doLogin(username, password) {
  const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  setToken(data.token);
  currentUser = data.user;
  updateAuthUI();
  closeModal('modal-auth');
  toast('登录成功');
  pollUnread();
}

async function doRegister(username, password) {
  const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });
  setToken(data.token);
  currentUser = data.user;
  updateAuthUI();
  closeModal('modal-auth');
  toast('注册成功');
  pollUnread();
}

function logout() {
  clearToken();
  currentUser = null;
  updateAuthUI();
  toast('已退出登录');
  switchPage('bounties');
  window.loadBounties();
}

let unreadTimer;
function pollUnread() {
  if (!token()) return;
  clearTimeout(unreadTimer);
  api('/messages/conversations').then(data => {
    const total = data.conversations.reduce((s, c) => s + c.unread, 0);
    const badge = document.getElementById('unread-badge');
    if (total > 0) { badge.textContent = total; badge.style.display = ''; }
    else badge.style.display = 'none';
  }).catch(() => {});
  unreadTimer = setTimeout(pollUnread, 15000);
}

// ===== Modal =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay').id));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
});

// ===== Page Switching =====
function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`[data-page="${name}"]`)?.classList.add('active');
}

// ===== Auth Modal =====
document.getElementById('btn-login').addEventListener('click', () => {
  openModal('modal-auth');
  document.getElementById('auth-title').textContent = '登录';
  document.getElementById('auth-submit').textContent = '登录';
  document.getElementById('auth-switch-text').textContent = '还没有账号？';
  document.getElementById('auth-switch-link').textContent = '注册';
  document.getElementById('auth-error').style.display = 'none';
});

let authMode = 'login';
document.getElementById('auth-switch-link').addEventListener('click', e => {
  e.preventDefault();
  authMode = authMode === 'login' ? 'register' : 'login';
  document.getElementById('auth-title').textContent = authMode === 'login' ? '登录' : '注册';
  document.getElementById('auth-submit').textContent = authMode === 'login' ? '登录' : '注册';
  document.getElementById('auth-switch-text').textContent = authMode === 'login' ? '还没有账号？' : '已有账号？';
  document.getElementById('auth-switch-link').textContent = authMode === 'login' ? '注册' : '登录';
  document.getElementById('auth-error').style.display = 'none';
});

document.getElementById('auth-form').addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const err = document.getElementById('auth-error');
  err.style.display = 'none';
  try {
    if (authMode === 'login') await doLogin(username, password);
    else await doRegister(username, password);
    window.loadBounties();
  } catch (ex) { err.textContent = ex.message; err.style.display = 'block'; }
});

document.getElementById('btn-user').addEventListener('click', () => {
  switchPage('profile');
  loadProfile();
});

// ===== Bounty List =====
const bountyState = { status: 'active', page: 1 };

async function loadBounties() {
  const grid = document.getElementById('bounty-list');
  const pag = document.getElementById('bounty-pagination');
  try {
    const data = await api(`/bounties?status=${bountyState.status}&page=${bountyState.page}&limit=12`);
    grid.innerHTML = data.bounties.map(b => `
      <div class="bounty-card status-${b.status}" onclick="showDetail('${b.id}')">
        <div class="bounty-target">
          <div class="bounty-target-avatar">&#128373;</div>
          <div class="bounty-target-info">
            <h3>${escHtml(b.game_id)}</h3>
            <span class="game">三角洲行动</span>
          </div>
        </div>
        <div class="bounty-reason">${escHtml(b.reason)}</div>
        <div class="bounty-meta">
          <span>${escHtml(b.creator_name)} &middot; ${timeAgo(b.created_at)}</span>
          <span>
            ${b.reward ? `<span class="bounty-reward-tag">&#128176; ${escHtml(b.reward)}</span>` : ''}
            <span class="bounty-status-tag ${b.status}">${statusLabel(b.status)}</span>
          </span>
        </div>
      </div>
    `).join('');

    pag.innerHTML = '';
    if (data.totalPages > 1) {
      for (let i = 1; i <= data.totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === data.page) btn.classList.add('active');
        btn.addEventListener('click', () => { bountyState.page = i; loadBounties(); });
        pag.appendChild(btn);
      }
    }
  } catch (e) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-dim);padding:40px">加载失败</p>';
  }
}

function statusLabel(s) {
  const map = { active: '通缉中', hunting: '狩猎中', completed: '已完成', cancelled: '已撤销' };
  return map[s] || s;
}

function escHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// Filter tabs
document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    bountyState.status = btn.dataset.status;
    bountyState.page = 1;
    loadBounties();
  });
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    if (page === 'bounties') { switchPage('bounties'); loadBounties(); }
    else if (page === 'messages') { switchPage('messages'); loadConversations(); }
  });
});

// ===== New Bounty =====
if (document.getElementById('btn-new-bounty')) {
  document.getElementById('btn-new-bounty').addEventListener('click', () => {
    if (!token()) { openModal('modal-auth'); return; }
    openModal('modal-bounty');
  });
}

document.getElementById('bounty-form').addEventListener('submit', async e => {
  e.preventDefault();
  const game_id = document.getElementById('bounty-gameid').value.trim();
  const reason = document.getElementById('bounty-reason').value.trim();
  const reward = document.getElementById('bounty-reward').value.trim();
  const errEl = document.getElementById('bounty-error');
  errEl.style.display = 'none';
  try {
    await api('/bounties', { method: 'POST', body: JSON.stringify({ game_id, reason, reward }) });
    closeModal('modal-bounty');
    e.target.reset();
    toast('通缉令发布成功！');
    loadBounties();
  } catch (ex) { errEl.textContent = ex.message; errEl.style.display = 'block'; }
});

// ===== Bounty Detail =====
window.showDetail = async function(id) {
  try {
    const data = await api(`/bounties/${id}`);
    const b = data.bounty;
    document.getElementById('detail-title').textContent = `通缉令: ${b.game_id}`;
    document.getElementById('detail-body').innerHTML = buildDetailHTML(b, data.comments);

    bindDetailActions(b);
    bindCommentForm(b.id);
  } catch (e) { toast(e.message); }
  openModal('modal-detail');
};

function buildDetailHTML(b, comments) {
  return `
    <div class="detail-header">
      <div class="detail-target">&#128373; ${escHtml(b.game_id)}</div>
      <div class="detail-game">三角洲行动 &middot; <span class="bounty-status-tag ${b.status}">${statusLabel(b.status)}</span></div>
      <div class="detail-reason">${escHtml(b.reason)}</div>
      ${b.reward ? `<div class="detail-reward">&#128176; 悬赏：${escHtml(b.reward)}</div>` : ''}
      <div class="detail-meta">
        <span>发布者：${escHtml(b.creator_name)}</span>
        <span>${timeAgo(b.created_at)}</span>
        ${b.hunter_name ? `<span>猎人：${escHtml(b.hunter_name)}</span>` : ''}
      </div>
    </div>
    <div class="detail-actions" id="detail-actions"></div>
    <div class="comments-section">
      <h3>&#128172; 评论 (${comments.length})</h3>
      ${token() ? '<div class="comment-form"><input id="comment-input" placeholder="添加评论..."><button class="btn btn-sm btn-primary" id="btn-comment">发送</button></div>' : '<p style="font-size:13px;color:var(--text-dim);margin-bottom:12px">登录后才能评论</p>'}
      <div class="comment-list">${comments.map(c => buildComment(c)).join('') || '<p style="color:var(--text-dim);font-size:13px">暂无评论</p>'}</div>
    </div>
  `;
}

function buildComment(c) {
  return `
    <div class="comment-item">
      <div class="comment-avatar">&#128100;</div>
      <div class="comment-body">
        <div class="comment-author">${escHtml(c.username)}</div>
        <div class="comment-text">${escHtml(c.content)}</div>
        <div class="comment-time">${timeAgo(c.created_at)}</div>
      </div>
    </div>
  `;
}

function bindDetailActions(b) {
  const el = document.getElementById('detail-actions');
  if (!el) return;
  if (!token()) return;
  if (!currentUser) return;

  let html = '';
  if (b.status === 'active' && b.creator_id === currentUser.id) {
    html += `<button class="btn btn-sm btn-danger" onclick="cancelBounty('${b.id}')">撤销通缉</button>`;
  }
  if (b.status === 'active' && b.creator_id !== currentUser.id) {
    html += `<button class="btn btn-sm btn-success" onclick="huntBounty('${b.id}')">&#127919; 接取通缉</button>`;
  }
  if (b.status === 'hunting' && b.creator_id === currentUser.id) {
    html += `<button class="btn btn-sm btn-success" onclick="completeBounty('${b.id}')">&#9989; 确认完成（支付悬赏）</button>`;
  }
  el.innerHTML = html;
}

function bindCommentForm(bountyId) {
  const btn = document.getElementById('btn-comment');
  const inp = document.getElementById('comment-input');
  if (!btn || !inp) return;
  btn.addEventListener('click', async () => {
    const content = inp.value.trim();
    if (!content) return;
    try {
      await api(`/bounties/${bountyId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
      inp.value = '';
      window.showDetail(bountyId);
    } catch (e) { toast(e.message); }
  });
}

window.huntBounty = async function(id) {
  if (!token()) { openModal('modal-auth'); return; }
  try { await api(`/bounties/${id}/hunt`, { method: 'POST' }); closeModal('modal-detail'); loadBounties(); toast('接取成功！'); }
  catch (e) { toast(e.message); }
};
window.cancelBounty = async function(id) {
  if (!confirm('确定要撤销这条通缉令吗？')) return;
  try { await api(`/bounties/${id}/cancel`, { method: 'POST' }); closeModal('modal-detail'); loadBounties(); toast('已撤销'); }
  catch (e) { toast(e.message); }
};
window.completeBounty = async function(id) {
  if (!confirm('确认该猎人已完成任务？悬赏将支付给猎人。')) return;
  try { await api(`/bounties/${id}/complete`, { method: 'POST' }); closeModal('modal-detail'); loadBounties(); toast('通缉完成！'); }
  catch (e) { toast(e.message); }
};

// ===== Messages =====
const chatState = { selectedUserId: null, selectedUserName: '' };

async function loadConversations() {
  if (!token()) return;
  const list = document.getElementById('conv-list');
  try {
    const data = await api('/messages/conversations');
    list.innerHTML = `
      <div class="msg-list-header">
        <h3>对话列表</h3>
        <button class="btn btn-sm btn-outline" id="btn-new-msg">+ 新消息</button>
      </div>
      ${data.conversations.map(c => `
        <div class="conv-item" onclick="openChat('${c.id}', '${escHtml(c.username)}')">
          <div class="conv-avatar">&#128100;</div>
          <div class="conv-info">
            <div class="conv-name">${escHtml(c.username)}</div>
            <div class="conv-last">${escHtml(c.last_msg || '')}</div>
          </div>
          ${c.unread > 0 ? `<span class="conv-unread">${c.unread}</span>` : ''}
        </div>
      `).join('') || '<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:13px">暂无对话</div>'}
    `;
    document.getElementById('btn-new-msg')?.addEventListener('click', () => openModal('modal-new-msg'));
  } catch (e) { /* ignore */ }
}

window.openChat = async function(userId, userName) {
  if (!token()) return;
  chatState.selectedUserId = userId;
  chatState.selectedUserName = userName;
  const area = document.getElementById('chat-area');
  area.innerHTML = `
    <div class="chat-header"><h3>&#128100; ${escHtml(userName)}</h3></div>
    <div class="chat-messages" id="chat-msgs"><p style="color:var(--text-dim)">加载中...</p></div>
    <div class="chat-input">
      <input id="chat-input-text" placeholder="输入消息..." autocomplete="off">
      <button class="btn btn-sm btn-primary" id="chat-send">发送</button>
    </div>
  `;
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
  area.querySelector('#chat-send').addEventListener('click', sendMessage);
  area.querySelector('#chat-input-text').addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
  await loadMessages(userId);
  pollUnread();
};

async function loadMessages(userId) {
  const data = await api(`/messages/with/${userId}`);
  const msgsEl = document.getElementById('chat-msgs');
  if (!msgsEl) return;
  msgsEl.innerHTML = data.messages.map(m => `
    <div class="chat-msg ${m.from_id === currentUser.id ? 'sent' : 'received'}">
      ${escHtml(m.content)}
      <div class="chat-msg-time">${timeAgo(m.created_at)}</div>
    </div>
  `).join('');
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

async function sendMessage() {
  const inp = document.getElementById('chat-input-text');
  const content = inp.value.trim();
  if (!content || !chatState.selectedUserId) return;
  await api('/messages', { method: 'POST', body: JSON.stringify({ to_id: chatState.selectedUserId, content }) });
  inp.value = '';
  await loadMessages(chatState.selectedUserId);
}

// ===== New Message Modal =====
document.getElementById('msg-search-user').addEventListener('input', async function() {
  const q = this.value.trim();
  const results = document.getElementById('user-search-results');
  if (q.length < 1) { results.innerHTML = ''; return; }
  try {
    const data = await api(`/users/search?q=${encodeURIComponent(q)}`);
    results.innerHTML = data.users.map(u => `
      <div class="user-search-item" onclick="openChatFromSearch('${u.id}', '${escHtml(u.username)}')">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--bg-surface);display:flex;align-items:center;justify-content:center">&#128100;</div>
        <span>${escHtml(u.username)}</span>
      </div>
    `).join('');
  } catch (e) { results.innerHTML = ''; }
});

window.openChatFromSearch = function(userId, username) {
  closeModal('modal-new-msg');
  switchPage('messages');
  loadConversations();
  setTimeout(() => openChat(userId, username), 300);
};

// ===== Profile =====
async function loadProfile() {
  if (!currentUser) return;
  try {
    const data = await api(`/users/${currentUser.id}`);
    document.getElementById('prof-name').textContent = data.user.username;
    document.getElementById('prof-join').textContent = `加入于 ${timeAgo(data.user.created_at)}`;
    document.getElementById('prof-avatar').textContent = data.user.username[0];
    document.getElementById('prof-stats').innerHTML = `
      <div class="stat-item"><div class="num">${data.stats.posted}</div><div class="label">发布通缉</div></div>
      <div class="stat-item"><div class="num">${data.stats.hunted}</div><div class="label">完成狩猎</div></div>
      <button class="btn btn-sm btn-outline" style="margin-left:auto" onclick="logout()">退出登录</button>
    `;
  } catch (e) { toast(e.message); }
}

// ===== Init =====
window.loadBounties = loadBounties;
checkLogin().then(() => loadBounties());
