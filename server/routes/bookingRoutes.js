const express = require('express');
const router = express.Router();
const {
  checkSchedule,
  createBooking,
  trackBookings,
  getAllBookings,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { verifyAdmin } = require('../middlewares/authMiddleware');

// Publik
router.get('/check-schedule', checkSchedule);
router.post('/', createBooking);
router.get('/track', trackBookings);

// Khusus Admin
router.get('/', verifyAdmin, getAllBookings);
router.put('/:id', verifyAdmin, updateBooking);
router.delete('/:id', verifyAdmin, deleteBooking);

module.exports = router;