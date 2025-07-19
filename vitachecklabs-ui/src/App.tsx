import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import Register from './pages/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import LabTests from './pages/LabTests';
import Reports from './pages/Reports';
import MyBookings from './pages/MyBookings';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/about" element={
          <ProtectedRoute>
            <About />
          </ProtectedRoute>
        } />
        <Route path="/lab-tests" element={
          <ProtectedRoute>
            <LabTests />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/my-bookings" element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;