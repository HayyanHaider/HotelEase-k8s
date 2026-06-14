const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if Cloudinary credentials are configured (must be non-empty strings)
const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                            process.env.CLOUDINARY_CLOUD_NAME.trim() !== '' &&
                          process.env.CLOUDINARY_API_KEY && 
                           process.env.CLOUDINARY_API_KEY.trim() !== '' &&
                            process.env.CLOUDINARY_API_SECRET && 
                          process.env.CLOUDINARY_API_SECRET.trim() !== '';

// Configure Cloudinary only if credentials are available
if (hasCloudinaryConfig) {
   try {
      cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
       api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
     console.log('✅ Cloudinary configured successfully');
    } catch (error) {
    console.error('❌ Error configuring Cloudinary:', error);
   }
} else {
  console.warn('⚠️  Cloudinary credentials not found in environment variables.');
   console.warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
    console.warn('Image uploads will use local storage as fallback.');
}

// Configure storage - use Cloudinary if configured, otherwise use local disk storage
let storage;
let useCloudinary = false;

if (hasCloudinaryConfig) {
   try {
      storage = new CloudinaryStorage({
      cloudinary: cloudinary,
       params: {
          folder: 'BookSmart/hotels', // Folder in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
         transformation: [
            { width: 1000, height: 1000, crop: 'limit' }, // Limit image size
          { quality: 'auto' } // Auto optimize quality
         ]
        }
    });
     useCloudinary = true;
      console.log('✅ CloudinaryStorage initialized successfully');
  } catch (error) {
     console.error('❌ Error initializing CloudinaryStorage:', error);
      console.error('Falling back to local disk storage');
    useCloudinary = false;
   }
}

// Fallback to local disk storage if Cloudinary is not configured or failed to initialize
if (!useCloudinary) {
  const uploadsDir = path.join(__dirname, '../uploads');
   if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
    storage = multer.diskStorage({
    destination: (req, file, cb) => {
       cb(null, uploadsDir);
      },
    filename: (req, file, cb) => {
       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
   });
    console.log('📁 Using local disk storage for image uploads');
}

// File filter for images only
const fileFilter = (req, file, cb) => {
   const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
  
   if (mimetype) {
      return cb(null, true);
  } else {
     cb(new Error('Only image files are allowed! (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
  storage: storage,
   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// Upload single image
const uploadImage = async (req, res) => {
   try {
      if (!req.file) {
      return res.status(400).json({
         success: false,
          message: 'No file uploaded'
      });
     }

    let imageUrl;
     let publicId;

    // Check if file.path is a Cloudinary URL (contains 'cloudinary.com' or 'res.cloudinary.com')
     const isCloudinaryUrl = req.file.path && (
        req.file.path.includes('cloudinary.com') || 
      req.file.path.includes('res.cloudinary.com')
     );

    if (isCloudinaryUrl) {
       // Cloudinary upload - path contains the Cloudinary URL
        imageUrl = req.file.path;
      publicId = req.file.filename || req.file.public_id || req.file.path.split('/').pop().split('.')[0];
     } else {
        // Local storage - construct URL from filename
      imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
       publicId = req.file.filename;
      }
    
     res.json({
        success: true,
      message: 'Image uploaded successfully',
       imageUrl: imageUrl,
        publicId: publicId
    });
   } catch (error) {
      console.error('Upload image error:', error);
    res.status(500).json({
       success: false,
        message: 'Server error while uploading image',
      error: error.message
     });
    }
};

// Upload multiple images
const uploadMultipleImages = async (req, res) => {
   try {
      if (!req.files || req.files.length === 0) {
      return res.status(400).json({
         success: false,
          message: 'No files uploaded'
      });
     }

    // Process uploaded files
     const imageUrls = req.files.map(file => {
        // Check if file.path is a Cloudinary URL (contains 'cloudinary.com' or 'res.cloudinary.com')
      const isCloudinaryUrl = file.path && (
         file.path.includes('cloudinary.com') || 
          file.path.includes('res.cloudinary.com')
      );
      
        if (isCloudinaryUrl) {
        // Cloudinary upload - path contains the Cloudinary URL
         return {
            url: file.path, // Cloudinary URL
          publicId: file.filename || file.public_id || file.path.split('/').pop().split('.')[0] // Cloudinary public ID
         };
        } else {
        // Local storage - construct URL from filename
         return {
            url: `http://localhost:5000/uploads/${file.filename}`,
          publicId: file.filename
         };
        }
    });

      res.json({
      success: true,
       message: useCloudinary 
          ? 'Images uploaded successfully to Cloudinary' 
        : 'Images uploaded successfully to local storage',
       images: imageUrls
      });
  } catch (error) {
     console.error('Upload multiple images error:', error);
      res.status(500).json({
      success: false,
       message: 'Server error while uploading images',
        error: error.message,
      details: useCloudinary 
         ? 'Check Cloudinary configuration and credentials' 
          : 'Using local storage fallback'
    });
   }
};

// Delete image from Cloudinary
const deleteImage = async (req, res) => {
  try {
     const { publicId } = req.body;
    
    if (!publicId) {
       return res.status(400).json({
          success: false,
        message: 'Public ID is required'
       });
      }

     // Only delete from Cloudinary if it's configured
      if (!useCloudinary) {
      return res.status(400).json({
         success: false,
          message: 'Cloudinary is not configured. Cannot delete images from Cloudinary.'
      });
     }

    // Extract public ID from URL if full URL is provided
     let cloudinaryPublicId = publicId;
      if (publicId.includes('cloudinary.com')) {
      // Extract public ID from Cloudinary URL
       const urlParts = publicId.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1) {
         // Get the part after 'upload' and before the file extension
          const filename = urlParts[urlParts.length - 1];
        cloudinaryPublicId = filename.split('.')[0];
         // Get folder path if exists
          const folderParts = urlParts.slice(uploadIndex + 2, -1);
        if (folderParts.length > 0) {
           cloudinaryPublicId = folderParts.join('/') + '/' + cloudinaryPublicId;
          }
      }
     }

    // Delete from Cloudinary
     const result = await cloudinary.uploader.destroy(cloudinaryPublicId);
    
    if (result.result === 'ok' || result.result === 'not found') {
       res.json({
          success: true,
        message: 'Image deleted successfully'
       });
      } else {
      res.status(400).json({
         success: false,
          message: 'Error deleting image from Cloudinary'
      });
     }
    } catch (error) {
    console.error('Delete image error:', error);
     res.status(500).json({
        success: false,
      message: 'Server error while deleting image',
       error: error.message
      });
  }
};

module.exports = {
   upload,
    uploadImage,
  uploadMultipleImages,
   deleteImage,
    cloudinary
};
