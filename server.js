const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { isSmsConfigured } = require('./services/dosnetSms');

// Load environment variables (.env required; .env.example fallback for local dev)
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

const app = express();

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

// Define Routes
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('Alvas Pragati Backend is running!');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (isSmsConfigured()) {
    console.log('[DOSNET SMS] Configured — registration SMS will be sent');
    console.log('[DOSNET SMS] API URL:', process.env.DOSNET_API_URL);
    console.log('[DOSNET SMS] Username:', process.env.DOSNET_USERNAME);
    console.log('[DOSNET SMS] Sender ID:', process.env.DOSNET_SENDERID);
    console.log('[DOSNET SMS] Template ID:', process.env.DOSNET_TEMPLATE_ID);
  } else {
    console.warn('[DOSNET SMS] NOT configured — add DOSNET_* vars to .env file');
    console.warn('[DOSNET SMS] Missing:', getMissingDosnetVars().join(', ') || 'unknown');
  }
});

function getMissingDosnetVars() {
  const required = [
    'DOSNET_API_URL',
    'DOSNET_API_KEY',
    'DOSNET_USERNAME',
    'DOSNET_SENDERID',
  ];
  return required.filter((key) => !process.env[key]);
}
