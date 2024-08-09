// src/components/HamburgerMenu.js
import React, { useState } from 'react';
import './HamburgerMenu.css';

const HamburgerMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="hamburger-menu">
      <button className="hamburger-icon" onClick={toggleMenu}>
        ☰
      </button>
      {isOpen && (
        <div className="menu">
          <img src={user.profilePicture} alt="profilr-pic" className="profile-picture" />
          <p className="user-name">{user.name}</p>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
