// PasswordPopup.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PasswordPopup.css';

const PasswordPopup = ({ linkId, onClose }) => {
  const [password, setPassword] = useState('');
  const [passwordSet, setPasswordSet] = useState(false);

  useEffect(() => {
    const fetchPassword = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/links/${linkId}/password`, { withCredentials: true });
        if (response.data.password) {
          setPassword(response.data.password);
          setPasswordSet(true);
        } else {
          setPasswordSet(false);
        }
      } catch (error) {
        console.error('Error fetching password:', error);
      }
    };

    fetchPassword();
  }, [linkId]);

  const handleSetPassword = async () => {
    try {
      await axios.post('http://localhost:5000/links/set-password', {
        linkId,
        password
      }, { withCredentials: true });
      alert('Password set successfully');
      onClose();
    } catch (error) {
      console.error('Error setting password:', error);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="password-popup-overlay">
      <div className="password-popup">
        <h2>{passwordSet ? 'View Password' : 'Set Password'}</h2>
        {passwordSet ? (
          <div>
            <p>Password: {password}</p>
          </div>
        ) : (
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <button onClick={handleSetPassword}>Set Password</button>
          </div>
        )}
        <button onClick={handleClose}>Close</button>
      </div>
    </div>
  );
};

export default PasswordPopup;
