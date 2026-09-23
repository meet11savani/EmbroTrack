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

async function postJSON(url: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const text = await response.text();
  return JSON.parse(text) as Record<string, unknown>;
}

/**
 * Data backend — records, parties, qualities, workers, sync.
 * Uses the googleScriptUrl from settings.
 */
export const googleSheets = {
  async syncAll(
    url: string,
    payload: SyncPayload,
    signal?: AbortSignal
  ): Promise<SyncResponse> {
    if (!url) throw new Error('Google Apps Script URL is not configured');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ operation: 'sync', ...payload }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as SyncResponse;
    } catch {
      return { success: true };
    }
  },

  async pullAll(url: string, token: string, signal?: AbortSignal): Promise<SyncResponse> {
    if (!url) throw new Error('Google Apps Script URL is not configured');

    const response = await fetch(`${url}?operation=getAll&token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      signal,
    });

    if (!response.ok) throw new Error(`Pull failed: ${response.status}`);

    const text = await response.text();
    return JSON.parse(text) as SyncResponse;
  },

  async getUsers(url: string, token: string): Promise<{ success: boolean; users?: RemoteUser[]; error?: string }> {
    if (!url) throw new Error('Google Apps Script URL is not configured');
    const result = await postJSON(url, { operation: 'getUsers', token });
    return result as unknown as { success: boolean; users?: RemoteUser[]; error?: string };
  },
};

/**
 * Admin backend — login, user account management.
 * Uses the adminScriptUrl from settings.
 */
export const adminApi = {
  async login(url: string, username: string, password: string): Promise<LoginResponse> {
    if (!url) throw new Error('Admin script URL is not configured');
    const result = await postJSON(url, { operation: 'login', username, password });
    return result as unknown as LoginResponse;
  },

  async getUsers(url: string, token: string): Promise<{ success: boolean; users?: RemoteUser[]; error?: string }> {
    if (!url) throw new Error('Admin script URL is not configured');
    const result = await postJSON(url, { operation: 'getUsers', token });
    return result as unknown as { success: boolean; users?: RemoteUser[]; error?: string };
  },

  async createUser(url: string, token: string, payload: CreateUserPayload): Promise<{ success: boolean; error?: string }> {
    if (!url) throw new Error('Admin script URL is not configured');
    const result = await postJSON(url, { operation: 'createUser', token, ...payload });
    return result as unknown as { success: boolean; error?: string };
  },

  async deleteUser(url: string, token: string, username: string): Promise<{ success: boolean; error?: string }> {
    if (!url) throw new Error('Admin script URL is not configured');
    const result = await postJSON(url, { operation: 'deleteUser', token, username });
    return result as unknown as { success: boolean; error?: string };
  },

  async changePassword(url: string, token: string, username: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!url) throw new Error('Admin script URL is not configured');
    const result = await postJSON(url, { operation: 'changePassword', token, username, newPassword });
    return result as unknown as { success: boolean; error?: string };
  },
};
