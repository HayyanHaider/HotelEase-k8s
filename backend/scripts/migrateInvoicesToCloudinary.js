require('dotenv').config();
const mongoose = require('mongoose');
const { uploadInvoiceToCloudinary } = require('../utils/cloudinaryInvoiceService');
const BookingModel = require('../models/bookingModel');
const path = require('path');
const fs = require('fs');

async function migrateInvoicesToCloudinary() {
    try {
    // Connect to MongoDB
     await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB');

     // Find all bookings with local invoice paths
      const bookings = await BookingModel.find({ 
      invoicePath: { $exists: true, $ne: '' },
       invoiceUrl: { $exists: false } // Only migrate if not already migrated
      });

     console.log(`\n📊 Found ${bookings.length} invoices to migrate\n`);

    let successCount = 0;
     let failCount = 0;

    for (const booking of bookings) {
       const localPath = path.join(__dirname, '../invoices', booking.invoicePath);
      
      if (fs.existsSync(localPath)) {
         try {
            console.log(`⏳ Migrating: ${booking.invoicePath}...`);
          
           const result = await uploadInvoiceToCloudinary(localPath, booking._id);
          
          await BookingModel.updateOne(
             { _id: booking._id },
              { 
              invoiceUrl: result.url,
               cloudinaryPublicId: result.publicId
              }
          );
          
            successCount++;
          console.log(`✅ Success: ${booking.invoicePath} → ${result.url}\n`);
         } catch (error) {
            failCount++;
          console.error(`❌ Failed: ${booking.invoicePath} - ${error.message}\n`);
         }
        } else {
        failCount++;
         console.warn(`⚠️  File not found: ${localPath}\n`);
        }
    }

      console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
     console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📁 Total: ${bookings.length}`);
     console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
       console.log('🎉 Migration completed! Invoices are now stored on Cloudinary.');
        console.log('💡 You can now safely delete the /backend/invoices/ folder if desired.');
    }

    } catch (error) {
    console.error('❌ Migration failed:', error);
   } finally {
      await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
     process.exit();
    }
}

// Run migration
console.log('\n' + '='.repeat(60));
console.log('🚀 Starting Invoice Migration to Cloudinary');
console.log('='.repeat(60) + '\n');

migrateInvoicesToCloudinary();
