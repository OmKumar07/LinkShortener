import React, { useState } from 'react';
import axios from 'axios';
import './styles.css';  // Import your CSS file

function LinkShortener() {
  const [url, setUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(''); // To show copy success message

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/shorten', { originalUrl: url });
      setShortenedUrl(response.data.shortUrl);
      setCopySuccess(''); // Reset copy success message
    } catch (error) {
      console.error('Error shortening URL:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortenedUrl).then(() => {
      setCopySuccess('Copied!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <div className="container">
      <h1>URL Shortener</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit">Shorten</button>
      </form>
      {shortenedUrl && (
        <div className="shortened-link">
          <p>Shortened URL:</p>
          <a href={`http://localhost:5000/${shortenedUrl}`} target="_blank" rel="noopener noreferrer">
          {`http://localhost:5000/${shortenedUrl}`}
          </a>
          <button onClick={copyToClipboard} className="copy-button">Copy</button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
      )}
    </div>
  );
}

export default LinkShortener;
