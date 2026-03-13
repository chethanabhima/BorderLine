const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const travelerRoutes = require('./routes/travelers');
const refugeeRoutes = require('./routes/refugees');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/travelers', travelerRoutes);
app.use('/api/refugees', refugeeRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    let mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('No MONGO_URI provided in .env, starting in-memory MongoDB...');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }

    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB: ${mongoUri.startsWith('mongodb://127.0.0.1') ? 'Memory Server' : 'Remote'}`);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
