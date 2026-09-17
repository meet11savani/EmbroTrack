import { Scissors } from 'lucide-react';

interface HeaderProps {
  businessName: string;
  businessSubtitle: string;
  activeTab: string;
  onNavigate: (tab: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
}

const NAV_ITEMS = [
  { key: 'records', label: 'Records' },
  { key: 'parties', label: 'Parties' },
  { key: 'qualities', label: 'Qualities' },
  { key: 'settings', label: 'Settings' },
];

import { SyncStatus } from '../pages/settings/SyncStatus';

export function Header({ businessName, businessSubtitle, activeTab, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-cream-300 no-print">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
              <Scissors size={20} className="text-gold" />
            </div>
            <div>
              <h1 className="text-base font-bold text-navy leading-tight">{businessName.toUpperCase()}</h1>
              <p className="text-xs text-navy-300 leading-tight">{businessSubtitle}</p>
            </div>
          </div>

          {/* Center: Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === item.key
                    ? 'bg-navy text-cream-100'
                    : 'text-navy-300 hover:bg-cream-100 hover:text-navy'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: Sync status */}
          <div className="flex items-center gap-3">
            <SyncStatus />
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === item.key
                  ? 'bg-navy text-cream-100'
                  : 'text-navy-300 hover:bg-cream-100 hover:text-navy'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
