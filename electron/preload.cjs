const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getOrders: () => ipcRenderer.invoke('getOrders'),
  addOrder: (data) => ipcRenderer.invoke('addOrder', data),
  updateOrder: (id, data) => ipcRenderer.invoke('updateOrder', { id, data }),
  deleteOrder: (id) => ipcRenderer.invoke('deleteOrder', id),
  googleScriptRequest: (opts) => ipcRenderer.invoke('googleScriptRequest', opts),
});
