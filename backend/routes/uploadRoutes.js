const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { upload, uploadImage, uploadMultipleImages, deleteImage } = require('../controllers/uploadController');

// Error handling middleware for multer errors (must have 4 parameters)
const multerErrorHandler = (err, req, res, next) => {
   if (err) {
      console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
       return res.status(400).json({
          success: false,
        message: 'File size too large. Maximum size is 10MB.',
         error: err.message
        });
    }
     if (err.message && err.message.includes('Only image files are allowed')) {
        return res.status(400).json({
        success: false,
         message: err.message,
          error: err.message
      });
     }
      return res.status(500).json({
      success: false,
       message: 'Error uploading file',
        error: err.message || 'Unknown error'
    });
   }
    next();
};

// Single image upload
router.post('/image', 
   authenticateToken, 
    (req, res, next) => {
    upload.single('image')(req, res, (err) => {
       if (err) {
          return multerErrorHandler(err, req, res, next);
      }
       next();
      });
  },
   uploadImage
);

// Multiple images upload (up to 10 images)
router.post('/images', 
  authenticateToken, 
   (req, res, next) => {
      upload.array('images', 10)(req, res, (err) => {
      if (err) {
         return multerErrorHandler(err, req, res, next);
        }
      next();
     });
    },
  uploadMultipleImages
);

// Delete image from Cloudinary
router.delete('/image', authenticateToken, deleteImage);

module.exports = router;

