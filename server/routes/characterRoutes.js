const express = require('express');
const router = express.Router();
const {
  getAllCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
} = require('../controllers/characterController');
const { verifyAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', getAllCharacters);
router.post('/', verifyAdmin, upload.single('image'), createCharacter);
router.put('/:id', verifyAdmin, upload.single('image'), updateCharacter);
router.delete('/:id', verifyAdmin, deleteCharacter);

module.exports = router;