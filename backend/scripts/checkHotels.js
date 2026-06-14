const mongoose = require('mongoose');
require('dotenv').config();

// Load models
const HotelModel = require('../models/hotelModel');
const UserModel = require('../models/userModel');

async function checkHotels() {
    try {
    await mongoose.connect(process.env.MONGO_URI);
     console.log('✅ Connected to MongoDB');

    const hotels = await HotelModel.find({}).populate('ownerId', 'name email');
    
      console.log('\n📊 Hotel Database Summary:');
    console.log('='.repeat(60));
     console.log(`Total hotels in database: ${hotels.length}`);
      console.log(`Approved hotels: ${hotels.filter(h => h.isApproved && !h.isSuspended).length}`);
    console.log(`Pending approval: ${hotels.filter(h => !h.isApproved && !h.isSuspended).length}`);
     console.log(`Suspended hotels: ${hotels.filter(h => h.isSuspended).length}`);
    
    console.log('\n📋 Hotel Details:');
     console.log('='.repeat(60));
      hotels.forEach((hotel, index) => {
      const status = hotel.isSuspended ? 'SUSPENDED' : 
                     hotel.isApproved ? 'APPROVED' : 'PENDING';
        console.log(`${index + 1}. ${hotel.name}`);
      console.log(`   Location: ${hotel.location?.city || 'N/A'}, ${hotel.location?.country || 'N/A'}`);
       console.log(`   Status: ${status}`);
        console.log(`   Owner: ${hotel.ownerId?.name || 'N/A'} (${hotel.ownerId?.email || 'N/A'})`);
      console.log(`   Created: ${hotel.createdAt}`);
       console.log('');
      });
    
     // Check for potentially fake/dummy hotels
      const suspiciousHotels = hotels.filter(h => {
      const name = h.name.toLowerCase();
       return name.includes('test') || 
              name.includes('dummy') || 
            name.includes('sample') || 
             name.includes('example') ||
              name.match(/\d{2,}/); // Hotels with numbers like "Hotel 33", "Suite 16"
    });
    
      if (suspiciousHotels.length > 0) {
      console.log('\n⚠️  Potentially fake/dummy hotels found:');
       console.log('='.repeat(60));
        suspiciousHotels.forEach(hotel => {
        console.log(`- ${hotel.name} (ID: ${hotel._id})`);
       });
        console.log('\n💡 To remove these hotels, you can:');
      console.log('   1. Delete them through the admin dashboard');
       console.log('   2. Or use: node scripts/deleteHotel.js <hotelId>');
      }
    
     await mongoose.disconnect();
      process.exit(0);
  } catch (error) {
     console.error('❌ Error:', error);
      process.exit(1);
  }
}

checkHotels();

