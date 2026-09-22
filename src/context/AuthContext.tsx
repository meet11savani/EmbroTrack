import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { googleSheets, type RemoteUser } from '@/services/googleSheets';
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
const USERS_STORAGE_KEY = 'he_managed_users';
const DEMO_FIRST_LOGIN_KEY = 'he_demo_first_login';
const DEMO_EXPIRED_KEY = 'he_demo_expired';

const DEMO_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function loadUsers(): ManagedUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ManagedUser[]) : [];
  } catch {
    return [];
  }
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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
  const [users, setUsers] = useState<ManagedUser[]>(() => loadUsers());
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
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

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

  const getBackendUrl = useCallback((): string => {
    return storage.getSettings().googleScriptUrl;
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

  const logout = useCallback(() => setUser(null), []);

  const authenticate = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const url = getBackendUrl();

    if (url) {
      try {
        const result = await googleSheets.login(url, username, password);
        if (result.success && result.user) {
          login({ ...result.user, token: result.token });
          return { success: true };
        }
        return { success: false, error: result.error ?? 'Invalid username or password' };
      } catch {
        return { success: false, error: 'Could not reach the server. Check your connection and try again.' };
      }
    }

    return { success: false, error: 'No backend URL configured. Contact your administrator.' };
  }, [getBackendUrl, login]);

  const refreshUsers = useCallback(async () => {
    const url = getBackendUrl();
    if (!url || !user?.token || !isAdmin) return;
    try {
      const result = await googleSheets.getUsers(url, user.token);
      if (result.success && result.users) {
        setUsers(result.users.map(remoteToLocal));
      }
    } catch {
      // keep local cache on failure
    }
  }, [getBackendUrl, user]);

  const addUser = useCallback(async (data: Omit<ManagedUser, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    const url = getBackendUrl();
    if (url && user?.token) {
      try {
        const result = await googleSheets.createUser(url, user.token, {
          username: data.username.trim(),
          password: data.password,
          role: data.role,
          name: data.name.trim(),
          phone: data.phone,
          email: data.email,
        });
        if (!result.success) {
          return { success: false, error: result.error ?? 'Failed to create user' };
        }
        await refreshUsers();
        return { success: true };
      } catch {
        return { success: false, error: 'Could not reach the server. Check your connection and try again.' };
      }
    }

    // Offline fallback — local only (works only on this device)
    const exists = users.some((u) => u.username.toLowerCase() === data.username.trim().toLowerCase());
    if (exists) return { success: false, error: 'Username already exists' };

    const newUser: ManagedUser = {
      ...data,
      username: data.username.trim(),
      name: data.name.trim(),
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return { success: true };
  }, [getBackendUrl, user, users, refreshUsers]);

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    const found = users.find((u) => u.id === id);
    if (!found) return;

    const url = getBackendUrl();
    if (url && user?.token) {
      try {
        await googleSheets.deleteUser(url, user.token, found.username);
      } catch {
        // fall through to local delete
      }
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, [getBackendUrl, user, users]);

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
