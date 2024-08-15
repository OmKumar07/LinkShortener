import React, { useEffect, useState } from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';
import './UserLinks.css';
import PasswordPopup from '../PasswordPopup/PasswordPopup';

const BASE_URL = 'http://localhost:5000'; // Update this if deploying to a different environment

const UserLinks = () => {
  const [links, setLinks] = useState([]);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [showQrCode, setShowQrCode] = useState(null);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [currentLinkId, setCurrentLinkId] = useState(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/links`, { withCredentials: true });
        setLinks(response.data);
      } catch (error) {
        console.error('Error fetching links:', error);
      }
    };

    fetchLinks();
  }, []);

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => {
        setCopiedUrl(null);
      }, 1000); // Hide the message after 2 seconds
    }).catch((err) => {
      console.error('Failed to copy URL:', err);
    });
  };
  const toggleLinkStatus = async (linkId, currentStatus) => {
    try {
      await axios.post('http://localhost:5000/links/toggle', {
        linkId,
        isDisabled: !currentStatus
      }, { withCredentials: true });
      
      // Update the local state to reflect the change
      setLinks(links.map(link =>
        link._id === linkId ? { ...link, isDisabled: !currentStatus } : link
      ));
    } catch (error) {
      console.error('Error toggling link status:', error);
    }
  };

  const handleDelete = async (linkId) => {
    try {
      await axios.delete(`${BASE_URL}/links/${linkId}`, { withCredentials: true });

      // Remove the deleted link from the state
      setLinks(links.filter(link => link._id !== linkId));
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };
  const handleGenerateQrCode = (url) => {
    setQrCodeUrl(url);
    setShowQrCode(url);
  };

  const handlePasswordSetupClick = (linkId) => {
    setCurrentLinkId(linkId);
    setShowPasswordPopup(true);
  };

  const handlePasswordPopupClose = () => {
    setShowPasswordPopup(false);
    setCurrentLinkId(null);
  };
  return (
    <div className="user-links-container">
      <h2 className='Userlinks-heading'>Your Shortened Links</h2>
      <ul className="user-links-list">
        {links.map((link) => {
          const fullUrl = `${BASE_URL}/${link.shortUrl}`;
          return (
            <li key={link._id}>
              <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                {fullUrl}
              </a>
              <button className="copy-button" onClick={() => handleCopy(fullUrl)}>
                Copy
              </button>
              
            <button className="generate-qr-button" onClick={() => handleGenerateQrCode(fullUrl)}>
                Generate QR
              </button>
              <button
                className={`password-setup-button ${link.password ? 'set' : 'unset'}`}
                onClick={() => handlePasswordSetupClick(link._id)}
              >
                {link.password ? 'View Password' : 'Set Password'}
              </button>
            <button className="delete-button" onClick={() => handleDelete(link._id)}>
                Delete
              </button>
              <div className="click-count">Clicks: {link.clickCount}</div>
              <label className="disable-link-label">
              Disable Link
              <input
                type="checkbox"
                checked={!!link.isDisabled}
                onChange={() => toggleLinkStatus(link._id, link.isDisabled)}
              />
            </label>
            {showQrCode === fullUrl && (
                <div className="qr-code-container">
                  <QRCode value={qrCodeUrl} size={64} />
                </div>
              )}
              {copiedUrl === fullUrl && <span className="copied-message">Copied!</span>}
            </li>
          );
        })}
      </ul>
      {showPasswordPopup && (
        <PasswordPopup
          linkId={currentLinkId}
          onClose={handlePasswordPopupClose}
        />
      )}
    </div>
  );
};

export default UserLinks;
