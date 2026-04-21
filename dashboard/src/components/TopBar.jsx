import React from 'react';

const TopBar = () => {
  return (
    <header className="topbar glass-panel">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Search logs, IPs, or threats..." className="search-input" />
      </div>
      
      <div className="topbar-actions">
        <button className="action-btn badge-container">
          🔔
          <span className="badge">3</span>
        </button>
        <div className="user-profile">
          <div className="avatar">A</div>
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
