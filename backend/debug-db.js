const mongoose = require('mongoose');
require('dotenv').config();
const Traveler = require('./models/Traveler');

async function checkTravelers() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('No MONGO_URI found');
      return;
    }
    await mongoose.connect(mongoUri);
    const travelers = await Traveler.find();
    console.log('Current Travelers in DB:');
    travelers.forEach(t => {
      console.log(`- Name: ${t.name}, Doc: ${t.document_number}, DOB: ${t.dob}, Status: ${t.status}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkTravelers();
