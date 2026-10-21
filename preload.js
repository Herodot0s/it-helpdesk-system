const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  authUser: (credentials) => ipcRenderer.invoke('auth:user', credentials),
  authStaff: (credentials) => ipcRenderer.invoke('auth:staff', credentials),
  lookupUser: (id) => ipcRenderer.invoke('auth:lookup', id),
  getTickets: (userId) => ipcRenderer.invoke('tickets:get', userId),
  createTicket: (payload) => ipcRenderer.invoke('tickets:create', payload),
  updateTicketStatus: (payload) => ipcRenderer.invoke('tickets:update-status', payload)
});
