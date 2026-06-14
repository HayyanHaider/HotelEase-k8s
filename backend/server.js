const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
require("dotenv").config();

dns.setDefaultResultOrder("ipv4first");

const app = express();
app.use(express.json());
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,https://localhost:5173,http://127.0.0.1:5173,https://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
    credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
}));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ownerBookingRoutes = require('./routes/ownerBookingRoutes');
const couponRoutes = require('./routes/couponRoutes');
const earningsRoutes = require('./routes/earningsRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const { startAutoConfirmService } = require('./utils/autoConfirmService');
const { startAutoFlagService } = require('./utils/autoFlagService');

app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner/bookings', ownerBookingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/geocode', geocodeRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorMiddleware);

const checkEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
     console.warn('⚠️  Email service not configured - booking confirmation emails will not be sent');
      console.warn('   Add EMAIL_USER and EMAIL_PASSWORD to your .env file to enable email sending');
  } else {
     console.log('✅ Email service configured');
    }
};

const connectToDatabase = async () => {
  const uri = process.env.MONGO_URI;
  const directUri = process.env.MONGO_URI_DIRECT;
  const maxRetries = Number(process.env.MONGO_CONNECT_RETRIES || 3);
  const retryDelayMs = Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS || 2000);
  const customDnsServers = (process.env.MONGO_DNS_SERVERS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (customDnsServers.length > 0) {
    try {
      dns.setServers(customDnsServers);
      console.log(`✅ Using custom DNS servers for MongoDB: ${customDnsServers.join(', ')}`);
    } catch (dnsErr) {
      console.warn('⚠️ Invalid MONGO_DNS_SERVERS value. Falling back to system DNS.');
      console.warn('   Expected format: 8.8.8.8,1.1.1.1');
    }
  }

    if (!uri) {
    console.error('❌ MongoDB connection string (MONGO_URI) is not defined');
     process.exit(1);
    }

  const candidates = [
    { label: 'MONGO_URI', value: uri },
    ...(directUri && directUri !== uri ? [{ label: 'MONGO_URI_DIRECT', value: directUri }] : []),
  ];

  for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
    const candidate = candidates[candidateIndex];

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        await mongoose.connect(candidate.value, {
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
        });
        console.log(`✅ MongoDB Connected using ${candidate.label}`);

        startAutoConfirmService();
        startAutoFlagService();
        checkEmailConfig();

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
        return;
      } catch (err) {
        const isSrvTimeout = err?.code === 'ETIMEOUT' && err?.syscall === 'querySrv';
        const isSrvNotFound = err?.code === 'ENOTFOUND' && err?.syscall === 'querySrv';
        const hasFallback = candidates.length > 1 && candidate.label === 'MONGO_URI';

        console.error(
          `❌ MongoDB connection failed via ${candidate.label} (attempt ${attempt}/${maxRetries}):`,
          err.message
        );

        if (isSrvTimeout) {
          console.error('ℹ️  DNS SRV lookup timed out. Check internet/DNS/firewall and Atlas IP access list.');
          if (hasFallback) {
            console.log('↪️ Switching to MONGO_URI_DIRECT fallback (non-SRV URI).');
            break;
          }
        }

        if (isSrvNotFound) {
          console.error('ℹ️  MongoDB SRV hostname was not found (NXDOMAIN). Update MONGO_URI with a valid Atlas connection string.');
          if (hasFallback) {
            console.log('↪️ Switching to MONGO_URI_DIRECT fallback (non-SRV URI).');
            break;
          }
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        } else if (candidateIndex < candidates.length - 1) {
          console.log(`↪️ Exhausted ${candidate.label}. Trying next MongoDB URI candidate.`);
        }
      }
    }
  }

  process.exit(1);
};

connectToDatabase();
