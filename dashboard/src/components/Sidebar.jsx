import React from 'react';

const Sidebar = () => {
  return (
    <aside className="sidebar glass-panel">
      <div className="logo-container">
        <h1 className="logo-text">
          <span className="logo-accent">SOC</span> Pulse
        </h1>
      </div>
      
      <nav className="nav-menu">
        <div className="nav-group">
          <p className="nav-label">COMMAND CENTER</p>
          <a href="#" className="nav-item active">
            <span className="icon">⊞</span>
            Dashboard
          </a>
          <a href="#" className="nav-item">
            <span className="icon">⚡</span>
            Live Alerts
          </a>
        </div>
        
        <div className="nav-group">
          <p className="nav-label">MODULES</p>
          <a href="#" className="nav-item">
            <span className="icon">🛡️</span>
            Malware Scanner
          </a>
          <a href="#" className="nav-item">
            <span className="icon">🌐</span>
            Web App Scanner
          </a>
          <a href="#" className="nav-item">
            <span className="icon">🔐</span>
            Server Hardening
          </a>
          <a href="#" className="nav-item">
            <span className="icon">🩹</span>
            Auto Remediation
          </a>
          <a href="#" className="nav-item">
            <span className="icon">🔑</span>
            SSL Manager
          </a>
        </div>
      </nav>
      
      <div className="system-health">
        <div className="health-indicator">
          <div className="pulse-dot"></div>
          <span>System Healthy</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
