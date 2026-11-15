import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Sparkles, Music } from 'lucide-react';
import api from '../../services/api';
import { formatRupiah } from '../../utils/formatter';

export default function ManageServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'main',
    price: '',
    description: '',
    is_active: true,
  });

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data);
    } catch (err) {
      console.error('Gagal memuat layanan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setForm({
      name: '',
      type: 'main',
      price: '',
      description: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      type: service.type || 'main',
      price: service.price,
      description: service.description || '',
      is_active: Boolean(service.is_active),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      price: Number(form.price),
      is_active: form.is_active ? 1 : 0,
    };

    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload);
      } else {
        await api.post('/services', payload);
      }
      setModalOpen(false);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data layanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus layanan "${name}"?`)) return;
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus layanan.');
    }
  };

  const mainServices = services.filter((s) => s.type === 'main');
  const addonServices = services.filter((s) => s.type === 'addon');

  const renderServiceCard = (service) => {
    const active = Boolean(service.is_active);
    return (
      <div
        key={service.id}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-4 transition-colors"
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
              {service.name}
            </h3>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                active
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              {active ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>

          <p className="text-amber-600 dark:text-amber-400 font-extrabold text-base mt-1">
            {formatRupiah(service.price)}
          </p>

          {service.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {service.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => openEditModal(service)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => handleDelete(service.id, service.name)}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Hapus
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Kelola Layanan &amp; Add-on
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Atur daftar paket hiburan utama maupun layanan tambahan beserta harga sewanya.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Layanan</span>
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Memuat daftar layanan...</p>
      ) : (
        <div className="space-y-7">
          {/* Kategori 1: Hiburan Utama */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2>Hiburan Utama ({mainServices.length})</h2>
            </div>

            {mainServices.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada layanan hiburan utama.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mainServices.map(renderServiceCard)}
              </div>
            )}
          </section>

          {/* Kategori 2: Layanan Tambahan (Add-on) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-200">
              <Music className="w-4 h-4 text-amber-500" />
              <h2>Layanan Tambahan / Add-on ({addonServices.length})</h2>
            </div>

            {addonServices.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada layanan tambahan.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {addonServices.map(renderServiceCard)}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal Tambah / Edit Layanan */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Layanan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Badut MC & Sulap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="main">Hiburan Utama</option>
                    <option value="addon">Layanan Tambahan (Add-on)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Contoh: 350000"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Jelaskan fasilitas atau durasi yang didapat pelanggan..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Tampilkan layanan ini di halaman pemesanan publik
                </span>
              </label>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition disabled:opacity-60"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}