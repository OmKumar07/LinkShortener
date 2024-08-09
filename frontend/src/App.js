// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LinkShortener from './components/LinkShortener';
import UserLinks from './components/UserLinks';
import LoginButton from './components/LandingPage';
import HamburgerMenu from './components/HamburgerMenu';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:5000/logout', { withCredentials: true });
      setIsAuthenticated(false);
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  const [user, setUser] = useState(null);
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/status', { withCredentials: true });
        setIsAuthenticated(response.data.isAuthenticated);
        if (response.data.isAuthenticated) {
          const userResponse = await axios.get('http://localhost:5000/auth/user', { withCredentials: true });
          setUser(userResponse.data);}
      } 
      catch (error) {
        console.error('Error checking authentication status:', error);
      }
    };


    checkAuthStatus();
  }, []);

  return (
    <div>
      {isAuthenticated ? (
        <>
          <HamburgerMenu user={user} onLogout={handleLogout} />
          <LinkShortener />
          <UserLinks />
        </>
      ) : (
        <LoginButton />
      )}
    </div>
  );
};

export default App;
