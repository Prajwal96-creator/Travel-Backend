const express = require('express');
const { getProfile, updateProfile, updateEmergencyContact } = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/emergency-contact', authMiddleware, updateEmergencyContact);

module.exports = router;
