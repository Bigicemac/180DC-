const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.locals.dbConnected = false;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve static frontend files (index.html, styles.css, app.js) directly
app.use(express.static(path.join(__dirname, '..')));

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const loanRoutes = require('./routes/loans');
const emiRoutes = require('./routes/emis');
const fmexRoutes = require('./routes/fmex');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/emis', emiRoutes);
app.use('/api/fmex', fmexRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Web-backend (Macwatis API)',
    port: PORT,
    database: app.locals.dbConnected ? 'MongoDB connected' : 'In-memory fallback active',
    dbConnected: app.locals.dbConnected
  });
});

// ─── Connect to MongoDB & Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finly_db';

function startServer() {
  app.listen(PORT, () => {
    const mode = app.locals.dbConnected ? 'MongoDB Connected' : 'In-Memory Fallback Active';
    console.log(`🚀 Web-backend Server running on http://localhost:${PORT} [${mode}]`);
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
    console.log('⚠️  Starting server with IN-MEMORY store (ready for frontend connection)');
    app.locals.dbConnected = false;
    startServer();
  });
