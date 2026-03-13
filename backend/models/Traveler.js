const mongoose = require('mongoose');

const travelerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  document_number: { type: String, required: true },
  type: { type: String, enum: ['Tourist', 'Immigrant', 'Refugee'], required: true },
  origin_country: { type: String, required: true },
  extra_info: { type: String },
  documents: [{ type: String }], // Array of file paths
  photo: { type: String }, // Single file path
  status: { type: String, enum: ['Departed', 'Arrived', 'Flagged'], default: 'Departed' },
  entry_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Traveler', travelerSchema);
