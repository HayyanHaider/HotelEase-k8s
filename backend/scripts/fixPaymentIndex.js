const mongoose = require('mongoose');

require('dotenv').config();

const PaymentModel = require('../models/paymentModel');

async function fixPaymentIndex() {
   try {
      // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
     console.log('✅ Connected to MongoDB');

    const collection = mongoose.connection.db.collection('payments');
    
      // Get all indexes
    const indexes = await collection.indexes();
     console.log('Current indexes:', indexes.map(idx => idx.name));

    // Drop existing transactionId index if it exists
     try {
        await collection.dropIndex('transactionId_1');
      console.log('✅ Dropped existing transactionId_1 index');
     } catch (error) {
        if (error.code === 27) {
        console.log('ℹ️  transactionId_1 index does not exist, skipping drop');
       } else {
          throw error;
      }
     }

    // Create sparse unique index on transactionId
     await collection.createIndex(
        { transactionId: 1 },
      { unique: true, sparse: true, name: 'transactionId_1' }
     );
      console.log('✅ Created sparse unique index on transactionId');

     // Verify the index was created
      const newIndexes = await collection.indexes();
    const transactionIdIndex = newIndexes.find(idx => idx.name === 'transactionId_1');
     if (transactionIdIndex) {
        console.log('✅ Index verification:', {
        name: transactionIdIndex.name,
         unique: transactionIdIndex.unique,
          sparse: transactionIdIndex.sparse
      });
     }

    await mongoose.connection.close();
     console.log('✅ Database connection closed');
      process.exit(0);
  } catch (error) {
     console.error('❌ Error fixing payment index:', error);
      process.exit(1);
  }
}

fixPaymentIndex();

