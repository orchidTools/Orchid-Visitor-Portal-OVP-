import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Form.css';

const SalesLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials, type: 'sales' })
      });
      const result = await response.json();
      if (result.success) {
        // Store user session info
        const sessionData = {
          userId: result.userId,
          username: result.username,
          name: result.name
        };
        sessionStorage.setItem('salesUserSession', JSON.stringify(sessionData));
        localStorage.setItem('salesUserSession', JSON.stringify(sessionData));
        navigate('/sales-dashboard');
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
      <h1>Sales Login</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Username" value={credentials.username} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={credentials.password} onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default SalesLogin;