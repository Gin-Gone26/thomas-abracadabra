const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const customToken = req.headers['x-admin-token'];

  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (customToken) {
    token = customToken;
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: 'Akses ditolak. Token admin tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Sesi admin tidak valid atau sudah kedaluwarsa.' });
  }
};

module.exports = { verifyAdmin };