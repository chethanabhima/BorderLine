import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.document_number && item.document_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
          <button className="btn btn-secondary"><Filter size={18} /> Filters</button>
        </div>

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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
