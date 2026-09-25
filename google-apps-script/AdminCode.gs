/**
 * EmbroTrack — Admin Backend (Google Apps Script)
 * -----------------------------------------------------------
 * Deploy this as a SEPARATE Web App from the main Code.gs.
 *
 * 1. Create a new Google Sheet (or use a separate tab in the same spreadsheet)
 * 2. Extensions → Apps Script → paste this file
 * 3. Run setupInitialAdmin() once to create the first admin account
 * 4. Deploy as a Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the Web App URL into EmbroTrack Settings → Admin Script URL
 *
 * This backend handles:
 *   - Admin authentication (login)
 *   - User account management (create, list, delete, change password)
 *
 * Admin accounts are stored in the "Admins" sheet.
 * User accounts are stored in the "Users" sheet.
 *
 * KNOWN LIMITATION: passwords are stored in plaintext in the sheet.
 * This is sufficient for an internal tool with a small number of users,
 * but if stronger security is needed, implement SHA-256 + salt hashing
 * via Utilities.computeDigest(password + salt) and compare digests
 * instead of raw strings. The login handler already has the hook point.
 */

const ADMIN_CONFIG = {
  SHEET_ADMINS: "Admins",
  SHEET_USERS: "Users",
};

const ADMIN_COLS = [
  "username",
  "password",
  "name",
  "phone",
  "email",
  "createdAt",
];
const USER_COLS = [
  "username",
  "password",
  "role",
  "name",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "pincode",
  "gstNumber",
  "companyName",
  "notes",
  "active",
  "createdAt",
];

// ─── Entry point ─────────────────────────────────────────────
function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  try {
    const params =
      method === "GET"
        ? e.parameter || {}
        : e.postData
          ? JSON.parse(e.postData.contents)
          : {};

    const operation = params.operation || "";
    const authToken = params.token || params.authToken || "";

    // Authenticate every request except 'login'
    if (operation !== "login") {
      if (!authToken) {
        return jsonOut({ success: false, error: "Authentication required" });
      }
      const session = verifyToken(authToken);
      if (!session) {
        return jsonOut({ success: false, error: "Invalid or expired session" });
      }
      if (session.role !== "admin") {
        return jsonOut({ success: false, error: "Admin access required" });
      }
      params._user = session;
    }

    switch (operation) {
      case "login":
        return handleLogin(params);
      case "getUsers":
        return handleGetUsers(params);
      case "createUser":
        return handleCreateUser(params);
      case "deleteUser":
        return handleDeleteUser(params);
      case "changePassword":
        return handleChangePassword(params);
      default:
        return jsonOut({
          success: false,
          error: "Unknown operation: " + operation,
        });
    }
  } catch (err) {
    return jsonOut({ success: false, error: String(err) });
  }
}

// ─── Authentication ───────────────────────────────────────────
function handleLogin(params) {
  const username = String(params.username || "").trim();
  const password = String(params.password || "");

  if (!username || !password) {
    return jsonOut({
      success: false,
      error: "Username and password are required",
    });
  }

  // Check Admins sheet
  const sheet = getSheet(ADMIN_CONFIG.SHEET_ADMINS);
  ensureHeaders(sheet, ADMIN_COLS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (
      String(data[i][0]).trim() === username &&
      String(data[i][1]) === password
    ) {
      const name = String(data[i][2] || username);
      const token = createToken(username, "admin");
      return jsonOut({
        success: true,
        token: token,
        user: { username: username, role: "admin", name: name },
      });
    }
  }

  // Check Users sheet (non-admin logins)
  const userSheet = getSheet(ADMIN_CONFIG.SHEET_USERS);
  ensureHeaders(userSheet, USER_COLS);
  const userData = userSheet.getDataRange().getValues();
  for (let i = 1; i < userData.length; i++) {
    if (
      String(userData[i][0]).trim() === username &&
      String(userData[i][1]) === password
    ) {
      const role = String(userData[i][2] || "user");
      const name = String(userData[i][3] || username);
      const token = createToken(username, role);
      return jsonOut({
        success: true,
        token: token,
        user: { username: username, role: role, name: name },
      });
    }
  }

  return jsonOut({ success: false, error: "Invalid username or password" });
}

function createToken(username, role) {
  const raw = username + "|" + role + "|" + new Date().getTime();
  return Utilities.base64Encode(raw);
}

function verifyToken(token) {
  try {
    const decoded = Utilities.base64Decode(token);
    const parts = Utilities.newBlob(decoded).getDataAsString().split("|");
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

// ─── User management (admin only) ─────────────────────────────
function handleGetUsers(params) {
  const sheet = getSheet(ADMIN_CONFIG.SHEET_USERS);
  ensureHeaders(sheet, USER_COLS);
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    users.push({
      username: String(data[i][0]),
      role: String(data[i][2] || "user"),
      name: String(data[i][3] || ""),
      phone: String(data[i][4] || ""),
      email: String(data[i][5] || ""),
      address: String(data[i][6] || ""),
      city: String(data[i][7] || ""),
      state: String(data[i][8] || ""),
      pincode: String(data[i][9] || ""),
      gstNumber: String(data[i][10] || ""),
      companyName: String(data[i][11] || ""),
      notes: String(data[i][12] || ""),
      active: String(data[i][13]).toLowerCase() !== "false",
      createdAt: String(data[i][14] || ""),
    });
  }
  return jsonOut({ success: true, users: users });
}

function handleCreateUser(params) {
  const username = String(params.username || "").trim();
  const password = String(params.password || "");
  const role = String(params.role || "user");
  const name = String(params.name || username);
  const phone = String(params.phone || "");
  const email = String(params.email || "");
  const address = String(params.address || "");
  const city = String(params.city || "");
  const state = String(params.state || "");
  const pincode = String(params.pincode || "");
  const gstNumber = String(params.gstNumber || "");
  const companyName = String(params.companyName || "");
  const notes = String(params.notes || "");
  const active = params.active !== false;

  if (!username || !password) {
    return jsonOut({
      success: false,
      error: "Username and password are required",
    });
  }

  const sheet = getSheet(ADMIN_CONFIG.SHEET_USERS);
  ensureHeaders(sheet, USER_COLS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === username) {
      return jsonOut({ success: false, error: "Username already exists" });
    }
  }

  sheet.appendRow([
    username,
    password,
    role,
    name,
    phone,
    email,
    address,
    city,
    state,
    pincode,
    gstNumber,
    companyName,
    notes,
    active ? "true" : "false",
    new Date().toISOString(),
  ]);
  return jsonOut({
    success: true,
    user: {
      username: username,
      role: role,
      name: name,
      phone: phone,
      email: email,
    },
  });
}

function handleDeleteUser(params) {
  const username = String(params.username || "").trim();
  if (!username) {
    return jsonOut({ success: false, error: "Username is required" });
  }

  // Admin-only: the dispatcher already checks role, but defense in depth
  if (!params._user || params._user.role !== "admin") {
    return jsonOut({ success: false, error: "Admin access required" });
  }

  const sheet = getSheet(ADMIN_CONFIG.SHEET_USERS);
  ensureHeaders(sheet, USER_COLS);
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === username) {
      sheet.deleteRow(i + 1);
      return jsonOut({ success: true });
    }
  }
  return jsonOut({ success: false, error: "User not found" });
}

function handleChangePassword(params) {
  const username = String(params.username || "").trim();
  const newPassword = String(params.newPassword || "");

  if (!username || !newPassword) {
    return jsonOut({
      success: false,
      error: "Username and new password are required",
    });
  }

  // Check Admins sheet first
  var sheet = getSheet(ADMIN_CONFIG.SHEET_ADMINS);
  ensureHeaders(sheet, ADMIN_COLS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === username) {
      sheet.getRange(i + 1, 2).setValue(newPassword);
      return jsonOut({ success: true });
    }
  }

  // Check Users sheet
  sheet = getSheet(ADMIN_CONFIG.SHEET_USERS);
  ensureHeaders(sheet, USER_COLS);
  data = sheet.getDataRange().getValues();
  for (var j = 1; j < data.length; j++) {
    if (String(data[j][0]).trim() === username) {
      sheet.getRange(j + 1, 2).setValue(newPassword);
      return jsonOut({ success: true });
    }
  }

  return jsonOut({ success: false, error: "User not found" });
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

// ─── Setup: run once to create sheets ────────────────────────
function setupSheets() {
  getSheet(ADMIN_CONFIG.SHEET_ADMINS);
  getSheet(ADMIN_CONFIG.SHEET_USERS);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "All sheets created successfully!",
  );
}

// ─── Setup: run once to create the initial admin account ─────
// Change the username and password before running, then run this function.
function setupInitialAdmin() {
  var adminUsername = "adminmeetsavani";
  var adminPassword = "admin@meet2004@";

  var sheet = getSheet(ADMIN_CONFIG.SHEET_ADMINS);
  ensureHeaders(sheet, ADMIN_COLS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === adminUsername) {
      SpreadsheetApp.getActiveSpreadsheet().toast("Admin user already exists.");
      return;
    }
  }
  sheet.appendRow([
    adminUsername,
    adminPassword,
    "Administrator",
    "",
    "",
    new Date().toISOString(),
  ]);
  SpreadsheetApp.getActiveSpreadsheet().toast("Initial admin account created.");
}

// ─── Utility ─────────────────────────────────────────────────
function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
