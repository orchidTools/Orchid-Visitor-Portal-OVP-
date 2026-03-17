import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Form.css';
import API_BASE_URL from '../config';

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
    <div className="form-container">
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Username" value={credentials.username} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={credentials.password} onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default AdminLogin;