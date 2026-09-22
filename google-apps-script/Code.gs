/**
 * EmbroTrack — Google Apps Script Backend
 * -----------------------------------------------------------
 * 1. Open Google Sheets → Extensions → Apps Script
 * 2. Paste this entire file into Code.gs
 * 3. Set ADMIN credentials in the CONFIG object below
 * 4. Deploy as a Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the Web App URL into EmbroTrack Settings → Google Script URL
 */

const CONFIG = {
  // ===== ADMIN CREDENTIALS =====
  // Change these before deploying!
  ADMIN_USERNAME: 'adminmeetsavani',  
  ADMIN_PASSWORD: 'admin@meet2004@',
  // =============================

  SHEET_RECORDS: 'Records',
  SHEET_PARTIES: 'Parties',
  SHEET_QUALITIES: 'Qualities',
  SHEET_WORKERS: 'Workers',
  SHEET_WORKER_TXNS: 'WorkerTransactions',
  SHEET_USERS: 'Users',
};

// ─── Column definitions ──────────────────────────────────────
const RECORD_COLS = [
  'id', 'challanNumber', 'partyId', 'partyName', 'date', 'qualityId',
  'qualityName', 'designNumber', 'quantity', 'rate', 'amount',
  'creditDate', 'debitDate', 'notes', 'status', 'createdAt', 'updatedAt', 'deleted'
];

const PARTY_COLS = [
  'id', 'name', 'phone', 'address', 'notes', 'createdAt', 'updatedAt', 'deleted'
];

const QUALITY_COLS = [
  'id', 'name', 'designNumber', 'defaultRate', 'unit', 'notes', 'createdAt', 'updatedAt', 'deleted'
];

const WORKER_COLS = [
  'id', 'name', 'phone', 'role', 'notes', 'createdAt', 'updatedAt', 'deleted'
];

const WORKER_TXN_COLS = [
  'id', 'workerId', 'workerName', 'type', 'date', 'amount', 'description', 'createdAt', 'updatedAt', 'deleted'
];

const USER_COLS = ['username', 'password', 'role', 'name', 'phone', 'email', 'createdAt'];

// ─── Entry point ─────────────────────────────────────────────
function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    const params = method === 'GET'
      ? (e.parameter || {})
      : (e.postData ? JSON.parse(e.postData.contents) : {});

    const operation = params.operation || 'getAll';
    const authToken = params.token || params.authToken || '';

    // Authenticate every request except 'login'
    if (operation !== 'login') {
      if (!authToken) {
        return jsonOut({ success: false, error: 'Authentication required' });
      }
      const session = verifyToken(authToken);
      if (!session) {
        return jsonOut({ success: false, error: 'Invalid or expired session' });
      }
      params._user = session;
    }

    switch (operation) {
      case 'login':       return handleLogin(params);
      case 'getAll':      return handleGetAll(params);
      case 'sync':        return handleSync(params);
      case 'create':      return handleCreate(params);
      case 'update':      return handleUpdate(params);
      case 'delete':      return handleDelete(params);
      case 'getUsers':    return handleGetUsers(params);
      case 'createUser':  return handleCreateUser(params);
      case 'deleteUser':  return handleDeleteUser(params);
      default:            return jsonOut({ success: false, error: 'Unknown operation: ' + operation });
    }
  } catch (err) {
    return jsonOut({ success: false, error: String(err) });
  }
}

// ─── Authentication ───────────────────────────────────────────
function handleLogin(params) {
  const username = String(params.username || '').trim();
  const password = String(params.password || '');

  if (!username || !password) {
    return jsonOut({ success: false, error: 'Username and password are required' });
  }

  // Check admin credentials first
  if (username === CONFIG.ADMIN_USERNAME && password === CONFIG.ADMIN_PASSWORD) {
    const token = createToken(username, 'admin');
    return jsonOut({
      success: true,
      token: token,
      user: { username: username, role: 'admin', name: 'Administrator' }
    });
  }

  // Check user sheet
  const sheet = getSheet(CONFIG.SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === username && String(data[i][1]) === password) {
      const role = String(data[i][2] || 'user');
      const name = String(data[i][3] || username);
      const token = createToken(username, role);
      return jsonOut({
        success: true,
        token: token,
        user: { username: username, role: role, name: name }
      });
    }
  }

  return jsonOut({ success: false, error: 'Invalid username or password' });
}

function createToken(username, role) {
  const raw = username + '|' + role + '|' + new Date().getTime();
  return Utilities.base64Encode(raw);
}

function verifyToken(token) {
  try {
    const decoded = Utilities.base64Decode(token);
    const parts = Utilities.newBlob(decoded).getDataAsString().split('|');
    if (parts.length < 3) return null;
    const username = parts[0];
    const role = parts[1];
    const timestamp = parseInt(parts[2], 10);
    // Tokens expire after 24 hours
    const age = new Date().getTime() - timestamp;
    if (age > 24 * 60 * 60 * 1000) return null;
    return { username: username, role: role };
  } catch (e) {
    return null;
  }
}

function requireAdmin(params) {
  if (!params._user || params._user.role !== 'admin') {
    return false;
  }
  return true;
}

// ─── User management (admin only) ─────────────────────────────
function handleGetUsers(params) {
  if (!requireAdmin(params)) {
    return jsonOut({ success: false, error: 'Admin access required' });
  }
  const sheet = getSheet(CONFIG.SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    users.push({
      username: String(data[i][0]),
      role: String(data[i][2] || 'user'),
      name: String(data[i][3] || ''),
      phone: String(data[i][4] || ''),
      email: String(data[i][5] || ''),
      createdAt: String(data[i][6] || '')
    });
  }
  return jsonOut({ success: true, users: users });
}

function handleCreateUser(params) {
  if (!requireAdmin(params)) {
    return jsonOut({ success: false, error: 'Admin access required' });
  }
  const username = String(params.username || '').trim();
  const password = String(params.password || '');
  const role = String(params.role || 'user');
  const name = String(params.name || username);
  const phone = String(params.phone || '');
  const email = String(params.email || '');

  if (!username || !password) {
    return jsonOut({ success: false, error: 'Username and password are required' });
  }

  const sheet = getSheet(CONFIG.SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === username) {
      return jsonOut({ success: false, error: 'Username already exists' });
    }
  }

  sheet.appendRow([username, password, role, name, phone, email, new Date().toISOString()]);
  return jsonOut({ success: true, user: { username: username, role: role, name: name, phone: phone, email: email } });
}

function handleDeleteUser(params) {
  if (!requireAdmin(params)) {
    return jsonOut({ success: false, error: 'Admin access required' });
  }
  const username = String(params.username || '').trim();
  if (!username) {
    return jsonOut({ success: false, error: 'Username is required' });
  }

  const sheet = getSheet(CONFIG.SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === username) {
      sheet.deleteRow(i + 1);
      return jsonOut({ success: true });
    }
  }
  return jsonOut({ success: false, error: 'User not found' });
}

// ─── Data: getAll ────────────────────────────────────────────
function handleGetAll(params) {
  return jsonOut({
    success: true,
    records: readSheet(CONFIG.SHEET_RECORDS, RECORD_COLS),
    parties: readSheet(CONFIG.SHEET_PARTIES, PARTY_COLS),
    qualities: readSheet(CONFIG.SHEET_QUALITIES, QUALITY_COLS),
    workers: readSheet(CONFIG.SHEET_WORKERS, WORKER_COLS),
    workerTransactions: readSheet(CONFIG.SHEET_WORKER_TXNS, WORKER_TXN_COLS),
  users: requireAdmin(params) ? readUsers() : []
  });
}

// ─── Data: sync (full push) ───────────────────────────────────
function handleSync(params) {
  if (params.records) writeSheet(CONFIG.SHEET_RECORDS, RECORD_COLS, params.records);
  if (params.parties) writeSheet(CONFIG.SHEET_PARTIES, PARTY_COLS, params.parties);
  if (params.qualities) writeSheet(CONFIG.SHEET_QUALITIES, QUALITY_COLS, params.qualities);
  if (params.workers) writeSheet(CONFIG.SHEET_WORKERS, WORKER_COLS, params.workers);
  if (params.workerTransactions) writeSheet(CONFIG.SHEET_WORKER_TXNS, WORKER_TXN_COLS, params.workerTransactions);

  return jsonOut({ success: true });
}

// ─── Data: create / update / delete ───────────────────────────
function handleCreate(params) {
  return handleSingleWrite(params, 'create');
}

function handleUpdate(params) {
  return handleSingleWrite(params, 'update');
}

function handleSingleWrite(params, operation) {
  const entityType = String(params.entityType || '');
  const data = params.data || {};
  const id = String(data.id || params.entityId || '');

  if (!id) return jsonOut({ success: false, error: 'Entity ID is required' });

  let sheetName, cols;
  switch (entityType) {
    case 'record':             sheetName = CONFIG.SHEET_RECORDS;    cols = RECORD_COLS; break;
    case 'party':              sheetName = CONFIG.SHEET_PARTIES;   cols = PARTY_COLS; break;
    case 'quality':            sheetName = CONFIG.SHEET_QUALITIES; cols = QUALITY_COLS; break;
    case 'worker':             sheetName = CONFIG.SHEET_WORKERS;  cols = WORKER_COLS; break;
    case 'worker_transaction': sheetName = CONFIG.SHEET_WORKER_TXNS; cols = WORKER_TXN_COLS; break;
    default: return jsonOut({ success: false, error: 'Unknown entity type: ' + entityType });
  }

  const sheet = getSheet(sheetName);
  const dataRange = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]) === id) { rowIndex = i + 1; break; }
  }

  const rowValues = cols.map(function(col) {
    var val = data[col] !== undefined ? data[col] : '';
    if (col === 'deleted') val = val ? 'true' : 'false';
    return val;
  });

  if (rowIndex === -1) {
    sheet.appendRow(rowValues);
  } else {
    sheet.getRange(rowIndex, 1, 1, cols.length).setValues([rowValues]);
  }

  return jsonOut({ success: true });
}

function handleDelete(params) {
  const entityType = String(params.entityType || '');
  const id = String(params.entityId || params.id || '');

  if (!id) return jsonOut({ success: false, error: 'Entity ID is required' });

  let sheetName, cols;
  switch (entityType) {
    case 'record':             sheetName = CONFIG.SHEET_RECORDS;    cols = RECORD_COLS; break;
    case 'party':              sheetName = CONFIG.SHEET_PARTIES;   cols = PARTY_COLS; break;
    case 'quality':            sheetName = CONFIG.SHEET_QUALITIES; cols = QUALITY_COLS; break;
    case 'worker':             sheetName = CONFIG.SHEET_WORKERS;  cols = WORKER_COLS; break;
    case 'worker_transaction': sheetName = CONFIG.SHEET_WORKER_TXNS; cols = WORKER_TXN_COLS; break;
    default: return jsonOut({ success: false, error: 'Unknown entity type: ' + entityType });
  }

  const sheet = getSheet(sheetName);
  const dataRange = sheet.getDataRange().getValues();
  const deletedColIndex = cols.indexOf('deleted');

  for (let i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]) === id) {
      sheet.getRange(i + 1, deletedColIndex + 1).setValue('true');
      return jsonOut({ success: true });
    }
  }

  return jsonOut({ success: false, error: 'Record not found' });
}

// ─── Sheet helpers ────────────────────────────────────────────
function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function ensureHeaders(sheet, cols) {
  var range = sheet.getRange(1, 1, 1, cols.length);
  if (range.getValues()[0][0] !== cols[0]) {
    range.setValues([cols]);
  }
}

function readSheet(name, cols) {
  var sheet = getSheet(name);
  ensureHeaders(sheet, cols);
  var data = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    var obj = {};
    for (var j = 0; j < cols.length; j++) {
      var val = data[i][j];
      if (cols[j] === 'deleted') {
        obj[cols[j]] = (val === 'true' || val === true);
      } else if (typeof val === 'number') {
        obj[cols[j]] = val;
      } else {
        obj[cols[j]] = val !== '' ? String(val) : '';
      }
    }
    result.push(obj);
  }
  return result;
}

function writeSheet(name, cols, rows) {
  var sheet = getSheet(name);
  ensureHeaders(sheet, cols);
  sheet.clear();
  ensureHeaders(sheet, cols);

  if (!rows || rows.length === 0) return;

  var values = rows.map(function(row) {
    return cols.map(function(col) {
      var v = row[col] !== undefined ? row[col] : '';
      if (col === 'deleted') v = v ? 'true' : 'false';
      return v;
    });
  });

  sheet.getRange(2, 1, values.length, cols.length).setValues(values);
}

function readUsers() {
  var sheet = getSheet(CONFIG.SHEET_USERS);
  ensureHeaders(sheet, USER_COLS);
  var data = sheet.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    users.push({
      username: String(data[i][0]),
      role: String(data[i][2] || 'user'),
      name: String(data[i][3] || ''),
      phone: String(data[i][4] || ''),
      email: String(data[i][5] || ''),
      createdAt: String(data[i][6] || '')
    });
  }
  return users;
}

// ─── Setup: run once to create sheets ────────────────────────
function setupSheets() {
  getSheet(CONFIG.SHEET_RECORDS);
  getSheet(CONFIG.SHEET_PARTIES);
  getSheet(CONFIG.SHEET_QUALITIES);
  getSheet(CONFIG.SHEET_WORKERS);
  getSheet(CONFIG.SHEET_WORKER_TXNS);
  getSheet(CONFIG.SHEET_USERS);
  SpreadsheetApp.getActiveSpreadsheet().toast('All sheets created successfully!');
}

// ─── Utility ─────────────────────────────────────────────────
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
