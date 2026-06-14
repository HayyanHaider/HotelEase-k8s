const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                          process.env.CLOUDINARY_API_KEY && 
                          process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary configured for invoice storage');
} else {
  console.warn('⚠️  Cloudinary credentials not configured for invoice storage');
}

/**
 * Upload invoice PDF to Cloudinary
 * @param {string} localFilePath - Path to the local PDF file
 * @param {string} bookingId - Booking ID for unique identification
 * @returns {Promise<Object>} - Cloudinary upload result with secure_url
 */
const uploadInvoiceToCloudinary = async (localFilePath, bookingId) => {
  try {
    if (!hasCloudinaryConfig) {
      throw new Error('Cloudinary is not configured');
    }

    if (!fs.existsSync(localFilePath)) {
      throw new Error('Local invoice file not found');
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: 'BookSmart/invoices',
      resource_type: 'raw', // For non-image files like PDFs
      public_id: `invoice-${bookingId}-${Date.now()}`,
      format: 'pdf',
      access_mode: 'public'
    });

    console.log(`✅ Invoice uploaded to Cloudinary: ${result.secure_url}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      cloudinaryId: result.public_id,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('❌ Error uploading invoice to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete invoice from Cloudinary
 * @param {string} publicId - Cloudinary public_id of the invoice
 * @returns {Promise<Object>} - Deletion result
 */
const deleteInvoiceFromCloudinary = async (publicId) => {
  try {
    if (!hasCloudinaryConfig) {
      throw new Error('Cloudinary is not configured');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });

    console.log(`🗑️  Invoice deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    console.error('❌ Error deleting invoice from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get invoice URL from Cloudinary public ID
 * @param {string} publicId - Cloudinary public_id
 * @returns {string} - Secure URL
 */
const getInvoiceUrl = (publicId) => {
  if (!hasCloudinaryConfig) {
    return null;
  }
  
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    secure: true
  });
};

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
const extractPublicIdFromUrl = (url) => {
  try {
    // Extract public_id from URL like: https://res.cloudinary.com/xxx/raw/upload/v123/BookSmart/invoices/invoice-xxx.pdf
    // Pattern: /upload/[version]/[folder]/[filename]
    const match = url.match(/\/upload\/[^\/]+\/(.+)$/);
    if (match && match[1]) {
      // Remove file extension
      return match[1].replace(/\.pdf$/, '');
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Download invoice from Cloudinary to buffer
 * @param {string} url - Cloudinary secure URL
 * @returns {Promise<Buffer>} - Invoice file buffer
 */
const downloadInvoiceFromCloudinary = async (url) => {
  try {
    if (!hasCloudinaryConfig) {
      throw new Error('Cloudinary is not configured');
    }

    // First, try direct download from the URL
    const https = require('https');
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode === 200) {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        } else if (response.statusCode === 401 || response.statusCode === 403) {
          // If unauthorized, try to extract public_id and use signed URL
          const publicId = extractPublicIdFromUrl(url);
          if (publicId) {
            try {
              // Use Cloudinary SDK to generate signed URL
              const signedUrl = cloudinary.url(publicId, {
                resource_type: 'raw',
                secure: true,
                sign_url: true,
                expires_at: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
              });
              
              https.get(signedUrl, (signedResponse) => {
                if (signedResponse.statusCode === 200) {
                  const chunks = [];
                  signedResponse.on('data', (chunk) => chunks.push(chunk));
                  signedResponse.on('end', () => resolve(Buffer.concat(chunks)));
                  signedResponse.on('error', reject);
                } else {
                  reject(new Error(`Failed to download invoice: ${signedResponse.statusCode}`));
                }
              }).on('error', reject);
            } catch (sdkError) {
              reject(new Error(`Failed to generate signed URL: ${sdkError.message}`));
            }
          } else {
            reject(new Error(`Failed to download invoice: ${response.statusCode} - Could not extract public_id`));
          }
        } else {
          reject(new Error(`Failed to download invoice: ${response.statusCode}`));
        }
      }).on('error', reject);
    });
  } catch (error) {
    console.error('❌ Error downloading invoice from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  uploadInvoiceToCloudinary,
  deleteInvoiceFromCloudinary,
  getInvoiceUrl,
  downloadInvoiceFromCloudinary,
  hasCloudinaryConfig
};
