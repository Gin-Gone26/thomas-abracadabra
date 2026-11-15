const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const ensureDefaultAdmin = async () => {
  try {
    const [rows] = await db.query('SELECT id FROM admins LIMIT 1');
    if (rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await db.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash]);
      console.log('Akun admin default dibuat -> username: admin | password: admin123');
    }
  } catch (err) {
    console.error('Gagal memeriksa akun admin default:', err.message);
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username.trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      admin: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server.', error: error.message });
  }
};

const getProfile = (req, res) => {
  res.json({ admin: req.admin });
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Password lama dan password baru wajib diisi.' });
  }

  if (String(new_password).length < 6) {
    return res.status(400).json({ message: 'Password baru minimal harus 6 karakter.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Akun admin tidak ditemukan.' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(current_password, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password lama tidak sesuai.' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE admins SET password_hash = ? WHERE id = ?', [newHash, admin.id]);

    res.json({ message: 'Password berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengganti password.', error: error.message });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, created_at FROM admins ORDER BY id ASC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat daftar admin.', error: error.message });
  }
};

const createAdmin = async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = String(username || '').trim();

  if (!cleanUsername || !password) {
    return res.status(400).json({ message: 'Username dan password admin baru wajib diisi.' });
  }

  if (cleanUsername.length < 3 || /\s/.test(cleanUsername)) {
    return res
      .status(400)
      .json({ message: 'Username minimal 3 karakter dan tidak boleh mengandung spasi.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password minimal harus 6 karakter.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM admins WHERE username = ?', [cleanUsername]);
    if (existing.length > 0) {
      return res.status(400).json({ message: `Username "${cleanUsername}" sudah digunakan.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      [cleanUsername, passwordHash]
    );

    const [created] = await db.query(
      'SELECT id, username, created_at FROM admins WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: `Admin "${cleanUsername}" berhasil ditambahkan!`,
      admin: created[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan admin baru.', error: error.message });
  }
};

const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  if (Number(id) === Number(req.admin.id)) {
    return res
      .status(400)
      .json({ message: 'Anda tidak dapat menghapus akun yang sedang digunakan saat ini.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM admins WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Akun admin tidak ditemukan.' });
    }

    await db.query('DELETE FROM admins WHERE id = ?', [id]);
    res.json({ message: 'Akun admin berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus akun admin.', error: error.message });
  }
};

module.exports = {
  ensureDefaultAdmin,
  login,
  getProfile,
  changePassword,
  getAllAdmins,
  createAdmin,
  deleteAdmin,
};