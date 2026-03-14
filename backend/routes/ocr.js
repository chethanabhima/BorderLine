const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const fs = require('fs');
const { GoogleGenAI, Type, Schema } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document image provided' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);

    const prompt = `
Extract the following information from this official document (passport, ID card, visa, etc):
1. The person's full name
2. Their date of birth
3. The official document number

Focus on accuracy. If you cannot find a field confidently, return an empty string for it.
`;

    // Define the expected JSON structure
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The full name of the person on the document. E.g., John Public Doe",
          },
          dob: {
            type: Type.STRING,
            description: "The date of birth in YYYY-MM-DD format.",
          },
          document_number: {
            type: Type.STRING,
            description: "The primary document number (e.g., Passport Number or ID Number).",
          }
        },
        required: ["name", "dob", "document_number"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType: req.file.mimetype || 'image/jpeg'
          }
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    // Output is expected to be a valid JSON string matching the schema
    let responseText = response.text;
    if (typeof responseText === 'function') {
      responseText = response.text();
    }
    const extractedData = JSON.parse(responseText);
    
    // Clean up the uploaded file to save space
    fs.unlinkSync(req.file.path);

    res.json(extractedData);

  } catch (err) {
    if (err.status) {
      console.error('OCR Error Status:', err.status, err.message);
    } else {
      console.error('OCR Error:', err.message || err);
    }
    res.status(500).json({ error: 'Failed to process document with Gemini OCR' });
  }
});

module.exports = router;
