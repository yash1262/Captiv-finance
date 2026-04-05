import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Users from './pages/Users';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRoute from './components/AuthRoute';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if splash was already seen in this session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    
    if (hasSeenSplash === 'true') {
      setShowSplash(false);
      setSplashComplete(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
    setSplashComplete(true);
    
    // Navigate based on auth status
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  // Show splash screen
  if (showSplash && !splashComplete) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show routes after splash completes
  return (
    <Routes>
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
      </Route>
      
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
        <Route path="/records" element={<DashboardLayout><Records /></DashboardLayout>} />
        <Route path="/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
        <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
        <Route path="/users" element={<DashboardLayout><Users /></DashboardLayout>} />
      </Route>
      
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
