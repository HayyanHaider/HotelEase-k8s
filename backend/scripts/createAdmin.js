const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/userModel');

async function createAdmin() {
     try {
          // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
         console.log('✅ Connected to MongoDB');

        // Check if admin already exists
         const existingAdmin = await User.findOne({ email: 'admin@hotelmanagement.com' });

        if (existingAdmin) {
             console.log('⚠️  Admin user already exists');
              console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);

              // Update to ensure it's an admin
            if (existingAdmin.role !== 'admin') {
                 existingAdmin.role = 'admin';
                  await existingAdmin.save();
                console.log('✅ Updated user role to admin');
             }
          } else {
            // Create new admin user
             const hashedPassword = await bcrypt.hash('admin123', 10);

            const admin = new User({
                 name: 'System Administrator',
                  email: 'admin@hotelmanagement.com',
                passwordHash: hashedPassword,
                 phone: '+92-300-0000000',
                  role: 'admin',
                isVerified: true,
                 isSuspended: false
              });

             await admin.save();
              console.log('✅ Admin user created successfully!');
            console.log('Email: admin@hotelmanagement.com');
             console.log('Password: admin123');
              console.log('⚠️  Please change the password after first login!');
        }

          await mongoose.connection.close();
        console.log('✅ Database connection closed');
         process.exit(0);
      } catch (error) {
        console.error('❌ Error creating admin:', error);
         process.exit(1);
      }
}

createAdmin();
