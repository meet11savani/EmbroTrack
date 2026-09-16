const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  name: 'embroidery-data',
  defaults: {
    orders: [],
  },
});

const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    title: 'Embroidery Record Management',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---- IPC: Orders (electron-store persistence) ----

ipcMain.handle('getOrders', () => {
  return store.get('orders', []);
});

ipcMain.handle('addOrder', (_event, order) => {
  const orders = store.get('orders', []);
  const newOrder = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
    ...order,
  };
  orders.push(newOrder);
  store.set('orders', orders);
  return newOrder;
});

ipcMain.handle('updateOrder', (_event, { id, data }) => {
  const orders = store.get('orders', []);
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) {
    return { error: 'Order not found' };
  }
  orders[idx] = { ...orders[idx], ...data, updatedAt: new Date().toISOString() };
  store.set('orders', orders);
  return orders[idx];
});

ipcMain.handle('deleteOrder', (_event, id) => {
  const orders = store.get('orders', []);
  const filtered = orders.filter((o) => o.id !== id);
  store.set('orders', filtered);
  return { success: true, id };
});

// ---- App lifecycle ----

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
