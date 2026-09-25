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
    title: 'EmbroTrack',
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

// ---- IPC: Google Apps Script HTTP requests ----
// Apps Script Web Apps respond via a 302 redirect that often lacks CORS headers,
// making renderer-side fetch() fail with "Failed to fetch" even when the request
// is correct. Routing through Node's fetch (redirect: 'follow') avoids this.
ipcMain.handle('googleScriptRequest', async (_event, { url, method, body }) => {
  try {
    const options = {
      method: method || 'GET',
      redirect: 'follow',
      headers: {},
    };

    if (method === 'POST' && body) {
      options.headers['Content-Type'] = 'text/plain;charset=utf-8';
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();
    return { ok: response.ok, status: response.status, text, error: null };
  } catch (err) {
    return { ok: false, status: 0, text: '', error: err instanceof Error ? err.message : String(err) };
  }
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
