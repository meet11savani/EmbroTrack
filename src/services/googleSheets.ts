import type { EmbroideryRecord, Party, Quality, AppSettings } from '@/types';
import type { UserRole } from '@/context/AuthContext';
import type { GoogleScriptResult } from '@/electron';

interface SyncPayload {
  records: EmbroideryRecord[];
  parties: Party[];
  qualities: Quality[];
  settings: AppSettings;
}

interface SyncResponse {
  success: boolean;
  records?: EmbroideryRecord[];
  parties?: Party[];
  qualities?: Quality[];
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: { username: string; role: UserRole; name: string };
  error?: string;
}

export interface RemoteUser {
  username: string;
  role: UserRole;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  companyName: string;
  notes: string;
  active: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  companyName: string;
  notes: string;
  active: boolean;
}

function hasElectronApi(): boolean {
  return typeof window !== 'undefined' && !!window.api && typeof window.api.googleScriptRequest === 'function';
}

// ─── Core HTTP helper ──────────────────────────────────────────
// Uses Electron's main-process IPC when available (window.api) to avoid
// Apps Script's CORS-less redirect problem. Falls back to plain fetch
// for vite dev in a browser.
async function callScript(
  url: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let result: GoogleScriptResult;

  if (hasElectronApi()) {
    result = await window.api.googleScriptRequest({ url, method, body });
  } else {
    const options: RequestInit = { method, redirect: 'follow' };
    if (method === 'POST' && body) {
      options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const text = await response.text();
    result = { ok: response.ok, status: response.status, text, error: null };
  }

  if (result.error) {
    throw new Error(result.error);
  }
  if (!result.ok) {
    throw new Error(`Request failed: ${result.status}`);
  }

  try {
    return JSON.parse(result.text) as Record<string, unknown>;
  } catch {
    return { success: true };
  }
}

// ─── Data backend ──────────────────────────────────────────────
export const googleSheets = {
  async syncAll(
    url: string,
    payload: SyncPayload,
    signal?: AbortSignal
  ): Promise<SyncResponse> {
    if (!url) throw new Error('Google Apps Script URL is not configured');

    if (!hasElectronApi()) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ operation: 'sync', ...payload }),
        redirect: 'follow',
        signal,
      });
      if (!response.ok) throw new Error(`Sync failed: ${response.status}`);
      const text = await response.text();
      try { return JSON.parse(text) as SyncResponse; } catch { return { success: true }; }
    }

    const result = await callScript(url, 'POST', { operation: 'sync', ...payload });
    return result as unknown as SyncResponse;
  },

  async pullAll(url: string, token: string, signal?: AbortSignal): Promise<SyncResponse> {
    if (!url) throw new Error('Google Apps Script URL is not configured');

    const fullUrl = `${url}?operation=getAll&token=${encodeURIComponent(token)}`;

    if (hasElectronApi()) {
      const result = await callScript(fullUrl, 'GET');
      return result as unknown as SyncResponse;
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      signal,
    });
    if (!response.ok) throw new Error(`Pull failed: ${response.status}`);
    const text = await response.text();
    return JSON.parse(text) as SyncResponse;
  },

  async getUsers(url: string, token: string): Promise<{ success: boolean; users?: RemoteUser[]; error?: string }> {
    if (!url) throw new Error('Google Apps Script URL is not configured');
    const result = await callScript(url, 'POST', { operation: 'getUsers', token });
    return result as unknown as { success: boolean; users?: RemoteUser[]; error?: string };
  },
};

// ─── Admin backend ─────────────────────────────────────────────
export const adminApi = {
  async login(url: string, username: string, password: string): Promise<LoginResponse> {
    if (!url) throw new Error('Admin script URL is not configured');
    const result = await callScript(url, 'POST', { operation: 'login', username, password });
    return result as unknown as LoginResponse;
  },

  async getUsers(url: string, token: string): Promise<{ success: boolean; users?: RemoteUser[]; error?: string }> {
    if (!url) throw new Error('Admin script URL is not configured');
    const result = await callScript(url, 'POST', { operation: 'getUsers', token });
    return result as unknown as { success: boolean; users?: RemoteUser[]; error?: string };
  },

  async createUser(url: string, token: string, payload: CreateUserPayload): Promise<{ success: boolean; error?: string }> {
    if (!url) throw new Error('Admin script URL is not configured');
    const result = await callScript(url, 'POST', { operation: 'createUser', token, ...payload });
    return result as unknown as { success: boolean; error?: string };
  },

  async deleteUser(url: string, token: string, username: string): Promise<{ success: boolean; error?: string }> {
    if (!url) throw new Error('Admin script URL is not configured');
    const result = await callScript(url, 'POST', { operation: 'deleteUser', token, username });
    return result as unknown as { success: boolean; error?: string };
  },

  async changePassword(url: string, token: string, username: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!url) throw new Error('Admin script URL is not configured');
    const result = await callScript(url, 'POST', { operation: 'changePassword', token, username, newPassword });
    return result as unknown as { success: boolean; error?: string };
  },
};
