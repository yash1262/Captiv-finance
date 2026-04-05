import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function AuthRoute() {
  const token = localStorage.getItem('authToken');
  
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}

export default AuthRoute;
