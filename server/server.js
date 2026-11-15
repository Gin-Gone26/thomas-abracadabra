const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { ensureDefaultAdmin } = require('./controllers/authController');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const characterRoutes = require('./routes/characterRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'API Thomas Abracadabra berjalan normal.' });
});

app.listen(PORT, async () => {
  await ensureDefaultAdmin();
  console.log(`Server berjalan di http://localhost:${PORT}`);
});