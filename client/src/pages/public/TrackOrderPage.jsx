import { useState } from 'react';
import { Search, Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { formatRupiah, formatTanggal, parseEventAddress } from '../../utils/formatter';
import StatusBadge from '../../components/common/StatusBadge';

export default function TrackOrderPage() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    try {
      const res = await api.get(`/bookings/track?keyword=${encodeURIComponent(keyword.trim())}`);
      setResults(res.data);
      setSearched(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mencari data pesanan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-8 sm:py-10">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Lacak Status Pesanan Anda
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
          Masukkan <strong className="text-slate-900 dark:text-white">Kode Booking</strong> (contoh:
          BDT-20261115-1234) atau{' '}
          <strong className="text-slate-900 dark:text-white">Nomor WhatsApp</strong> yang digunakan
          saat memesan.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 mb-7 sm:mb-8">
        <input
          type="text"
          required
          placeholder="Ketik Kode Booking atau Nomor WhatsApp..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-amber-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Mencari...' : 'Cek Status'}</span>
        </button>
      </form>

      {searched && results.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Pesanan dengan kata kunci{' '}
          <strong className="text-slate-800 dark:text-slate-200">&ldquo;{keyword}&rdquo;</strong>{' '}
          tidak ditemukan. Periksa kembali penulisan kode booking atau nomor WhatsApp Anda.
        </div>
      )}

      <div className="space-y-4">
        {results.map((order) => {
          const parsedLoc = parseEventAddress(order.event_address);
          return (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 block">Kode Booking</span>
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {order.booking_code}
                  </span>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                <div>
                  <span className="text-slate-400 text-[11px] block">Pemesan &amp; Acara</span>
                  <span className="font-semibold">
                    {order.customer_name} (Ultah {order.child_name})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{formatTanggal(order.event_date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Pukul {order.event_time} (± 1 jam)</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 min-w-0 break-words">
                    {parsedLoc.detailText && <span className="block">{parsedLoc.detailText}</span>}
                    {parsedLoc.mapsUrl && (
                      <a
                        href={parsedLoc.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>Lihat Titik Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3.5 text-xs sm:text-sm border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Item Hiburan Dipesan:
                </span>
                <ul className="space-y-1">
                  {order.items?.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <span>• {item.item_name}</span>
                      <span className="font-medium shrink-0">{formatRupiah(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2 flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Total Biaya</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {formatRupiah(order.total_price)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}