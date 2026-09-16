import type { EmbroideryRecord, Party, Quality, AppSettings } from '@/types';

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

/**
 * Calls the Google Apps Script Web App.
 * Uses no-cors fetch with text/plain to avoid preflight — response is opaque,
 * so this is a best-effort fire-and-forget push. Full sync uses a normal POST
 * with the Apps Script JSON response.
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

  async pullAll(url: string, signal?: AbortSignal): Promise<SyncResponse> {
    if (!url) throw new Error('Google Apps Script URL is not configured');

    const response = await fetch(`${url}?operation=getAll`, {
      method: 'GET',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      signal,
    });

    if (!response.ok) throw new Error(`Pull failed: ${response.status}`);

    const text = await response.text();
    return JSON.parse(text) as SyncResponse;
  },
};
