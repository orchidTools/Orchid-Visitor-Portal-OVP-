import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import API_BASE_URL from '../config';

const SalesDashboard = () => {
    const navigate = useNavigate();
    const [salesUser, setSalesUser] = useState(null);
    
    // Popup state for view reason
    const [showReasonPopup, setShowReasonPopup] = useState(false);
    const [reasonVisitorId, setReasonVisitorId] = useState(null);
    const [reasonField, setReasonField] = useState('');
    const [reasonText, setReasonText] = useState('');
    const [reasonError, setReasonError] = useState('');
    const [currentVisitor, setCurrentVisitor] = useState(null);
    const [showReasonResult, setShowReasonResult] = useState(false);
    const [revealedFields, setRevealedFields] = useState({}); // Track which fields are revealed and when

    const handleView = (visitorId, field, visitorData) => {
      setReasonVisitorId(visitorId);
      setReasonField(field);
      setCurrentVisitor(visitorData);
      setShowReasonPopup(true);
      setReasonText('');
      setReasonError('');
      setShowReasonResult(false);
    };

    const handleReasonSubmit = async (e) => {
      e.preventDefault();
      if (!reasonText.trim()) {
        setReasonError('Please enter a reason.');
        return;
      }
      // Send reason to backend
      try {
        const response = await fetch(`${API_BASE_URL}/viewReason`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            visitorId: reasonVisitorId, 
            field: reasonField, 
            reason: reasonText,
            salesUserName: salesUser ? `${salesUser.name} (${salesUser.username})` : 'Unknown'
          })
        });
        
        if (response.ok) {
          // Add this field to revealed fields with a 2-minute timeout
          const fieldKey = `${reasonVisitorId}_${reasonField}`;
          setRevealedFields(prev => ({
            ...prev,
            [fieldKey]: true
          }));
          
          // Auto-hide after 2 minutes (120000 ms)
          setTimeout(() => {
            setRevealedFields(prev => {
              const newState = { ...prev };
              delete newState[fieldKey];
              return newState;
            });
          }, 120000);
          
          setShowReasonResult(true);
        } else {
          setReasonError('Error submitting reason. Please try again.');
        }
      } catch (error) {
        console.error('Error submitting reason:', error);
        setReasonError('Connection error: ' + error.message);
      }
    };

    const handleLogout = async () => {
      try {
        // Log the logout event to backend
        if (salesUser) {
          await fetch(`${API_BASE_URL}/logLogout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              username: salesUser.username,
              name: salesUser.name
            })
          });
        }
        // Clear session/local storage
        localStorage.removeItem('salesUserSession');
        sessionStorage.removeItem('salesUserSession');
        // Redirect to login
        navigate('/sales-login');
      } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if logging fails
        navigate('/sales-login');
      }
    };

  const [visitors, setVisitors] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get user info from session storage
    const userSession = sessionStorage.getItem('salesUserSession') || localStorage.getItem('salesUserSession');
    if (userSession) {
      try {
        const userData = JSON.parse(userSession);
        setSalesUser(userData);
        setIsAuthenticated(true);
        fetchVisitors();
      } catch (error) {
        console.error('Error parsing user session:', error);
        navigate('/sales-login');
      }
    } else {
      // No session found, redirect to login
      navigate('/sales-login');
    }
  }, [navigate]);

  const fetchVisitors = async () => {
    const response = await fetch(`${API_BASE_URL}/getVisitors`);
    const data = await response.json();
    setVisitors(data);
  };

  // Protect route - if not authenticated, redirect will happen in useEffect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard dashboard-white">
      <div className="dashboard-header">
        <div>
          <h1>Sales Dashboard</h1>
          {salesUser && <p className="user-info">Welcome, <strong>{salesUser.name}</strong> (@{salesUser.username})</p>}
        </div>
        <button className="dashboard-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {showReasonPopup && (
        <div className="dashboard-popup-overlay">
          <div className="dashboard-popup">
            {!showReasonResult ? (
              <>
                <h2>Why do you want to view this {reasonField === 'mobileNumber' ? 'number' : 'email'}?</h2>
                <form onSubmit={handleReasonSubmit}>
                  <textarea 
                    className="dashboard-textarea"
                    value={reasonText} 
                    onChange={e => setReasonText(e.target.value)} 
                    placeholder="Enter your reason..." 
                    required 
                  />
                  {reasonError && <div className="dashboard-popup-error">{reasonError}</div>}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button type="submit" className="dashboard-download-btn">Submit Reason</button>
                    <button type="button" className="dashboard-download-btn" style={{background: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)'}} onClick={() => setShowReasonPopup(false)}>Cancel</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 style={{ color: '#667eea', marginBottom: '24px' }}>✓ Request Approved</h2>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <p style={{ color: '#666', marginBottom: '12px' }}>Here is the requested information:</p>
                  <div style={{
                    background: '#f8f9fc',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '2px solid #667eea'
                  }}>
                    <p style={{ margin: '0 0 8px 0', color: '#999', fontSize: '0.85rem' }}>
                      {reasonField === 'mobileNumber' ? 'Phone Number' : 'Email Address'}
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      color: '#667eea',
                      wordBreak: 'break-all'
                    }}>
                      {reasonField === 'mobileNumber' ? currentVisitor?.mobileNumber : currentVisitor?.email}
                    </p>
                  </div>
                  <p style={{ color: '#999', fontSize: '0.85rem', margin: '0' }}>
                    Your request has been logged for admin review.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button 
                    className="dashboard-download-btn" 
                    onClick={() => setShowReasonPopup(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Visitor Inquiries</h2>
        </div>

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Visitor Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Nationality</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map(visitor => {
                // Handle both Firestore timestamp formats
                let formattedDate = '';
                let formattedTime = '';
                
                if (visitor.submissionDate) {
                  if (visitor.submissionDate.seconds) {
                    const date = new Date(visitor.submissionDate.seconds * 1000);
                    formattedDate = date.toLocaleDateString();
                    formattedTime = date.toLocaleTimeString();
                  } else if (visitor.submissionDate._seconds) {
                    const date = new Date(visitor.submissionDate._seconds * 1000);
                    formattedDate = date.toLocaleDateString();
                    formattedTime = date.toLocaleTimeString();
                  }
                }

                return (
                  <tr key={visitor.id}>
                    <td>{formattedDate}</td>
                    <td>{formattedTime}</td>
                  <td><strong>{visitor.fullName}</strong></td>
                  <td>
                    {revealedFields[`${visitor.id}_mobileNumber`] ? (
                      <span style={{ fontWeight: '600', color: '#667eea', fontFamily: 'monospace' }}>{visitor.mobileNumber}</span>
                    ) : (
                      <>
                        <span className="masked-field">•••••••••••</span>
                        <button className="dashboard-view-btn" onClick={() => handleView(visitor.id, 'mobileNumber', visitor)}>View</button>
                      </>
                    )}
                  </td>
                  <td>
                    {revealedFields[`${visitor.id}_email`] ? (
                      <span style={{ fontWeight: '600', color: '#667eea', fontFamily: 'monospace', wordBreak: 'break-all' }}>{visitor.email}</span>
                    ) : (
                      <>
                        <span className="masked-field">•••••••••••</span>
                        <button className="dashboard-view-btn" onClick={() => handleView(visitor.id, 'email', visitor)}>View</button>
                      </>
                    )}
                  </td>
                  <td>{visitor.nationality || 'N/A'}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
