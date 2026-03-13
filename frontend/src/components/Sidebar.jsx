import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserPlus, LogOut, FileCheck, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <ShieldCheck size={28} />
        <span>BCMS</span>
      </div>
      
      <nav className="nav-menu">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} end>
          <LayoutDashboard size={20} />
          Home
        </NavLink>
        
        {user.role === 'border_control' && (
          <>
            <NavLink to="/departure" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <UserPlus size={20} />
              Departure Form
            </NavLink>
            <NavLink to="/arrival" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Users size={20} />
              Arrival Verification
            </NavLink>
          </>
        )}

        {user.role === 'humanitarian' && (
          <>
            <NavLink to="/refugee-departure" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <UserPlus size={20} />
              Refugee Departure
            </NavLink>
            <NavLink to="/refugee-arrival" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <FileCheck size={20} />
              Refugee Check-in
            </NavLink>
          </>
        )}
      </nav>
      
      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Logged in as <strong>{user.username}</strong> ({user.role})
        </p>
        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', display: 'flex', gap: '0.5rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
