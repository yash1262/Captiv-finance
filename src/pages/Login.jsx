import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import brandImage from '../assets/captiv-brand.png';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('Login button clicked');
    
    // Validate inputs
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      console.log('Response status:', response.status);

      const data = await response.json();

      if (response.ok) {
        // Save token and user to localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server not reachable. Please check if the server is running on port 3000.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-page">
      <div className="left-column">
        <div className="left-content">
          <img src={brandImage} alt="Captiv" className="brand-image" />
          <h1 className="brand-name">Captiv</h1>
          <p className="brand-tagline">Track. Analyze. Grow.</p>
        </div>
      </div>
      
      <div className="right-column">
        <div className="form-card">
          <h2 className="form-heading">Welcome Back</h2>
          <p className="form-subheading">Sign in to your account</p>
          
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          
          {error && <p className="error-message">{error}</p>}
          
          <button
            className="btn-submit"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <p className="form-footer">
            Need an account? <Link to="/register" className="link-text">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
