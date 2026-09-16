import { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { ToastContainer } from '@/components/Toast';
import { Records } from '@/features/records/Records';
import { Parties } from '@/features/parties/Parties';
import { Qualities } from '@/features/qualities/Qualities';
import { Settings } from '@/features/settings/Settings';

type Tab = 'records' | 'parties' | 'qualities' | 'settings';

function AppContent() {
  const { settings } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('records');
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      // N — New Record (focus challan field)
      if (e.key === 'n' && !isTyping && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTab('records');
        setTimeout(() => {
          document.getElementById('challanNo')?.focus();
        }, 100);
      }

      // / — Focus search
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
      }

      // CTRL+S — Save current form
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
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <Header
        businessName={settings.businessName}
        businessSubtitle={settings.businessSubtitle}
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab as Tab)}
        searchRef={searchRef}
      />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6 lg:py-8">
        {activeTab === 'records' && <Records />}
        {activeTab === 'parties' && <Parties />}
        {activeTab === 'qualities' && <Qualities />}
        {activeTab === 'settings' && <Settings />}
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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
