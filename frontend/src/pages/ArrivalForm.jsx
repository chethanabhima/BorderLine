import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Upload, CheckCircle, AlertOctagon, ScanFace, ScanText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compareFaces } from '../utils/faceMatch';
import { extractDataFromDocument } from '../utils/ocr';
import LiveCamera from '../components/LiveCamera';

export default function ArrivalForm() {
  const [formData, setFormData] = useState({ name: '', dob: '', document_number: '', type: 'Tourist' });
  const [photo, setPhoto] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [faceMatchResult, setFaceMatchResult] = useState(null);
  const [faceMatchLoading, setFaceMatchLoading] = useState(false);
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

  const handleFaceMatch = async () => {
    setFaceMatchLoading(true);
    setFaceMatchResult(null);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (photo) data.append('photo', photo);
    for (let i = 0; i < documents.length; i++) {
        data.append('documents', documents[i]);
    }

    try {
      const res = await axios.post('http://localhost:5000/api/travelers/arrival/facematch', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFaceMatchResult(res.data);
    } catch (err) {
      console.error(err);
      setFaceMatchResult({
         success: false,
         results: [err.response?.data?.message || err.response?.data?.error || err.message || 'Face matching failed to execute.']
      });
    } finally {
      setFaceMatchLoading(false);
    }
  };

  const handleSubmit = async (finalStatus) => {
    setLoading(true);
    setResult(null);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (photo) data.append('photo', photo);
    for (let i = 0; i < documents.length; i++) {
        data.append('documents', documents[i]);
    }
    data.append('finalStatus', finalStatus);

    try {
      const res = await axios.post('http://localhost:5000/api/travelers/arrival/submit', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/');
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || 'Submission Failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Arrival Verification</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Cross-reference arrival details with central database.</p>

      {result && result.type === 'error' && (
        <div className="glass-panel border-l-4" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeftColor: 'var(--danger)', display:'flex', gap:'1rem', alignItems:'center' }}>
          <AlertOctagon size={32} color="var(--danger)" />
          <div>
            <h3 style={{margin:0, color:'var(--danger)'}}>System Error</h3>
            <p style={{margin:0}}>{result.message}</p>
          </div>
        </div>
      )}

      {ocrStatus && (
        <div className="badge badge-warning" style={{ display: 'block', marginBottom: '1.5rem', padding: '1rem', fontSize: '1rem' }}>
          <ScanText size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          <span style={{ verticalAlign: 'middle' }}>{ocrStatus}</span>
        </div>
      )}

      {faceMatchResult && (
        <div className={`glass-panel border-l-4 animate-fade-in`} style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeftColor: faceMatchResult.success ? 'var(--success)' : 'var(--danger)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: faceMatchResult.success ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ScanFace size={24} /> 3-Way Face Match Results
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {faceMatchResult.results.map((res, i) => (
              <li key={i} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                 {res}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Identity Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
            <label className="form-label">Full Name (Optional fallback)</label>
            <input type="text" name="name" className="form-input" onChange={handleInputChange} value={formData.name} />
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth (Optional fallback)</label>
            <input type="date" name="dob" className="form-input" onChange={handleInputChange} value={formData.dob} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Arrival Photo <Camera size={16} style={{display:'inline'}} /></label>
            <LiveCamera onCapture={(file) => setPhoto(file)} />
          </div>
          <div className="form-group">
            <label className="form-label">Supplementary Docs <Upload size={16} style={{display:'inline'}} /></label>
            <input type="file" multiple className="form-input" onChange={handleDocumentUpload} />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={handleFaceMatch} disabled={faceMatchLoading || !photo || !formData.document_number}>
             {faceMatchLoading ? 'Analyzing...' : <><ScanFace size={18} style={{marginRight: 8}} /> Verify Faces (3-Way)</>}
          </button>
          <button type="button" className="btn btn-secondary" style={{color: 'var(--danger)'}} onClick={() => handleSubmit('Denied')} disabled={loading || faceMatchLoading}>
            Reject Entry
          </button>
          <button type="button" className="btn btn-primary" onClick={() => handleSubmit('Arrived')} disabled={loading || faceMatchLoading}>
            {loading ? <div className="spinner"></div> : <><CheckCircle size={18} style={{marginRight: 8}} /> Confirm & Admit</>}
          </button>
        </div>
      </form>
    </div>
  );
}
