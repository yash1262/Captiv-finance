require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recordRoutes = require('./routes/recordRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS must be configured before routes
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database and import Excel data
initDatabase();

// Seed database after a short delay to ensure tables are created
setTimeout(() => {
  const { seedDatabase } = require('./seedData');
  seedDatabase();
}, 2000);

// Routes
console.log('Mounting routes...');
app.use('/api/auth', authRoutes);
console.log('Auth routes mounted at /api/auth');
app.use('/api/users', userRoutes);
console.log('User routes mounted at /api/users');
app.use('/api/records', recordRoutes);
console.log('Record routes mounted at /api/records');
app.use('/api/dashboard', dashboardRoutes);
console.log('Dashboard routes mounted at /api/dashboard');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
