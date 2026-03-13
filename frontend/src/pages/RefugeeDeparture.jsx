import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Upload, Send, ScanText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { extractDataFromDocument } from '../utils/ocr';

export default function RefugeeDeparture() {
  const [formData, setFormData] = useState({ name: '', dob: '', document_number: '', extra_info: '' });
  const [photo, setPhoto] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [ocrStatus, setOcrStatus] = useState('');
  const navigate = useNavigate();

  const handleDocumentUpload = async (e) => {
    const files = e.target.files;
    setDocuments(files);
    
    if (files.length > 0) {
      const extractedContent = await extractDataFromDocument(files[0], setOcrStatus);
      if (extractedContent) {
        setFormData(prev => ({
          ...prev,
          name: extractedContent.name || prev.name,
          dob: extractedContent.dob || prev.dob,
          document_number: extractedContent.document_number || prev.document_number
        }));
      }
      setTimeout(() => setOcrStatus(''), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!photo) {
      setMessage({ text: 'A photo is required for registering a refugee.', type: 'error' });
      setLoading(false);
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('photo', photo);
    for (let i = 0; i < documents.length; i++) {
        data.append('documents', documents[i]);
    }

    try {
      await axios.post('http://localhost:5000/api/refugees/departure', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ text: 'Refugee departure entry logged in central database.', type: 'success' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to submit entry', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Refugee Registration (Departure)</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Register new refugee entrants into the humanitarian system.</p>

      {message.text && (
        <div className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ display: 'block', marginBottom: '1.5rem', padding: '1rem', fontSize: '1rem' }}>
          {message.text}
        </div>
      )}

      {ocrStatus && (
        <div className="badge badge-warning" style={{ display: 'block', marginBottom: '1.5rem', padding: '1rem', fontSize: '1rem' }}>
          <ScanText size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          <span style={{ verticalAlign: 'middle' }}>{ocrStatus}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-input" required onChange={handleInputChange} value={formData.name} />
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input type="date" name="dob" className="form-input" required onChange={handleInputChange} value={formData.dob} />
          </div>
          <div className="form-group">
            <label className="form-label">Document Number (If available)</label>
            <input type="text" name="document_number" className="form-input" onChange={handleInputChange} value={formData.document_number} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Medical Needs / Extra Information</label>
          <textarea name="extra_info" className="form-textarea" rows="3" onChange={handleInputChange}></textarea>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Required Photo <Camera size={16} style={{display:'inline'}} /></label>
            <input type="file" required accept="image/*" capture="environment" className="form-input" onChange={(e) => setPhoto(e.target.files[0])} />
          </div>
          <div className="form-group">
            <label className="form-label">Identification Docs (Optional) <Upload size={16} style={{display:'inline'}} /></label>
            <input type="file" multiple className="form-input" onChange={handleDocumentUpload} />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="spinner"></div> : <><Send size={18} style={{marginRight: 8}} /> Register Refugee</>}
          </button>
        </div>
      </form>
    </div>
  );
}
