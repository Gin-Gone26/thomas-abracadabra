import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Search, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-amber-200/70 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Logo & Nama Brand */}
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block leading-tight truncate">
              Thomas Abracadabra
            </span>
            <span className="hidden sm:block text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              Badut MC, Sulap &amp; Hiburan Ultah
            </span>
          </div>
        </Link>

        {/* Menu Navigasi & Tombol Dark Mode */}
        <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Link
            to="/"
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              pathname === '/'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800'
            }`}
          >
            Pesan
          </Link>

          <Link
            to="/cek-pesanan"
            className={`inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              pathname === '/cek-pesanan'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cek Pesanan</span>
          </Link>

          <Link
            to="/admin"
            title="Panel Admin"
            className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border transition ${
              pathname.startsWith('/admin')
                ? 'border-slate-900 bg-slate-900 text-white dark:border-amber-400 dark:bg-amber-500 dark:text-slate-950'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Admin</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ganti Mode Gelap atau Terang"
            title={isDark ? 'Pindah ke Mode Terang' : 'Pindah ke Mode Gelap'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}