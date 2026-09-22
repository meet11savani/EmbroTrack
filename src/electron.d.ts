export interface ApiOrder {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ElectronApi {
  getOrders(): Promise<ApiOrder[]>;
  addOrder(data: Record<string, unknown>): Promise<ApiOrder>;
  updateOrder(id: string, data: Record<string, unknown>): Promise<ApiOrder | { error: string }>;
  deleteOrder(id: string): Promise<{ success: boolean; id: string }>;
}

declare global {
  interface Window {
    api: ElectronApi;
  }
}

export {};
