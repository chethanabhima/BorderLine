const mongoose = require('mongoose');

const refugeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  document_number: { type: String }, // Optional for refugees
  photo: { type: String, required: true },
  documents: [{ type: String }],
  extra_info: { type: String },
  verification_status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  entry_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Refugee', refugeeSchema);
