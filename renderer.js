// Application State
let currentSession = null; // { role: 'user'|'it_staff', userId, userName, userType, staffId, name }
let userTickets = [];
let allTickets = [];
let selectedDetailTicket = null;
let selectedStaffTicketId = null;

// Modal Focus Management
let activeModalTrap = null;
let lastFocusedBeforeModal = null;

function announce(message) {
  const el = document.getElementById('liveAnnouncer');
  if (el) el.textContent = message;
}

function showModal(modal) {
  if (!modal) return;
  lastFocusedBeforeModal = document.activeElement;
  modal.classList.add('active');

  const focusables = modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
  if (focusables.length > 0) {
    focusables[0].focus();
  }

  if (activeModalTrap) {
    document.removeEventListener('keydown', activeModalTrap);
  }

  activeModalTrap = (e) => {
    if (e.key !== 'Tab') return;
    const currentFocusables = Array.from(modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (currentFocusables.length === 0) return;
    const first = currentFocusables[0];
    const last = currentFocusables[currentFocusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener('keydown', activeModalTrap);
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('active');
  if (activeModalTrap) {
    document.removeEventListener('keydown', activeModalTrap);
    activeModalTrap = null;
  }
  if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
    lastFocusedBeforeModal.focus();
    lastFocusedBeforeModal = null;
  }
}

// DOM Views
const authView = document.getElementById('authView');
const userPortalView = document.getElementById('userPortalView');
const itStaffView = document.getElementById('itStaffView');

// Header Elements
const sessionBadgeContainer = document.getElementById('sessionBadgeContainer');
const sessionRoleText = document.getElementById('sessionRoleText');
const sessionDivider = document.getElementById('sessionDivider');
const sessionUserText = document.getElementById('sessionUserText');
const btnSwitchRole = document.getElementById('btnSwitchRole');

// Auth Form Elements
const userLoginForm = document.getElementById('userLoginForm');
const authUserId = document.getElementById('authUserId');
const authResolvedName = document.getElementById('authResolvedName');
const authResolvedBadge = document.getElementById('authResolvedBadge');
const staffLoginForm = document.getElementById('staffLoginForm');
const authStaffId = document.getElementById('authStaffId');
const authStaffPassword = document.getElementById('authStaffPassword');
const authAlert = document.getElementById('authAlert');

// Pre-defined campus user directory
const USER_DIRECTORY = {
  '24-1766': { name: 'Carlos James Martinez', userType: 'Student' },
  'FAC-101': { name: 'Stephen Marion Gregory', userType: 'Faculty' },
  '24-1767': { name: 'Jushua Bogay', userType: 'Student' },
  '2024-0001': { name: 'Carlos James Martinez', userType: 'Student' },
  '2024-0002': { name: 'Juan Dela Cruz', userType: 'Student' },
  '2024-0003': { name: 'Ana Gomez', userType: 'Student' },
  '2024-0004': { name: 'Jushua Bogay', userType: 'Student' }
};

// ponytail: query accounts.json through IPC lookup; fallback to seeded directory if IPC unavailable
async function updateResolvedUserDisplay() {
  if (!authResolvedName || !authResolvedBadge) return;
  const id = authUserId.value.trim();
  if (!id) {
    authResolvedName.textContent = 'Enter ID above to verify account';
    authResolvedName.className = 'font-semibold text-slate-500';
    authResolvedBadge.textContent = 'Unverified';
    authResolvedBadge.className = 'badge badge-ghost badge-xs font-semibold';
    return;
  }

  let user = null;
  if (window.api && window.api.lookupUser) {
    user = await window.api.lookupUser(id);
  } else {
    user = USER_DIRECTORY[id] || USER_DIRECTORY[id.toUpperCase()] || null;
  }

  if (user) {
    authResolvedName.textContent = user.name;
    authResolvedName.className = 'font-semibold text-slate-900';
    authResolvedBadge.textContent = user.userType || user.role || 'Student';
    authResolvedBadge.className = `badge badge-xs font-semibold ${(user.userType || user.role) === 'Faculty' ? 'badge-warning' : 'badge-info'}`;
  } else {
    authResolvedName.textContent = 'Unregistered ID';
    authResolvedName.className = 'font-semibold text-red-600';
    authResolvedBadge.textContent = 'Not Found';
    authResolvedBadge.className = 'badge badge-error badge-xs font-semibold text-red-900';
  }
}

// User Portal Elements
const userPortalHeaderName = document.getElementById('userPortalHeaderName');
const userPortalHeaderId = document.getElementById('userPortalHeaderId');
const formUserDisplayId = document.getElementById('formUserDisplayId');
const formUserDisplayName = document.getElementById('formUserDisplayName');
const createTicketForm = document.getElementById('createTicketForm');
const selectCategory = document.getElementById('selectCategory');
const selectPriority = document.getElementById('selectPriority');
const textareaDescription = document.getElementById('textareaDescription');
const formAlert = document.getElementById('formAlert');
const btnUserRefresh = document.getElementById('btnUserRefresh');
const userSearchQuery = document.getElementById('userSearchQuery');
const userFilterStatus = document.getElementById('userFilterStatus');
const userTicketsTableBody = document.getElementById('userTicketsTableBody');
const userEmptyState = document.getElementById('userEmptyState');
const tabUserSubmit = document.getElementById('tabUserSubmit');
const tabUserHistory = document.getElementById('tabUserHistory');
const panelUserSubmit = document.getElementById('panelUserSubmit');
const panelUserHistory = document.getElementById('panelUserHistory');
const userTicketCountBadge = document.getElementById('userTicketCountBadge');

function setUserPortalTab(tab) {
  if (!tabUserSubmit || !tabUserHistory || !panelUserSubmit || !panelUserHistory) return;
  if (tab === 'history') {
    tabUserSubmit.className = 'px-4 py-2 rounded-md text-sm font-bold text-slate-600 hover:text-slate-900 transition-all';
    tabUserSubmit.setAttribute('aria-selected', 'false');
    tabUserHistory.className = 'px-4 py-2 rounded-md text-sm font-bold transition-all bg-white text-primary shadow-xs';
    tabUserHistory.setAttribute('aria-selected', 'true');
    panelUserSubmit.classList.add('hidden');
    panelUserHistory.classList.remove('hidden');
  } else {
    tabUserSubmit.className = 'px-4 py-2 rounded-md text-sm font-bold transition-all bg-white text-primary shadow-xs';
    tabUserSubmit.setAttribute('aria-selected', 'true');
    tabUserHistory.className = 'px-4 py-2 rounded-md text-sm font-bold text-slate-600 hover:text-slate-900 transition-all';
    tabUserHistory.setAttribute('aria-selected', 'false');
    panelUserSubmit.classList.remove('hidden');
    panelUserHistory.classList.add('hidden');
  }
}

if (tabUserSubmit && tabUserHistory) {
  tabUserSubmit.addEventListener('click', () => setUserPortalTab('submit'));
  tabUserHistory.addEventListener('click', () => setUserPortalTab('history'));
}

// IT Staff Portal Elements
const btnStaffRefresh = document.getElementById('btnStaffRefresh');
const statTotal = document.getElementById('statTotal');
const statOpen = document.getElementById('statOpen');
const statInProgress = document.getElementById('statInProgress');
const statResolved = document.getElementById('statResolved');
const staffSearchQuery = document.getElementById('staffSearchQuery');
const staffFilterStatus = document.getElementById('staffFilterStatus');
const staffFilterCategory = document.getElementById('staffFilterCategory');
const staffTicketsTableBody = document.getElementById('staffTicketsTableBody');
const staffEmptyState = document.getElementById('staffEmptyState');

// IT Staff Live Split-Pane Inspector Elements
const paneEmptyState = document.getElementById('paneEmptyState');
const paneContent = document.getElementById('paneContent');
const paneTicketId = document.getElementById('paneTicketId');
const paneStatusBadge = document.getElementById('paneStatusBadge');
const panePriorityBadge = document.getElementById('panePriorityBadge');
const paneUserName = document.getElementById('paneUserName');
const paneUserId = document.getElementById('paneUserId');
const paneCategory = document.getElementById('paneCategory');
const paneUserType = document.getElementById('paneUserType');
const paneCreatedAt = document.getElementById('paneCreatedAt');
const paneUpdatedAt = document.getElementById('paneUpdatedAt');
const paneDescription = document.getElementById('paneDescription');
const paneActionButtons = document.getElementById('paneActionButtons');

// Modals
const confirmationModal = document.getElementById('confirmationModal');
const modalTicketId = document.getElementById('modalTicketId');
const modalUserName = document.getElementById('modalUserName');
const modalCategory = document.getElementById('modalCategory');
const modalStatus = document.getElementById('modalStatus');
const btnCloseModal = document.getElementById('btnCloseModal');

// Ticket Detail Inspector Modal Elements (User View Modal)
const ticketDetailModal = document.getElementById('ticketDetailModal');
const detailTicketId = document.getElementById('detailTicketId');
const detailStatusBadge = document.getElementById('detailStatusBadge');
const detailPriorityBadge = document.getElementById('detailPriorityBadge');
const detailUserName = document.getElementById('detailUserName');
const detailUserId = document.getElementById('detailUserId');
const detailCategory = document.getElementById('detailCategory');
const detailUserType = document.getElementById('detailUserType');
const detailCreatedAt = document.getElementById('detailCreatedAt');
const detailUpdatedAt = document.getElementById('detailUpdatedAt');
const detailDescription = document.getElementById('detailDescription');
const detailStaffActions = document.getElementById('detailStaffActions');
const detailActionButtons = document.getElementById('detailActionButtons');
const btnCloseTicketDetail = document.getElementById('btnCloseTicketDetail');
const btnCloseTicketDetail2 = document.getElementById('btnCloseTicketDetail2');

// --- Helper Functions ---
function getPriorityBadge(priority) {
  switch (String(priority).toLowerCase()) {
    case 'high':
      return '<span class="badge badge-error badge-sm font-semibold whitespace-nowrap">High</span>';
    case 'medium':
      return '<span class="badge badge-warning badge-sm font-semibold whitespace-nowrap">Medium</span>';
    case 'low':
      return '<span class="badge badge-ghost badge-sm font-semibold whitespace-nowrap">Low</span>';
    default:
      return `<span class="badge badge-ghost badge-sm font-semibold whitespace-nowrap">${escapeHtml(priority)}</span>`;
  }
}

function getStatusBadge(status) {
  switch (String(status).toUpperCase()) {
    case 'OPEN':
      return '<span class="badge badge-warning badge-sm font-semibold whitespace-nowrap">OPEN</span>';
    case 'IN PROGRESS':
      return '<span class="badge badge-info badge-sm font-semibold whitespace-nowrap">IN PROGRESS</span>';
    case 'RESOLVED':
      return '<span class="badge badge-success badge-sm font-semibold whitespace-nowrap">RESOLVED</span>';
    default:
      return `<span class="badge badge-ghost badge-sm font-semibold whitespace-nowrap">${escapeHtml(status)}</span>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ponytail: relative time formatter; switch to Intl.RelativeTimeFormat when internationalization is requested
function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatFullDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

function showAuthAlert(message, type = 'error') {
  // Strip Electron IPC error wrapper and internal prefixes
  const cleanMsg = String(message || '')
    .replace(/^Error invoking remote method '[^']+': (Error: )?/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();

  authAlert.textContent = cleanMsg;
  authAlert.className = `mt-6 p-3 rounded-lg text-sm font-bold text-center ${
    type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  }`;
  authAlert.classList.remove('hidden');
}

function showFormAlert(message, type = 'error') {
  formAlert.textContent = message;
  formAlert.className = `p-3 rounded-md text-sm font-bold ${
    type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  }`;
  formAlert.classList.remove('hidden');
}

// Quick Demo User Filler
window.fillDemoUser = function (id) {
  authUserId.value = id;
  authUserId.classList.remove('is-invalid');
  authAlert.classList.add('hidden');
  updateResolvedUserDisplay();
};

// Quick Demo Staff Filler
window.fillDemoStaff = function (id, password = 'admin123') {
  authStaffId.value = id;
  authStaffPassword.value = password;
  authStaffId.classList.remove('is-invalid');
  authStaffPassword.classList.remove('is-invalid');
  authAlert.classList.add('hidden');
};

// --- View Transitions ---
function showAuthView() {
  currentSession = null;
  authView.classList.remove('hidden');
  userPortalView.classList.add('hidden');
  itStaffView.classList.add('hidden');

  sessionBadgeContainer.classList.add('hidden');
  sessionBadgeContainer.classList.remove('flex');
  btnSwitchRole.classList.add('hidden');
  updateResolvedUserDisplay();
}

function showUserPortal(profile) {
  currentSession = profile;
  authView.classList.add('hidden');
  itStaffView.classList.add('hidden');
  userPortalView.classList.remove('hidden');

  // Header Session
  sessionRoleText.textContent = profile.userType || 'User';
  sessionUserText.textContent = `${profile.userName} (${profile.userId})`;
  if (sessionDivider) sessionDivider.classList.remove('hidden');
  sessionUserText.classList.remove('hidden');
  sessionBadgeContainer.classList.remove('hidden');
  sessionBadgeContainer.classList.add('flex');
  btnSwitchRole.classList.remove('hidden');

  // Portal Header & Form Prefills
  userPortalHeaderName.textContent = profile.userName;
  userPortalHeaderId.textContent = profile.userId;
  formUserDisplayId.textContent = profile.userId;
  formUserDisplayName.textContent = profile.userName;

  loadUserTickets();
}

function showITStaffPortal(profile) {
  currentSession = profile;
  authView.classList.add('hidden');
  userPortalView.classList.add('hidden');
  itStaffView.classList.remove('hidden');

  // Header Session
  // ponytail: IT staff badge displays role only without admin suffix; restore sessionUserText if multi-admin display is required.
  sessionRoleText.textContent = 'IT Support Staff';
  sessionUserText.textContent = '';
  if (sessionDivider) sessionDivider.classList.add('hidden');
  sessionUserText.classList.add('hidden');
  sessionBadgeContainer.classList.remove('hidden');
  sessionBadgeContainer.classList.add('flex');
  btnSwitchRole.classList.remove('hidden');

  loadAllTickets();
}

// --- Ticket Detail Modal (User View) ---
function openTicketDetail(ticket) {
  if (!ticket) return;
  selectedDetailTicket = ticket;

  detailTicketId.textContent = ticket.id;
  detailStatusBadge.innerHTML = getStatusBadge(ticket.status);
  detailPriorityBadge.innerHTML = getPriorityBadge(ticket.priority);
  detailUserName.textContent = ticket.userName || 'N/A';
  detailUserId.textContent = ticket.userId ? `ID: ${ticket.userId}` : '';
  detailCategory.textContent = ticket.category || 'N/A';
  detailUserType.textContent = ticket.userType ? `Role: ${ticket.userType}` : '';
  detailCreatedAt.textContent = formatFullDateTime(ticket.createdAt);
  detailUpdatedAt.textContent = formatFullDateTime(ticket.updatedAt);
  detailDescription.textContent = ticket.description || 'No description provided.';

  const detailRemarksContainer = document.getElementById('detailRemarksContainer');
  const detailRemarks = document.getElementById('detailRemarks');
  if (detailRemarksContainer && detailRemarks) {
    if (ticket.remarks && ticket.remarks.trim()) {
      detailRemarks.textContent = ticket.remarks;
      detailRemarksContainer.classList.remove('hidden');
    } else {
      detailRemarksContainer.classList.add('hidden');
    }
  }

  // Render staff action buttons if in staff role inside modal
  if (currentSession && currentSession.role === 'it_staff') {
    detailStaffActions.classList.remove('hidden');
    renderDetailActionButtons(ticket);
  } else {
    detailStaffActions.classList.add('hidden');
  }

  showModal(ticketDetailModal);
}

function renderDetailActionButtons(ticket) {
  detailActionButtons.innerHTML = '';
  if (ticket.status === 'OPEN') {
    const btnProgress = document.createElement('button');
    btnProgress.className = 'btn btn-xs btn-outline border-sky-500 text-sky-700 hover:bg-sky-50';
    btnProgress.textContent = 'In Progress';
    btnProgress.onclick = () => updateStatus(ticket.id, 'IN PROGRESS', true);

    const btnResolve = document.createElement('button');
    btnResolve.className = 'btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0';
    btnResolve.textContent = 'Resolve';
    btnResolve.onclick = () => updateStatus(ticket.id, 'RESOLVED', true);

    detailActionButtons.appendChild(btnProgress);
    detailActionButtons.appendChild(btnResolve);
  } else if (ticket.status === 'IN PROGRESS') {
    const btnResolve = document.createElement('button');
    btnResolve.className = 'btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0';
    btnResolve.textContent = 'Resolve';
    btnResolve.onclick = () => updateStatus(ticket.id, 'RESOLVED', true);
    detailActionButtons.appendChild(btnResolve);
  } else if (ticket.status === 'RESOLVED') {
    const btnReopen = document.createElement('button');
    btnReopen.className = 'btn btn-xs btn-outline border-slate-300 text-slate-700 hover:bg-slate-100';
    btnReopen.textContent = 'Reopen Ticket';
    btnReopen.onclick = () => updateStatus(ticket.id, 'OPEN', true);
    detailActionButtons.appendChild(btnReopen);
  }
}

function closeTicketDetail() {
  closeModal(ticketDetailModal);
  selectedDetailTicket = null;
}

// --- IT Staff Master-Detail Live Inspector Pane ---
function inspectTicketInStaffPane(ticket) {
  if (!ticket) {
    selectedStaffTicketId = null;
    paneContent.classList.add('hidden');
    paneEmptyState.classList.remove('hidden');
    paneStatusBadge.innerHTML = '';
    panePriorityBadge.innerHTML = '';
    return;
  }

  selectedStaffTicketId = ticket.id;
  selectedDetailTicket = ticket;

  paneEmptyState.classList.add('hidden');
  paneContent.classList.remove('hidden');

  paneTicketId.textContent = ticket.id;
  paneStatusBadge.innerHTML = getStatusBadge(ticket.status);
  panePriorityBadge.innerHTML = getPriorityBadge(ticket.priority);
  paneUserName.textContent = ticket.userName || 'N/A';
  paneUserId.textContent = ticket.userId ? `ID: ${ticket.userId}` : '';
  paneCategory.textContent = ticket.category || 'N/A';
  paneUserType.textContent = ticket.userType ? `Role: ${ticket.userType}` : '';
  paneCreatedAt.textContent = formatFullDateTime(ticket.createdAt);
  paneUpdatedAt.textContent = formatFullDateTime(ticket.updatedAt);
  paneDescription.textContent = ticket.description || 'No description provided.';

  const paneStaffRemarks = document.getElementById('paneStaffRemarks');
  if (paneStaffRemarks) {
    paneStaffRemarks.value = ticket.remarks || '';
  }

  // Render triage action buttons
  paneActionButtons.innerHTML = '';
  if (ticket.status === 'OPEN') {
    const btnProgress = document.createElement('button');
    btnProgress.type = 'button';
    btnProgress.className = 'btn btn-xs btn-outline border-sky-500 text-sky-700 hover:bg-sky-50 font-semibold px-3';
    btnProgress.textContent = 'Set In Progress';
    btnProgress.onclick = () => updateStatus(ticket.id, 'IN PROGRESS');

    const btnResolve = document.createElement('button');
    btnResolve.type = 'button';
    btnResolve.className = 'btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 font-semibold px-3';
    btnResolve.textContent = 'Mark Resolved';
    btnResolve.onclick = () => updateStatus(ticket.id, 'RESOLVED');

    paneActionButtons.appendChild(btnProgress);
    paneActionButtons.appendChild(btnResolve);
  } else if (ticket.status === 'IN PROGRESS') {
    const btnResolve = document.createElement('button');
    btnResolve.type = 'button';
    btnResolve.className = 'btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 font-semibold px-4';
    btnResolve.textContent = 'Mark Resolved';
    btnResolve.onclick = () => updateStatus(ticket.id, 'RESOLVED');
    paneActionButtons.appendChild(btnResolve);
  } else if (ticket.status === 'RESOLVED') {
    const btnReopen = document.createElement('button');
    btnReopen.type = 'button';
    btnReopen.className = 'btn btn-xs btn-outline border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold px-3';
    btnReopen.textContent = 'Reopen Ticket';
    btnReopen.onclick = () => updateStatus(ticket.id, 'OPEN');
    paneActionButtons.appendChild(btnReopen);
  }

  // Update table row selected state
  document.querySelectorAll('#staffTicketsTableBody tr').forEach(row => {
    if (row.getAttribute('data-ticket-id') === ticket.id) {
      row.classList.add('selected-row');
      row.setAttribute('aria-selected', 'true');
    } else {
      row.classList.remove('selected-row');
      row.setAttribute('aria-selected', 'false');
    }
  });
}

// --- Data Fetching & Rendering: User Portal ---
async function loadUserTickets() {
  if (!currentSession || currentSession.role !== 'user') return;
  try {
    userTickets = await window.api.getTickets(currentSession.userId);
    renderUserTickets();
  } catch (err) {
    console.error('Failed to load user tickets:', err);
  }
}

function renderUserTickets() {
  const query = (userSearchQuery.value || '').trim().toLowerCase();
  const statusFilter = userFilterStatus.value;

  const filtered = userTickets.filter(ticket => {
    const matchesSearch =
      !query ||
      (ticket.id && ticket.id.toLowerCase().includes(query)) ||
      (ticket.category && ticket.category.toLowerCase().includes(query)) ||
      (ticket.description && ticket.description.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  userTicketsTableBody.innerHTML = '';

  if (filtered.length === 0) {
    userEmptyState.classList.remove('hidden');
  } else {
    userEmptyState.classList.add('hidden');
    filtered.forEach(ticket => {
      const tr = document.createElement('tr');
      tr.className = 'clickable-row hover:bg-blue-50/50 transition-colors border-b border-slate-100';

      tr.innerHTML = `
        <td class="font-mono font-bold py-2.5 px-3">
          <button type="button" class="text-primary hover:underline p-0 bg-transparent border-0 font-bold font-mono cursor-pointer" aria-label="View ticket ${ticket.id} details">
            ${ticket.id}
          </button>
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap"><span class="badge badge-outline text-xs font-medium text-slate-700 bg-slate-50 border-slate-200 whitespace-nowrap">${escapeHtml(ticket.category)}</span></td>
        <td class="py-2.5 px-3 whitespace-nowrap">${getPriorityBadge(ticket.priority)}</td>
        <td class="py-2.5 px-3 max-w-xs truncate text-slate-800" title="Click to view full description">${escapeHtml(ticket.description)}</td>
        <td class="py-2.5 px-3 font-mono text-xs text-slate-600 whitespace-nowrap" title="${formatFullDateTime(ticket.createdAt)}">${formatRelativeTime(ticket.createdAt)}</td>
        <td class="py-2.5 px-3 text-center whitespace-nowrap">${getStatusBadge(ticket.status)}</td>
      `;

      tr.addEventListener('click', () => openTicketDetail(ticket));
      userTicketsTableBody.appendChild(tr);
    });
  }

  if (userTicketCountBadge) {
    userTicketCountBadge.textContent = userTickets.length;
  }
  announce(`User tickets updated: showing ${filtered.length} of ${userTickets.length} tickets.`);
}

// --- Data Fetching & Rendering: IT Support Staff Portal ---
async function loadAllTickets() {
  if (!currentSession || currentSession.role !== 'it_staff') return;
  try {
    allTickets = await window.api.getTickets(); // no userId passed -> returns all
    renderAllTickets();
    updateStaffStats(allTickets);
  } catch (err) {
    console.error('Failed to load all tickets:', err);
  }
}

function updateStaffStats(tickets) {
  statTotal.textContent = tickets.length;
  statOpen.textContent = tickets.filter(t => t.status === 'OPEN').length;
  statInProgress.textContent = tickets.filter(t => t.status === 'IN PROGRESS').length;
  statResolved.textContent = tickets.filter(t => t.status === 'RESOLVED').length;
}

function renderAllTickets() {
  const query = (staffSearchQuery.value || '').trim().toLowerCase();
  const statusFilter = staffFilterStatus.value;
  const categoryFilter = staffFilterCategory.value;

  const filtered = allTickets.filter(ticket => {
    const matchesSearch =
      !query ||
      (ticket.id && ticket.id.toLowerCase().includes(query)) ||
      (ticket.userName && ticket.userName.toLowerCase().includes(query)) ||
      (ticket.userId && ticket.userId.toLowerCase().includes(query)) ||
      (ticket.description && ticket.description.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || ticket.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  staffTicketsTableBody.innerHTML = '';

  if (filtered.length === 0) {
    staffEmptyState.classList.remove('hidden');
    inspectTicketInStaffPane(null);
  } else {
    staffEmptyState.classList.add('hidden');

    // Keep active selected ticket or default to the first in filtered list
    let ticketToSelect = filtered.find(t => t.id === selectedStaffTicketId);
    if (!ticketToSelect) {
      ticketToSelect = filtered[0];
    }

    filtered.forEach(ticket => {
      const tr = document.createElement('tr');
      tr.className = `clickable-row hover:bg-blue-50/50 transition-colors border-b border-slate-100 ${
        ticket.id === ticketToSelect.id ? 'selected-row' : ''
      }`;
      tr.setAttribute('data-ticket-id', ticket.id);

      const userTypeBadge = ticket.userType === 'Faculty' 
        ? '<span class="badge badge-warning badge-xs font-semibold">Faculty</span>'
        : '<span class="badge badge-info badge-xs font-semibold">Student</span>';

      tr.innerHTML = `
        <td class="font-mono font-bold py-2.5 px-3">
          <button type="button" class="text-primary hover:underline p-0 bg-transparent border-0 font-bold font-mono cursor-pointer" aria-label="Inspect ticket ${ticket.id}">
            ${ticket.id}
          </button>
        </td>
        <td class="py-2.5 px-3">
          <div class="font-semibold text-slate-900">${escapeHtml(ticket.userName)}</div>
          <div class="text-xs font-mono text-slate-600">${escapeHtml(ticket.userId || 'N/A')}</div>
        </td>
        <td class="py-2.5 px-3 whitespace-nowrap">${userTypeBadge}</td>
        <td class="py-2.5 px-3 whitespace-nowrap"><span class="badge badge-outline text-xs font-medium text-slate-700 bg-slate-50 border-slate-200 whitespace-nowrap">${escapeHtml(ticket.category)}</span></td>
        <td class="py-2.5 px-3 whitespace-nowrap">${getPriorityBadge(ticket.priority)}</td>
        <td class="py-2.5 px-3 font-mono text-xs text-slate-600 whitespace-nowrap" title="${formatFullDateTime(ticket.createdAt)}">${formatRelativeTime(ticket.createdAt)}</td>
        <td class="py-2.5 px-3 text-center whitespace-nowrap">${getStatusBadge(ticket.status)}</td>
      `;

      tr.addEventListener('click', () => {
        inspectTicketInStaffPane(ticket);
      });

      staffTicketsTableBody.appendChild(tr);
    });

    inspectTicketInStaffPane(ticketToSelect);
  }

  announce(`Staff queue updated: showing ${filtered.length} of ${allTickets.length} tickets.`);
  updateStaffStats(allTickets);
}

// IT Staff Status Update (Called from Inspector Pane or Modal)
window.updateStatus = async function (id, status, fromModal = false) {
  try {
    const paneStaffRemarks = document.getElementById('paneStaffRemarks');
    const remarks = paneStaffRemarks ? paneStaffRemarks.value.trim() : '';

    const updated = await window.api.updateTicketStatus({ id, status, remarks });
    const index = allTickets.findIndex(t => t.id === id);
    if (index !== -1) {
      allTickets[index] = updated;
      renderAllTickets();
    }
    // Update live inspector pane
    inspectTicketInStaffPane(updated);

    // Update modal if open
    if (fromModal && selectedDetailTicket && selectedDetailTicket.id === id) {
      selectedDetailTicket = updated;
      detailStatusBadge.innerHTML = getStatusBadge(updated.status);
      detailUpdatedAt.textContent = formatFullDateTime(updated.updatedAt);
      renderDetailActionButtons(updated);
    }
  } catch (err) {
    console.error('Error updating status:', err);
    showFormAlert('Failed to update ticket status: ' + err.message);
  }
};

// --- Form Listeners & Real-Time Inline Validation ---

// Clear validation errors and resolve user name on typing
authUserId.addEventListener('input', () => {
  authUserId.classList.remove('is-invalid');
  authUserId.removeAttribute('aria-invalid');
  authAlert.classList.add('hidden');
  updateResolvedUserDisplay();
});

[authStaffId, authStaffPassword].forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    authAlert.classList.add('hidden');
  });
});

[selectCategory, selectPriority, textareaDescription].forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    if (!createTicketForm.querySelector('.is-invalid')) {
      formAlert.classList.add('hidden');
    }
  });
  input.addEventListener('change', () => {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    if (!createTicketForm.querySelector('.is-invalid')) {
      formAlert.classList.add('hidden');
    }
  });
});

// 1. User Login with Validation Highlighting
userLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = authUserId.value.trim();

  authUserId.classList.remove('is-invalid');
  authUserId.removeAttribute('aria-invalid');

  if (!id) {
    authUserId.classList.add('is-invalid');
    authUserId.setAttribute('aria-invalid', 'true');
    showAuthAlert('Please enter your Student / Faculty ID.');
    authUserId.focus();
    return;
  }

  try {
    // ponytail: verifies credentials against accounts.json via IPC; upgrade to JWT/OAuth when enterprise SSO is active.
    const profile = await window.api.authUser({ id });
    showUserPortal(profile);
  } catch (err) {
    authUserId.classList.add('is-invalid');
    authUserId.setAttribute('aria-invalid', 'true');
    showAuthAlert(err.message || 'Unregistered ID');
    authUserId.focus();
  }
});

// 2. Staff Login
staffLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const staffId = authStaffId.value.trim();
  const password = authStaffPassword.value.trim();

  authStaffId.classList.remove('is-invalid');
  authStaffPassword.classList.remove('is-invalid');
  authStaffId.removeAttribute('aria-invalid');
  authStaffPassword.removeAttribute('aria-invalid');

  if (!staffId) {
    authStaffId.classList.add('is-invalid');
    authStaffId.setAttribute('aria-invalid', 'true');
    showAuthAlert('Please enter your Staff Personnel ID.');
    authStaffId.focus();
    return;
  }

  try {
    const profile = await window.api.authStaff({ staffId, password });
    showITStaffPortal(profile);
  } catch (err) {
    const isPassErr = err.message && err.message.toLowerCase().includes('password');
    const target = isPassErr ? authStaffPassword : authStaffId;
    target.classList.add('is-invalid');
    target.setAttribute('aria-invalid', 'true');
    target.focus();
    showAuthAlert(err.message || 'Unregistered ID');
  }
});

// 3. User Submit Ticket with Inline Validation & Async Double-Click Guard
createTicketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentSession || currentSession.role !== 'user') return;

  const category = selectCategory.value;
  const priority = selectPriority.value;
  const description = textareaDescription.value.trim();

  [selectCategory, selectPriority, textareaDescription].forEach(el => {
    if (el) {
      el.classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
    }
  });

  const invalidFields = [];
  if (!category) invalidFields.push(selectCategory);
  if (!description) invalidFields.push(textareaDescription);

  if (invalidFields.length > 0) {
    invalidFields.forEach(el => {
      el.classList.add('is-invalid');
      el.setAttribute('aria-invalid', 'true');
    });
    showFormAlert('Please complete all required fields highlighted in red.');
    invalidFields[0].focus();
    return;
  }

  const btnSubmit = document.getElementById('btnSubmitTicket');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Submitting Ticket...';

  try {
    const newTicket = await window.api.createTicket({
      userId: currentSession.userId,
      userType: currentSession.userType,
      userName: currentSession.userName,
      category,
      priority,
      description
    });

    userTickets.unshift(newTicket);
    renderUserTickets();

    // Show Confirmation Modal with focus trap
    modalTicketId.textContent = newTicket.id;
    modalUserName.textContent = `${newTicket.userName} (${newTicket.userId})`;
    modalCategory.textContent = newTicket.category;
    modalStatus.textContent = newTicket.status;
    showModal(confirmationModal);

    // Reset Form
    textareaDescription.value = '';
    selectCategory.value = '';
    selectPriority.value = 'Medium';
  } catch (err) {
    showFormAlert(err.message || 'Failed to submit ticket.');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Submit Support Ticket';
  }
});

// 4. Logout / Switch Role
btnSwitchRole.addEventListener('click', () => {
  showAuthView();
});

// 5. User Filters & Refresh
userSearchQuery.addEventListener('input', renderUserTickets);
userFilterStatus.addEventListener('change', renderUserTickets);
btnUserRefresh.addEventListener('click', loadUserTickets);

// 6. IT Staff Filters & Refresh
staffSearchQuery.addEventListener('input', renderAllTickets);
staffFilterStatus.addEventListener('change', renderAllTickets);
staffFilterCategory.addEventListener('change', renderAllTickets);
btnStaffRefresh.addEventListener('click', loadAllTickets);

// 7. Modals
btnCloseModal.addEventListener('click', () => {
  closeModal(confirmationModal);
  setUserPortalTab('history');
});

btnCloseTicketDetail.addEventListener('click', closeTicketDetail);
btnCloseTicketDetail2.addEventListener('click', closeTicketDetail);

// Close modals when clicking backdrop
document.querySelectorAll('.modal-overlay').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
});

// Global keyboard accessibility: Escape to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      closeModal(modal);
    });
  }
});

// Initialize on Login Screen
showAuthView();
