import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import * as XLSX from "xlsx";
import API_BASE_URL from "../config";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [visitors, setVisitors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pendingEdits, setPendingEdits] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submittedReasons, setSubmittedReasons] = useState([]);

  const [showSalesUserPopup, setShowSalesUserPopup] = useState(false);
  const [popupError, setPopupError] = useState("");
  const [selectedLogs, setSelectedLogs] = useState(new Set());
  const [selectedReasons, setSelectedReasons] = useState(new Set());
  const [showEditUserPopup, setShowEditUserPopup] = useState(false);
  const [editUserError, setEditUserError] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);

  const [salesUserData, setSalesUserData] = useState({
    name: "",
    username: "",
    password: ""
  });

  const [editUserData, setEditUserData] = useState({
    name: "",
    username: "",
    password: ""
  });

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleLogSelection = (logId) => {
    setSelectedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const toggleSelectAllLogs = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map(log => log.id)));
    }
  };

  const deleteSelectedLogs = async () => {
    if (selectedLogs.size === 0) {
      alert('Please select logs to delete');
      return;
    }
    
    if (!window.confirm(`Delete ${selectedLogs.size} log(s)?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/deleteLogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logIds: Array.from(selectedLogs) })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Successfully deleted ${data.deletedCount} log(s)`);
        setSelectedLogs(new Set());
        fetchLogs();
      } else {
        alert(`Error deleting logs: ${data.error || 'Unknown error'}`);
        console.error('Delete error:', data);
      }
    } catch (error) {
      console.error('Error deleting logs:', error);
      alert(`Error deleting logs: ${error.message}`);
    }
  };

  const clearAllLogs = async () => {
    if (!window.confirm('Delete all activity logs? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/clearAllLogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Successfully cleared ${data.deletedCount} log(s)`);
        setSelectedLogs(new Set());
        fetchLogs();
      } else {
        alert(`Error clearing logs: ${data.error || 'Unknown error'}`);
        console.error('Clear error:', data);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      alert(`Error clearing logs: ${error.message}`);
    }
  };

  const toggleReasonSelection = (reasonId) => {
    setSelectedReasons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reasonId)) {
        newSet.delete(reasonId);
      } else {
        newSet.add(reasonId);
      }
      return newSet;
    });
  };

  const toggleSelectAllReasons = () => {
    if (selectedReasons.size === submittedReasons.length) {
      setSelectedReasons(new Set());
    } else {
      setSelectedReasons(new Set(submittedReasons.map(reason => reason.id)));
    }
  };

  const deleteSelectedReasons = async () => {
    if (selectedReasons.size === 0) {
      alert('Please select access requests to delete');
      return;
    }
    
    if (!window.confirm(`Delete ${selectedReasons.size} access request(s)?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/deleteReasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reasonIds: Array.from(selectedReasons) })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Successfully deleted ${data.deletedCount} access request(s)`);
        setSelectedReasons(new Set());
        fetchReasons();
      } else {
        alert(`Error deleting requests: ${data.error || 'Unknown error'}`);
        console.error('Delete error:', data);
      }
    } catch (error) {
      console.error('Error deleting reasons:', error);
      alert(`Error deleting requests: ${error.message}`);
    }
  };

  const deleteOneReason = async (reasonId) => {
    if (!window.confirm('Delete this access request?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/deleteReasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reasonIds: [reasonId] })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSelectedReasons(prev => {
          const newSet = new Set(prev);
          newSet.delete(reasonId);
          return newSet;
        });
        fetchReasons();
      } else {
        alert(`Error deleting request: ${data.error || 'Unknown error'}`);
        console.error('Delete error:', data);
      }
    } catch (error) {
      console.error('Error deleting reason:', error);
      alert(`Error deleting request: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      // Log the logout event
      await fetch(`${API_BASE_URL}/logLogout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: 'admin',
          name: 'Administrator'
        })
      });
      // Clear authentication
      sessionStorage.removeItem('adminSession');
      localStorage.removeItem('adminSession');
      // Redirect to login
      navigate('/admin-login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/admin-login');
    }
  };

  useEffect(() => {
    // Check if admin is logged in
    const adminSession = sessionStorage.getItem('adminSession') || localStorage.getItem('adminSession');
    if (!adminSession) {
      navigate('/admin-login');
      return;
    }
    setIsAuthenticated(true);
    fetchVisitors();
    fetchLogs();
    fetchPendingEdits();
    fetchSalesUsers();
    fetchReasons();
  }, [navigate]);

  const fetchVisitors = async () => {
    const response = await fetch("http://localhost:5000/getVisitors");
    const data = await response.json();
    setVisitors(data);
  };

  const fetchLogs = async () => {
    const response = await fetch("http://localhost:5000/getActivityLogs");
    const data = await response.json();
    setLogs(data);
  };

  const fetchPendingEdits = async () => {
    const response = await fetch("http://localhost:5000/getPendingEdits");
    const data = await response.json();
    setPendingEdits(data);
  };

  const fetchSalesUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/getSalesUsers");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Sales users fetched:', data);
      setSalesUsers(data || []);
    } catch (error) {
      console.error('Error fetching sales users:', error);
      setSalesUsers([]);
    }
  };

  const fetchReasons = async () => {
    try {
      const response = await fetch("http://localhost:5000/getReasons");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSubmittedReasons(data || []);
    } catch (error) {
      console.error('Error fetching reasons:', error);
      setSubmittedReasons([]);
    }
  };

  const handleApprove = async (editId) => {
    await fetch("http://localhost:5000/approveEdit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ editId })
    });

    fetchVisitors();
    fetchPendingEdits();
  };

  const handleReject = async (editId) => {
    await fetch("http://localhost:5000/rejectEdit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ editId })
    });

    fetchVisitors();
    fetchPendingEdits();
  };

  const handleSalesUserChange = (e) => {
    setSalesUserData({
      ...salesUserData,
      [e.target.name]: e.target.value
    });
  };

  const handleSalesUserSubmit = async (e) => {
    e.preventDefault();
    setPopupError('Creating...');
    try {
      const response = await fetch("http://localhost:5000/createSalesUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(salesUserData)
      });
      const data = await response.json();
      if (response.ok) {
        setPopupError('User created successfully!');
        setTimeout(() => {
          setShowSalesUserPopup(false);
          setSalesUserData({ name: '', username: '', password: '' });
          setPopupError('');
          fetchSalesUsers(); // Refresh the sales users list
        }, 1500);
      } else {
        setPopupError(data.error || "Error creating user");
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setPopupError("Connection error: " + error.message);
    }
  };

  const handleEditClick = (user) => {
    setEditingUserId(user.id);
    setEditUserData({
      name: user.name,
      username: user.username,
      password: user.password
    });
    setEditUserError('');
    setShowEditUserPopup(true);
  };

  const handleEditUserChange = (e) => {
    setEditUserData({
      ...editUserData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setEditUserError('Updating...');
    try {
      const response = await fetch("http://localhost:5000/updateSalesUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: editingUserId,
          ...editUserData
        })
      });
      const data = await response.json();
      if (response.ok) {
        setEditUserError('User updated successfully!');
        setTimeout(() => {
          setShowEditUserPopup(false);
          setEditingUserId(null);
          setEditUserData({ name: '', username: '', password: '' });
          setEditUserError('');
          fetchSalesUsers(); // Refresh the sales users list
        }, 1500);
      } else {
        setEditUserError(data.error || "Error updating user");
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setEditUserError("Connection error: " + error.message);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Delete sales user "${username}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/deleteSalesUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (response.ok) {
        alert('User deleted successfully!');
        fetchSalesUsers(); // Refresh the sales users list
      } else {
        alert(data.error || "Error deleting user");
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert("Connection error: " + error.message);
    }
  };

  const handleDeleteVisitor = async (visitorId, visitorName) => {
    if (!window.confirm(`Delete visitor "${visitorName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/deleteVisitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ visitorId })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Visitor deleted successfully!');
        fetchVisitors(); // Refresh the visitors list
      } else {
        alert(data.error || "Error deleting visitor");
      }
    } catch (error) {
      console.error('Error deleting visitor:', error);
      alert("Connection error: " + error.message);
    }
  };

  const downloadExcel = () => {

    const worksheet = XLSX.utils.json_to_sheet(
      visitors.map((visitor) => ({
        Date: visitor.submissionDate
          ? new Date(visitor.submissionDate.seconds * 1000).toLocaleDateString()
          : "",
        Time: visitor.submissionDate
          ? new Date(visitor.submissionDate.seconds * 1000).toLocaleTimeString()
          : "",
        Name: visitor.fullName,
        Mobile: visitor.mobileNumber,
        Email: visitor.email
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visitors");

    XLSX.writeFile(workbook, "visitors.xlsx");
  };

  // Protect route - if not authenticated, redirect will happen in useEffect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard dashboard-white">

      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="dashboard-download-btn"
            onClick={() => setShowSalesUserPopup(true)}
          >
            Add Sales User
          </button>
          <button
            className="dashboard-logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {showSalesUserPopup && (
        <div className="dashboard-popup-overlay">
          <div className="dashboard-popup">
            <h2>Add Sales User</h2>
            <form onSubmit={handleSalesUserSubmit} style={{ width: '100%' }}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={salesUserData.name}
                onChange={handleSalesUserChange}
                required
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={salesUserData.username}
                onChange={handleSalesUserChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={salesUserData.password}
                onChange={handleSalesUserChange}
                required
              />
              {popupError && (
                <div className="dashboard-popup-error">
                  {popupError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="dashboard-download-btn"
                  disabled={popupError === 'Creating...' || !salesUserData.name || !salesUserData.username || !salesUserData.password}
                >
                  {popupError === 'Creating...' ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  className="dashboard-download-btn"
                  style={{ background: '#d32f2f' }}
                  onClick={() => setShowSalesUserPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditUserPopup && (
        <div className="dashboard-popup-overlay">
          <div className="dashboard-popup">
            <h2>Edit Sales User</h2>
            <form onSubmit={handleEditUserSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={editUserData.name}
                onChange={handleEditUserChange}
                required
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={editUserData.username}
                onChange={handleEditUserChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={editUserData.password}
                onChange={handleEditUserChange}
                required
              />
              {editUserError && (
                <div className="dashboard-popup-error">
                  {editUserError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="dashboard-download-btn"
                  disabled={editUserError === 'Updating...' || !editUserData.name || !editUserData.username || !editUserData.password}
                >
                  {editUserError === 'Updating...' ? 'Updating...' : 'Update User'}
                </button>
                <button
                  type="button"
                  className="dashboard-download-btn"
                  style={{ background: '#d32f2f' }}
                  onClick={() => setShowEditUserPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dashboard-section">

        <div className="dashboard-section-header">
          <h2>Visitors</h2>

          <button
            className="dashboard-download-btn"
            onClick={downloadExcel}
          >
            Download Excel
          </button>

        </div>

        <div className="dashboard-table-wrapper">

          <table className="dashboard-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Full Name</th>
                <th>Father/Mother Name</th>
                <th>Gender</th>
                <th>Nationality</th>
                <th>Permanent Address</th>
                <th>Current Address</th>
                <th>Mobile</th>
                <th>Email</th>
                {/* Removed Govt ID fields */}
                <th>Broker Name</th>
                <th>Broker Company</th>
                <th>Broker Contact</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {visitors.map((visitor) => {

                const edit = pendingEdits.find(
                  (e) => e.visitorId === visitor.id
                );

                return (
                  <tr key={visitor.id}>
                    <td>
                      {visitor.submissionDate && visitor.submissionDate.seconds
                        ? new Date(visitor.submissionDate.seconds * 1000).toLocaleDateString()
                        : visitor.submissionDate && visitor.submissionDate._seconds
                        ? new Date(visitor.submissionDate._seconds * 1000).toLocaleDateString()
                        : ""}
                    </td>
                    <td>
                      {visitor.submissionDate && visitor.submissionDate.seconds
                        ? new Date(visitor.submissionDate.seconds * 1000).toLocaleTimeString()
                        : visitor.submissionDate && visitor.submissionDate._seconds
                        ? new Date(visitor.submissionDate._seconds * 1000).toLocaleTimeString()
                        : ""}
                    </td>
                    <td>{visitor.fullName}</td>
                    <td>{visitor.fatherMotherName}</td>
                    <td>{visitor.gender}</td>
                    <td>{visitor.nationality}</td>
                    <td>{visitor.permanentAddress}</td>
                    <td>{visitor.currentAddress}</td>
                    <td>{visitor.mobileNumber}</td>
                    <td>{visitor.email}</td>
                    {/* Removed Govt ID fields */}
                    <td>{visitor.brokerName}</td>
                    <td>{visitor.brokerCompany}</td>
                    <td>{visitor.brokerContact}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {edit && (
                          <>
                            <button onClick={() => handleApprove(edit.id)} style={{ fontSize: '0.7rem', padding: '4px 8px' }} className="dashboard-download-btn">Approve</button>
                            <button onClick={() => handleReject(edit.id)} style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#f39c12' }} className="dashboard-download-btn">Reject</button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDeleteVisitor(visitor.id, visitor.fullName)}
                          style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#e74c3c' }}
                          className="dashboard-download-btn"
                          title="Delete visitor"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

      </div>

      <div className="dashboard-section">

        <div className="dashboard-section-header">
          <h2>Sales Users Created</h2>
          <button className="dashboard-download-btn" onClick={fetchSalesUsers} style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
            Refresh
          </button>
        </div>

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Password</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesUsers.length > 0 ? (
                salesUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.username}</td>
                    <td className="password-cell">
                      <span className="password-display">
                        {visiblePasswords[user.id] ? user.password : '••••••••••'}
                      </span>
                      <button 
                        className="password-toggle-btn"
                        onClick={() => togglePasswordVisibility(user.id)}
                        title={visiblePasswords[user.id] ? 'Hide password' : 'Show password'}
                      >
                        {visiblePasswords[user.id] ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </td>
                    <td>
                      {user.createdAt ? (
                        user.createdAt.seconds ? (
                          new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                        ) : user.createdAt._seconds ? (
                          new Date(user.createdAt._seconds * 1000).toLocaleDateString()
                        ) : (
                          'N/A'
                        )
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="dashboard-download-btn"
                        onClick={() => handleEditClick(user)}
                        style={{ fontSize: '0.75rem', padding: '6px 12px', background: '#667eea' }}
                        title="Edit user"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="dashboard-download-btn"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        style={{ fontSize: '0.75rem', padding: '6px 12px', background: '#e74c3c' }}
                        title="Delete user"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    No sales users created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      <div className="dashboard-section">

        <div className="dashboard-section-header">
          <h2>Activity Logs</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="dashboard-download-btn" onClick={fetchLogs} style={{ fontSize: '0.85rem', padding: '10px 16px' }} title="Refresh logs">
              🔄 Refresh
            </button>
            {selectedLogs.size > 0 && (
              <button className="dashboard-download-btn" onClick={deleteSelectedLogs} style={{ 
                fontSize: '0.85rem', 
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)'
              }}>
                🗑️ Delete Selected ({selectedLogs.size})
              </button>
            )}
            {logs.length > 0 && (
              <button className="dashboard-download-btn" onClick={clearAllLogs} style={{ 
                fontSize: '0.85rem', 
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
              }}>
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        {logs.length > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fc', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={selectedLogs.size === logs.length && logs.length > 0}
                onChange={toggleSelectAllLogs}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: '600', color: '#1a1a2e' }}>
                {selectedLogs.size === logs.length && logs.length > 0 ? 'Deselect All' : 'Select All'} ({logs.length})
              </span>
            </label>
          </div>
        )}

        <ul className="dashboard-logs">

          {logs.length > 0 ? logs.map((log) => {
            // Format timestamp from Firestore
            let formattedTime = '';
            if (log.timestamp) {
              if (log.timestamp.seconds) {
                formattedTime = new Date(log.timestamp.seconds * 1000).toLocaleString();
              } else if (log.timestamp._seconds) {
                formattedTime = new Date(log.timestamp._seconds * 1000).toLocaleString();
              } else if (typeof log.timestamp === 'number') {
                formattedTime = new Date(log.timestamp).toLocaleString();
              }
            }

            return (
              <li key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input 
                  type="checkbox"
                  checked={selectedLogs.has(log.id)}
                  onChange={() => toggleLogSelection(log.id)}
                  style={{ marginTop: '6px', cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <strong>{log.user}</strong> 
                  <span className="log-username">{log.username && `(@${log.username})`}</span>
                  <span> - {log.action} - </span>
                  <small>{formattedTime || 'N/A'}</small>
                </div>
              </li>
            );
          }) : (
            <li style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              No activity logs
            </li>
          )}

        </ul>

      </div>

      <div className="dashboard-section">

        <div className="dashboard-section-header">
          <h2>Submitted Access Requests</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="dashboard-download-btn" onClick={fetchReasons} style={{ fontSize: '0.85rem', padding: '10px 16px' }} title="Refresh requests">
              🔄 Refresh
            </button>
            {selectedReasons.size > 0 && (
              <button className="dashboard-download-btn" onClick={deleteSelectedReasons} style={{ 
                fontSize: '0.85rem', 
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
              }}>
                🗑️ Delete Selected ({selectedReasons.size})
              </button>
            )}
          </div>
        </div>

        {submittedReasons.length > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fc', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={selectedReasons.size === submittedReasons.length && submittedReasons.length > 0}
                onChange={toggleSelectAllReasons}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: '600', color: '#1a1a2e' }}>
                {selectedReasons.size === submittedReasons.length && submittedReasons.length > 0 ? 'Deselect All' : 'Select All'} ({submittedReasons.length})
              </span>
            </label>
          </div>
        )}

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {submittedReasons.length > 0 ? (
            submittedReasons.map((reason) => {
              // Format timestamp from Firestore
              let formattedTime = '';
              if (reason.submittedAt) {
                if (reason.submittedAt.seconds) {
                  formattedTime = new Date(reason.submittedAt.seconds * 1000).toLocaleString();
                } else if (reason.submittedAt._seconds) {
                  formattedTime = new Date(reason.submittedAt._seconds * 1000).toLocaleString();
                }
              }

              return (
                <div key={reason.id} style={{
                  padding: '16px',
                  marginBottom: '12px',
                  borderLeft: `4px solid ${selectedReasons.has(reason.id) ? '#667eea' : '#667eea'}`,
                  background: selectedReasons.has(reason.id) ? '#e8eaf6' : '#f8f9fc',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <input 
                    type="checkbox"
                    checked={selectedReasons.has(reason.id)}
                    onChange={() => toggleReasonSelection(reason.id)}
                    style={{ marginTop: '6px', cursor: 'pointer', width: '18px', height: '18px', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <strong style={{ color: '#667eea' }}>
                        {reason.salesUserName || 'Unknown User'}
                      </strong>
                      <small style={{ color: '#999' }}>{formattedTime || 'N/A'}</small>
                    </div>
                    <div style={{ marginBottom: '8px', color: '#666' }}>
                      <span style={{ fontWeight: '600' }}>Requested Field: </span>
                      <span style={{ background: '#e8eaf6', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        {reason.field}
                    </span>
                    </div>
                    <div style={{ color: '#333', lineHeight: '1.5' }}>
                      <span style={{ fontWeight: '600' }}>Reason: </span>
                      <p style={{ margin: '0', marginTop: '4px' }}>
                        "{reason.reason}"
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteOneReason(reason.id)}
                    style={{ 
                      fontSize: '0.7rem', 
                      padding: '6px 10px', 
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      marginTop: '6px',
                      height: 'fit-content'
                    }}
                    className="dashboard-download-btn"
                    title="Delete this request"
                  >
                    🗑️
                  </button>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              No access requests submitted yet
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
