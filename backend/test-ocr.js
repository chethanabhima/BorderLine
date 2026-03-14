const fs = require('fs');
const path = require('path');

async function testOCR() {
  try {
    const filePath = path.join(__dirname, '../frontend/src/assets/hero.png');
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(filePath)], { type: 'image/png' });
    formData.append('document', blob, 'hero.png');
    
    const response = await fetch('http://localhost:5000/api/ocr', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", data);
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}
testOCR();
