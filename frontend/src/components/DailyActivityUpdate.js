import React, { useState, useEffect, useCallback } from 'react';
import './DailyActivityUpdate.css';
import API_BASE_URL from '../config';

const DailyActivityUpdate = ({ salesUserId, salesUserName }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    date: today,
    totalMeetings: 0,
    totalCalls: 0,
    dealsClosed: '',
    challengesFaced: '',
    nextDayPlan: '',
    additionalRemarks: ''
  });

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch daily activity history
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getDailyActivities/${salesUserId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Ensure data is always an array
      const historyArray = Array.isArray(data) ? data : [];
      setHistory(historyArray);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    }
  }, [salesUserId]);

  // Fetch history on mount
  useEffect(() => {
    if (salesUserId) {
      fetchHistory();
    }
  }, [salesUserId, fetchHistory]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(value) ? value : parseInt(value)
    }));
  };

  // Submit daily activity
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!salesUserId || !salesUserName) {
      alert('Error: Sales User information not available. Please refresh the page.');
      setLoading(false);
      return;
    }

    if (!formData.date) {
      alert('Error: Activity date is required.');
      setLoading(false);
      return;
    }

    if (!formData.challengesFaced.trim()) {
      alert('Error: Challenges are required.');
      setLoading(false);
      return;
    }

    if (!formData.nextDayPlan.trim()) {
      alert('Error: Next Day Plan is required.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isEditing ? 'updateDailyActivity' : 'submitDailyActivity';
      const body = {
        salesUserId: String(salesUserId),
        salesUserName: String(salesUserName),
        date: formData.date,
        totalMeetings: parseInt(formData.totalMeetings) || 0,
        totalCalls: parseInt(formData.totalCalls) || 0,
        dealsClosed: formData.dealsClosed.trim(),
        challengesFaced: formData.challengesFaced.trim(),
        nextDayPlan: formData.nextDayPlan.trim(),
        additionalRemarks: formData.additionalRemarks.trim(),
        ...(isEditing && { id: editingId })
      };

      console.log('Submitting daily activity:', body);

      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        alert(isEditing ? 'Daily activity updated successfully!' : 'Daily activity submitted successfully!');
        resetForm();
        fetchHistory();
        setIsEditing(false);
        setEditingId(null);
      } else {
        alert('Error saving activity: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving daily activity: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: today,
      totalMeetings: 0,
      totalCalls: 0,
      dealsClosed: '',
      challengesFaced: '',
      nextDayPlan: '',
      additionalRemarks: ''
    });
  };

  // Load activity for editing
  const loadActivityForEdit = (activity) => {
    setFormData({
      date: activity.date,
      totalMeetings: activity.totalMeetings,
      totalCalls: activity.totalCalls,
      dealsClosed: activity.dealsClosed,
      challengesFaced: activity.challengesFaced,
      nextDayPlan: activity.nextDayPlan,
      additionalRemarks: activity.additionalRemarks
    });
    setEditingId(activity.id);
    setIsEditing(true);
    setActiveTab('new');
  };

  // Delete activity
  const deleteActivity = async (id) => {
    if (!window.confirm('Delete this daily activity record?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/deleteDailyActivity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const result = await response.json();
      if (result.success) {
        alert('Record deleted successfully');
        fetchHistory();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting record');
    }
  };

  return (
    <div className="daily-activity-container">
      <div className="activity-header-bar">
        <div className="activity-tabs">
          <button 
            className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            📝 Daily Update {isEditing && '(Editing)'}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📋 History
          </button>
        </div>
        
        {activeTab === 'new' && (
          <div className="date-selector">
            <label>Activity Date</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
        )}
      </div>

      {activeTab === 'new' && (
        <form onSubmit={handleSubmit} className="activity-form">
          {/* Meetings & Calls */}
          <div className="form-section">
            <h3>📊 Daily Summary</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Total Meetings Today *</label>
                <input 
                  type="number" 
                  name="totalMeetings"
                  value={formData.totalMeetings}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Total Calls *</label>
                <input 
                  type="number" 
                  name="totalCalls"
                  value={formData.totalCalls}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Deals */}
            <div className="form-row">
              <div className="form-group full-width">
                <label>Deals Closed (If Any)</label>
                <textarea 
                  name="dealsClosed"
                  placeholder="Enter deal details if any..."
                  value={formData.dealsClosed}
                  onChange={handleInputChange}
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* Challenges */}
          <div className="form-section">
            <h3>⚠️ Challenges Faced Today</h3>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Challenges *</label>
                <textarea 
                  name="challengesFaced"
                  placeholder="Describe any challenges faced today..."
                  value={formData.challengesFaced}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
              </div>
            </div>
          </div>

          {/* Next Day Plan */}
          <div className="form-section">
            <h3>📋 Plan/Follow-ups for Next Day</h3>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Next Day Plan *</label>
                <textarea 
                  name="nextDayPlan"
                  placeholder="Enter plans and follow-ups for tomorrow..."
                  value={formData.nextDayPlan}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Remarks */}
          <div className="form-section">
            <h3>💬 Additional Remarks</h3>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Remarks</label>
                <textarea 
                  name="additionalRemarks"
                  placeholder="Any additional notes..."
                  value={formData.additionalRemarks}
                  onChange={handleInputChange}
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? '✏️ Update Activity' : '✓ Submit Daily Report'}
            </button>
            {isEditing && (
              <button type="button" className="cancel-btn" onClick={() => {
                resetForm();
                setIsEditing(false);
                setEditingId(null);
              }}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {activeTab === 'history' && (
        <div className="history-section">
          <h3>Activity History</h3>
          {!history || history.length === 0 ? (
            <p className="no-data">No activity records yet</p>
          ) : (
            <div className="activity-timeline">
              {history.map((activity, idx) => {
                // Check if edit is allowed (within 20 minutes of creation)
                const createdAt = activity.createdAt?.seconds 
                  ? new Date(activity.createdAt.seconds * 1000)
                  : activity.createdAt?._seconds
                  ? new Date(activity.createdAt._seconds * 1000)
                  : null;
                
                const now = new Date();
                const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);
                const canEdit = createdAt && createdAt > twentyMinutesAgo;

                return (
                  <div key={idx} className="activity-card">
                    <div className="activity-header">
                      <h4>📅 {new Date(activity.date).toLocaleDateString()}</h4>
                      <div className="activity-actions">
                        {canEdit ? (
                          <button 
                            className="edit-btn"
                            onClick={() => loadActivityForEdit(activity)}
                            title="Edit available for 20 minutes after submission"
                          >
                            ✏️ Edit
                          </button>
                        ) : (
                          <button 
                            className="edit-btn" 
                            disabled 
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            title="Edit window expired (20 minutes)"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        <button 
                          className="delete-btn"
                          onClick={() => deleteActivity(activity.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="activity-details">
                      <p><strong>📅 Date:</strong> {new Date(activity.date).toLocaleDateString()}</p>
                      <p><strong>📞 Total Calls:</strong> {activity.totalCalls}</p>
                      <p><strong>🤝 Total Meetings:</strong> {activity.totalMeetings}</p>
                      {activity.dealsClosed && (
                        <p><strong>✓ Deals Closed:</strong> {activity.dealsClosed}</p>
                      )}
                      {activity.challengesFaced && (
                        <p><strong>⚠️ Challenges:</strong> {activity.challengesFaced}</p>
                      )}
                      {activity.nextDayPlan && (
                        <p><strong>📋 Next Day Plan:</strong> {activity.nextDayPlan}</p>
                      )}
                      {activity.additionalRemarks && (
                        <p><strong>💬 Remarks:</strong> {activity.additionalRemarks}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyActivityUpdate;
