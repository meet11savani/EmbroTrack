export interface ApiOrder {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface GoogleScriptResult {
  ok: boolean;
  status: number;
  text: string;
  error: string | null;
}

export interface ElectronApi {
  getOrders(): Promise<ApiOrder[]>;
  addOrder(data: Record<string, unknown>): Promise<ApiOrder>;
  updateOrder(id: string, data: Record<string, unknown>): Promise<ApiOrder | { error: string }>;
  deleteOrder(id: string): Promise<{ success: boolean; id: string }>;
  googleScriptRequest(opts: { url: string; method: string; body?: unknown }): Promise<GoogleScriptResult>;
}

declare global {
  interface Window {
    api: ElectronApi;
  }
}

export {};
