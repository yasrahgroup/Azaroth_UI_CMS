import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DEFAULT_SETTINGS } from '../../constants/defaultSettings';
import { brandDocumentTitle } from '../../utils/branding';

export const AdminLogin: React.FC = () => {
  const { user, login } = useAuth();
  const { settings } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const brandName = settings.header.brandName.trim() || DEFAULT_SETTINGS.header.brandName;
  const cmsName = settings.cmsAppearance?.cmsName?.trim() || `${brandName} Staff Portal`;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    document.title = brandDocumentTitle(cmsName, brandName);
  }, [brandName, cmsName]);

  // If already authenticated, redirect to destination or dashboard (no loop)
  React.useEffect(() => {
    if (user) {
      const rawFrom = (location.state as any)?.from?.pathname;
      const from = rawFrom && !rawFrom.startsWith('/admin/login') ? rawFrom : '/admin';
      navigate(from, { replace: true });
    }
  }, [user, location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      const rawFrom = (location.state as any)?.from?.pathname;
      const from = rawFrom && !rawFrom.startsWith('/admin/login') ? rawFrom : '/admin';
      navigate(from, { replace: true });
    } else {
      setError(res.error || 'Authentication rejected. Verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 bg-[#35123F] rounded-2xl mx-auto flex items-center justify-center text-white border border-[#D5A13C]/40 shadow-md">
          <Lock className="w-6 h-6 text-[#D5A13C]" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#171B2C]">
          {cmsName}
        </h2>
        <p className="text-xs text-slate-500">
          Visual Content Management & Platform Administration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  data-testid="admin-email"
                  placeholder="Enter administrator email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#35123F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  data-testid="admin-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#35123F]"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="admin-login-submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <Link to="/" className="text-xs text-[#35123F] hover:underline font-medium">
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
