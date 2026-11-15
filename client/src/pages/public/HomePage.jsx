import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Smile,
  Music,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Copy,
  Check,
  ShoppingBag,
  MessageCircle,
  AlertTriangle,
  Info,
  Navigation,
  ExternalLink,
  Loader2,
  ArrowDown,
} from 'lucide-react';
import api from '../../services/api';
import { formatRupiah, getImageUrl, buildWhatsAppOrderUrl } from '../../utils/formatter';

export default function HomePage() {
  const [services, setServices] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [wantCharacter, setWantCharacter] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);

  // Mode lokasi: 'manual' atau 'gps'
  const [locationMode, setLocationMode] = useState('manual');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsLandmark, setGpsLandmark] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const [form, setForm] = useState({
    customer_name: '',
    whatsapp_number: '',
    child_name: '',
    child_age: '',
    event_date: '',
    event_time: '',
    event_address: '',
    notes: '',
  });

  const [scheduleInfo, setScheduleInfo] = useState({
    hasConflict: false,
    conflicts: [],
    sameDayBookings: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const summaryRef = useRef(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [srvRes, charRes] = await Promise.all([
          api.get('/services?activeOnly=true'),
          api.get('/characters?availableOnly=true'),
        ]);
        setServices(srvRes.data);
        setCharacters(charRes.data);
      } catch (err) {
        console.error('Gagal memuat katalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (!form.event_date) {
      setScheduleInfo({ hasConflict: false, conflicts: [], sameDayBookings: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/bookings/check-schedule', {
          params: { date: form.event_date, time: form.event_time || undefined },
        });
        setScheduleInfo(res.data);
      } catch (err) {
        console.error('Gagal memeriksa jadwal:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [form.event_date, form.event_time]);

  const handleGetCurrentLocation = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Browser Anda tidak mendukung fitur GPS. Silakan gunakan mode Isi Manual.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setGpsCoords({ lat, lng, mapsUrl });
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError(
            'Izin akses lokasi ditolak oleh browser. Aktifkan izin lokasi di pengaturan browser atau pilih Isi Manual.'
          );
        } else {
          setGpsError(
            'Gagal mendeteksi titik GPS. Pastikan GPS/Lokasi HP aktif atau gunakan Isi Manual.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSwitchLocationMode = (mode) => {
    setLocationMode(mode);
    setGpsError('');
    if (mode === 'gps' && !gpsCoords) {
      handleGetCurrentLocation();
    }
  };

  const mainServices = services.filter((s) => s.type === 'main');
  const addonServices = services.filter((s) => s.type === 'addon');

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCharacter = (id) => {
    setSelectedCharacterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleWantCharacter = (checked) => {
    setWantCharacter(checked);
    if (!checked) {
      setSelectedCharacterIds([]);
    }
  };

  const chosenServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const chosenCharacters = wantCharacter
    ? characters.filter((c) => selectedCharacterIds.includes(c.id))
    : [];

  const totalItemsCount = chosenServices.length + chosenCharacters.length;

  const totalPrice =
    chosenServices.reduce((sum, s) => sum + Number(s.price), 0) +
    chosenCharacters.reduce((sum, c) => sum + Number(c.price), 0);

  const scrollToSummary = () => {
    summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (scheduleInfo.hasConflict) {
      alert(
        'Jam yang dipilih terlalu berdekatan dengan jadwal lain. Silakan pilih jam dengan jeda minimal 1,5 - 2 jam.'
      );
      return;
    }

    const items = [
      ...chosenServices.map((s) => ({ item_type: 'service', service_id: s.id, quantity: 1 })),
      ...chosenCharacters.map((c) => ({ item_type: 'character', character_id: c.id, quantity: 1 })),
    ];

    if (items.length === 0) {
      alert('Silakan pilih minimal satu layanan hiburan atau badut karakter terlebih dahulu.');
      return;
    }

    let finalAddress = '';
    if (locationMode === 'gps') {
      if (!gpsCoords) {
        alert('Titik lokasi GPS belum didapatkan. Klik tombol "Ambil Titik Lokasi" atau pilih Isi Manual.');
        return;
      }
      finalAddress = gpsLandmark.trim()
        ? `${gpsCoords.mapsUrl} - Patokan: ${gpsLandmark.trim()}`
        : gpsCoords.mapsUrl;
    } else {
      if (!form.event_address.trim()) {
        alert('Silakan isi alamat lengkap lokasi acara.');
        return;
      }
      finalAddress = form.event_address.trim();
    }

    setSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        ...form,
        event_address: finalAddress,
        items,
      });
      setBookingResult(res.data.booking);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengirim pesanan. Periksa kembali isian Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!bookingResult) return;
    navigator.clipboard.writeText(bookingResult.booking_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetOrder = () => {
    setBookingResult(null);
    setSelectedServiceIds([]);
    setWantCharacter(false);
    setSelectedCharacterIds([]);
    setLocationMode('manual');
    setGpsCoords(null);
    setGpsLandmark('');
    setGpsError('');
    setScheduleInfo({ hasConflict: false, conflicts: [], sameDayBookings: [] });
    setForm({
      customer_name: '',
      whatsapp_number: '',
      child_name: '',
      child_age: '',
      event_date: '',
      event_time: '',
      event_address: '',
      notes: '',
    });
  };

  if (bookingResult) {
    const whatsappUrl = buildWhatsAppOrderUrl(bookingResult);

    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/70 shadow-lg p-5 sm:p-8 text-center transition-colors">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Pesanan Berhasil Dikirim!
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1.5 text-xs sm:text-sm leading-relaxed">
            Klik tombol WhatsApp di bawah agar admin &amp; pembawa acara{' '}
            <strong className="text-slate-900 dark:text-white">Thomas Abracadabra</strong> dapat
            mengecek jarak lokasi dan mengonfirmasi jadwal Anda.
          </p>

          <div className="mt-5 sm:mt-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-2">
            <div className="text-left min-w-0">
              <span className="text-[11px] sm:text-xs font-semibold uppercase text-amber-700 dark:text-amber-400 block">
                Kode Booking Anda
              </span>
              <span className="text-lg sm:text-xl font-extrabold tracking-wider text-slate-900 dark:text-white block truncate">
                {bookingResult.booking_code}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold transition shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>

          <div className="mt-5 text-left bg-slate-50 dark:bg-slate-800/70 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Pemesan:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                {bookingResult.customer_name}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Acara Ulang Tahun:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                {bookingResult.child_name}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Jadwal:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                {String(bookingResult.event_date).slice(0, 10)} • Pukul {bookingResult.event_time}
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">
                Rincian Hiburan:
              </span>
              <ul className="space-y-1">
                {bookingResult.items?.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-2 text-slate-700 dark:text-slate-200"
                  >
                    <span>• {item.item_name}</span>
                    <span className="font-medium shrink-0">{formatRupiah(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              <span>Estimasi Total:</span>
              <span className="text-amber-600 dark:text-amber-400">
                {formatRupiah(bookingResult.total_price)}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-2.5 sm:space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Kirim Rincian ke WhatsApp Admin</span>
            </a>

            <button
              onClick={resetOrder}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition"
            >
              Buat Pesanan Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-5 sm:pt-8 pb-24 lg:pb-10">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-5 sm:p-8 text-white shadow-md mb-6 sm:mb-8">
        <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-2.5 sm:mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Thomas Abracadabra Entertainment
        </span>
        <h1 className="text-xl sm:text-4xl font-extrabold leading-snug sm:leading-tight">
          Rakit Sendiri Hiburan Ulang Tahun Si Kecil!
        </h1>
        <p className="mt-2 text-amber-50 max-w-2xl text-xs sm:text-base leading-relaxed">
          Pilih sesuai kebutuhan acara Anda: mulai dari Badut MC &amp; Sulap, tambah Badut Karakter
          favorit anak, hingga Organ Tunggal dan Fotografer.
        </p>
        <div className="mt-3.5 sm:mt-4 inline-flex items-start sm:items-center gap-2 bg-black/20 px-3 py-2 rounded-xl text-[11px] sm:text-sm font-medium">
          <Clock className="w-4 h-4 text-amber-200 shrink-0 mt-0.5 sm:mt-0" />
          <span>Durasi standar hiburan ± 1 jam per acara (jeda antar lokasi minimal 1,5 - 2 jam).</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">
          Memuat daftar layanan &amp; karakter...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Tahap 1: Hiburan Utama */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-2.5 mb-3.5 sm:mb-4">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  1
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Pilih Hiburan Utama
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mainServices.map((service) => {
                  const checked = selectedServiceIds.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`cursor-pointer rounded-xl border-2 p-3.5 sm:p-4 transition ${
                        checked
                          ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            {service.name}
                          </h3>
                          <p className="text-amber-600 dark:text-amber-400 font-extrabold text-sm mt-0.5">
                            {formatRupiah(service.price)}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="w-5 h-5 accent-amber-500 mt-0.5 pointer-events-none shrink-0"
                        />
                      </div>
                      {service.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                          {service.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Tahap 2: Badut Karakter (Kostum) */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Tambah Badut Karakter
                  </h2>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-300">
                  <input
                    type="checkbox"
                    checked={wantCharacter}
                    onChange={(e) => handleToggleWantCharacter(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Sertakan Karakter</span>
                </label>
              </div>

              {!wantCharacter ? (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Centang <strong className="text-slate-700 dark:text-slate-200">&ldquo;Sertakan Karakter&rdquo;</strong> di atas jika ingin memilih kostum karakter tertentu untuk hadir di acara.
                </p>
              ) : (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Pilih satu atau beberapa karakter yang diinginkan:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {characters.map((char) => {
                      const checked = selectedCharacterIds.includes(char.id);
                      const imgUrl = getImageUrl(char.image_url);
                      return (
                        <div
                          key={char.id}
                          onClick={() => toggleCharacter(char.id)}
                          className={`cursor-pointer rounded-xl border-2 overflow-hidden transition flex flex-col ${
                            checked
                              ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-200 dark:ring-amber-800'
                              : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 bg-white dark:bg-slate-800/50'
                          }`}
                        >
                          <div className="aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={char.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Smile className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600" />
                            )}
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="w-5 h-5 accent-amber-500 absolute top-2 right-2 pointer-events-none"
                            />
                          </div>
                          <div className="p-2.5 sm:p-3">
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {char.name}
                            </h3>
                            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                              {formatRupiah(char.price)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Tahap 3: Layanan Tambahan (Add-on) */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-2.5 mb-3.5 sm:mb-4">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  3
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Layanan Tambahan (Opsional)</span>
                  <Music className="w-4 h-4 text-amber-500 shrink-0" />
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addonServices.map((addon) => {
                  const checked = selectedServiceIds.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleService(addon.id)}
                      className={`cursor-pointer rounded-xl border-2 p-3.5 sm:p-4 transition ${
                        checked
                          ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            {addon.name}
                          </h3>
                          <p className="text-amber-600 dark:text-amber-400 font-extrabold text-sm mt-0.5">
                            {formatRupiah(addon.price)}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="w-5 h-5 accent-amber-500 mt-0.5 pointer-events-none shrink-0"
                        />
                      </div>
                      {addon.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                          {addon.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Tahap 4: Data Pemesan & Jadwal Acara */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  4
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Data Pemesan &amp; Jadwal Acara
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pemesan / Orang Tua *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ibu Rina"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp Aktif *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Anak yang Berulang Tahun *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Arka"
                    value={form.child_name}
                    onChange={(e) => setForm({ ...form, child_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ulang Tahun Ke- (Opsional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 5"
                    value={form.child_age}
                    onChange={(e) => setForm({ ...form, child_age: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" /> Tanggal Acara *
                    </span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> Jam Mulai Hiburan *
                    </span>
                  </label>
                  <input
                    type="time"
                    required
                    value={form.event_time}
                    onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-base sm:text-sm focus:outline-none ${
                      scheduleInfo.hasConflict
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-amber-500'
                    }`}
                  />
                </div>

                {/* Peringatan Bentrok / Jeda Perjalanan */}
                {scheduleInfo.hasConflict && (
                  <div className="sm:col-span-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3.5 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-rose-900 dark:text-rose-100">
                        Jam Terlalu Berdekatan dengan Jadwal Lain!
                      </p>
                      {scheduleInfo.conflicts.map((c) => (
                        <p key={c.id}>
                          Sudah ada pesanan pukul <strong>{c.event_time}</strong>. Karena durasi
                          acara 1 jam + waktu perjalanan antar lokasi, Anda hanya bisa memilih jam{' '}
                          {c.allowed_before && (
                            <>
                              <strong>{c.allowed_before} ke bawah</strong>
                            </>
                          )}
                          {c.allowed_before && c.allowed_after && ' atau '}
                          {c.allowed_after && (
                            <>
                              <strong>{c.allowed_after} ke atas</strong>
                            </>
                          )}
                          .
                        </p>
                      ))}
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 pt-0.5">
                        *Seluruh jadwal pada hari yang sama juga tetap akan dikonfirmasi ulang ke
                        pembawa acara terkait jarak tempuh lokasi.
                      </p>
                    </div>
                  </div>
                )}

                {!scheduleInfo.hasConflict && scheduleInfo.sameDayBookings.length > 0 && (
                  <div className="sm:col-span-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 p-3.5 flex items-start gap-2.5 text-xs text-sky-900 dark:text-sky-200">
                    <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        Info Jadwal Terisi pada Tanggal Ini (Jeda Perjalanan Minimal 1,5 Jam):
                      </p>
                      <ul className="list-disc list-inside text-sky-800 dark:text-sky-300">
                        {scheduleInfo.sameDayBookings.map((b) => (
                          <li key={b.id}>
                            Terisi pukul <strong>{b.event_time}</strong> — pilihan jam tersedia:{' '}
                            {b.allowed_before ? `≤ ${b.allowed_before}` : ''}
                            {b.allowed_before && b.allowed_after ? ' atau ' : ''}
                            {b.allowed_after ? `≥ ${b.allowed_after}` : ''}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-sky-700 dark:text-sky-300/80">
                        Catatan: Setelah pesanan dikirim, tim kami akan mengonfirmasi ulang jarak
                        tempuh lokasi ke pembawa acara.
                      </p>
                    </div>
                  </div>
                )}

                {/* Pilihan Lokasi: Manual vs Kirim Lokasi GPS */}
                <div className="sm:col-span-2 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" /> Lokasi Acara *
                      </span>
                    </label>

                    <div className="grid grid-cols-2 sm:inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleSwitchLocationMode('manual')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                          locationMode === 'manual'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Isi Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchLocationMode('gps')}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          locationMode === 'gps'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5 shrink-0" />
                        <span>Kirim Lokasi</span>
                      </button>
                    </div>
                  </div>

                  {locationMode === 'manual' ? (
                    <textarea
                      rows="2"
                      required={locationMode === 'manual'}
                      placeholder="Nama jalan, nomor rumah, RT/RW, patokan lokasi, atau nama gedung/restoran"
                      value={form.event_address}
                      onChange={(e) => setForm({ ...form, event_address: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Kirim titik koordinat GPS perangkat Anda saat ini sebagai link Google
                          Maps.
                        </p>
                        <button
                          type="button"
                          onClick={handleGetCurrentLocation}
                          disabled={gpsLoading}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold transition disabled:opacity-60 shrink-0"
                        >
                          {gpsLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Mendeteksi GPS...</span>
                            </>
                          ) : (
                            <>
                              <Navigation className="w-3.5 h-3.5 text-amber-400 dark:text-slate-950" />
                              <span>{gpsCoords ? 'Perbarui Titik Lokasi' : 'Ambil Titik Lokasi'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {gpsError && (
                        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-700 dark:text-rose-200">
                          {gpsError}
                        </div>
                      )}

                      {gpsCoords && (
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="text-emerald-900 dark:text-emerald-200">
                            <span className="font-bold block">Titik Lokasi Berhasil Didapat!</span>
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                              Koordinat: {gpsCoords.lat}, {gpsCoords.lng}
                            </span>
                          </div>
                          <a
                            href={gpsCoords.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald-100 dark:hover:bg-slate-800 transition"
                          >
                            <span>Cek di Google Maps</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Patokan / Nomor Rumah (Opsional, agar kru lebih mudah menemukan titik)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Rumah pagar hitam sebelah Masjid Al-Ikhlas"
                          value={gpsLandmark}
                          onChange={(e) => setGpsLandmark(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Tema warna acara, permintaan lagu, atau catatan khusus lainnya"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Kolom Kanan: Ringkasan Pesanan Sticky */}
          <div ref={summaryRef} className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-slate-800 p-4 sm:p-6 shadow-md transition-colors">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h2 className="font-extrabold text-slate-900 dark:text-white">
                  Ringkasan Pilihan Anda
                </h2>
              </div>

              <div className="py-4 space-y-2.5 text-sm">
                {chosenServices.length === 0 && chosenCharacters.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500 text-center py-5 text-xs">
                    Belum ada layanan yang dipilih. Silakan centang layanan di atas.
                  </p>
                ) : (
                  <>
                    {chosenServices.map((s) => (
                      <div key={`srv-${s.id}`} className="flex justify-between gap-2">
                        <span className="text-slate-700 dark:text-slate-200">{s.name}</span>
                        <span className="font-semibold text-slate-900 dark:text-white shrink-0">
                          {formatRupiah(s.price)}
                        </span>
                      </div>
                    ))}
                    {chosenCharacters.map((c) => (
                      <div key={`char-${c.id}`} className="flex justify-between gap-2">
                        <span className="text-slate-700 dark:text-slate-200">
                          Badut Karakter: {c.name}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white shrink-0">
                          {formatRupiah(c.price)}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Estimasi Total
                  </span>
                  <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                    {formatRupiah(totalPrice)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  *Durasi standar ± 1 jam per acara. Kepastian jam mulai akan dikonfirmasi oleh
                  Admin &amp; Pembawa Acara menyesuaikan jarak perjalanan lokasi.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || scheduleInfo.hasConflict}
                className="mt-5 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-sm shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scheduleInfo.hasConflict
                  ? 'Jam Terlalu Dekat — Pilih Jam Lain'
                  : submitting
                  ? 'Mengirim Pesanan...'
                  : 'Kirim Pemesanan Sekarang'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Bilah Estimasi Melayang Khusus Layar HP */}
      {!loading && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-amber-200 dark:border-slate-800 px-3.5 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Estimasi Total ({totalItemsCount} item)
              </span>
              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 block truncate">
                {formatRupiah(totalPrice)}
              </span>
            </div>

            <button
              type="button"
              onClick={scrollToSummary}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs shadow-sm shrink-0"
            >
              <span>Lanjut Pesan</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}