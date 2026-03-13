import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Upload, Send, ScanText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { extractDataFromDocument } from '../utils/ocr';

export default function DepartureForm() {
  const [formData, setFormData] = useState({
    name: '', dob: '', document_number: '', type: 'Tourist', origin_country: '', extra_info: ''
  });
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

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (photo) data.append('photo', photo);
    for (let i = 0; i < documents.length; i++) {
        data.append('documents', documents[i]);
    }

    try {
      await axios.post('http://localhost:5000/api/travelers/departure', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ text: 'Departure record successfully created.', type: 'success' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to submit form', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Departure Entry Form</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Log an individual leaving their country of origin.</p>

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
            <label className="form-label">Document Number</label>
            <input type="text" name="document_number" className="form-input" required onChange={handleInputChange} value={formData.document_number} />
          </div>
          <div className="form-group">
            <label className="form-label">Traveler Type</label>
            <select name="type" className="form-select" onChange={handleInputChange} value={formData.type}>
              <option value="Tourist">Tourist</option>
              <option value="Immigrant">Immigrant</option>
              <option value="Refugee">Refugee</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Country of Origin</label>
            <input type="text" name="origin_country" className="form-input" required onChange={handleInputChange} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Additional Information</label>
          <textarea name="extra_info" className="form-textarea" rows="3" onChange={handleInputChange}></textarea>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Capture Photo <Camera size={16} style={{display:'inline', marginLeft:4}} /></label>
            <input type="file" accept="image/*" capture="environment" className="form-input" onChange={(e) => setPhoto(e.target.files[0])} />
          </div>
          <div className="form-group">
            <label className="form-label">Upload Documents (Max 5) <Upload size={16} style={{display:'inline', marginLeft:4}} /></label>
            <input type="file" multiple className="form-input" onChange={handleDocumentUpload} />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="spinner"></div> : <><Send size={18} style={{marginRight: 8}} /> Submit Entry</>}
          </button>
        </div>
      </form>
    </div>
  );
}
