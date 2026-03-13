const express = require('express');
const Traveler = require('../models/Traveler');
const { verifyToken, isBorderControl } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

const router = express.Router();

// Get all travelers (with optional filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const filters = {};
    if (req.query.name) filters.name = { $regex: req.query.name, $options: 'i' };
    if (req.query.nationality) filters.origin_country = { $regex: req.query.nationality, $options: 'i' };
    if (req.query.type) filters.type = req.query.type;
    if (req.query.status) filters.status = req.query.status;
    
    const travelers = await Traveler.find(filters).sort({ entry_date: -1 });
    res.json(travelers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Departure Form (Creates a new traveler record)
router.post('/departure', verifyToken, isBorderControl, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'documents', maxCount: 5 }]), async (req, res) => {
  try {
    const { name, dob, document_number, type, origin_country, extra_info } = req.body;
    
    const photoPath = req.files['photo'] ? req.files['photo'][0].path : null;
    const documentPaths = req.files['documents'] ? req.files['documents'].map(file => file.path) : [];

    const traveler = new Traveler({
      name, dob, document_number, type, origin_country, extra_info,
      photo: photoPath, documents: documentPaths, status: 'Departed'
    });

    await traveler.save();
    res.status(201).json(traveler);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Arrival Verification
router.post('/arrival/verify', verifyToken, isBorderControl, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'documents', maxCount: 5 }]), async (req, res) => {
  try {
    const { document_number, name, dob, type } = req.body;

    // Try to match traveler
    const traveler = await Traveler.findOne({
      $or: [
        { document_number },
        { name: { $regex: name, $options: 'i' }, dob }
      ]
    });

    if (!traveler) {
      return res.status(404).json({ message: 'No matching record found. Further investigation required.' });
    }

    // Update status mapping
    traveler.status = 'Arrived';
    
    // Add additional uploaded docs/photos if necessary
    if (req.files['photo']) traveler.photo = req.files['photo'][0].path;
    if (req.files['documents']) {
      const newDocs = req.files['documents'].map(file => file.path);
      traveler.documents.push(...newDocs);
    }

    await traveler.save();
    res.json({ message: 'Identity Verified. Arrival processed successfully.', traveler });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
