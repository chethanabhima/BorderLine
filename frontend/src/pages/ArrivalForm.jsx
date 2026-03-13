import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Upload, CheckCircle, AlertOctagon, ScanFace, ScanText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compareFaces } from '../utils/faceMatch';
import { extractDataFromDocument } from '../utils/ocr';

export default function ArrivalForm() {
  const [formData, setFormData] = useState({ name: '', dob: '', document_number: '', type: 'Tourist' });
  const [photo, setPhoto] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [faceMatch, setFaceMatch] = useState({ status: 'idle', message: '' });
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

  const runFaceMatch = async () => {
    if (!photo || documents.length === 0) {
       setFaceMatch({ status: 'error', message: 'Please upload both an Arrival Photo and an ID Document with a face.' });
       return;
    }
    setFaceMatch({ status: 'loading', message: 'Analyzing facial geometries...' });
    const res = await compareFaces(photo, documents[0]);
    if (res.success) {
      if (res.match) {
        setFaceMatch({ status: 'success', message: `High confidence match! (Distance: ${res.distance.toFixed(2)})` });
      } else {
        setFaceMatch({ status: 'error', message: `Faces do not match. (Distance: ${res.distance.toFixed(2)})` });
      }
    } else {
      setFaceMatch({ status: 'error', message: res.error || 'Failed to detect face in one or both images.' });
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (photo) data.append('photo', photo);
    for (let i = 0; i < documents.length; i++) {
        data.append('documents', documents[i]);
    }

    try {
      const res = await axios.post('http://localhost:5000/api/travelers/arrival/verify', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult({ type: 'success', data: res.data });
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || 'Verification Failed. Subject flag required.' });
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
            <h3 style={{margin:0, color:'var(--danger)'}}>Verification Alert</h3>
            <p style={{margin:0}}>{result.message}</p>
          </div>
        </div>
      )}

      {result && result.type === 'success' && (
        <div className="glass-panel border-l-4" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeftColor: 'var(--success)', display:'flex', gap:'1rem', alignItems:'center' }}>
          <CheckCircle size={32} color="var(--success)" />
          <div style={{flex: 1}}>
            <h3 style={{margin:0, color:'var(--success)'}}>{result.data.message}</h3>
            <p style={{margin:0, color:'var(--text-secondary)'}}>Matched Identity: {result.data.traveler.name} ({result.data.traveler.document_number})</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>View Dashboard</button>
        </div>
      )}

      {faceMatch.status !== 'idle' && (
        <div className={`badge ${faceMatch.status === 'success' ? 'badge-success' : faceMatch.status === 'error' ? 'badge-danger' : 'badge-warning'}`} style={{ display: 'block', marginBottom: '1.5rem', padding: '1rem', fontSize: '1rem' }}>
          <ScanFace size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          <span style={{ verticalAlign: 'middle' }}>{faceMatch.message}</span>
        </div>
      )}

      {ocrStatus && (
        <div className="badge badge-warning" style={{ display: 'block', marginBottom: '1.5rem', padding: '1rem', fontSize: '1rem' }}>
          <ScanText size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          <span style={{ verticalAlign: 'middle' }}>{ocrStatus}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="glass-panel" style={{ padding: '2rem' }}>
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
            <input type="file" accept="image/*" capture="environment" className="form-input" onChange={(e) => setPhoto(e.target.files[0])} />
          </div>
          <div className="form-group">
            <label className="form-label">Supplementary Docs <Upload size={16} style={{display:'inline'}} /></label>
            <input type="file" multiple className="form-input" onChange={handleDocumentUpload} />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {photo && documents.length > 0 && (
            <button type="button" className="btn btn-secondary" onClick={runFaceMatch} disabled={faceMatch.status === 'loading'}>
              {faceMatch.status === 'loading' ? 'Analyzing...' : <><ScanFace size={18} style={{marginRight: 8}} /> Verify Faces</>}
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading || faceMatch.status === 'loading'}>
            {loading ? <div className="spinner"></div> : <><CheckCircle size={18} style={{marginRight: 8}} /> Submit Verification</>}
          </button>
        </div>
      </form>
    </div>
  );
}
