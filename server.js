const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables before any service reads process.env
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('[Env] Loaded', envPath);
} else if (fs.existsSync(envExamplePath)) {
  dotenv.config({ path: envExamplePath });
  console.warn('[Env] .env not found — loaded .env.example instead. Copy it to .env for production.');
} else {
  dotenv.config();
  console.warn('[Env] No .env or .env.example found');
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { isSmsConfigured, getDosnetConfig, getMissingDosnetVars } = require('./services/dosnetSms');

const app = express();

// Global Security & Stability Middlewares
const { cacheInvalidator } = require('./middlewares/cacheMiddleware');

app.use(cacheInvalidator);

// Middlewares
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,https://alvaspragati.com,https://www.alvaspragati.com')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for simple admin panel if needed)
app.use(express.static('public'));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alvas-pragati')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Database connection check middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && mongoose.connection.readyState !== 1) {
    console.warn(`[DB Connection Check] Mongoose connection not ready. State: ${mongoose.connection.readyState}`);
    return res.status(503).json({
      message: 'Database connection is initializing. Please try again in a few seconds.'
    });
  }
  next();
});

// Define Routes
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('Alvas Pragati Backend is running!');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (isSmsConfigured()) {
    const sms = getDosnetConfig();
    console.log('[DOSNET SMS] Configured — registration SMS will be sent');
    console.log('[DOSNET SMS] API URL:', sms.apiUrl);
    console.log('[DOSNET SMS] Username:', sms.username);
    console.log('[DOSNET SMS] API Key:', sms.apiKey);
    console.log('[DOSNET SMS] Sender ID:', sms.senderId);
    console.log('[DOSNET SMS] Template ID:', sms.templateId);
  } else {
    console.warn('[DOSNET SMS] NOT configured — add DOSNET_* vars to .env file');
    console.warn('[DOSNET SMS] Missing:', getMissingDosnetVars().join(', ') || 'unknown');
  }
});
