/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { adminApi, type RemoteUser } from '@/services/googleSheets';
import { storage } from '@/services/localStorage';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  username: string;
  role: UserRole;
  name: string;
  isDemo?: boolean;
  token?: string;
}

export interface ManagedUser {
  id: string;
  username: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
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

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  users: ManagedUser[];
  login: (user: AuthUser) => void;
  logout: () => void;
  authenticate: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  refreshUsers: () => Promise<void>;
  addUser: (data: Omit<ManagedUser, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<void>;
  isDemoExpired: boolean;
  demoDaysLeft: number | null;
}

const AUTH_STORAGE_KEY = 'he_auth_user';
const DEMO_FIRST_LOGIN_KEY = 'he_demo_first_login';
const DEMO_EXPIRED_KEY = 'he_demo_expired';

const DEMO_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function remoteToLocal(ru: RemoteUser): ManagedUser {
  return {
    id: ru.username,
    username: ru.username,
    password: '',
    name: ru.name,
    phone: ru.phone,
    email: ru.email,
    role: ru.role,
    address: ru.address || '',
    city: ru.city || '',
    state: ru.state || '',
    pincode: ru.pincode || '',
    gstNumber: ru.gstNumber || '',
    companyName: ru.companyName || '',
    notes: ru.notes || '',
    active: ru.active !== false,
    createdAt: ru.createdAt,
  };
}

export function isDemoAccountExpired(): boolean {
  return localStorage.getItem(DEMO_EXPIRED_KEY) === 'true';
}

export function getDemoDaysLeft(): number | null {
  const firstLogin = localStorage.getItem(DEMO_FIRST_LOGIN_KEY);
  if (!firstLogin) return null;
  const elapsed = Date.now() - parseInt(firstLogin, 10);
  const remaining = DEMO_DURATION_MS - elapsed;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthUser;

      if (parsed.isDemo) {
        const firstLogin = localStorage.getItem(DEMO_FIRST_LOGIN_KEY);
        if (firstLogin) {
          const elapsed = Date.now() - parseInt(firstLogin, 10);
          if (elapsed >= DEMO_DURATION_MS) {
            localStorage.setItem(DEMO_EXPIRED_KEY, 'true');
            localStorage.removeItem(AUTH_STORAGE_KEY);
            return null;
          }
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });
  // Users list is NEVER cached in localStorage — it always comes fresh from the
  // Apps Script backend. This is the single-source-of-truth principle.
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [demoExpired, setDemoExpired] = useState<boolean>(() => isDemoAccountExpired());
  const [demoDaysLeft, setDemoDaysLeft] = useState<number | null>(() => getDemoDaysLeft());

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.isDemo) return;

    const checkExpiry = () => {
      const firstLogin = localStorage.getItem(DEMO_FIRST_LOGIN_KEY);
      if (!firstLogin) return;
      const elapsed = Date.now() - parseInt(firstLogin, 10);
      if (elapsed >= DEMO_DURATION_MS) {
        localStorage.setItem(DEMO_EXPIRED_KEY, 'true');
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setDemoExpired(true);
        setDemoDaysLeft(0);
        setUser(null);
      } else {
        setDemoDaysLeft(Math.ceil((DEMO_DURATION_MS - elapsed) / (24 * 60 * 60 * 1000)));
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const getAdminUrl = useCallback((): string => {
    return storage.getSettings().adminScriptUrl;
  }, []);

  const login = useCallback((u: AuthUser) => {
    if (u.isDemo) {
      if (!localStorage.getItem(DEMO_FIRST_LOGIN_KEY)) {
        localStorage.setItem(DEMO_FIRST_LOGIN_KEY, String(Date.now()));
      }
      setDemoDaysLeft(getDemoDaysLeft());
    }
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    setUsers([]);
    setUser(null);
  }, []);

  const authenticate = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const adminUrl = getAdminUrl();

    if (adminUrl) {
      try {
        const result = await adminApi.login(adminUrl, username, password);
        if (result.success && result.user) {
          login({ ...result.user, token: result.token });
          return { success: true };
        }
        return { success: false, error: result.error ?? 'Invalid username or password' };
      } catch {
        return { success: false, error: 'Could not reach the server. Check your connection and try again.' };
      }
    }

    return { success: false, error: 'No admin backend URL configured. Contact your administrator.' };
  }, [getAdminUrl, login]);

  const refreshUsers = useCallback(async () => {
    const adminUrl = getAdminUrl();
    if (!adminUrl || !user?.token || user.role !== 'admin') return;
    try {
      const result = await adminApi.getUsers(adminUrl, user.token);
      if (result.success && result.users) {
        setUsers(result.users.map(remoteToLocal));
      }
    } catch {
      // keep whatever we last loaded; not an error to the caller
    }
  }, [getAdminUrl, user]);

  const addUser = useCallback(async (data: Omit<ManagedUser, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    const adminUrl = getAdminUrl();
    if (!adminUrl || !user?.token) {
      return { success: false, error: 'No admin backend configured. Set the Admin Script URL in Settings.' };
    }
    try {
      const result = await adminApi.createUser(adminUrl, user.token, {
        username: data.username.trim(),
        password: data.password,
        role: data.role,
        name: data.name.trim(),
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gstNumber: data.gstNumber,
        companyName: data.companyName,
        notes: data.notes,
        active: data.active,
      });
      if (!result.success) {
        return { success: false, error: result.error ?? 'Failed to create user' };
      }
      await refreshUsers();
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach the server. Check your connection and try again.' };
    }
  }, [getAdminUrl, user, refreshUsers]);

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    const found = users.find((u) => u.id === id);
    if (!found) return;

    const adminUrl = getAdminUrl();
    if (adminUrl && user?.token) {
      try {
        await adminApi.deleteUser(adminUrl, user.token, found.username);
      } catch {
        // if the server call fails, don't remove locally — keep server as truth
        return;
      }
    }

    await refreshUsers();
  }, [getAdminUrl, user, users, refreshUsers]);

  const isAdmin = user?.role === 'admin';

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isAdmin,
    users,
    login,
    logout,
    authenticate,
    refreshUsers,
    addUser,
    deleteUser,
    isDemoExpired: demoExpired,
    demoDaysLeft,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
