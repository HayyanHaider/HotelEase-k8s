const mongoose = require('mongoose');
require('dotenv').config();

const HotelModel = require('../models/hotelModel');
const UserModel = require('../models/userModel');

async function deleteFakeHotels() {
   try {
      await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

      // Find all hotels
    const hotels = await HotelModel.find({}).populate('ownerId', 'name email');
    
      // Identify fake hotels (hotels with numbers in name or owners with "Owner X" pattern)
    const fakeHotels = hotels.filter(hotel => {
       const name = hotel.name.toLowerCase();
        const ownerName = hotel.ownerId?.name?.toLowerCase() || '';
      const ownerEmail = hotel.ownerId?.email?.toLowerCase() || '';
      
        // Check if hotel name has numbers at the end (like "Hotel 33", "Suite 16")
      const hasNumberSuffix = / \d+$/.test(hotel.name);
      
        // Check if owner name matches "owner X" pattern
      const isFakeOwner = /^owner \d+$/.test(ownerName) || /^owner\d+$/.test(ownerName);
      
        // Check if owner email matches "ownerX@example.com" pattern
      const isFakeEmail = /^owner\d+@example\.com$/.test(ownerEmail);
      
        return hasNumberSuffix || isFakeOwner || isFakeEmail;
    });
    
      console.log(`\n📊 Found ${fakeHotels.length} fake/dummy hotels to delete`);
    console.log('='.repeat(60));
    
      if (fakeHotels.length === 0) {
      console.log('✅ No fake hotels found!');
       await mongoose.disconnect();
        process.exit(0);
    }
    
      // List hotels to be deleted
    console.log('\n🗑️  Hotels to be deleted:');
     fakeHotels.forEach((hotel, index) => {
        console.log(`${index + 1}. ${hotel.name} (ID: ${hotel._id})`);
      console.log(`   Owner: ${hotel.ownerId?.name} (${hotel.ownerId?.email})`);
       console.log(`   Status: ${hotel.isApproved ? 'APPROVED' : 'PENDING'}`);
        console.log('');
    });
    
      // Delete fake hotels
    const hotelIds = fakeHotels.map(h => h._id);
     const result = await HotelModel.deleteMany({ _id: { $in: hotelIds } });
    
    console.log(`✅ Successfully deleted ${result.deletedCount} fake hotels!`);
    
      // Show remaining hotels
    const remainingHotels = await HotelModel.find({}).populate('ownerId', 'name email');
     console.log(`\n📋 Remaining hotels in database: ${remainingHotels.length}`);
      remainingHotels.forEach((hotel, index) => {
      const status = hotel.isSuspended ? 'SUSPENDED' : 
                     hotel.isApproved ? 'APPROVED' : 'PENDING';
        console.log(`${index + 1}. ${hotel.name} - ${status} (Owner: ${hotel.ownerId?.name})`);
    });
    
      await mongoose.disconnect();
    process.exit(0);
   } catch (error) {
      console.error('❌ Error:', error);
    process.exit(1);
   }
}

deleteFakeHotels();

