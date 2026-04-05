import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './DashboardLayout.css';
import API_BASE_URL from '../utils/config';

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [kpiData, setKpiData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    savingsRate: 0,
    incomeChange: 0,
    expenseChange: 0
  });

  useEffect(() => {
    // Check for token
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get user info
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    // Load KPI data for sidebar
    loadKPIData();

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const loadKPIData = async () => {
    const token = localStorage.getItem('authToken');
    console.log('Loading KPI data with token:', token ? 'exists' : 'missing');
    
    try {
      const [summary, comparison] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard/summary`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/dashboard/monthly-comparison`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
      ]);

      console.log('Summary data:', summary);
      console.log('Comparison data:', comparison);

      const savingsRate = summary.totalIncome > 0 
        ? ((summary.netBalance / summary.totalIncome) * 100).toFixed(1)
        : 0;

      const incomeChange = comparison.previousMonth.income > 0
        ? (((comparison.currentMonth.income - comparison.previousMonth.income) / comparison.previousMonth.income) * 100).toFixed(1)
        : 0;

      const expenseChange = comparison.previousMonth.expense > 0
        ? (((comparison.currentMonth.expense - comparison.previousMonth.expense) / comparison.previousMonth.expense) * 100).toFixed(1)
        : 0;

      const kpiValues = {
        totalIncome: summary.totalIncome || 0,
        totalExpense: summary.totalExpense || 0,
        netBalance: summary.netBalance || 0,
        savingsRate: parseFloat(savingsRate),
        incomeChange: parseFloat(incomeChange),
        expenseChange: parseFloat(expenseChange)
      };

      console.log('Setting KPI data:', kpiValues);
      setKpiData(kpiValues);
    } catch (error) {
      console.error('Error loading KPI data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₹', 'Rs ');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="dashboard-layout-powerbi">
      <div className="sidebar-kpi">
        <div className="sidebar-header">
          <div className="app-logo">Captiv</div>
        </div>
        
        <div className="sidebar-divider"></div>
        
        <div className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <span>Dashboard</span>
          </Link>
          <Link
            to="/records"
            className={`nav-item ${isActive('/records') ? 'active' : ''}`}
          >
            <span>Records</span>
          </Link>
          <Link
            to="/analytics"
            className={`nav-item ${isActive('/analytics') ? 'active' : ''}`}
          >
            <span>Analytics</span>
          </Link>
          {currentUser.role === 'Admin' && (
            <Link
              to="/users"
              className={`nav-item ${isActive('/users') ? 'active' : ''}`}
            >
              <span>Users</span>
            </Link>
          )}
          <Link
            to="/settings"
            className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
          >
            <span>Settings</span>
          </Link>
        </div>

        <div className="sidebar-divider"></div>

        <div className="kpi-section-label">OVERVIEW</div>
        <div className="kpi-cards-sidebar">
          <div className="kpi-card-sidebar">
            <div className="kpi-card-top">
              <div className="kpi-label">TOTAL INCOME</div>
              <div className={`kpi-change ${kpiData.incomeChange >= 0 ? 'positive' : 'negative'}`}>
                {kpiData.incomeChange >= 0 ? '↑' : '↓'}{Math.abs(kpiData.incomeChange)}%
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(kpiData.totalIncome)}</div>
          </div>

          <div className="kpi-card-sidebar">
            <div className="kpi-card-top">
              <div className="kpi-label">TOTAL EXPENSES</div>
              <div className={`kpi-change ${kpiData.expenseChange <= 0 ? 'positive' : 'negative'}`}>
                {kpiData.expenseChange >= 0 ? '↑' : '↓'}{Math.abs(kpiData.expenseChange)}%
              </div>
            </div>
            <div className="kpi-value">{formatCurrency(kpiData.totalExpense)}</div>
          </div>

          <div className="kpi-card-sidebar">
            <div className="kpi-card-top">
              <div className="kpi-label">NET BALANCE</div>
              <div className="kpi-change neutral">Current</div>
            </div>
            <div className={`kpi-value ${kpiData.netBalance >= 0 ? 'positive-text' : 'negative-text'}`}>
              {formatCurrency(kpiData.netBalance)}
            </div>
          </div>

          <div className="kpi-card-sidebar">
            <div className="kpi-card-top">
              <div className="kpi-label">SAVINGS RATE</div>
              <div className={`kpi-change ${kpiData.savingsRate >= 20 ? 'positive' : kpiData.savingsRate >= 10 ? 'neutral' : 'negative'}`}>
                {kpiData.savingsRate >= 20 ? 'Excellent' : kpiData.savingsRate >= 10 ? 'Good' : 'Low'}
              </div>
            </div>
            <div className="kpi-value">{kpiData.savingsRate}%</div>
          </div>
        </div>

        <div className="notes-section">
          <div className="notes-label">NOTES</div>
          <textarea 
            className="notes-textarea" 
            placeholder="Quick notes..."
            defaultValue={localStorage.getItem('dashboardNotes') || ''}
            onChange={(e) => localStorage.setItem('dashboardNotes', e.target.value)}
          />
        </div>
        
        <div className="sidebar-spacer"></div>
        
        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{currentUser.username}</div>
              <div className="user-role-badge">{currentUser.role}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="main-wrapper-powerbi">
        <nav className="top-header-powerbi">
          <div className="header-left">
            <h1 className="page-title">
              {location.pathname === '/dashboard' && 'Dashboard'}
              {location.pathname === '/records' && 'Financial Records'}
              {location.pathname === '/analytics' && 'Analytics'}
              {location.pathname === '/settings' && 'Settings'}
              {location.pathname === '/users' && 'User Management'}
            </h1>
          </div>
          <div className="header-center">
            <div className="date-time-display">
              <div className="current-date">{formatDate()}</div>
              <div className="current-time">{formatTime()}</div>
            </div>
          </div>
          <div className="header-right">
            <div className="header-user">{currentUser.username}</div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>
        
        <div className="content-powerbi">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
