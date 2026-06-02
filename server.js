const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
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
});
