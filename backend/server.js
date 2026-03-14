const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const travelerRoutes = require('./routes/travelers');
const refugeeRoutes = require('./routes/refugees');
const ocrRoutes = require('./routes/ocr');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/travelers', travelerRoutes);
app.use('/api/refugees', refugeeRoutes);
app.use('/api/ocr', ocrRoutes);

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
    console.log(`Connected to MongoDB Cluster`);
    console.log(`Using Database: ${mongoose.connection.name}`);

    // Auto-seed initial users if using in-memory DB
    if (!process.env.MONGO_URI) {
      const User = require('./models/User');
      const bcrypt = require('bcryptjs');
      const adminCount = await User.countDocuments();
      if (adminCount === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        await User.create([
          { username: 'officer1', password: hashedPassword, role: 'border_control' },
          { username: 'staff1', password: hashedPassword, role: 'humanitarian' }
        ]);
        console.log('Database seeded with initial users (officer1 and staff1 / password123)');
      }
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
