import { useEffect, useState } from 'react';
import { Lock, UserPlus, Users, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AccountSettings() {
  const { admin } = useAuth();

  // State Ganti Password
  const [passForm, setPassForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passFeedback, setPassFeedback] = useState({ type: '', text: '' });

  // State Kelola Daftar Admin
  const [adminList, setAdminList] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [newAdminForm, setNewAdminForm] = useState({ username: '', password: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState({ type: '', text: '' });

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/auth/admins');
      setAdminList(res.data);
    } catch (err) {
      console.error('Gagal memuat daftar admin:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    api
      .get('/auth/admins')
      .then((res) => {
        if (!ignore) setAdminList(res.data);
      })
      .catch((err) => {
        console.error('Gagal memuat daftar admin:', err);
      })
      .finally(() => {
        if (!ignore) setLoadingAdmins(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassFeedback({ type: '', text: '' });

    if (passForm.new_password !== passForm.confirm_password) {
      setPassFeedback({
        type: 'error',
        text: 'Konfirmasi password baru tidak cocok.',
      });
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        current_password: passForm.current_password,
        new_password: passForm.new_password,
      });
      setPassFeedback({ type: 'success', text: res.data.message });
      setPassForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPassFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengganti password.',
      });
    } finally {
      setPassLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminFeedback({ type: '', text: '' });
    setCreateLoading(true);

    try {
      const res = await api.post('/auth/admins', newAdminForm);
      setAdminFeedback({ type: 'success', text: res.data.message });
      setNewAdminForm({ username: '', password: '' });
      fetchAdmins();
    } catch (err) {
      setAdminFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menambahkan admin baru.',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteAdmin = async (targetId, targetUsername) => {
    if (!window.confirm(`Hapus akses admin untuk akun "${targetUsername}"?`)) return;
    setAdminFeedback({ type: '', text: '' });

    try {
      const res = await api.delete(`/auth/admins/${targetId}`);
      setAdminFeedback({ type: 'success', text: res.data.message });
      fetchAdmins();
    } catch (err) {
      setAdminFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menghapus akun admin.',
      });
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
          Pengaturan Akun &amp; Admin
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Ubah password akun Anda secara berkala dan kelola siapa saja yang dapat mengakses panel
          admin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
        {/* Kartu 1: Ganti Password */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                Ganti Password Saya
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Akun aktif:{' '}
                <strong className="text-slate-800 dark:text-slate-200">{admin?.username}</strong>
              </p>
            </div>
          </div>

          {passFeedback.text && (
            <div
              className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                passFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
              }`}
            >
              {passFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{passFeedback.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="mt-4 space-y-3.5 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password Lama *
              </label>
              <input
                type="password"
                required
                placeholder="Masukkan password saat ini"
                value={passForm.current_password}
                onChange={(e) => setPassForm({ ...passForm, current_password: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password Baru (Minimal 6 karakter) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Masukkan password baru"
                value={passForm.new_password}
                onChange={(e) => setPassForm({ ...passForm, new_password: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ulangi Password Baru *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Ketik ulang password baru"
                value={passForm.confirm_password}
                onChange={(e) => setPassForm({ ...passForm, confirm_password: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-sm transition disabled:opacity-60"
            >
              {passLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        </section>

        {/* Kartu 2: Tambah & Daftar Admin */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-5 transition-colors">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                Tambah Admin Baru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buat akun terpisah untuk rekan pengelola atau pembawa acara.
              </p>
            </div>
          </div>

          {adminFeedback.text && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                adminFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
              }`}
            >
              {adminFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{adminFeedback.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username Baru *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  placeholder="Contoh: admin_thomas"
                  value={newAdminForm.username}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password Awal *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition disabled:opacity-60"
            >
              {createLoading ? 'Menambahkan...' : 'Tambah Akun Admin'}
            </button>
          </form>

          {/* Daftar Akun Admin Terdaftar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
              <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Daftar Admin Terdaftar ({adminList.length})</span>
            </div>

            {loadingAdmins ? (
              <p className="text-xs text-slate-400">Memuat daftar akun...</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {adminList.map((item) => {
                  const isCurrentUser = Number(item.id) === Number(admin?.id);
                  return (
                    <li
                      key={item.id}
                      className="px-3.5 py-3 bg-slate-50/60 dark:bg-slate-800/50 flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {item.username}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 shrink-0">
                              Sedang Login
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                          Dibuat:{' '}
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {!isCurrentUser && (
                        <button
                          onClick={() => handleDeleteAdmin(item.id, item.username)}
                          title="Hapus akun admin ini"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}