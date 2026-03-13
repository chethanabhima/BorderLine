import Tesseract from 'tesseract.js';

export const extractDataFromDocument = async (file, setStatusMsg) => {
  try {
    setStatusMsg('Initializing OCR Engine...');
    const result = await Tesseract.recognize(file, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          setStatusMsg(`Scanning document... ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    const text = result.data.text;
    console.log("OCR Result Text:", text);
    
    // More robust parsing logic (MRZ + generic ID fallback)
    const parsedData = { name: '', dob: '', document_number: '' };
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Attempt 1: MRZ Parsing (Machine Readable Zone at bottom of passports)
    const mrzLines = lines.filter(l => l.match(/^[A-Z0-9<]{30,44}$/));
    if (mrzLines.length >= 2) {
      if (mrzLines[0].startsWith('P') && mrzLines[0].length >= 44) {
         const nameParts = mrzLines[0].substring(5).split('<<');
         if (nameParts.length >= 2) {
            const surname = nameParts[0].replace(/</g, ' ');
            const given = nameParts[1].replace(/</g, ' ');
            parsedData.name = `${given.trim()} ${surname.trim()}`.trim();
         }
         parsedData.document_number = mrzLines[1].substring(0, 9).replace(/</g, '');
         const dobStr = mrzLines[1].substring(13, 19);
         if (dobStr.match(/^\d{6}$/)) {
            let year = parseInt(dobStr.substring(0,2));
            year += (year > 50 ? 1900 : 2000);
            parsedData.dob = `${year}-${dobStr.substring(2,4)}-${dobStr.substring(4,6)}`;
         }
      }
    }

    // Fallback: Generic line-by-line parsing
    lines.forEach(line => {
      const lower = line.toLowerCase();
      
      // Document Number
      if (!parsedData.document_number) {
        if (/(document|passport|id|no\.?|number)[:\s]*([A-Z0-9]{6,15})/i.test(line)) {
          const match = line.match(/(?:document|passport|id|no\.?|number)[:\s]*([A-Z0-9]{6,15})/i);
          if (match) parsedData.document_number = match[1];
        } else if (/\b([A-Z0-9]{8,12})\b/.test(line) && lower.includes('id')) {
          const match = line.match(/\b([A-Z0-9]{8,12})\b/);
          if (match) parsedData.document_number = match[1];
        }
      }
      
      // DOB
      if (!parsedData.dob) {
        let dobMatch = line.match(/\b(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})\b/); // DD/MM/YYYY
        if (dobMatch) {
          parsedData.dob = `${dobMatch[3]}-${dobMatch[2]}-${dobMatch[1]}`;
        } else {
          dobMatch = line.match(/\b(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})\b/); // YYYY/MM/DD
          if (dobMatch) {
             parsedData.dob = `${dobMatch[1]}-${dobMatch[2]}-${dobMatch[3]}`;
          }
        }
      }

      // Name
      if (!parsedData.name) {
        if (/(name|given name|surname)[:\s]+([A-Za-z\s]{3,30})/i.test(line)) {
          const match = line.match(/(?:name|given name|surname)[:\s]+([A-Za-z\s]{3,30})/i);
          if (match) {
            parsedData.name = match[1].trim();
          }
        } else if (/^[A-Z][A-Z\s]{4,30}$/.test(line) && !lower.includes('republic') && !lower.includes('passport')) {
           // Fallback to fully capitalized lines that might be the name
           parsedData.name = line.trim();
        }
      }
    });

    console.log("Extracted Parsed Data:", parsedData);
    setStatusMsg('Document Scanned Successfully');
    return parsedData;
  } catch (error) {
    console.error("OCR Error:", error);
    setStatusMsg('Failed to scan document.');
    return null;
  }
};
