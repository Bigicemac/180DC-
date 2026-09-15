const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Track MongoDB connection state globally
app.locals.dbConnected = false;

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// Serve React Login App at /login
app.use('/login', express.static(path.join(__dirname, '../client/dist')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// API Route Layers
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const loanRoutes = require('./routes/loans');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/loans', loanRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Finly API is running',
    database: app.locals.dbConnected ? 'connected' : 'disconnected (in-memory fallback active)'
  });
});

// Database connection & server start
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finly_db';

function startServer() {
  app.listen(PORT, () => {
    const mode = app.locals.dbConnected ? 'MongoDB' : 'In-Memory Fallback';
    console.log(`🚀 Finly Backend Server running on http://localhost:${PORT} [${mode}]`);
  });
}

console.log('Connecting to MongoDB...');
mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.locals.dbConnected = true;
    startServer();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Starting server with IN-MEMORY user store (data will not persist across restarts)');
    app.locals.dbConnected = false;
    startServer();
  });
