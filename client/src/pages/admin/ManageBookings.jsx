import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Calendar,
  Phone,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import { formatRupiah, formatTanggal, parseEventAddress } from '../../utils/formatter';
import StatusBadge from '../../components/common/StatusBadge';

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal Edit Pesanan
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editScheduleInfo, setEditScheduleInfo] = useState({ conflicts: [], sameDayBookings: [] });
  const [editForceOverride, setEditForceOverride] = useState(false);

  // Modal Tambah Pesanan Manual
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);
  const [createScheduleInfo, setCreateScheduleInfo] = useState({
    conflicts: [],
    sameDayBookings: [],
  });
  const [createForceOverride, setCreateForceOverride] = useState(false);
  const [createForm, setCreateForm] = useState({
    customer_name: '',
    whatsapp_number: '',
    child_name: '',
    child_age: '',
    event_date: '',
    event_time: '',
    event_address: '',
    notes: '',
    status: 'confirmed',
  });

  const fetchAll = async () => {
    try {
      const [bookRes, srvRes, charRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/services'),
        api.get('/characters'),
      ]);
      setBookings(bookRes.data);
      setServices(srvRes.data);
      setCharacters(charRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!editModalOpen || !editingBooking || !editForm.event_date) {
      setEditScheduleInfo({ conflicts: [], sameDayBookings: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/bookings/check-schedule', {
          params: {
            date: editForm.event_date,
            time: editForm.event_time || undefined,
            excludeId: editingBooking.id,
          },
        });
        setEditScheduleInfo({
          conflicts: editForm.status === 'confirmed' ? res.data.conflicts || [] : [],
          sameDayBookings: res.data.sameDayBookings || [],
        });
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [editModalOpen, editingBooking, editForm.status, editForm.event_date, editForm.event_time]);

  useEffect(() => {
    if (!createModalOpen || !createForm.event_date) {
      setCreateScheduleInfo({ conflicts: [], sameDayBookings: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/bookings/check-schedule', {
          params: {
            date: createForm.event_date,
            time: createForm.event_time || undefined,
          },
        });
        setCreateScheduleInfo({
          conflicts: res.data.conflicts || [],
          sameDayBookings: res.data.sameDayBookings || [],
        });
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [createModalOpen, createForm.event_date, createForm.event_time]);

  const openEditModal = (booking) => {
    setEditingBooking(booking);
    setEditForceOverride(false);
    setEditScheduleInfo({ conflicts: [], sameDayBookings: [] });
    setEditForm({
      customer_name: booking.customer_name,
      whatsapp_number: booking.whatsapp_number,
      child_name: booking.child_name,
      child_age: booking.child_age || '',
      event_date: String(booking.event_date).slice(0, 10),
      event_time: booking.event_time,
      event_address: booking.event_address,
      notes: booking.notes || '',
      total_price: booking.total_price,
      status: booking.status,
    });
    setEditModalOpen(true);
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    if (editScheduleInfo.conflicts.length > 0 && !editForceOverride) {
      alert(
        'Centang persetujuan "Tetap simpan setelah konfirmasi ke Pembawa Acara" terlebih dahulu, atau ubah jam acara.'
      );
      return;
    }

    try {
      await api.put(`/bookings/${editingBooking.id}`, {
        ...editForm,
        force_override: editForceOverride,
      });
      setEditModalOpen(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui pesanan.');
    }
  };

  const handleDeleteBooking = async (id, code) => {
    if (!window.confirm(`Hapus permanen data pesanan ${code}?`)) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchAll();
    } catch (err) {
      alert('Gagal menghapus pesanan.');
    }
  };

  const handleCreateManualBooking = async (e) => {
    e.preventDefault();
    if (createScheduleInfo.conflicts.length > 0 && !createForceOverride) {
      alert(
        'Centang persetujuan "Tetap simpan setelah konfirmasi ke Pembawa Acara" terlebih dahulu, atau ubah jam acara.'
      );
      return;
    }

    const items = [
      ...selectedServiceIds.map((id) => ({ item_type: 'service', service_id: id, quantity: 1 })),
      ...selectedCharacterIds.map((id) => ({
        item_type: 'character',
        character_id: id,
        quantity: 1,
      })),
    ];

    if (items.length === 0) {
      alert('Pilih minimal satu layanan atau badut karakter.');
      return;
    }

    try {
      await api.post('/bookings', {
        ...createForm,
        items,
        force_override: createForceOverride,
      });
      setCreateModalOpen(false);
      setSelectedServiceIds([]);
      setSelectedCharacterIds([]);
      setCreateForceOverride(false);
      setCreateScheduleInfo({ conflicts: [], sameDayBookings: [] });
      setCreateForm({
        customer_name: '',
        whatsapp_number: '',
        child_name: '',
        child_age: '',
        event_date: '',
        event_time: '',
        event_address: '',
        notes: '',
        status: 'confirmed',
      });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan pesanan.');
    }
  };

  const filteredBookings =
    filterStatus === 'all' ? bookings : bookings.filter((b) => b.status === filterStatus);

  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <div>
      {/* Kartu Ringkasan Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block">
            Total Semua Pesanan
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
            {bookings.length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-amber-200 dark:border-amber-900/70 shadow-sm transition-colors">
          <span className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 block">
            Menunggu Konfirmasi
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
            {bookings.filter((b) => b.status === 'pending').length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-blue-200 dark:border-blue-900/70 shadow-sm transition-colors">
          <span className="text-[11px] sm:text-xs text-blue-700 dark:text-blue-400 block">
            Jadwal Dikonfirmasi
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 block">
            {bookings.filter((b) => b.status === 'confirmed').length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/70 shadow-sm transition-colors">
          <span className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 block">
            Estimasi Omzet Aktif
          </span>
          <span className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate">
            {formatRupiah(totalRevenue)}
          </span>
        </div>
      </div>

      {/* Filter Status & Tombol Tambah Manual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pending', label: 'Menunggu' },
            { id: 'confirmed', label: 'Dikonfirmasi' },
            { id: 'completed', label: 'Selesai' },
            { id: 'cancelled', label: 'Dibatalkan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setCreateForceOverride(false);
            setCreateScheduleInfo({ conflicts: [], sameDayBookings: [] });
            setCreateModalOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pesanan Manual</span>
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Memuat daftar pesanan...</p>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Belum ada data pesanan pada kategori ini.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const parsedLoc = parseEventAddress(booking.event_address);
            return (
              <div
                key={booking.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {booking.booking_code}
                      </span>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                      {booking.customer_name} • Acara Ultah {booking.child_name}
                      {booking.child_age ? ` (Ke-${booking.child_age})` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(booking)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit / Status
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(booking.id, booking.booking_code)}
                      title="Hapus Pesanan"
                      className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 text-xs sm:text-sm">
                  <div className="space-y-2 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <a
                        href={`https://wa.me/${booking.whatsapp_number.replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline break-all"
                      >
                        {booking.whatsapp_number} (Chat WhatsApp)
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        {formatTanggal(booking.event_date)} • Pukul {booking.event_time}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                      <div className="break-words">
                        <strong className="text-slate-800 dark:text-slate-100">Lokasi:</strong>{' '}
                        {parsedLoc.detailText ? parsedLoc.detailText : 'Titik GPS Pelanggan'}
                      </div>
                      {parsedLoc.mapsUrl && (
                        <a
                          href={parsedLoc.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold transition"
                        >
                          <span>Buka di Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {booking.notes && (
                      <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 px-2.5 py-1.5 rounded-lg break-words">
                        <strong>Catatan:</strong> {booking.notes}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                      Rincian Item Pesanan:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200">
                      {booking.items?.map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span>• {item.item_name}</span>
                          <span className="font-semibold shrink-0">
                            {formatRupiah(item.subtotal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2 flex justify-between font-extrabold text-slate-900 dark:text-white">
                      <span>Total Harga</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {formatRupiah(booking.total_price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Edit Status & Detail Pesanan */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Edit Pesanan ({editingBooking?.booking_code})
              </h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBooking} className="mt-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Pesanan
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 font-semibold text-base sm:text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="pending">Menunggu Konfirmasi</option>
                  <option value="confirmed">Dikonfirmasi</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              {editScheduleInfo.sameDayBookings.length > 0 &&
                editScheduleInfo.conflicts.length === 0 && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Ada acara lain pada tanggal ini:</p>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                        {editScheduleInfo.sameDayBookings.map((b) => (
                          <li key={b.id}>
                            <strong>Pukul {b.event_time}</strong> ({b.customer_name}) — Lokasi:{' '}
                            {b.event_address}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                        Pastikan sudah konfirmasi jarak perjalanan antar lokasi ke Pembawa Acara (MC)
                        sebelum mengonfirmasi.
                      </p>
                    </div>
                  </div>
                )}

              {editScheduleInfo.conflicts.length > 0 && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-800 dark:text-rose-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-900 dark:text-rose-100">
                        Jeda Waktu Terlalu Dekat (&lt; 1,5 Jam)!
                      </p>
                      <p className="mt-0.5">
                        Sudah ada jadwal lain di tanggal tersebut:{' '}
                        <strong>
                          {editScheduleInfo.conflicts
                            .map((c) => `${c.booking_code} (${c.customer_name} • ${c.event_time})`)
                            .join(', ')}
                        </strong>
                        . Jeda waktu perjalanan antar lokasi kurang dari standar.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-start gap-2 font-semibold text-rose-900 dark:text-rose-100 pt-1.5 border-t border-rose-200 dark:border-rose-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForceOverride}
                      onChange={(e) => setEditForceOverride(e.target.checked)}
                      className="w-4 h-4 accent-rose-600 mt-0.5 shrink-0"
                    />
                    <span>
                      Tetap simpan setelah konfirmasi jarak lokasi ke Pembawa Acara (MC)
                    </span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pemesan
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.whatsapp_number}
                    onChange={(e) => setEditForm({ ...editForm, whatsapp_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Acara
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.event_date}
                    onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={editForm.event_time}
                    onChange={(e) => setEditForm({ ...editForm, event_time: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Harga Akhir (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={editForm.total_price}
                  onChange={(e) => setEditForm({ ...editForm, total_price: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 font-bold text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat / Link Google Maps
                </label>
                <textarea
                  rows="2"
                  required
                  value={editForm.event_address}
                  onChange={(e) => setEditForm({ ...editForm, event_address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan
                </label>
                <textarea
                  rows="2"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Pesanan Manual */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Tambah Pesanan Manual (Via WA/Telp)
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="mt-4 space-y-3 text-sm">
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Layanan:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {services.map((s) => {
                    const active = selectedServiceIds.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() =>
                          setSelectedServiceIds((prev) =>
                            prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                          )
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          active
                            ? 'bg-amber-500 border-amber-500 text-slate-950'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {s.name} ({formatRupiah(s.price)})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Badut Karakter:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {characters.map((c) => {
                    const active = selectedCharacterIds.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() =>
                          setSelectedCharacterIds((prev) =>
                            prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                          )
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                          active
                            ? 'bg-amber-500 border-amber-500 text-slate-950'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {c.name} ({formatRupiah(c.price)})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nama Pemesan *"
                  value={createForm.customer_name}
                  onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  required
                  placeholder="No. WhatsApp *"
                  value={createForm.whatsapp_number}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, whatsapp_number: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Nama Anak *"
                  value={createForm.child_name}
                  onChange={(e) => setCreateForm({ ...createForm, child_name: e.target.value })}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
                <input
                  type="number"
                  placeholder="Umur Anak"
                  value={createForm.child_age}
                  onChange={(e) => setCreateForm({ ...createForm, child_age: e.target.value })}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
                <input
                  type="date"
                  required
                  value={createForm.event_date}
                  onChange={(e) => setCreateForm({ ...createForm, event_date: e.target.value })}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
                <input
                  type="time"
                  required
                  value={createForm.event_time}
                  onChange={(e) => setCreateForm({ ...createForm, event_time: e.target.value })}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {createScheduleInfo.conflicts.length > 0 && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-800 dark:text-rose-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-900 dark:text-rose-100">
                        Jeda Waktu Terlalu Dekat (&lt; 1,5 Jam)!
                      </p>
                      <p className="mt-0.5">
                        Sudah ada jadwal lain di tanggal tersebut:{' '}
                        <strong>
                          {createScheduleInfo.conflicts
                            .map((c) => `${c.booking_code} (${c.customer_name} • ${c.event_time})`)
                            .join(', ')}
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                  <label className="flex items-start gap-2 font-semibold text-rose-900 dark:text-rose-100 pt-1.5 border-t border-rose-200 dark:border-rose-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForceOverride}
                      onChange={(e) => setCreateForceOverride(e.target.checked)}
                      className="w-4 h-4 accent-rose-600 mt-0.5 shrink-0"
                    />
                    <span>
                      Tetap simpan setelah konfirmasi jarak lokasi ke Pembawa Acara (MC)
                    </span>
                  </label>
                </div>
              )}

              <textarea
                rows="2"
                required
                placeholder="Alamat Lengkap Acara / Link Shareloc *"
                value={createForm.event_address}
                onChange={(e) => setCreateForm({ ...createForm, event_address: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
              />

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition"
                >
                  Simpan Pesanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}