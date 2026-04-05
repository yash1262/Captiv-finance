import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import brandImage from '../assets/captiv-brand.png';
import './Register.css';
import API_BASE_URL from '../utils/config';

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validate all fields
    if (!username) {
      setError('Please enter a username');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }
    if (!confirmPassword) {
      setError('Please confirm your password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!role) {
      setError('Please select a role');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role })
      });

      const data = await response.json();

      if (response.ok) {
        // Navigate to login
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('Server not reachable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="register-page">
      <div className="left-column">
        <div className="left-content">
          <img src={brandImage} alt="Captiv" className="brand-image" />
          <h1 className="brand-name">Captiv</h1>
          <p className="brand-tagline">Track. Analyze. Grow.</p>
        </div>
      </div>
      
      <div className="right-column">
        <div className="form-card">
          <h2 className="form-heading">Create Account</h2>
          <p className="form-subheading">Join Captiv today</p>
          
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Choose a username"
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
                placeholder="Create a password"
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
          
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label>Role</label>
            <select
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyPress={handleKeyPress}
            >
              <option value="">Select your role</option>
              <option value="Viewer">Viewer</option>
              <option value="Analyst">Analyst</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          {error && <p className="error-message">{error}</p>}
          
          <button
            className="btn-submit"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
          
          <p className="form-footer">
            Already have an account? <Link to="/login" className="link-text">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
