import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Form.css';

const EditVisitor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchVisitor = async () => {
      const response = await fetch('http://localhost:5000/getVisitors');
      const visitors = await response.json();
      const visitor = visitors.find(v => v.id === id);
      if (visitor) {
        setFormData(visitor);
      }
    };
    fetchVisitor();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    const changes = { ...formData };
    delete changes.id;
    delete changes.submissionDate;
    delete changes.status;
    try {
      const response = await fetch('http://localhost:5000/editVisitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: id, changes, userId })
      });
      const result = await response.json();
      if (result.success) {
        alert('Changes submitted for approval!');
        navigate('/sales-dashboard');
      } else {
        alert('Error submitting changes');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="form-container">
      <h1>Edit Visitor</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName || ''} onChange={handleChange} />
        <input type="text" name="fatherMotherName" placeholder="Father’s / Mother’s Name" value={formData.fatherMotherName || ''} onChange={handleChange} />
        <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} />
        <select name="gender" value={formData.gender || ''} onChange={handleChange}>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input type="text" name="nationality" placeholder="Nationality" value={formData.nationality || ''} onChange={handleChange} />
        <textarea name="permanentAddress" placeholder="Permanent Address" value={formData.permanentAddress || ''} onChange={handleChange} />
        <textarea name="currentAddress" placeholder="Current Address" value={formData.currentAddress || ''} onChange={handleChange} />
        <input type="tel" name="mobileNumber" placeholder="Mobile Number" value={formData.mobileNumber || ''} onChange={handleChange} />
        <input type="email" name="email" placeholder="Email ID" value={formData.email || ''} onChange={handleChange} />
        <select name="governmentIdType" value={formData.governmentIdType || ''} onChange={handleChange}>
          <option value="">Select Government ID Type</option>
          <option value="Aadhaar">Aadhaar</option>
          <option value="Passport">Passport</option>
          <option value="PAN">PAN</option>
          <option value="Driving License">Driving License</option>
        </select>
        <input type="text" name="governmentIdNumber" placeholder="ID Number" value={formData.governmentIdNumber || ''} onChange={handleChange} />
        <input type="text" name="brokerName" placeholder="Broker Name" value={formData.brokerName || ''} onChange={handleChange} />
        <input type="text" name="brokerCompany" placeholder="Broker Company Name" value={formData.brokerCompany || ''} onChange={handleChange} />
        <input type="tel" name="brokerContact" placeholder="Broker Contact Number" value={formData.brokerContact || ''} onChange={handleChange} />
        <button type="submit">Submit Changes</button>
      </form>
    </div>
  );
};

export default EditVisitor;