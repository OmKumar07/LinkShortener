import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <h1 className="landing-title">Welcome to LinkShortener</h1>
      <p className="landing-subtitle">
        Simplify your links and track your URLs with ease.
      </p>
      <a href="http://localhost:5000/auth/google" className="cta-button">Get Started with Google</a>
    </div>
  );
};

export default LandingPage;