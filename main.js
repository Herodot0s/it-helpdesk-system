const electron = require('electron');

if (typeof electron === 'string') {
  console.error('\n[ERROR] App was launched in Node.js mode instead of Electron runtime.');
  console.error('Run via: npm start\n');
  process.exit(1);
}

const { app, BrowserWindow, ipcMain } = electron;

// Disable GPU hardware acceleration and sandboxing to prevent GPU crashes on Windows
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('in-process-gpu');

const path = require('path');
const fs = require('fs').promises;

const DATA_FILE = path.join(__dirname, 'tickets.json');
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 650,
    title: 'QCU (Quezon City University) IT Help Desk System',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile('index.html');
}

// Data access helpers
async function readTickets() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    console.error('Failed to read tickets.json:', err);
    return [];
  }
}

async function writeTickets(tickets) {
  await fs.writeFile(DATA_FILE, JSON.stringify(tickets, null, 2), 'utf-8');
}

function generateNextId(tickets) {
  const max = tickets.reduce((highest, t) => {
    if (!t || !t.id) return highest;
    const match = String(t.id).match(/^T(\d+)$/i);
    if (!match) return highest;
    const num = parseInt(match[1], 10);
    return isNaN(num) ? highest : Math.max(highest, num);
  }, 0);
  return `T${String(max + 1).padStart(3, '0')}`;
}

async function readAccounts() {
  try {
    const raw = await fs.readFile(ACCOUNTS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to read accounts.json:', err);
    return [];
  }
}

// IPC Handlers

// Account verification lookup
ipcMain.handle('auth:lookup', async (_event, id) => {
  const cleanId = String(id || '').trim();
  if (!cleanId) return null;
  const accounts = await readAccounts();
  return accounts.find(a => String(a.id).trim().toUpperCase() === cleanId.toUpperCase()) || null;
});

// Authentication: Student / Faculty User verified against accounts.json
ipcMain.handle('auth:user', async (_event, { id }) => {
  const cleanId = String(id || '').trim();
  if (!cleanId) throw new Error('Student / Faculty ID is required for access.');

  const accounts = await readAccounts();
  const account = accounts.find(a => String(a.id).trim().toUpperCase() === cleanId.toUpperCase());
  if (!account) {
    throw new Error('Unregistered ID');
  }

  return {
    role: 'user',
    userId: account.id,
    userName: account.name,
    userType: account.userType || account.role || 'Student'
  };
});

// Authentication: IT Support Personnel verified against accounts.json
ipcMain.handle('auth:staff', async (_event, { staffId, password }) => {
  const cleanStaffId = String(staffId || '').trim();
  const cleanPass = String(password || '').trim();

  if (!cleanStaffId) throw new Error('Staff Personnel ID is required.');

  const accounts = await readAccounts();
  const account = accounts.find(a => 
    String(a.id).trim().toUpperCase() === cleanStaffId.toUpperCase() &&
    (a.userType === 'IT Staff' || a.role === 'it_staff' || a.id.toLowerCase() === 'admin' || a.id.toUpperCase().startsWith('IT'))
  );

  if (!account) {
    throw new Error('Unregistered ID');
  }

  if (account.password && cleanPass !== account.password) {
    throw new Error('Incorrect password');
  }

  return {
    role: 'it_staff',
    staffId: account.id,
    name: account.name || 'IT Support Engineer'
  };
});

// Fetch tickets: If userId is provided, return ONLY their own tickets. Otherwise return all.
ipcMain.handle('tickets:get', async (_event, userId) => {
  const tickets = await readTickets();
  if (userId) {
    const cleanId = String(userId).trim().toLowerCase();
    return tickets.filter(t => String(t.userId || '').trim().toLowerCase() === cleanId);
  }
  return tickets;
});

// Create Ticket (Requires Student/Faculty ID)
ipcMain.handle('tickets:create', async (_event, payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid ticket payload.');
  }

  const userId = String(payload.userId || '').trim();
  const userType = String(payload.userType || 'Student').trim();
  const userName = String(payload.userName || '').trim();
  const category = String(payload.category || '').trim();
  const description = String(payload.description || '').trim();
  const priority = String(payload.priority || '').trim();
  const campus = String(payload.campus || 'San Bartolome (Main)').trim();
  const location = String(payload.location || 'General Campus').trim();

  if (!userId) throw new Error('Student or Faculty ID is required.');
  if (!userName) throw new Error('User Name is required.');
  if (!category) throw new Error('Category is required.');
  if (!description) throw new Error('Problem description is required.');
  if (!priority) throw new Error('Priority is required.');

  const tickets = await readTickets();
  const newTicket = {
    id: generateNextId(tickets),
    userId,
    userType,
    userName,
    category,
    campus,
    location,
    description,
    priority,
    status: 'OPEN',
    remarks: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tickets.push(newTicket);
  await writeTickets(tickets);

  return newTicket;
});

ipcMain.handle('tickets:update-status', async (_event, { id, status, remarks }) => {
  if (!id || !status) {
    throw new Error('Ticket ID and status are required.');
  }

  const validStatuses = ['OPEN', 'IN PROGRESS', 'RESOLVED'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  const tickets = await readTickets();
  const index = tickets.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error(`Ticket ${id} not found.`);
  }

  tickets[index].status = status;
  if (remarks !== undefined) {
    tickets[index].remarks = String(remarks).trim();
  }
  tickets[index].updatedAt = new Date().toISOString();

  await writeTickets(tickets);

  return tickets[index];
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
