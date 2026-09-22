import { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { ToastContainer } from '@/components/Toast';
import { Records } from '@/pages/records/Records';
import { Parties } from '@/pages/parties/Parties';
import { Qualities } from '@/pages/qualities/Qualities';
import { Workers } from '@/pages/workers/Workers';
import { LoginPage } from '@/pages/auth/LoginPage';
import { UsersData } from '@/pages/admin/UsersData';
import { AddUser } from '@/pages/admin/AddUser';
import { UserSettings } from '@/pages/user/UserSettings';

type AdminTab = 'usersData' | 'addUser';
type UserTab = 'records' | 'parties' | 'qualities' | 'workers' | 'settings';

function AppContent() {
  const { settings } = useApp();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [adminTab, setAdminTab] = useState<AdminTab>('usersData');
  const [userTab, setUserTab] = useState<UserTab>('records');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      if (e.key === 'n' && !isTyping && !e.ctrlKey && !e.metaKey && !isAdmin) {
        e.preventDefault();
        setUserTab('records');
        setTimeout(() => {
          document.getElementById('challanNo')?.focus();
        }, 100);
      }

      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.querySelector('form');
        if (form) {
          const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          submitBtn?.click();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAdmin]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (isAdmin) {
    const adminNavItems: { key: AdminTab; label: string }[] = [
      { key: 'usersData', label: 'Users Data' },
      { key: 'addUser', label: 'Add User' },
    ];

    return (
      <div className="min-h-screen bg-cream">
        <Header
          businessName={settings.businessName}
          businessSubtitle={settings.businessSubtitle}
          activeTab={adminTab}
          onNavigate={(tab) => setAdminTab(tab as AdminTab)}
          searchRef={searchRef}
          navItems={adminNavItems}
          userName={user?.name ?? ''}
          userRole={user?.role ?? 'admin'}
          onLogout={logout}
        />

        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6 lg:py-8">
          {adminTab === 'usersData' && <UsersData />}
          {adminTab === 'addUser' && <AddUser />}
        </main>

        <footer className="border-t border-cream-300 py-6 no-print">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <p className="text-xs text-navy-300">
              {settings.businessName} — {settings.businessSubtitle}
            </p>
          </div>
        </footer>

        <ToastContainer />
      </div>
    );
  }

  const userNavItems: { key: UserTab; label: string }[] = [
    { key: 'records', label: 'Records' },
    { key: 'parties', label: 'Parties' },
    { key: 'qualities', label: 'Qualities' },
    { key: 'workers', label: 'Workers' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <Header
        businessName={settings.businessName}
        businessSubtitle={settings.businessSubtitle}
        activeTab={userTab}
        onNavigate={(tab) => setUserTab(tab as UserTab)}
        searchRef={searchRef}
        navItems={userNavItems}
        userName={user?.name ?? ''}
        userRole={user?.role ?? 'user'}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6 lg:py-8">
        {userTab === 'records' && <Records />}
        {userTab === 'parties' && <Parties />}
        {userTab === 'qualities' && <Qualities />}
        {userTab === 'workers' && <Workers />}
        {userTab === 'settings' && <UserSettings />}
      </main>

      <footer className="border-t border-cream-300 py-6 no-print">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-xs text-navy-300">
            {settings.businessName} — {settings.businessSubtitle}
          </p>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
