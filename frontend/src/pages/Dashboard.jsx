import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, RefreshCw, Eye, X, Image as ImageIcon } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    startDate: '',
    endDate: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = user.role === 'border_control' ? 'http://localhost:5000/api/travelers' : 'http://localhost:5000/api/refugees';
      const res = await axios.get(endpoint);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const filteredData = data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.document_number && item.document_number.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const itemStatus = item.status || item.verification_status;
    const matchesStatus = filters.status ? itemStatus === filters.status : true;
    const matchesType = filters.type ? item.type === filters.type : true;
    
    let matchesDate = true;
    if (filters.startDate || filters.endDate) {
      const itemDate = new Date(item.entry_date);
      itemDate.setHours(0, 0, 0, 0); // Normalize time
      
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) matchesDate = false;
      }
      
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const openModal = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRecord(null);
    setIsModalOpen(false);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user.username}. Here are the latest updates.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>
          <RefreshCw size={18} style={{ marginRight: '0.5rem' }} className={loading ? 'spinner' : ''} /> Refresh
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel stat-card border-l-4" style={{borderLeftColor: 'var(--accent-primary)'}}>
          <span className="stat-title">Total Records</span>
          <span className="stat-value">{data.length}</span>
        </div>
        <div className="glass-panel stat-card" style={{borderLeftColor: 'var(--warning)'}}>
          <span className="stat-title">{user.role === 'border_control' ? 'Departed' : 'Pending Verification'}</span>
          <span className="stat-value">
            {data.filter(d => d.status === 'Departed' || d.verification_status === 'Pending').length}
          </span>
        </div>
        <div className="glass-panel stat-card" style={{borderLeftColor: 'var(--success)'}}>
          <span className="stat-title">{user.role === 'border_control' ? 'Processed Arrivals' : 'Verified Arrivals'}</span>
          <span className="stat-value">
            {data.filter(d => d.status === 'Arrived' || d.verification_status === 'Verified').length}
          </span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '3rem' }} 
              placeholder="Search by name or document number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} /> Filters
          </button>
        </div>

        {showFilters && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.875rem' }}>Status</label>
              <select 
                className="form-select" 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Statuses</option>
                <option value="Departed">Departed</option>
                <option value="Arrived">Arrived</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
              </select>
            </div>
            
            {user.role === 'border_control' && (
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.875rem' }}>Traveler Type</label>
                <select 
                  className="form-select" 
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="Tourist">Tourist</option>
                  <option value="Immigrant">Immigrant</option>
                  <option value="Refugee">Refugee</option>
                </select>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.875rem' }}>From Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label" style={{ fontSize: '0.875rem' }}>To Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setFilters({ status: '', type: '', startDate: '', endDate: '' })}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>DOB</th>
                <th>Document No.</th>
                {user.role === 'border_control' && <th>Origin</th>}
                {user.role === 'border_control' && <th>Type</th>}
                <th>Entry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{margin:'0 auto'}}></div></td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No records found.</td></tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>{new Date(item.dob).toLocaleDateString()}</td>
                    <td>{item.document_number || <span style={{color:'var(--text-secondary)'}}>None</span>}</td>
                    {user.role === 'border_control' && <td>{item.origin_country}</td>}
                    {user.role === 'border_control' && <td>
                      <span className={`badge ${item.type === 'Refugee' ? 'badge-warning' : 'badge-neutral'}`}>{item.type}</span>
                    </td>}
                    <td>{new Date(item.entry_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${
                        (item.status === 'Arrived' || item.verification_status === 'Verified') ? 'badge-success' : 'badge-warning'
                      }`}>
                        {item.status || item.verification_status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={() => openModal(item)}>
                        <Eye size={14} style={{ marginRight: '4px' }}/> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={closeModal} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Record Details</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              <div>
                <h4 style={{ marginBottom: '1rem' }}>Profile Photo</h4>
                {selectedRecord.photo ? (
                  <img 
                    src={getImageUrl(selectedRecord.photo)} 
                    alt="Profile" 
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/200?text=Image+Not+Found' }}
                  />
                ) : (
                  <div style={{ width: '100%', paddingTop: '100%', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', position: 'relative', border: '1px dashed var(--border-color)' }}>
                     <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                       <ImageIcon size={32} style={{ margin: '0 auto 8px' }} />
                       <span style={{ fontSize: '0.875rem' }}>No Photo</span>
                     </div>
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ marginBottom: '1rem' }}>Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Full Name</label>
                    <p style={{ fontWeight: 500, margin: '0.25rem 0 0 0' }}>{selectedRecord.name}</p>
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Date of Birth</label>
                    <p style={{ fontWeight: 500, margin: '0.25rem 0 0 0' }}>{new Date(selectedRecord.dob).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Document Number</label>
                    <p style={{ fontWeight: 500, margin: '0.25rem 0 0 0' }}>{selectedRecord.document_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Status</label>
                    <p style={{ fontWeight: 500, margin: '0.25rem 0 0 0' }}>
                      <span className={`badge ${(selectedRecord.status === 'Arrived' || selectedRecord.verification_status === 'Verified') ? 'badge-success' : 'badge-warning'}`}>
                        {selectedRecord.status || selectedRecord.verification_status}
                      </span>
                    </p>
                  </div>
                  
                  {user.role === 'border_control' && (
                    <>
                      <div>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Origin Country</label>
                        <p style={{ fontWeight: 500, margin: '0.25rem 0 0 0' }}>{selectedRecord.origin_country}</p>
                      </div>
                      <div>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Traveler Type</label>
                        <p style={{ fontWeight: 500, margin: '0.25rem 0 0 0' }}>{selectedRecord.type}</p>
                      </div>
                    </>
                  )}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Extra Information</label>
                    <p style={{ fontWeight: 500, margin: '0.25rem 0 0 0', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '4px' }}>
                      {selectedRecord.extra_info || 'No additional information provided.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {selectedRecord.documents && selectedRecord.documents.length > 0 && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Uploaded Documents</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {selectedRecord.documents.map((doc, idx) => (
                    <div key={idx} style={{ position: 'relative', paddingTop: '141%', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                       <img 
                          src={getImageUrl(doc)} 
                          alt={`Document ${idx + 1}`} 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x210?text=Doc+Error' }}
                       />
                       <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '0.25rem', textAlign: 'center', fontSize: '0.75rem' }}>
                          Doc {idx + 1}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
