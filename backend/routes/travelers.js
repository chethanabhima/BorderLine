const express = require('express');
const Traveler = require('../models/Traveler');
const { verifyToken, isBorderControl } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
const { compareFacesBackend } = require('../utils/faceMatchBackend');
const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

// Finalize Arrival (One-Step)
router.post('/arrival/submit', verifyToken, isBorderControl, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'documents', maxCount: 5 }]), async (req, res) => {
  try {
    const { document_number, name, dob, type, finalStatus } = req.body;

    if (!['Arrived', 'Denied'].includes(finalStatus)) {
        return res.status(400).json({ message: 'Invalid final status provided.' });
    }

    // Try to match traveler
    const traveler = await Traveler.findOne({
      $or: [
        { document_number: document_number?.replace(/\s+/g, '').toUpperCase() },
        { name: { $regex: name?.trim(), $options: 'i' }, dob }
      ]
    });

    if (!traveler) {
      return res.status(404).json({ message: 'No matching record found in Central DB.' });
    }

    let verificationNotes = [];
    let isFlagged = false;

    // Optional: Still run diagnostics for logging/audit
    if (req.files['photo']) {
      const livePhotoPath = req.files['photo'][0].path;
      if (traveler.photo) {
        const faceResultDB = await compareFacesBackend(livePhotoPath, traveler.photo);
        if (!faceResultDB.success || !faceResultDB.match) {
           isFlagged = true;
           verificationNotes.push('Facial mismatch with baseline.');
        }
      }
      traveler.photo = livePhotoPath;
    }

    if (req.files['documents'] && req.files['documents'].length > 0) {
      const newDocs = req.files['documents'].map(file => file.path);
      traveler.documents.push(...newDocs);
    }

    // Direct Finalization
    traveler.status = finalStatus;
    await traveler.save();
    
    res.json({ 
      message: `Arrival finalized as ${finalStatus}`, 
      notes: verificationNotes, 
      isFlagged: isFlagged,
      traveler 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Standalone Face Match API (Three-Way check)
router.post('/arrival/facematch', verifyToken, isBorderControl, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'documents', maxCount: 5 }]), async (req, res) => {
  try {
    const { document_number, name, dob } = req.body;

    const traveler = await Traveler.findOne({
      $or: [
        { document_number },
        { name: { $regex: name, $options: 'i' }, dob }
      ]
    });

    if (!traveler) {
      return res.status(404).json({ message: 'No matching record found in Central DB for baseline.' });
    }

    let results = [];
    let allMatch = true;

    if (req.files['photo']) {
      const livePhotoPath = req.files['photo'][0].path;

      // 1. Compare against Database
      if (traveler.photo) {
        const faceResultDB = await compareFacesBackend(livePhotoPath, traveler.photo);
        if (!faceResultDB.success || !faceResultDB.match) {
          allMatch = false;
          results.push(`❌ Central DB Match Failed: ${faceResultDB.error || 'Faces do not match'}`);
        } else {
          results.push('✅ Central DB Match: Passed');
        }
      } else {
         results.push('⚠️ Central DB Match: No baseline photo found in system.');
      }

      // 2. Compare against Uploaded ID Document
      if (req.files['documents'] && req.files['documents'].length > 0) {
        const documentPhotoPath = req.files['documents'][0].path;
        const faceResultDoc = await compareFacesBackend(livePhotoPath, documentPhotoPath);
        if (!faceResultDoc.success || !faceResultDoc.match) {
          allMatch = false;
          results.push(`❌ ID Document Match Failed: ${faceResultDoc.error || 'Faces do not match'}`);
        } else {
          results.push('✅ ID Document Match: Passed');
        }
      } else {
         results.push('⚠️ ID Document Match: Skipped (no document uploaded).');
         allMatch = false;
      }
    } else {
       results.push('❌ Live photo required for verification.');
       allMatch = false;
    }

    res.json({ success: allMatch, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Finalize Arrival Verification (Manual Confirm/Deny)
router.post('/arrival/confirm', verifyToken, isBorderControl, async (req, res) => {
  try {
    const { travelerId, finalStatus } = req.body; // finalStatus should be 'Arrived' or 'Denied'

    if (!['Arrived', 'Denied'].includes(finalStatus)) {
      return res.status(400).json({ message: 'Invalid final status provided.' });
    }

    const traveler = await Traveler.findById(travelerId);
    if (!traveler) {
      return res.status(404).json({ message: 'Traveler record not found.' });
    }

    traveler.status = finalStatus;
    await traveler.save();

    res.json({ message: `Traveler status finalized as ${finalStatus}`, traveler });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
