import React, { useState } from 'react';
import './VisitorFormPage.css';
import API_BASE_URL from '../config';
import logo from '../images/logo.png';
import ThankYouModal from './ThankYouModal';

const VisitorForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    nationality: '',
    address: '',
    mobileNumber: '',
    email: '',
    channelPartner: ''
  });

  const [showThankYou, setShowThankYou] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/submitVisitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          gender: formData.gender,
          nationality: formData.nationality,
          permanentAddress: formData.address,
          currentAddress: formData.address,
          mobileNumber: formData.mobileNumber,
          email: formData.email,
          brokerName: formData.channelPartner,
          fatherMotherName: '',
          brokerCompany: '',
          brokerContact: ''
        })
      });
      const result = await response.json();
      if (result.success) {
        // Show thank you modal instead of alert
        setSubmittedName(formData.fullName);
        setShowThankYou(true);
        
        // Clear form
        setFormData({
          fullName: '',
          gender: '',
          nationality: '',
          address: '',
          mobileNumber: '',
          email: '',
          channelPartner: ''
        });
      } else {
        alert('Error submitting form');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting form: ' + error.message);
    }
  };

  const handleThankYouClose = () => {
    setShowThankYou(false);
    setSubmittedName("");
  };

  return (
    <div className="visitor-page">
      <div className="visitor-brand">
        <div className="logo-section">
          <img src={logo} alt="Orchid Logo" className="logo-image" />
        </div>
        <div className="portal-name">
          <span className="portal-orchid">Orchid</span>
          <span className="portal-visitor">Visitor</span>
          <span className="portal-portal">Portal</span>
        </div>
      </div>
      
      <div className="visitor-form-section">
        <h1 className="visitor-form-title">VISITOR PROFILE</h1>
        <form onSubmit={handleSubmit} className="visitor-form">
          <div className="form-row">
            <div className="form-group">
              <input 
                type="text" 
                name="fullName" 
                placeholder="Full Name" 
                value={formData.fullName} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange} 
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input 
                type="text" 
                name="nationality" 
                placeholder="Nationality" 
                value={formData.nationality} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <input 
                type="text" 
                name="channelPartner" 
                placeholder="Channel Partner (Broker)" 
                value={formData.channelPartner} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input 
                type="tel" 
                name="mobileNumber" 
                placeholder="Mobile Number" 
                value={formData.mobileNumber} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <input 
                type="email" 
                name="email" 
                placeholder="Email ID" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-row full-width">
            <div className="form-group full-width">
              <textarea 
                name="address" 
                placeholder="Address" 
                value={formData.address} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <button type="submit" className="visitor-form-submit">SUBMIT</button>
        </form>
      </div>

      {/* Thank You Modal */}
      <ThankYouModal
        isOpen={showThankYou}
        visitorName={submittedName}
        onClose={handleThankYouClose}
      />
    </div>
  );
};

export default VisitorForm;