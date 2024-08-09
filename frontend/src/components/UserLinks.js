import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserLinks.css';

const BASE_URL = 'http://localhost:5000'; // Update this if deploying to a different environment

const UserLinks = () => {
  const [links, setLinks] = useState([]);
  const [copiedUrl, setCopiedUrl] = useState(null);

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
      }, 2000); // Hide the message after 2 seconds
    }).catch((err) => {
      console.error('Failed to copy URL:', err);
    });
  };

  return (
    <div className="user-links-container">
      <h2>Your Shortened Links</h2>
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
              {copiedUrl === fullUrl && <span className="copied-message">Copied!</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default UserLinks;
