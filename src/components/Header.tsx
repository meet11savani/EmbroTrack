import logo from '../assets/logo.png';
import { LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { SyncStatus } from '../pages/settings/SyncStatus';

interface NavItem {
  key: string;
  label: string;
}

interface HeaderProps {
  businessName: string;
  businessSubtitle: string;
  activeTab: string;
  onNavigate: (tab: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
  navItems: NavItem[];
  userName: string;
  userRole: string;
  onLogout: () => void;
}

export function Header({
  activeTab,
  onNavigate,
  navItems,
  userName,
  userRole,
  onLogout,
}: HeaderProps) {
  const isAdmin = userRole === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-cream-300 no-print">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-6 h-6 rounded-lg" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-navy leading-tight">EmbroTrack</h1>
              <p className="text-xs text-navy-300 leading-tight">Embroidery Record Management App</p>
            </div>
          </div>

          {/* Center: Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === item.key
                    ? 'bg-navy text-cream-100'
                    : 'text-navy-300 hover:bg-cream-100 hover:text-navy'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: User + Sync + Logout */}
          <div className="flex items-center gap-3">
            <SyncStatus />
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-cream-100 px-3 py-1.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-navy' : 'bg-teal'}`}>
                {isAdmin ? <ShieldCheck size={14} className="text-cream-100" /> : <UserIcon size={14} className="text-cream-100" />}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-navy">{userName}</p>
                <p className="text-[10px] text-navy-300 capitalize">{userRole}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-xl border border-cream-300 bg-white flex items-center justify-center text-navy-300 transition-colors hover:bg-danger hover:border-danger hover:text-white"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => (
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
