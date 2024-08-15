import React, { useState, useEffect } from "react";
import axios from "axios";
import "./LinkShortener.css"; // Import your CSS file

function LinkShortener() {
  const [url, setUrl] = useState("");
  const [shortenedUrl, setShortenedUrl] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState('');

  // Check if the user is authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get("http://localhost:5000/auth/status", {
          withCredentials: true,
        });
        setIsAuthenticated(response.data.isAuthenticated);
      } catch (error) {
        console.error("Error checking authentication status:", error);
      }
    };

    checkAuthStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please login to shorten URLs.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/shorten",
        {
          originalUrl: url,
          customUrl: customUrl || undefined, // Only send customUrl if it's not empty
        },
        { withCredentials: true }
      );
      setShortenedUrl(response.data.shortUrl);
      setErrorMessage('');
      setCopySuccess(""); // Reset copy success message
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error); // Set the error message
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(`${shortenedUrl}`)
      .then(() => {
        setCopySuccess("Copied!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  };

  return (
    <div className="container">
      <h1>URL Shortener</h1>
      {!isAuthenticated ? (
        <p>Please log in to shorten URLs.</p>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter your URL"
              value={url}
              className="Original-input"
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="input-container">
              <span className="placeholder">http://localhost:5000/</span>
              <input
                type="text"
                className="custom-input"
                placeholder="your-custom-url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
              <span className="placeholder">(optional)</span>
            </div>
            <button type="submit" className="submit-btn">Shorten</button>
          </form>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {shortenedUrl && (
            <div className="shortened-link">
              <p>Shortened URL:</p>
              <a href={shortenedUrl} target="_blank" rel="noopener noreferrer">
                {shortenedUrl}
              </a>
              <button onClick={copyToClipboard} className="copy-button">
                Copy
              </button>
              {copySuccess && (
                <span className="copy-success">{copySuccess}</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LinkShortener;
