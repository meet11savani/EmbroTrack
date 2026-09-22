import logo from '../../assets/logo.png';
import { useState, type FormEvent } from 'react';
import { Lock, User, Eye, EyeOff, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { useAuth, isDemoAccountExpired } from '@/context/AuthContext';

const ADMIN_CREDENTIALS = {
  username: 'adminmeetsavani',
  password: 'admin@meet2004@',
};  

const DEMO_CREDENTIALS = {
  username: 'meetsavani',
  password: '123456',
};

export function LoginPage() {
  const { login, authenticate } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoExpired = isDemoAccountExpired();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (username.trim() === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      login({ username: 'admin', role: 'admin', name: 'Administrator' });
      return;
    }

    if (username.trim().toLowerCase() === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      if (demoExpired) {
        setError('The demo account has expired. Please contact the administrator for access.');
        setLoading(false);
        return;
      }
      login({ username: 'demo', role: 'user', name: 'Demo User', isDemo: true });
      return;
    }

    const result = await authenticate(username.trim(), password);
    if (!result.success) {
      setError(result.error ?? 'Invalid username or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-teal/8 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-navy/8 blur-3xl" />
      </div>

      <div className="animate-scale-in relative w-full max-w-md">
        <div className="card p-8 lg:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mx-auto mb-4">
              <img src={logo} alt="Logo" className="w-12 h-12 rounded-lg" />
            </div>
            <h1 className="text-2xl font-bold text-navy">EmbroTrack</h1>
            <p className="mt-1 text-sm text-navy-300">Embroidery Record Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`input-field pl-10 ${error ? 'border-danger' : ''}`}
                  placeholder="Enter username"
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input-field pl-10 pr-10 ${error ? 'border-danger' : ''}`}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-fade-in rounded-xl bg-danger/10 border border-danger/20 px-4 py-3">
                <p className="text-sm font-medium text-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-primary w-full py-3"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cream-200 space-y-3">
            <div className="rounded-xl bg-cream-100 px-4 py-3 text-center">
              <p className="text-xs text-navy-300">
                <span className="font-semibold text-navy">Admin login:</span> admin / admin123
              </p>
            </div>

            {demoExpired ? (
              <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-danger shrink-0" />
                <p className="text-xs font-medium text-danger">
                  Demo account has expired and can no longer be used.
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-teal/8 border border-teal/20 px-4 py-3 flex items-center gap-2">
                <Clock size={16} className="text-teal shrink-0" />
                <p className="text-xs text-navy-300">
                  <span className="font-semibold text-teal">Demo login:</span> demo / demo123
                  <span className="text-navy-300"> — valid for 3 days only</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-navy-300">
          EmbroTrack &copy; 2026 — Embroidery Record Management
        </p>
      </div>
    </div>
  );
}
