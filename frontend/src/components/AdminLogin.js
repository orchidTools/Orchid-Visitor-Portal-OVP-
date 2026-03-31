import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import API_BASE_URL from '../config';
import logo from '../images/logo.png';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials, type: 'admin' })
      });
      const result = await response.json();
      if (result.success) {
        // Store admin session
        const adminSession = {
          username: credentials.username,
          role: 'admin',
          loginTime: new Date().toISOString()
        };
        sessionStorage.setItem('adminSession', JSON.stringify(adminSession));
        localStorage.setItem('adminSession', JSON.stringify(adminSession));
        navigate('/admin-dashboard');
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error logging in');
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="logo-section">
          <img src={logo} alt="Orchid Logo" className="logo-image" />
        </div>
        <div className="portal-name">
          <span className="portal-orchid">Orchid</span>
          <span className="portal-visitor">Visitor</span>
          <span className="portal-portal">Portal</span>
        </div>
      </div>
      
      <div className="login-form-section">
        <h1 className="login-title">Admin Login</h1>
        <p className="login-subheading">Please contact the HR team for Credential or any Guidance</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">User Name</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Example"
              value={credentials.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="login-button">LOGIN</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;