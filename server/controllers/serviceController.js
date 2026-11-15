const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const removeFileIfExists = (imageUrl) => {
  if (!imageUrl) return;
  const filename = path.basename(imageUrl);
  const filePath = path.join(__dirname, '../uploads', filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const getAllServices = async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const sql = activeOnly
      ? 'SELECT * FROM services WHERE is_active = TRUE ORDER BY type ASC, id ASC'
      : 'SELECT * FROM services ORDER BY type ASC, id ASC';
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat daftar layanan.', error: error.message });
  }
};

const createService = async (req, res) => {
  const { name, type, price, description, is_active } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Nama layanan wajib diisi.' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const parsedPrice = Number(price) || 0;
  const activeFlag = is_active === 'false' || is_active === false ? 0 : 1;

  try {
    const [result] = await db.query(
      'INSERT INTO services (name, type, price, description, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type || 'main', parsedPrice, description || '', imageUrl, activeFlag]
    );
    const [newRow] = await db.query('SELECT * FROM services WHERE id = ?', [result.insertId]);
    res.status(201).json(newRow[0]);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan layanan.', error: error.message });
  }
};

const updateService = async (req, res) => {
  const { id } = req.params;
  const { name, type, price, description, is_active } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Layanan tidak ditemukan.' });
    }

    const current = existing[0];
    let imageUrl = current.image_url;

    if (req.file) {
      removeFileIfExists(current.image_url);
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const parsedPrice = price !== undefined ? Number(price) : current.price;
    const activeFlag =
      is_active !== undefined
        ? is_active === 'false' || is_active === false
          ? 0
          : 1
        : current.is_active;

    await db.query(
      'UPDATE services SET name = ?, type = ?, price = ?, description = ?, image_url = ?, is_active = ? WHERE id = ?',
      [
        name ?? current.name,
        type ?? current.type,
        parsedPrice,
        description ?? current.description,
        imageUrl,
        activeFlag,
        id,
      ]
    );

    const [updated] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui layanan.', error: error.message });
  }
};

const deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Layanan tidak ditemukan.' });
    }

    removeFileIfExists(existing[0].image_url);
    await db.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Layanan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus layanan.', error: error.message });
  }
};

module.exports = { getAllServices, createService, updateService, deleteService };