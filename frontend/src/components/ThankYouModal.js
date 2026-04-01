import React, { useEffect, useState } from 'react';
import './ThankYouModal.css';

const ThankYouModal = ({ isOpen, visitorName, onClose }) => {
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="thank-you-backdrop">
      <div className="thank-you-modal">
        <div className="thank-you-checkmark">
          <svg viewBox="0 0 24 24" className="checkmark-icon">
            <path
              fill="currentColor"
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
            />
          </svg>
        </div>

        <h1 className="thank-you-title">Thank You!</h1>

        <p className="thank-you-message">
          Dear <strong>{visitorName || 'Visitor'}</strong>,
        </p>

        <p className="thank-you-text">
          Your profile has been successfully submitted. Our team will review your information and get back to you shortly.
        </p>

        <div className="thank-you-footer">
          <p className="countdown-text">
            Redirecting in <span className="countdown-number">{countdown}</span> seconds...
          </p>
          <button className="thank-you-button" onClick={onClose}>
            Close Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouModal;