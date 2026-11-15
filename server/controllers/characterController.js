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

const getAllCharacters = async (req, res) => {
  try {
    const availableOnly = req.query.availableOnly === 'true';
    const sql = availableOnly
      ? 'SELECT * FROM characters WHERE is_available = TRUE ORDER BY id ASC'
      : 'SELECT * FROM characters ORDER BY id ASC';
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat daftar badut karakter.', error: error.message });
  }
};

const createCharacter = async (req, res) => {
  const { name, price, is_available } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Nama karakter wajib diisi.' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const parsedPrice = Number(price) || 0;
  const availableFlag = is_available === 'false' || is_available === false ? 0 : 1;

  try {
    const [result] = await db.query(
      'INSERT INTO characters (name, price, image_url, is_available) VALUES (?, ?, ?, ?)',
      [name, parsedPrice, imageUrl, availableFlag]
    );
    const [newRow] = await db.query('SELECT * FROM characters WHERE id = ?', [result.insertId]);
    res.status(201).json(newRow[0]);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan karakter.', error: error.message });
  }
};

const updateCharacter = async (req, res) => {
  const { id } = req.params;
  const { name, price, is_available } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM characters WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Karakter tidak ditemukan.' });
    }

    const current = existing[0];
    let imageUrl = current.image_url;

    if (req.file) {
      removeFileIfExists(current.image_url);
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const parsedPrice = price !== undefined ? Number(price) : current.price;
    const availableFlag =
      is_available !== undefined
        ? is_available === 'false' || is_available === false
          ? 0
          : 1
        : current.is_available;

    await db.query(
      'UPDATE characters SET name = ?, price = ?, image_url = ?, is_available = ? WHERE id = ?',
      [name ?? current.name, parsedPrice, imageUrl, availableFlag, id]
    );

    const [updated] = await db.query('SELECT * FROM characters WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui karakter.', error: error.message });
  }
};

const deleteCharacter = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query('SELECT * FROM characters WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Karakter tidak ditemukan.' });
    }

    removeFileIfExists(existing[0].image_url);
    await db.query('DELETE FROM characters WHERE id = ?', [id]);
    res.json({ message: 'Karakter berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus karakter.', error: error.message });
  }
};

module.exports = { getAllCharacters, createCharacter, updateCharacter, deleteCharacter };