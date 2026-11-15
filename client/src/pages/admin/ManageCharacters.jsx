import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Smile, Upload } from 'lucide-react';
import api from '../../services/api';
import { formatRupiah, getImageUrl } from '../../utils/formatter';

export default function ManageCharacters() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    is_available: true,
  });

  const fetchCharacters = async () => {
    try {
      const res = await api.get('/characters');
      setCharacters(res.data);
    } catch (err) {
      console.error('Gagal memuat daftar karakter:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const openCreateModal = () => {
    setEditingChar(null);
    setImageFile(null);
    setImagePreview(null);
    setForm({
      name: '',
      price: '',
      description: '',
      is_available: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (char) => {
    setEditingChar(char);
    setImageFile(null);
    setImagePreview(getImageUrl(char.image_url));
    setForm({
      name: char.name,
      price: char.price,
      description: char.description || '',
      is_available: Boolean(char.is_available),
    });
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price', Number(form.price));
    formData.append('description', form.description);
    formData.append('is_available', form.is_available ? '1' : '0');
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editingChar) {
        await api.put(`/characters/${editingChar.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/characters', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setModalOpen(false);
      fetchCharacters();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data badut karakter.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus karakter "${name}"?`)) return;
    try {
      await api.delete(`/characters/${id}`);
      fetchCharacters();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus karakter.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Kelola Badut Karakter (Kostum)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tambah atau perbarui foto kostum karakter badut beserta status ketersediaannya.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Karakter</span>
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Memuat daftar karakter...</p>
      ) : characters.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Belum ada data badut karakter. Klik tombol &ldquo;Tambah Karakter&rdquo; untuk memulai.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {characters.map((char) => {
            const imgUrl = getImageUrl(char.image_url);
            const available = Boolean(char.is_available);

            return (
              <div
                key={char.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col transition-colors"
              >
                <div className="aspect-[4/3] sm:aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative">
                  {imgUrl ? (
                    <img src={imgUrl} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    <Smile className="w-14 h-14 text-slate-300 dark:text-slate-600" />
                  )}

                  <span
                    className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${
                      available
                        ? 'bg-emerald-50/95 text-emerald-700 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-50/95 text-rose-700 border-rose-200 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {available ? 'Tersedia' : 'Tidak Tersedia'}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {char.name}
                    </h3>
                    <p className="text-amber-600 dark:text-amber-400 font-extrabold text-sm mt-0.5">
                      {formatRupiah(char.price)}
                    </p>
                    {char.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {char.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => openEditModal(char)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(char.id, char.name)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Badut Karakter */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingChar ? 'Edit Badut Karakter' : 'Tambah Badut Karakter'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-sm">
              {/* Upload & Preview Foto Kostum */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Foto Kostum Karakter
                </label>
                <div className="flex items-center gap-3.5">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Smile className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-slate-50/70 dark:bg-slate-800/50 p-3 text-center transition">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <Upload className="w-4 h-4 text-amber-500" />
                      <span>{imageFile ? 'Ganti File Foto' : 'Pilih / Foto Kostum'}</span>
                    </div>
                    <span className="block text-[11px] text-slate-400 mt-1 truncate">
                      {imageFile ? imageFile.name : 'Format JPG, PNG, atau WEBP'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Karakter *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Doraemon"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Sewa (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Contoh: 250000"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan (Opsional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Catatan ukuran kostum atau keterangan tambahan..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Kostum tersedia untuk dipesan pelanggan
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
                  {submitting ? 'Menyimpan...' : 'Simpan Karakter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}