import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import VisitorForm from './components/VisitorForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
// ...existing code...
import SalesLogin from './components/SalesLogin';
import SalesDashboard from './components/SalesDashboard';
import EditVisitor from './components/EditVisitor';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="luxury-header">
          <h1>Orchid Visitor Portal (OVP)</h1>
        </header>
        <Routes>
          <Route path="/visitor-form" element={<VisitorForm />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
// ...existing code...
          <Route path="/sales-login" element={<SalesLogin />} />
          <Route path="/sales-dashboard" element={<SalesDashboard />} />
          <Route path="/edit-visitor/:id" element={<EditVisitor />} />
          <Route path="/" element={<VisitorForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
