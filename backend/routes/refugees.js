const express = require('express');
const Refugee = require('../models/Refugee');
const { verifyToken, isHumanitarian } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const refugees = await Refugee.find().sort({ entry_date: -1 });
    res.json(refugees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/departure', verifyToken, isHumanitarian, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'documents', maxCount: 5 }]), async (req, res) => {
  try {
    const { name, dob, document_number, extra_info } = req.body;
    const photoPath = req.files['photo'] ? req.files['photo'][0].path : null;
    const documentPaths = req.files['documents'] ? req.files['documents'].map(f => f.path) : [];

    const refugee = new Refugee({
      name, dob, document_number, extra_info,
      photo: photoPath, documents: documentPaths, verification_status: 'Pending'
    });

    await refugee.save();
    res.status(201).json(refugee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/arrival/verify', verifyToken, isHumanitarian, async (req, res) => {
  try {
    const { document_number, name, dob, verbal_verification_confirmed } = req.body;
    let refugee;

    if (document_number) {
      refugee = await Refugee.findOne({ document_number });
    }

    if (!refugee && name && dob) {
      refugee = await Refugee.findOne({ name: { $regex: name, $options: 'i' }, dob });
    }

    if (!refugee) return res.status(404).json({ message: 'Refugee not found in central database' });

    if (verbal_verification_confirmed) {
      refugee.verification_status = 'Verified';
      await refugee.save();
      
      // Generate temporary document logic (simulated by returning an ID string)
      const tempDocNumber = `REF-${refugee._id.toString().slice(-6).toUpperCase()}-TEMP`;
      
      return res.json({ 
        message: 'Refugee Identity Confirmed', 
        refugee,
        temporary_document: tempDocNumber
      });
    }

    res.json({ message: 'Match found, waiting for verbal verification', refugee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
