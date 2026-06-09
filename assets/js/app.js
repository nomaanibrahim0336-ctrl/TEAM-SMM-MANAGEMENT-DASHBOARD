// ===== API CONFIG =====
// Set this to your Railway backend URL (no trailing slash)
const API_URL = localStorage.getItem('smm_api_url') || '';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('smm_token');
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (res.status === 401) { logout(); return null; }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || res.statusText); }
  return res.json();
}

// ===== GLOBAL APP STATE =====
// Reads from localStorage (cache). API calls populate the cache on page load.
const APP = {
  get currentUser() { return JSON.parse(localStorage.getItem('smm_user')) || null; },
  get clients()     { return JSON.parse(localStorage.getItem('smm_clients')) || []; },
  set clients(v)    { localStorage.setItem('smm_clients', JSON.stringify(v)); },
  get tasks()       { return JSON.parse(localStorage.getItem('smm_tasks')) || []; },
  set tasks(v)      { localStorage.setItem('smm_tasks', JSON.stringify(v)); },
  get team()        { return JSON.parse(localStorage.getItem('smm_team')) || []; },
  set team(v)       { localStorage.setItem('smm_team', JSON.stringify(v)); },
  get useAPI()      { return !!API_URL; }
};

// Sync all data from API into localStorage cache
async function syncFromAPI() {
  if (!APP.useAPI) return;
  try {
    const [clients, tasks, team] = await Promise.all([
      apiFetch('/clients'),
      apiFetch('/tasks'),
      apiFetch('/team')
    ]);
    if (clients) APP.clients = clients.map(normalizeClient);
    if (tasks)   APP.tasks   = tasks.map(normalizeTask);
    if (team)    APP.team    = team.map(normalizeMember);
  } catch (err) {
    console.warn('API sync failed, using cache:', err.message);
  }
}

// Field name normalization: API uses snake_case, frontend uses camelCase
function normalizeClient(c) {
  return {
    id: c.id, name: c.name, platform: c.platform, status: c.status,
    package: c.package, budget: c.budget,
    startDate: c.start_date || c.startDate,
    endDate:   c.end_date   || c.endDate,
    tenure: c.tenure, brief: c.brief,
    executive: c.executive, designer: c.designer, pm: c.pm,
    ...c
  };
}
function normalizeTask(t) {
  return {
    id: t.id, clientId: t.client_id || t.clientId, clientName: t.client_name || t.clientName,
    title: t.title, platform: t.platform, contentType: t.content_type || t.contentType,
    status: t.status, priority: t.priority, assignedTo: t.assigned_to || t.assignedTo,
    designer: t.designer, createdBy: t.created_by || t.createdBy,
    dueDate: t.due_date || t.dueDate, postedDate: t.posted_date || t.postedDate,
    scheduledTill: t.scheduled_till || t.scheduledTill,
    brief: t.brief, changes_requested: t.changes_requested, change_note: t.change_note,
    timeline: t.timeline || [], comments: t.change_requests || t.comments || [],
    createdDate: t.created_at || t.createdDate,
    ...t
  };
}
function normalizeMember(m) {
  return {
    id: String(m.id), name: m.name, email: m.email, role: m.role,
    avatar: m.avatar, color: ROLE_AVATAR_BG?.[m.role] || 'bg-gray-700', ...m
  };
}

// saveData — writes to localStorage and fires background API sync
function saveData() {
  localStorage.setItem('smm_clients', JSON.stringify(APP.clients));
  localStorage.setItem('smm_tasks',   JSON.stringify(APP.tasks));
  localStorage.setItem('smm_team',    JSON.stringify(APP.team));
}

// API write helpers — called alongside localStorage saves
// After every write, re-sync from API and fire smm:synced so all pages re-render instantly
async function _afterWrite() {
  if (!APP.useAPI) return;
  await syncFromAPI();
  document.dispatchEvent(new CustomEvent('smm:synced'));
}

async function apiSaveClient(client) {
  if (!APP.useAPI) return;
  try {
    await apiFetch('/clients', { method: 'POST', body: {
      id: client.id, name: client.name, platform: client.platform,
      status: client.status, package: client.package, budget: client.budget,
      start_date: client.startDate, end_date: client.endDate, tenure: client.tenure,
      brief: client.brief, executive: client.executive, designer: client.designer, pm: client.pm
    }});
    await _afterWrite();
  } catch(e) { console.warn('apiSaveClient:', e.message); }
}
async function apiDeleteClient(id) {
  if (!APP.useAPI) return;
  try { await apiFetch(`/clients/${id}`, { method: 'DELETE' }); await _afterWrite(); } catch(e) { console.warn(e.message); }
}
async function apiSaveTask(task) {
  if (!APP.useAPI) return;
  try {
    await apiFetch('/tasks', { method: 'POST', body: {
      id: task.id, client_id: task.clientId, client_name: task.clientName,
      title: task.title || task.topic, platform: task.platform, content_type: task.contentType,
      status: task.status, priority: task.priority, assigned_to: task.assignedTo,
      designer: task.designer, created_by: task.createdBy,
      due_date: task.dueDate, brief: task.brief
    }});
    await _afterWrite();
  } catch(e) { console.warn('apiSaveTask:', e.message); }
}
async function apiUpdateTask(id, fields) {
  if (!APP.useAPI) return;
  try { await apiFetch(`/tasks/${id}`, { method: 'PUT', body: fields }); await _afterWrite(); } catch(e) { console.warn(e.message); }
}
async function apiDeleteTask(id) {
  if (!APP.useAPI) return;
  try { await apiFetch(`/tasks/${id}`, { method: 'DELETE' }); await _afterWrite(); } catch(e) { console.warn(e.message); }
}
async function apiSaveMember(member) {
  if (!APP.useAPI) return;
  try {
    if (member.id && !member.id.startsWith('u')) {
      await apiFetch(`/team/${member.id}`, { method: 'PUT', body: member });
    } else {
      await apiFetch('/team', { method: 'POST', body: member });
    }
    await _afterWrite();
  } catch(e) { console.warn('apiSaveMember:', e.message); }
}
async function apiDeleteMember(id) {
  if (!APP.useAPI) return;
  try { await apiFetch(`/team/${id}`, { method: 'DELETE' }); await _afterWrite(); } catch(e) { console.warn(e.message); }
}

// ===== SAMPLE DATA =====
function getSampleClients() {
  const data = [
    { id:'c1', name:'David Thomas',  pm:'Noman', tenure:3,  startDate:'2025-05-01', endDate:'2025-07-31', budget:50000,  currency:'PKR', status:'active', contentTypes:['video','carousel'],         notes:'Prefers morning posts' },
    { id:'c2', name:'Craig Sutton',  pm:'Noman', tenure:6,  startDate:'2025-04-01', endDate:'2025-09-30', budget:100000, currency:'PKR', status:'active', contentTypes:['carousel','stories'],        notes:'' },
    { id:'c3', name:'Karen Reilly',  pm:'Noman', tenure:12, startDate:'2025-01-01', endDate:'2025-12-31', budget:75000,  currency:'PKR', status:'active', contentTypes:['carousel','video','stories'],notes:'Use trending audio' },
    { id:'c4', name:'Julie Suarez',  pm:'Noman', tenure:3,  startDate:'2025-05-05', endDate:'2025-08-05', budget:30000,  currency:'PKR', status:'active', contentTypes:['stories','reels'],           notes:'' },
    { id:'c5', name:'Bob Ramieh',    pm:'Zaid',  tenure:6,  startDate:'2025-02-01', endDate:'2025-07-31', budget:75000,  currency:'PKR', status:'active', contentTypes:['reels','post'],             notes:'Ending soon' },
    { id:'c6', name:'Leo Patterson', pm:'Noman', tenure:3,  startDate:'2025-03-01', endDate:'2025-05-31', budget:40000,  currency:'PKR', status:'active', contentTypes:['video'],                    notes:'' },
    { id:'c7', name:'Hector Colon',  pm:'Zaid',  tenure:12, startDate:'2024-12-01', endDate:'2025-11-30', budget:150000, currency:'PKR', status:'active', contentTypes:['carousel','video','reels'],  notes:'' },
  ];
  localStorage.setItem('smm_clients', JSON.stringify(data));
  return data;
}

function getSampleTasks() {
  const data = [
    { id:'t1', clientId:'c1', clientName:'David Thomas',  contentType:'video',    topic:'Product Launch Video',     platform:'instagram', brief:'Launch video for new collection',      instructions:'Use trending audio',           dueDate:'2025-06-08', priority:'high',   status:'with_designer',     createdBy:'Zaid', assignedTo:'Noman', designer:'Faaiz', createdDate:'2025-06-01', comments:[], timeline:[{action:'Task created',by:'Zaid',date:'2025-06-01'},{action:'Sent to designer',by:'Noman',date:'2025-06-03'}] },
    { id:'t2', clientId:'c3', clientName:'Karen Reilly',  contentType:'carousel', topic:'Summer Collection Launch',  platform:'instagram', brief:'New denim styles in trending colors',  instructions:'Use trending audio, morning post',dueDate:'2025-06-10', priority:'high',   status:'pending_review',    createdBy:'Zaid', assignedTo:'Noman', designer:'Faaiz', createdDate:'2025-06-02', comments:[], timeline:[{action:'Task created',by:'Zaid',date:'2025-06-02'},{action:'Sent to designer',by:'Noman',date:'2025-06-04'},{action:'Design completed',by:'Faaiz',date:'2025-06-06'}] },
    { id:'t3', clientId:'c2', clientName:'Craig Sutton',  contentType:'stories',  topic:'Weekend Sale',              platform:'instagram', brief:'Weekend sale announcement story pack',  instructions:'',                             dueDate:'2025-06-09', priority:'medium', status:'new',               createdBy:'Zaid', assignedTo:'Noman', designer:'Faaiz', createdDate:'2025-06-07', comments:[], timeline:[{action:'Task created',by:'Zaid',date:'2025-06-07'}] },
    { id:'t4', clientId:'c6', clientName:'Leo Patterson', contentType:'video',    topic:'Brand Awareness Video',     platform:'facebook',  brief:'Brand story video',                    instructions:'',                             dueDate:'2025-06-08', priority:'high',   status:'changes_requested', createdBy:'Zaid', assignedTo:'Noman', designer:'Faaiz', createdDate:'2025-06-01', comments:[{by:'Zaid',text:'Change the audio, too loud',date:'2025-06-07'}], timeline:[{action:'Task created',by:'Zaid',date:'2025-06-01'},{action:'Changes requested',by:'Zaid',date:'2025-06-07'}] },
    { id:'t5', clientId:'c4', clientName:'Julie Suarez',  contentType:'reels',    topic:'Product Feature Reels',     platform:'instagram', brief:'3 reels showcasing products',          instructions:'Trending sound',               dueDate:'2025-06-12', priority:'medium', status:'ready_to_post',     createdBy:'Zaid', assignedTo:'Noman', designer:'Faaiz', createdDate:'2025-06-04', comments:[], timeline:[{action:'Task created',by:'Zaid',date:'2025-06-04'},{action:'Approved by PM',by:'Zaid',date:'2025-06-07'}] },
  ];
  localStorage.setItem('smm_tasks', JSON.stringify(data));
  return data;
}

function getSampleTeam() {
  const data = [
    { id:'u1', name:'Admin',   role:'admin',           email:'admin@smm.com',   password:'admin123',   avatar:'A', color:'bg-indigo-700' },
    { id:'u2', name:'Noman',   role:'project_manager', email:'noman@smm.com',   password:'lead123',    avatar:'N', color:'bg-green-700'  },
    { id:'u3', name:'Faaiz',   role:'designer',        email:'faaiz@smm.com',   password:'exec123',    avatar:'F', color:'bg-pink-700'   },
    { id:'u4', name:'Zaid',    role:'creator',         email:'zaid@smm.com',    password:'exec123',    avatar:'Z', color:'bg-blue-700'   },
  ];
  localStorage.setItem('smm_team', JSON.stringify(data));
  return data;
}

// ===== AUTH & ROLES =====

const ROLE_LABELS = {
  admin:           'Admin',
  project_manager: 'Team Lead',
  creator:         'Executive',
  designer:        'Designer',
};

const ROLE_AVATAR_BG = {
  admin:           'bg-indigo-700',
  project_manager: 'bg-green-700',
  creator:         'bg-blue-700',
  designer:        'bg-pink-700',
};

// Pages each role can access (filename)
const ROLE_ACCESS = {
  admin:           ['index.html','clients.html','pipeline.html','tasks.html','team.html','analytics.html','admin.html','settings.html'],
  project_manager: ['index.html','clients.html','pipeline.html','tasks.html','team.html','analytics.html'],
  creator:         ['index.html','pipeline.html','tasks.html','team.html'],
  designer:        ['index.html','pipeline.html','tasks.html','team.html'],
};

// Nav items each role sees
const ROLE_NAV = {
  admin:           ['dashboard','clients','pipeline','tasks','team','analytics','admin','settings'],
  project_manager: ['dashboard','clients','pipeline','tasks','team','analytics'],
  creator:         ['dashboard','pipeline','tasks','team'],
  designer:        ['dashboard','pipeline','tasks','team'],
};

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('smm_user')) || null;
}

function checkAuth() {
  const user = getCurrentUser();
  const page = location.pathname.split('/').pop() || 'index.html';
  if (!user) { window.location.href = 'login.html'; return null; }
  const allowed = ROLE_ACCESS[user.role] || [];
  if (!allowed.includes(page)) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

// Tasks visible to current user based on role
function getVisibleTasks(allTasks, user) {
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'project_manager') return allTasks;
  if (user.role === 'creator') return allTasks.filter(t => t.assignedTo === user.name || t.createdBy === user.name);
  if (user.role === 'designer') return allTasks.filter(t => t.designer === user.name);
  return [];
}

// Clients visible to current user
function getVisibleClients(allClients, user) {
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'project_manager') return allClients;
  if (user.role === 'creator') return allClients.filter(c => c.executive === user.name || c.pm === user.name);
  if (user.role === 'designer') return allClients.filter(c => c.designer === user.name);
  return [];
}

// What actions a role can perform
function can(action, user) {
  if (!user) return false;
  const r = user.role;
  const perms = {
    create_task:      ['admin','project_manager'],
    approve_task:     ['admin','project_manager'],
    reject_task:      ['admin','project_manager'],
    request_changes:  ['admin','project_manager'],
    move_to_designer: ['admin','creator'],
    mark_design_done: ['admin','designer'],
    post_content:     ['admin','creator','project_manager'],
    edit_client:      ['admin','project_manager'],
    delete_client:    ['admin'],
    manage_team:      ['admin'],
    view_analytics:   ['admin','project_manager'],
    view_admin_panel: ['admin'],
  };
  return (perms[action] || []).includes(r);
}

// ===== SIDEBAR =====
function renderSidebar(user) {
  if (!user) return;
  const navItems = [
    { key:'dashboard', href:'index.html',    icon:'fa-gauge-high',    label:'Dashboard' },
    { key:'clients',   href:'clients.html',  icon:'fa-users',         label:'Clients' },
    { key:'pipeline',  href:'pipeline.html', icon:'fa-kanban',        label:'Pipeline' },
    { key:'tasks',     href:'tasks.html',    icon:'fa-list-check',    label:'Tasks' },
    { key:'team',      href:'team.html',     icon:'fa-people-group',  label:'Team' },
    { key:'analytics', href:'analytics.html',icon:'fa-chart-line',    label:'Analytics' },
  ];
  const adminItems = [
    { key:'admin',    href:'admin.html',    icon:'fa-shield-halved', label:'Admin Panel' },
    { key:'settings', href:'settings.html', icon:'fa-gear',          label:'Settings' },
  ];

  const allowed = ROLE_NAV[user.role] || [];
  const page = location.pathname.split('/').pop() || 'index.html';

  const navHTML = navItems
    .filter(n => allowed.includes(n.key))
    .map(n => `<a href="${n.href}" class="nav-link ${n.href === page ? 'active' : ''}">
      <i class="fa-solid ${n.icon} w-5"></i><span>${n.label}</span>
    </a>`).join('');

  const adminVisible = adminItems.filter(n => allowed.includes(n.key));
  const adminHTML = adminVisible.length ? `
    <div class="pt-4 pb-1 px-3"><p class="text-xs text-gray-600 uppercase tracking-widest font-semibold">Admin</p></div>
    ${adminVisible.map(n => `<a href="${n.href}" class="nav-link ${n.href === page ? 'active' : ''}">
      <i class="fa-solid ${n.icon} w-5"></i><span>${n.label}</span>
    </a>`).join('')}` : '';

  const avatarBg = ROLE_AVATAR_BG[user.role] || 'bg-gray-700';
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  // Reset sidebar container — panel is rendered inside it
  sidebar.style.cssText = 'position:static;width:auto;height:auto;background:none;border:none;';

  // Build notifications from visible tasks
  const allTasks = APP.tasks;
  const visibleTasks = getVisibleTasks(allTasks, user);
  const changeReqs = visibleTasks.filter(t => t.status === 'changes_requested');
  const dueToday   = visibleTasks.filter(t => { const d = daysUntil(t.dueDate); return d === 0 && t.status !== 'posted'; });
  const overdue    = visibleTasks.filter(t => { const d = daysUntil(t.dueDate); return d < 0 && t.status !== 'posted'; });
  const notifCount = changeReqs.length + dueToday.length + overdue.length;

  const notifItems = [
    ...changeReqs.map(t => `<div class="flex gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors" onclick="window.location='tasks.html'">
      <div class="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"><i class="fa-solid fa-flag text-red-400 text-xs"></i></div>
      <div class="min-w-0"><p class="text-xs font-medium text-white truncate">${t.clientName}</p><p class="text-xs text-red-400 truncate">${(t.comments||[]).slice(-1)[0]?.text || 'Changes requested'}</p></div>
    </div>`),
    ...dueToday.map(t => `<div class="flex gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors" onclick="window.location='tasks.html'">
      <div class="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"><i class="fa-solid fa-clock text-orange-400 text-xs"></i></div>
      <div class="min-w-0"><p class="text-xs font-medium text-white truncate">${t.clientName}</p><p class="text-xs text-orange-400">Due today — ${t.topic}</p></div>
    </div>`),
    ...overdue.map(t => `<div class="flex gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors" onclick="window.location='tasks.html'">
      <div class="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"><i class="fa-solid fa-triangle-exclamation text-red-400 text-xs"></i></div>
      <div class="min-w-0"><p class="text-xs font-medium text-white truncate">${t.clientName}</p><p class="text-xs text-red-400">Overdue — ${t.topic}</p></div>
    </div>`),
  ].join('');

  sidebar.innerHTML = `
    <!-- Mobile overlay -->
    <div id="sidebarOverlay" class="sidebar-overlay" onclick="closeSidebar()"></div>

    <!-- Hamburger (mobile only) -->
    <button id="hamburgerBtn" class="hamburger-btn" onclick="toggleSidebar()">
      <i class="fa-solid fa-bars text-gray-300 text-lg"></i>
    </button>

    <!-- Sidebar panel -->
    <div id="sidebarPanel" class="sidebar-panel">
      <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div class="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-layer-group text-white text-sm"></i>
        </div>
        <span class="text-white font-bold text-lg tracking-wide sidebar-text">SMM-MANAGER</span>
        <button class="ml-auto text-gray-500 hover:text-gray-300 lg:hidden" onclick="closeSidebar()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        ${navHTML}${adminHTML}
      </nav>

      <!-- Notification Bell -->
      <div class="px-3 pb-2 relative">
        <button onclick="toggleNotifPanel()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-left">
          <div class="relative">
            <i class="fa-solid fa-bell text-gray-400 text-sm w-5"></i>
            ${notifCount ? `<span class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">${notifCount > 9 ? '9+' : notifCount}</span>` : ''}
          </div>
          <span class="text-sm text-gray-400 sidebar-text">Notifications</span>
          ${notifCount ? `<span class="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full sidebar-text">${notifCount}</span>` : ''}
        </button>
        <!-- Notification dropdown -->
        <div id="notifPanel" class="hidden absolute bottom-full left-3 right-3 mb-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
          <div class="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <p class="text-xs font-semibold text-white uppercase tracking-wider">Notifications</p>
            <button onclick="toggleNotifPanel()" class="text-gray-500 hover:text-gray-300"><i class="fa-solid fa-xmark text-xs"></i></button>
          </div>
          ${notifItems || '<p class="text-xs text-gray-600 text-center py-6">All clear — nothing pending</p>'}
        </div>
      </div>

      <div class="px-4 py-4 border-t border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-sm font-bold flex-shrink-0">${user.avatar || user.name[0]}</div>
          <div class="flex-1 min-w-0 sidebar-text">
            <p class="text-sm font-semibold text-white truncate">${user.name}</p>
            <p class="text-xs text-gray-500 truncate">${roleLabel}</p>
          </div>
          <button onclick="logout()" class="text-gray-500 hover:text-red-400 transition-colors" title="Logout">
            <i class="fa-solid fa-right-from-bracket text-sm"></i>
          </button>
        </div>
      </div>
    </div>`;
}

function logout() {
  localStorage.removeItem('smm_user');
  localStorage.removeItem('smm_token');
  window.location.href = 'login.html';
}

function toggleSidebar() {
  const panel = document.getElementById('sidebarPanel');
  const overlay = document.getElementById('sidebarOverlay');
  if (!panel) return;
  panel.classList.toggle('open');
  overlay.classList.toggle('open');
}

function closeSidebar() {
  const panel = document.getElementById('sidebarPanel');
  const overlay = document.getElementById('sidebarOverlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

function toggleNotifPanel() {
  const p = document.getElementById('notifPanel');
  if (p) p.classList.toggle('hidden');
}

// Role badge HTML
function roleBadge(role) {
  const map = {
    admin:           'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    project_manager: 'bg-green-500/15 text-green-400 border-green-500/30',
    creator:         'bg-blue-500/15 text-blue-400 border-blue-500/30',
    designer:        'bg-pink-500/15 text-pink-400 border-pink-500/30',
  };
  return `<span class="status-badge ${map[role] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}">${ROLE_LABELS[role] || role}</span>`;
}

// ===== DATE HELPERS =====
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.round((new Date(dateStr) - today) / 86400000);
}

function daysAgo(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.round((today - new Date(dateStr)) / 86400000);
}

// ===== STATUS HELPERS =====
const STATUS_CONFIG = {
  new:               { label:'New',                    color:'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  ready_to_designer: { label:'Ready to Designer',      color:'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  with_designer:     { label:'With Designer',          color:'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  pending_review:    { label:'Pending Review',         color:'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  changes_requested: { label:'Changes Requested',      color:'bg-red-500/15 text-red-400 border-red-500/30' },
  additional_content:{ label:'Additional Content',     color:'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  ready_to_post:     { label:'Ready to Post',          color:'bg-green-500/15 text-green-400 border-green-500/30' },
  posted:            { label:'Posted',                 color:'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  on_hold:           { label:'On Hold',                color:'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

function statusBadge(status) {
  const cfg = STATUS_CONFIG[status] || { label:status, color:'bg-gray-500/15 text-gray-400 border-gray-500/30' };
  return `<span class="status-badge ${cfg.color}">${cfg.label}</span>`;
}

// ===== POSTED DATE MODAL =====
// Call this instead of directly setting status to 'posted'
// onConfirm(postedDate) is called with the date string
function showPostedDateModal(taskId, onConfirm) {
  // Remove existing if any
  const existing = document.getElementById('_postedModal');
  if (existing) existing.remove();

  const today = new Date().toISOString().split('T')[0];

  const overlay = document.createElement('div');
  overlay.id = '_postedModal';
  overlay.className = 'modal-overlay open';
  overlay.style.zIndex = '300';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:400px">
      <div class="flex items-center justify-between px-6 py-5 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <i class="fa-solid fa-circle-check text-green-400 text-sm"></i>
          </div>
          <h2 class="text-base font-semibold text-white">Mark as Posted</h2>
        </div>
        <button onclick="document.getElementById('_postedModal').remove()" class="text-gray-500 hover:text-gray-300">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="form-label">Posted Date</label>
          <input id="_postedDateInput" type="date" class="form-input bg-gray-800/50 cursor-not-allowed" value="${today}" readonly/>
          <p class="text-xs text-gray-500 mt-1">Auto-set to today — the day content is being marked as posted</p>
        </div>
        <div>
          <label class="form-label">Scheduled Till <span class="text-gray-500 font-normal">(optional)</span></label>
          <input id="_scheduledTillInput" type="date" class="form-input" min="${today}"/>
          <p class="text-xs text-gray-500 mt-1">Future date — how long it stays scheduled/active on Facebook</p>
        </div>
        <div>
          <label class="form-label">Post Link / Notes (optional)</label>
          <input id="_postedNoteInput" type="text" class="form-input" placeholder="e.g. Instagram post link or any note"/>
        </div>
      </div>
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
        <button onclick="document.getElementById('_postedModal').remove()" class="btn-secondary">Cancel</button>
        <button id="_postedConfirmBtn" class="btn-primary flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-sm"></i> Mark Posted
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  document.getElementById('_postedConfirmBtn').onclick = () => {
    const date          = today; // always auto today
    const scheduledTill = document.getElementById('_scheduledTillInput').value || '';
    const note          = document.getElementById('_postedNoteInput').value.trim() || '';
    overlay.remove();
    onConfirm(date, scheduledTill, note);
  };

  // Close on overlay click
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const existing = document.getElementById('_toast');
  if (existing) existing.remove();
  const colors = { success:'bg-green-600', error:'bg-red-600', info:'bg-indigo-600' };
  const icons  = { success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info' };
  const t = document.createElement('div');
  t.id = '_toast';
  t.className = `fixed bottom-6 right-6 ${colors[type]||colors.success} text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg z-[200] fade-in`;
  t.innerHTML = `<i class="fa-solid ${icons[type]||icons.success} mr-2"></i>${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ===== CURRENT DATE =====
function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (el) el.textContent = new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}

// ===== PAGE INIT =====
// Call this at the top of every page's DOMContentLoaded
function pageInit(options = {}) {
  const user = checkAuth();
  if (!user) return null;
  renderSidebar(user);
  setCurrentDate();
  // show role banner
  const banner = document.getElementById('roleBanner');
  if (banner) {
    const colors = { admin:'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', project_manager:'bg-green-500/10 text-green-400 border-green-500/20', creator:'bg-blue-500/10 text-blue-400 border-blue-500/20', designer:'bg-pink-500/10 text-pink-400 border-pink-500/20' };
    banner.className = `text-xs px-3 py-1.5 rounded-full border ${colors[user.role]||'bg-gray-500/10 text-gray-400 border-gray-500/20'}`;
    banner.textContent = ROLE_LABELS[user.role] || user.role;
  }
  // Sync from API in background if configured — caller gets user immediately,
  // pages listen for 'smm:synced' event to re-render with fresh data
  if (APP.useAPI) {
    syncFromAPI().then(() => {
      document.dispatchEvent(new CustomEvent('smm:synced'));
    });
    // Auto-refresh every 30 seconds so team sees each other's changes
    setInterval(() => {
      syncFromAPI().then(() => {
        document.dispatchEvent(new CustomEvent('smm:synced'));
      });
    }, 30000);
  } else if (!localStorage.getItem('smm_clients')) {
    // first ever load — seed sample data
    getSampleClients(); getSampleTasks(); getSampleTeam();
  }
  return user;
}
