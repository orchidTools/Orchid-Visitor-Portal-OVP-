import React, { useState, useEffect } from 'react';
import './DailyActivityUpdate.css';
import API_BASE_URL from '../config';

const DailyActivityUpdate = ({ salesUserId, salesUserName }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: today,
    locationsVisited: '',
    clientInteractions: [],
    meetingsConducted: [],
    callsMade: 0,
    callDiscussions: '',
    siteVisits: '',
    leadsGenerated: 0,
    leadsFollowup: 0,
    dealsClosed: '',
    challengesFaced: '',
    nextDayPlan: '',
    remarks: '',
  });

  const [clientInput, setClientInput] = useState({ name: '', type: 'buyer' });
  const [meetingInput, setMeetingInput] = useState({ purpose: '', outcome: '' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Activity tags
  const activityTags = ['Site Visit', 'Client Meeting', 'Follow-up Call', 'Broker Meet', 'Lead Generation', 'Deal Discussion'];

  // Fetch history on mount
  useEffect(() => {
    if (salesUserId) {
      fetchHistory();
    }
  }, [salesUserId]);

  // Fetch daily activity history
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getDailyActivities/${salesUserId}`);
      const data = await response.json();
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(value) ? value : parseInt(value)
    }));
  };

  // Add client interaction
  const addClientInteraction = () => {
    if (clientInput.name.trim()) {
      setFormData(prev => ({
        ...prev,
        clientInteractions: [...prev.clientInteractions, { ...clientInput }]
      }));
      setClientInput({ name: '', type: 'buyer' });
    }
  };

  // Remove client interaction
  const removeClientInteraction = (index) => {
    setFormData(prev => ({
      ...prev,
      clientInteractions: prev.clientInteractions.filter((_, i) => i !== index)
    }));
  };

  // Add meeting
  const addMeeting = () => {
    if (meetingInput.purpose.trim() && meetingInput.outcome.trim()) {
      setFormData(prev => ({
        ...prev,
        meetingsConducted: [...prev.meetingsConducted, { ...meetingInput }]
      }));
      setMeetingInput({ purpose: '', outcome: '' });
    }
  };

  // Remove meeting
  const removeMeeting = (index) => {
    setFormData(prev => ({
      ...prev,
      meetingsConducted: prev.meetingsConducted.filter((_, i) => i !== index)
    }));
  };

  // Submit daily activity
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isEditing ? 'updateDailyActivity' : 'submitDailyActivity';
      const body = {
        ...formData,
        salesUserId,
        salesUserName,
        ...(isEditing && { id: editingId })
      };

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
      locationsVisited: '',
      clientInteractions: [],
      meetingsConducted: [],
      callsMade: 0,
      callDiscussions: '',
      siteVisits: '',
      leadsGenerated: 0,
      leadsFollowup: 0,
      dealsClosed: '',
      challengesFaced: '',
      nextDayPlan: '',
      remarks: '',
    });
  };

  // Load activity for editing
  const loadActivityForEdit = (activity) => {
    setFormData({
      date: activity.date,
      locationsVisited: activity.locationsVisited,
      clientInteractions: activity.clientInteractions || [],
      meetingsConducted: activity.meetingsConducted || [],
      callsMade: activity.callsMade,
      callDiscussions: activity.callDiscussions,
      siteVisits: activity.siteVisits,
      leadsGenerated: activity.leadsGenerated,
      leadsFollowup: activity.leadsFollowup,
      dealsClosed: activity.dealsClosed,
      challengesFaced: activity.challengesFaced,
      nextDayPlan: activity.nextDayPlan,
      remarks: activity.remarks,
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
        <form onSubmit={handleSubmit} className="activity-form">
          <div className="form-section">
            <h3>📅 Activity Date & Locations</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Locations Visited</label>
                <input 
                  type="text" 
                  name="locationsVisited"
                  placeholder="e.g., Downtown Project Site, ABC Offices, XYZ Broker Office"
                  value={formData.locationsVisited}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Client Interactions */}
          <div className="form-section">
            <h3>👥 Client Interactions</h3>
            <div className="interaction-input">
              <select 
                value={clientInput.type}
                onChange={(e) => setClientInput({...clientInput, type: e.target.value})}
              >
                <option value="buyer">Buyer</option>
                <option value="investor">Investor</option>
                <option value="channel_partner">Channel Partner</option>
                <option value="broker">Broker</option>
                <option value="vendor">Vendor</option>
              </select>
              <input 
                type="text"
                placeholder="Client name"
                value={clientInput.name}
                onChange={(e) => setClientInput({...clientInput, name: e.target.value})}
              />
              <button type="button" onClick={addClientInteraction} className="add-btn">+ Add</button>
            </div>
            <div className="interactions-list">
              {formData.clientInteractions.map((client, idx) => (
                <div key={idx} className="interaction-tag">
                  <span>{client.name} ({client.type})</span>
                  <button type="button" onClick={() => removeClientInteraction(idx)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Meetings */}
          <div className="form-section">
            <h3>🤝 Meetings Conducted</h3>
            <div className="meeting-input">
              <input 
                type="text"
                placeholder="Purpose of meeting"
                value={meetingInput.purpose}
                onChange={(e) => setMeetingInput({...meetingInput, purpose: e.target.value})}
              />
              <input 
                type="text"
                placeholder="Outcome/Next steps"
                value={meetingInput.outcome}
                onChange={(e) => setMeetingInput({...meetingInput, outcome: e.target.value})}
              />
              <button type="button" onClick={addMeeting} className="add-btn">+ Add Meeting</button>
            </div>
            <div className="meetings-list">
              {formData.meetingsConducted.map((meeting, idx) => (
                <div key={idx} className="meeting-item">
                  <strong>Purpose:</strong> {meeting.purpose}
                  <br />
                  <strong>Outcome:</strong> {meeting.outcome}
                  <button type="button" onClick={() => removeMeeting(idx)} className="remove-btn">Remove</button>
                </div>
              ))}
            </div>
          </div>

          {/* Calls & Site Visits */}
          <div className="form-section">
            <h3>📞 Calls & Site Visits</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Number of Calls Made</label>
                <input 
                  type="number" 
                  name="callsMade"
                  value={formData.callsMade}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Key Call Discussions</label>
                <input 
                  type="text"
                  name="callDiscussions"
                  placeholder="Summary of calls"
                  value={formData.callDiscussions}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Site Visits Arranged/Completed</label>
                <input 
                  type="text"
                  name="siteVisits"
                  placeholder="Details of site visits"
                  value={formData.siteVisits}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Leads & Deals */}
          <div className="form-section">
            <h3>🎯 Leads & Deals</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Leads Generated</label>
                <input 
                  type="number" 
                  name="leadsGenerated"
                  value={formData.leadsGenerated}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Leads Followed Up</label>
                <input 
                  type="number" 
                  name="leadsFollowup"
                  value={formData.leadsFollowup}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Deals Closed (if any)</label>
                <textarea 
                  name="dealsClosed"
                  placeholder="Details of closed deals"
                  value={formData.dealsClosed}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Challenges & Plans */}
          <div className="form-section">
            <h3>⚠️ Challenges & Plans</h3>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Challenges Faced Today</label>
                <textarea 
                  name="challengesFaced"
                  placeholder="Any obstacles or issues faced"
                  value={formData.challengesFaced}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Plan/Follow-ups for Next Day</label>
                <textarea 
                  name="nextDayPlan"
                  placeholder="Planned activities and follow-ups"
                  value={formData.nextDayPlan}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Additional Remarks */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group full-width">
                <label>Additional Remarks</label>
                <textarea 
                  name="remarks"
                  placeholder="Any other important notes"
                  value={formData.remarks}
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
          {history.length === 0 ? (
            <p className="no-data">No activity records yet</p>
          ) : (
            <div className="activity-timeline">
              {history.map((activity, idx) => (
                <div key={idx} className="activity-card">
                  <div className="activity-header">
                    <h4>📅 {new Date(activity.date).toLocaleDateString()}</h4>
                    <div className="activity-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => loadActivityForEdit(activity)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteActivity(activity.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="activity-details">
                    {activity.locationsVisited && (
                      <p><strong>📍 Locations:</strong> {activity.locationsVisited}</p>
                    )}
                    {activity.clientInteractions?.length > 0 && (
                      <p><strong>👥 Clients:</strong> {activity.clientInteractions.map(c => `${c.name} (${c.type})`).join(', ')}</p>
                    )}
                    {activity.callsMade > 0 && (
                      <p><strong>📞 Calls:</strong> {activity.callsMade} calls - {activity.callDiscussions}</p>
                    )}
                    {activity.leadsGenerated > 0 && (
                      <p><strong>🎯 Leads:</strong> {activity.leadsGenerated} generated, {activity.leadsFollowup} follow-ups</p>
                    )}
                    {activity.meetingsConducted?.length > 0 && (
                      <p><strong>🤝 Meetings:</strong> {activity.meetingsConducted.length} conducted</p>
                    )}
                    {activity.dealsClosed && (
                      <p><strong>✓ Deals:</strong> {activity.dealsClosed}</p>
                    )}
                    {activity.nextDayPlan && (
                      <p><strong>📋 Next Steps:</strong> {activity.nextDayPlan}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyActivityUpdate;
