import React, { useState } from 'react';
import axios from 'axios';
import { Search, IdCard, CheckCircle, Navigation, Camera, ScanFace, ScanText, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compareFaces } from '../utils/faceMatch';
import { extractDataFromDocument } from '../utils/ocr';

export default function RefugeeArrival() {
  const [searchParams, setSearchParams] = useState({ document_number: '', name: '', dob: '' });
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(null);
  const [livePhoto, setLivePhoto] = useState(null);
  const [faceMatch, setFaceMatch] = useState({ status: 'idle', message: '' });
  const [ocrStatus, setOcrStatus] = useState('');
  const navigate = useNavigate();

  const handleSearchChange = (e) => setSearchParams({ ...searchParams, [e.target.name]: e.target.value });

  const handleDocumentUpload = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const extractedContent = await extractDataFromDocument(files[0], setOcrStatus);
      if (extractedContent) {
        setSearchParams(prev => ({
          ...prev,
          name: extractedContent.name || prev.name,
          dob: extractedContent.dob || prev.dob,
          document_number: extractedContent.document_number || prev.document_number
        }));
      }
      setTimeout(() => setOcrStatus(''), 5000);
    }
  };

  const runFaceMatch = async () => {
    if (!livePhoto || !matchData?.photo) {
       setFaceMatch({ status: 'error', message: 'A live photo and profile photo are required for matching.' });
       return;
    }
    setFaceMatch({ status: 'loading', message: 'Analyzing facial geometries...' });
    
    // Fetch profile image as blob/File for comparison
    try {
      const response = await fetch(`http://localhost:5000/${matchData.photo.replace(/\\/g, '/')}`);
      const blob = await response.blob();
      const profileImageFile = new File([blob], "profile.jpg", { type: blob.type });

      const res = await compareFaces(livePhoto, profileImageFile);
      if (res.success) {
        if (res.match) {
          setFaceMatch({ status: 'success', message: `High confidence match! Identity verified.` });
        } else {
          setFaceMatch({ status: 'error', message: `Alert: Faces do not match. Proceed with caution.` });
        }
      } else {
        setFaceMatch({ status: 'error', message: res.error || 'Failed to detect face.' });
      }
    } catch (err) {
      setFaceMatch({ status: 'error', message: 'Network error retrieving profile photo.' });
    }
  };

  const handleFindMatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMatchData(null);
    setSuccess(null);

    try {
      const res = await axios.post('http://localhost:5000/api/refugees/arrival/verify', { ...searchParams, verbal_verification_confirmed: false });
      setMatchData(res.data.refugee);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search for records');
    } finally {
      setLoading(false);
    }
  };

  const handleVerbalConfirm = async () => {
    setVerifying(true);
    try {
      const res = await axios.post('http://localhost:5000/api/refugees/arrival/verify', {
        name: matchData.name, dob: matchData.dob, document_number: matchData.document_number, verbal_verification_confirmed: true
      });
      setSuccess(res.data);
      setMatchData(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification Failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Refugee Camp Check-In Verification</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Search and verify incoming refugees upon arrival.</p>

      {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1.5rem', padding: '1rem', fontSize: '1rem' }}>{error}</div>}

      {success && (
        <div className="glass-panel border-l-4" style={{ padding: '2rem', marginBottom: '2rem', borderLeftColor: 'var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <CheckCircle size={32} color="var(--success)" />
            <h2 style={{ margin: 0, color: 'var(--success)' }}>Identity Verified</h2>
          </div>
          <p><strong>Name:</strong> {success.refugee.name}</p>
          <p><strong>Status:</strong> {success.refugee.verification_status}</p>
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--accent-primary)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Generated Temporary ID</p>
              <h3 style={{ margin: 0, letterSpacing: '0.1em' }}>{success.temporary_document}</h3>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Complete Check-In</button>
          </div>
        </div>
      )}

      {!matchData && !success && (
        <form onSubmit={handleFindMatch} className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>Search Database</h4>
            <div>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                <ScanText size={16} style={{display:'inline', marginRight: 8}} /> Auto-fill from ID
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleDocumentUpload} />
              </label>
            </div>
          </div>

          {ocrStatus && (
            <div className="badge badge-warning" style={{ display: 'block', marginBottom: '1.5rem', padding: '1rem', fontSize: '1rem' }}>
              <ScanText size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              <span style={{ verticalAlign: 'middle' }}>{ocrStatus}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Document Number (If available)</label>
              <input type="text" name="document_number" className="form-input" onChange={handleSearchChange} value={searchParams.document_number} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>- OR Search by Demographics -</span>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" className="form-input" onChange={handleSearchChange} value={searchParams.name} />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="dob" className="form-input" onChange={handleSearchChange} value={searchParams.dob} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : <><Search size={18} style={{marginRight: 8}} /> Search Network</>}
            </button>
          </div>
        </form>
      )}

      {matchData && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          <h4>Pending Verbal Verification</h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>A potential match was found. Please cross-reference the profile and perform verbal confirmation with the individual.</p>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <img 
              src={matchData.photo ? `http://localhost:5000/${matchData.photo.replace(/\\/g, '/')}` : 'https://via.placeholder.com/150?text=No+Photo'} 
              alt="Profile" 
              style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=Image+Error' }}
            />
            
            <div style={{ flex: 1 }}>
              <p><strong>Name:</strong> {matchData.name}</p>
              <p><strong>DOB:</strong> {new Date(matchData.dob).toLocaleDateString()}</p>
              <p><strong>Doc No:</strong> {matchData.document_number || 'None provided'}</p>
              <p><strong>Info:</strong> {matchData.extra_info || 'N/A'}</p>
              <p><strong>System Status:</strong> <span className="badge badge-warning">{matchData.verification_status}</span></p>
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <label className="form-label">Live Verification Capture <Camera size={16} style={{display:'inline'}} /></label>
            <input type="file" accept="image/*" capture="environment" className="form-input" onChange={(e) => setLivePhoto(e.target.files[0])} />
          </div>

          {faceMatch.status !== 'idle' && (
            <div className={`badge ${faceMatch.status === 'success' ? 'badge-success' : faceMatch.status === 'error' ? 'badge-danger' : 'badge-warning'}`} style={{ display: 'block', marginTop: '1.5rem', padding: '1rem', fontSize: '1rem' }}>
              <ScanFace size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              <span style={{ verticalAlign: 'middle' }}>{faceMatch.message}</span>
            </div>
          )}
          
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setMatchData(null)} disabled={verifying}>
              Cancel Match
            </button>
            {livePhoto && (
              <button className="btn btn-secondary" onClick={runFaceMatch} disabled={faceMatch.status === 'loading'}>
                {faceMatch.status === 'loading' ? 'Analyzing...' : 'Run Facial Match'}
              </button>
            )}
            <button className="btn btn-primary" onClick={handleVerbalConfirm} disabled={verifying}>
              {verifying ? <div className="spinner"></div> : 'Confirm Verbal Match & Generate Docs'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
