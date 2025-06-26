
const express = require('express');
const router = express.Router();
const { uploadCertificates, uploadProfileImage } = require('../controllers/uploadController'); 
const { protect } = require('../middleware/authMiddleware');

router.post('/certificates', protect, uploadCertificates);
router.post('/profile-image', protect, uploadProfileImage);

module.exports = router;
