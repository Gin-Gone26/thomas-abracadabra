const db = require('../config/db');

// Jeda minimal 90 menit = 60 menit durasi acara + 30 menit perjalanan antar lokasi
// (Contoh: acara 13:00 -> bisa dipesan lagi mulai 14:30 atau sebelum 11:30)
const MIN_GAP_MINUTES = 90;

const generateBookingCode = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `BDT-${datePart}-${randomPart}`;
};

const timeToMinutes = (timeStr) => {
  if (!timeStr || !String(timeStr).includes(':')) return null;
  const [hours, minutes] = String(timeStr).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}`;
};

const enrichBookingWindow = (booking) => {
  const mins = timeToMinutes(booking.event_time);
  if (mins === null) return booking;
  return {
    ...booking,
    allowed_before: mins - MIN_GAP_MINUTES >= 0 ? minutesToTime(mins - MIN_GAP_MINUTES) : null,
    allowed_after: mins + MIN_GAP_MINUTES < 24 * 60 ? minutesToTime(mins + MIN_GAP_MINUTES) : null,
  };
};

const findScheduleConflicts = async (dbOrConn, eventDate, eventTime, excludeBookingId = null) => {
  if (!eventDate) {
    return { hasConflict: false, conflicts: [], sameDayBookings: [] };
  }

  let sql = `
    SELECT id, booking_code, customer_name, child_name, event_time, event_address, status
    FROM bookings
    WHERE event_date = ? AND status IN ('pending', 'confirmed')
  `;
  const params = [String(eventDate).slice(0, 10)];

  if (excludeBookingId) {
    sql += ' AND id != ?';
    params.push(excludeBookingId);
  }

  sql += ' ORDER BY event_time ASC';
  const [rawBookings] = await dbOrConn.query(sql, params);
  const sameDayBookings = rawBookings.map(enrichBookingWindow);

  const requestedMinutes = timeToMinutes(eventTime);
  if (requestedMinutes === null) {
    return { hasConflict: false, conflicts: [], sameDayBookings };
  }

  const conflicts = sameDayBookings.filter((b) => {
    const existingMinutes = timeToMinutes(b.event_time);
    if (existingMinutes === null) return false;
    return Math.abs(existingMinutes - requestedMinutes) < MIN_GAP_MINUTES;
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    sameDayBookings,
  };
};

const attachItemsToBookings = async (bookings) => {
  if (bookings.length === 0) return [];
  const bookingIds = bookings.map((b) => b.id);
  const [items] = await db.query(
    'SELECT * FROM booking_items WHERE booking_id IN (?) ORDER BY id ASC',
    [bookingIds]
  );

  return bookings.map((b) => ({
    ...b,
    items: items.filter((item) => item.booking_id === b.id),
  }));
};

const checkSchedule = async (req, res) => {
  const { date, time, excludeId } = req.query;
  if (!date) {
    return res.status(400).json({ message: 'Parameter tanggal wajib diisi.' });
  }

  try {
    const result = await findScheduleConflicts(db, date, time || null, excludeId || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memeriksa ketersediaan jadwal.', error: error.message });
  }
};

const createBooking = async (req, res) => {
  const {
    customer_name,
    whatsapp_number,
    child_name,
    child_age,
    event_date,
    event_time,
    event_address,
    notes,
    items,
    custom_total_price,
    status,
    force_override,
  } = req.body;

  if (!customer_name || !whatsapp_number || !child_name || !event_date || !event_time || !event_address) {
    return res.status(400).json({ message: 'Lengkapi seluruh data pemesan dan jadwal acara.' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Pilih minimal satu layanan atau badut karakter.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const scheduleCheck = await findScheduleConflicts(connection, event_date, event_time);
    if (scheduleCheck.hasConflict && !force_override) {
      await connection.rollback();
      const firstConflict = scheduleCheck.conflicts[0];
      const suggestionParts = [];
      if (firstConflict.allowed_before) suggestionParts.push(`maksimal pukul ${firstConflict.allowed_before}`);
      if (firstConflict.allowed_after) suggestionParts.push(`mulai pukul ${firstConflict.allowed_after}`);

      return res.status(409).json({
        message: `Jadwal terlalu berdekatan dengan acara pukul ${firstConflict.event_time}. Karena durasi tampil 1 jam + jeda perjalanan antar lokasi, silakan pilih ${suggestionParts.join(' atau ')}.`,
        conflicts: scheduleCheck.conflicts,
      });
    }

    let calculatedTotal = 0;
    const preparedItems = [];

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);

      if (item.item_type === 'service') {
        const [rows] = await connection.query('SELECT id, name, price FROM services WHERE id = ?', [
          item.service_id,
        ]);
        if (rows.length === 0) {
          throw new Error(`Layanan dengan ID ${item.service_id} tidak ditemukan.`);
        }
        const unitPrice = rows[0].price;
        const subtotal = unitPrice * qty;
        calculatedTotal += subtotal;
        preparedItems.push({
          item_type: 'service',
          service_id: rows[0].id,
          character_id: null,
          item_name: rows[0].name,
          quantity: qty,
          unit_price: unitPrice,
          subtotal,
        });
      } else if (item.item_type === 'character') {
        const [rows] = await connection.query('SELECT id, name, price FROM characters WHERE id = ?', [
          item.character_id,
        ]);
        if (rows.length === 0) {
          throw new Error(`Karakter dengan ID ${item.character_id} tidak ditemukan.`);
        }
        const unitPrice = rows[0].price;
        const subtotal = unitPrice * qty;
        calculatedTotal += subtotal;
        preparedItems.push({
          item_type: 'character',
          service_id: null,
          character_id: rows[0].id,
          item_name: `Badut Karakter: ${rows[0].name}`,
          quantity: qty,
          unit_price: unitPrice,
          subtotal,
        });
      }
    }

    const finalTotal =
      custom_total_price !== undefined && custom_total_price !== null
        ? Number(custom_total_price)
        : calculatedTotal;

    const bookingCode = generateBookingCode();
    const initialStatus = status || 'pending';

    const [bookingResult] = await connection.query(
      `INSERT INTO bookings 
      (booking_code, customer_name, whatsapp_number, child_name, child_age, event_date, event_time, event_address, notes, total_price, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingCode,
        customer_name,
        whatsapp_number,
        child_name,
        child_age ? Number(child_age) : null,
        event_date,
        event_time,
        event_address,
        notes || '',
        finalTotal,
        initialStatus,
      ]
    );

    const bookingId = bookingResult.insertId;

    for (const pItem of preparedItems) {
      await connection.query(
        `INSERT INTO booking_items 
        (booking_id, item_type, service_id, character_id, item_name, quantity, unit_price, subtotal) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingId,
          pItem.item_type,
          pItem.service_id,
          pItem.character_id,
          pItem.item_name,
          pItem.quantity,
          pItem.unit_price,
          pItem.subtotal,
        ]
      );
    }

    await connection.commit();

    const [createdRows] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    const hydrated = await attachItemsToBookings(createdRows);

    res.status(201).json({
      message: 'Pemesanan berhasil dibuat!',
      booking: hydrated[0],
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Gagal membuat pesanan.', error: error.message });
  } finally {
    connection.release();
  }
};

const trackBookings = async (req, res) => {
  const { keyword } = req.query;
  if (!keyword || !keyword.trim()) {
    return res.status(400).json({ message: 'Masukkan Kode Booking atau Nomor WhatsApp.' });
  }

  const cleanKeyword = keyword.trim();
  try {
    const [rows] = await db.query(
      'SELECT * FROM bookings WHERE booking_code = ? OR whatsapp_number = ? ORDER BY created_at DESC',
      [cleanKeyword, cleanKeyword]
    );
    const hydrated = await attachItemsToBookings(rows);
    res.json(hydrated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal melacak pesanan.', error: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bookings ORDER BY event_date DESC, created_at DESC');
    const hydrated = await attachItemsToBookings(rows);
    res.json(hydrated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat data pesanan.', error: error.message });
  }
};

const updateBooking = async (req, res) => {
  const { id } = req.params;
  const {
    customer_name,
    whatsapp_number,
    child_name,
    child_age,
    event_date,
    event_time,
    event_address,
    notes,
    total_price,
    status,
    force_override,
  } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    const current = existing[0];
    const targetDate = event_date ?? current.event_date;
    const targetTime = event_time ?? current.event_time;
    const targetStatus = status ?? current.status;

    if (targetStatus === 'confirmed') {
      const scheduleCheck = await findScheduleConflicts(db, targetDate, targetTime, id);
      if (scheduleCheck.hasConflict && !force_override) {
        const conflictInfo = scheduleCheck.conflicts
          .map((c) => `${c.booking_code} (${c.customer_name} - pukul ${c.event_time})`)
          .join(', ');
        return res.status(409).json({
          message: `Peringatan Bentrok / Jeda Terlalu Dekat! Sudah ada jadwal di tanggal tersebut: ${conflictInfo}.`,
          conflicts: scheduleCheck.conflicts,
        });
      }
    }

    await db.query(
      `UPDATE bookings SET 
        customer_name = ?, whatsapp_number = ?, child_name = ?, child_age = ?,
        event_date = ?, event_time = ?, event_address = ?, notes = ?,
        total_price = ?, status = ?
      WHERE id = ?`,
      [
        customer_name ?? current.customer_name,
        whatsapp_number ?? current.whatsapp_number,
        child_name ?? current.child_name,
        child_age !== undefined ? (child_age ? Number(child_age) : null) : current.child_age,
        targetDate,
        targetTime,
        event_address ?? current.event_address,
        notes ?? current.notes,
        total_price !== undefined ? Number(total_price) : current.total_price,
        targetStatus,
        id,
      ]
    );

    const [updatedRows] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    const hydrated = await attachItemsToBookings(updatedRows);
    res.json(hydrated[0]);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui pesanan.', error: error.message });
  }
};

const deleteBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query('SELECT id FROM bookings WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    await db.query('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ message: 'Pesanan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus pesanan.', error: error.message });
  }
};

module.exports = {
  checkSchedule,
  createBooking,
  trackBookings,
  getAllBookings,
  updateBooking,
  deleteBooking,
};