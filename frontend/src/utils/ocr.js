import axios from 'axios';

export const extractDataFromDocument = async (file, setStatusMsg) => {
  try {
    setStatusMsg('Uploading document for AI analysis...');
    
    const formData = new FormData();
    formData.append('document', file);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    
    const response = await axios.post(`${backendUrl}/api/ocr`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (percentCompleted < 100) {
          setStatusMsg(`Uploading document... ${percentCompleted}%`);
        } else {
          setStatusMsg('Analyzing document with Gemini AI...');
        }
      }
    });

    const parsedData = {
      name: response.data?.name || '',
      dob: response.data?.dob || '',
      document_number: response.data?.document_number || ''
    };

    console.log("Extracted Parsed Data (Gemini):", parsedData);
    setStatusMsg('Document Scanned Successfully');
    return parsedData;
  } catch (error) {
    console.error("OCR Error:", error);
    setStatusMsg(error.response?.data?.error || 'Failed to scan document.');
    return null;
  }
};

