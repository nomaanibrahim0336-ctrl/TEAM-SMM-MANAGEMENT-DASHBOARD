// ===== GLOBAL APP STATE =====
const APP = {
  currentUser: JSON.parse(localStorage.getItem('smm_user')) || null,
  clients: JSON.parse(localStorage.getItem('smm_clients')) || getSampleClients(),
  tasks: JSON.parse(localStorage.getItem('smm_tasks')) || getSampleTasks(),
  team: JSON.parse(localStorage.getItem('smm_team')) || getSampleTeam(),
};

function saveData() {
  localStorage.setItem('smm_clients', JSON.stringify(APP.clients));
  localStorage.setItem('smm_tasks', JSON.stringify(APP.tasks));
  localStorage.setItem('smm_team', JSON.stringify(APP.team));
}

// ===== SAMPLE DATA =====
function getSampleClients() {
  return [
    { id: 'c1', name: 'David Thomas', pm: 'Noman', tenure: 3, startDate: '2025-05-01', endDate: '2025-07-31', budget: 50000, currency: 'PKR', status: 'active', contentTypes: ['video', 'carousel'], notes: 'Prefers morning posts' },
    { id: 'c2', name: 'Craig Sutton', pm: 'Noman', tenure: 6, startDate: '2025-04-01', endDate: '2025-09-30', budget: 100000, currency: 'PKR', status: 'active', contentTypes: ['carousel', 'stories'], notes: '' },
    { id: 'c3', name: 'Karen Reilly', pm: 'Noman', tenure: 12, startDate: '2025-01-01', endDate: '2025-12-31', budget: 75000, currency: 'PKR', status: 'active', contentTypes: ['carousel', 'video', 'stories'], notes: 'Use trending audio' },
    { id: 'c4', name: 'Julie Suarez', pm: 'Noman', tenure: 3, startDate: '2025-05-05', endDate: '2025-08-05', budget: 30000, currency: 'PKR', status: 'active', contentTypes: ['stories', 'reels'], notes: '' },
    { id: 'c5', name: 'Bob Ramieh', pm: 'Zaid', tenure: 6, startDate: '2025-02-01', endDate: '2025-07-31', budget: 75000, currency: 'PKR', status: 'active', contentTypes: ['reels', 'post'], notes: 'Ending soon' },
    { id: 'c6', name: 'Leo Patterson', pm: 'Noman', tenure: 3, startDate: '2025-03-01', endDate: '2025-05-31', budget: 40000, currency: 'PKR', status: 'active', contentTypes: ['video'], notes: '' },
    { id: 'c7', name: 'Hector Colon', pm: 'Zaid', tenure: 12, startDate: '2024-12-01', endDate: '2025-11-30', budget: 150000, currency: 'PKR', status: 'active', contentTypes: ['carousel', 'video', 'reels'], notes: '' },
  ];
}

function getSampleTasks() {
  return [
    { id: 't1', clientId: 'c1', clientName: 'David Thomas', contentType: 'video', topic: 'Product Launch Video', platform: 'instagram', brief: 'Launch video for new collection', instructions: 'Use trending audio', dueDate: '2025-06-08', priority: 'high', status: 'with_designer', createdBy: 'Noman', assignedTo: 'Noman', designer: 'Javeria', createdDate: '2025-06-01', comments: [], timeline: [{ action: 'Task created', by: 'Noman', date: '2025-06-01' }, { action: 'Sent to designer', by: 'Noman', date: '2025-06-03' }] },
    { id: 't2', clientId: 'c3', clientName: 'Karen Reilly', contentType: 'carousel', topic: 'Summer Collection Launch', platform: 'instagram', brief: 'New denim styles in trending colors', instructions: 'Use trending audio, morning post', dueDate: '2025-06-10', priority: 'high', status: 'pending_review', createdBy: 'Noman', assignedTo: 'Noman', designer: 'Javeria', createdDate: '2025-06-02', comments: [], timeline: [{ action: 'Task created', by: 'Noman', date: '2025-06-02' }, { action: 'Sent to designer', by: 'Noman', date: '2025-06-04' }, { action: 'Design completed', by: 'Javeria', date: '2025-06-06' }] },
    { id: 't3', clientId: 'c2', clientName: 'Craig Sutton', contentType: 'stories', topic: 'Weekend Sale', platform: 'instagram', brief: 'Weekend sale announcement story pack', instructions: '', dueDate: '2025-06-09', priority: 'medium', status: 'new', createdBy: 'Noman', assignedTo: 'Noman', designer: 'Javeria', createdDate: '2025-06-07', comments: [], timeline: [{ action: 'Task created', by: 'Noman', date: '2025-06-07' }] },
    { id: 't4', clientId: 'c6', clientName: 'Leo Patterson', contentType: 'video', topic: 'Brand Awareness Video', platform: 'facebook', brief: 'Brand story video', instructions: '', dueDate: '2025-06-08', priority: 'high', status: 'changes_requested', createdBy: 'Noman', assignedTo: 'Noman', designer: 'Javeria', createdDate: '2025-06-01', comments: [{ by: 'PM', text: 'Change the audio, too loud', date: '2025-06-07' }], timeline: [{ action: 'Task created', by: 'Noman', date: '2025-06-01' }, { action: 'Changes requested', by: 'PM', date: '2025-06-07' }] },
    { id: 't5', clientId: 'c4', clientName: 'Julie Suarez', contentType: 'reels', topic: 'Product Feature Reels', platform: 'instagram', brief: '3 reels showcasing products', instructions: 'Trending sound', dueDate: '2025-06-12', priority: 'medium', status: 'ready_to_post', createdBy: 'Noman', assignedTo: 'Noman', designer: 'Javeria', createdDate: '2025-06-04', comments: [], timeline: [{ action: 'Task created', by: 'Noman', date: '2025-06-04' }, { action: 'Approved by PM', by: 'PM', date: '2025-06-07' }] },
  ];
}

function getSampleTeam() {
  return [
    { id: 'u1', name: 'Admin', role: 'admin', email: 'admin@smm.com', password: 'admin123', avatar: 'A', color: 'bg-indigo-700' },
    { id: 'u2', name: 'Noman', role: 'creator', email: 'noman@smm.com', password: 'creator123', avatar: 'N', color: 'bg-blue-700' },
    { id: 'u3', name: 'Javeria', role: 'designer', email: 'javeria@smm.com', password: 'designer123', avatar: 'J', color: 'bg-pink-700' },
    { id: 'u4', name: 'Zaid', role: 'project_manager', email: 'zaid@smm.com', password: 'pm123', avatar: 'Z', color: 'bg-green-700' },
  ];
}

// ===== DATE HELPERS =====
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const target = new Date(dateStr);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function daysAgo(dateStr) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const target = new Date(dateStr);
  const diff = Math.round((today - target) / (1000 * 60 * 60 * 24));
  return diff;
}

// ===== STATUS HELPERS =====
const STATUS_CONFIG = {
  new:                        { label: 'New', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  ready_to_designer:          { label: 'Ready to Designer', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  with_designer:              { label: 'With Designer', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  pending_review:             { label: 'Pending Review', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  changes_requested:          { label: 'Changes Requested', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  additional_content:         { label: 'Additional Content', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  ready_to_post:              { label: 'Ready to Post', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  posted:                     { label: 'Posted', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  on_hold:                    { label: 'On Hold', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

function statusBadge(status) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };
  return `<span class="status-badge ${cfg.color}">${cfg.label}</span>`;
}

const PRIORITY_CONFIG = {
  high:   { label: 'High', color: 'text-red-400', dot: 'bg-red-500' },
  medium: { label: 'Medium', color: 'text-yellow-400', dot: 'bg-yellow-500' },
  low:    { label: 'Low', color: 'text-green-400', dot: 'bg-green-500' },
};

// ===== SET CURRENT DATE =====
function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
}

// ===== HIGHLIGHT ACTIVE NAV =====
function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === page) link.classList.add('active');
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  setActiveNav();
  saveData();
});
