export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const ADMIN_WHATSAPP = import.meta.env.VITE_ADMIN_WHATSAPP || '6281234567890';

export const formatRupiah = (number) => {
  const value = Number(number) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export const formatTanggal = (dateStr) => {
  if (!dateStr) return '-';
  const cleanDate = String(dateStr).slice(0, 10);
  const date = new Date(`${cleanDate}T00:00:00`);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

export const parseEventAddress = (rawAddress) => {
  if (!rawAddress) return { mapsUrl: null, detailText: '-' };
  const urlMatch = String(rawAddress).match(/(https:\/\/www\.google\.com\/maps\?q=[^\s]+)/);
  if (!urlMatch) {
    return { mapsUrl: null, detailText: rawAddress };
  }
  const mapsUrl = urlMatch[1];
  const remainder = String(rawAddress)
    .replace(mapsUrl, '')
    .replace(/^\s*[-—•|]\s*/, '')
    .trim();
  return {
    mapsUrl,
    detailText: remainder || null,
  };
};

export const STATUS_CONFIG = {
  pending: {
    label: 'Menunggu Konfirmasi',
    color:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  confirmed: {
    label: 'Dikonfirmasi',
    color:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  },
  completed: {
    label: 'Selesai',
    color:
      'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  cancelled: {
    label: 'Dibatalkan',
    color:
      'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  },
};

export const buildWhatsAppOrderUrl = (booking) => {
  const cleanPhone = String(ADMIN_WHATSAPP).replace(/\D/g, '').replace(/^0/, '62');
  const itemsList = (booking.items || [])
    .map((item) => `• ${item.item_name} (${formatRupiah(item.subtotal)})`)
    .join('\n');

  const ageText = booking.child_age ? ` (Ke-${booking.child_age})` : '';
  const notesText = booking.notes && booking.notes.trim() ? booking.notes.trim() : '-';

  const message = [
    'Halo Admin *Thomas Abracadabra*! 👋',
    'Saya baru saja melakukan pemesanan hiburan ulang tahun melalui website. Berikut rincian pesanan saya:',
    '',
    `*Kode Booking:* ${booking.booking_code}`,
    `*Nama Pemesan:* ${booking.customer_name}`,
    `*No. WhatsApp:* ${booking.whatsapp_number}`,
    `*Acara Ultah:* ${booking.child_name}${ageText}`,
    `*Tanggal:* ${formatTanggal(booking.event_date)}`,
    `*Jam Mulai:* ${booking.event_time} (± 1 jam)`,
    `*Lokasi:* ${booking.event_address}`,
    '',
    '*Rincian Hiburan:*',
    itemsList,
    '',
    `*Estimasi Total:* ${formatRupiah(booking.total_price)}`,
    `*Catatan:* ${notesText}`,
    '',
    'Mohon konfirmasi ketersediaan jadwalnya ya. Terima kasih! 🙏',
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};