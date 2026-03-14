const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkUsers() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('No MONGO_URI found');
      return;
    }
    await mongoose.connect(mongoUri);
    const users = await User.find();
    console.log('Current Users in DB:');
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Role: ${u.role}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkUsers();
