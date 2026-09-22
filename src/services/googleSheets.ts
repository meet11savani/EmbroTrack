import type { EmbroideryRecord, Party, Quality, AppSettings } from '@/types';
import type { UserRole } from '@/context/AuthContext';

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
  createdAt: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  email: string;
}

/**
 * Calls the Google Apps Script Web App.
 *
 * Apps Script Web Apps respond via a redirect to a script.googleusercontent.com
 * URL that frequently lacks the CORS headers a browser fetch() expects, which
 * makes calls fail with "TypeError: Failed to fetch" from the renderer —
 * even when the URL, deployment, and network are all fine.
 *
 * When running inside Electron, this routes the request through the main
 * process (plain Node, via IPC) instead, where CORS doesn't apply at all.
 * Falls back to a normal browser fetch when window.api isn't available
 * (e.g. running the app as a plain web page during `vite dev`).
 */
async function callScript(
  url: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (!url) throw new Error('Google Apps Script URL is not configured');

  if (typeof window !== 'undefined' && window.api?.googleScriptRequest) {
    const result = await window.api.googleScriptRequest({ url, method, body });
    if (result.error) throw new Error(result.error);
    if (!result.ok) throw new Error(`Request failed: ${result.status}`);
    try {
      return JSON.parse(result.text) as Record<string, unknown>;
    } catch {
      return { success: true };
    }
  }

  const response =
    method === 'GET'
      ? await fetch(url)
      : await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(body),
        });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { success: true };
  }
}

export const googleSheets = {
  async syncAll(url: string, payload: SyncPayload): Promise<SyncResponse> {
    const result = await callScript(url, 'POST', { operation: 'sync', ...payload });
    return result as unknown as SyncResponse;
  },

  async pullAll(url: string): Promise<SyncResponse> {
    const result = await callScript(`${url}?operation=getAll`, 'GET');
    return result as unknown as SyncResponse;
  },

  async login(url: string, username: string, password: string): Promise<LoginResponse> {
    const result = await callScript(url, 'POST', { operation: 'login', username, password });
    return result as unknown as LoginResponse;
  },

  async getUsers(url: string, token: string): Promise<{ success: boolean; users?: RemoteUser[]; error?: string }> {
    const result = await callScript(url, 'POST', { operation: 'getUsers', token });
    return result as unknown as { success: boolean; users?: RemoteUser[]; error?: string };
  },

  async createUser(url: string, token: string, payload: CreateUserPayload): Promise<{ success: boolean; error?: string }> {
    const result = await callScript(url, 'POST', { operation: 'createUser', token, ...payload });
    return result as unknown as { success: boolean; error?: string };
  },

  async deleteUser(url: string, token: string, username: string): Promise<{ success: boolean; error?: string }> {
    const result = await callScript(url, 'POST', { operation: 'deleteUser', token, username });
    return result as unknown as { success: boolean; error?: string };
  },
};