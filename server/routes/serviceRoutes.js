const express = require('express');
const router = express.Router();
const {
  getAllServices,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { verifyAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', getAllServices);
router.post('/', verifyAdmin, upload.single('image'), createService);
router.put('/:id', verifyAdmin, upload.single('image'), updateService);
router.delete('/:id', verifyAdmin, deleteService);

module.exports = router;