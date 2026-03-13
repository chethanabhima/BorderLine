import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DepartureForm from './pages/DepartureForm';
import ArrivalForm from './pages/ArrivalForm';
import RefugeeDeparture from './pages/RefugeeDeparture';
import RefugeeArrival from './pages/RefugeeArrival';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  console.log("App mounted");
  const { user, loading } = useAuth();

  if (loading) return <div>Loading Context...</div>;

  return (
    <BrowserRouter>
      {user ? (
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/departure" element={<ProtectedRoute allowedRoles={['border_control']}><DepartureForm /></ProtectedRoute>} />
              <Route path="/arrival" element={<ProtectedRoute allowedRoles={['border_control']}><ArrivalForm /></ProtectedRoute>} />
              <Route path="/refugee-departure" element={<ProtectedRoute allowedRoles={['humanitarian']}><RefugeeDeparture /></ProtectedRoute>} />
              <Route path="/refugee-arrival" element={<ProtectedRoute allowedRoles={['humanitarian']}><RefugeeArrival /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
