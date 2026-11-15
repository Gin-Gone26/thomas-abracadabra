import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Sparkles,
  Smile,
  Lock,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const { admin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', label: 'Pesanan Masuk', icon: CalendarCheck },
    { to: '/admin/layanan', label: 'Layanan & Add-on', icon: Sparkles },
    { to: '/admin/karakter', label: 'Badut Karakter', icon: Smile },
    { to: '/admin/akun', label: 'Pengaturan Akun', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <header className="bg-slate-900 dark:bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-sm sm:text-lg text-amber-400 truncate">
              Thomas Abracadabra
            </span>
            <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
              Admin ({admin?.username || 'admin'})
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700 transition"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to="/"
              title="Lihat Web Publik"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 hover:text-white px-2.5 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lihat Web Publik</span>
            </Link>

            <button
              onClick={handleLogout}
              title="Keluar"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 px-2.5 sm:px-3 py-2 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex gap-1.5 sm:gap-2 overflow-x-auto pb-2.5 pt-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-5 sm:py-6">{children}</main>
    </div>
  );
}