const express = require('express');
const router = express.Router();
const {
  login,
  getProfile,
  changePassword,
  getAllAdmins,
  createAdmin,
  deleteAdmin,
} = require('../controllers/authController');
const { verifyAdmin } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.get('/me', verifyAdmin, getProfile);
router.put('/change-password', verifyAdmin, changePassword);
router.get('/admins', verifyAdmin, getAllAdmins);
router.post('/admins', verifyAdmin, createAdmin);
router.delete('/admins/:id', verifyAdmin, deleteAdmin);

module.exports = router;