import React, { useState, useEffect } from 'react';

const Sidebar = ({ activeView, setActiveView }) => {
  const pulseTranslations = ["Pulse", "पल्स", "পালস"];
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % pulseTranslations.length);
    }, 1500); // 1.5 second loop
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar glass-panel">
      <div className="logo-container">
        <h1 className="logo-text">
          <span className="logo-accent">SOC</span> {pulseTranslations[pulseIndex]}
        </h1>
      </div>
      
      <nav className="nav-menu">
        <div className="nav-group">
          <p className="nav-label">COMMAND CENTER</p>
          <a href="#" className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}>
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
          <a href="#" className={`nav-item ${activeView === 'doc-1' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('doc-1'); }}>
            <span className="icon">🛡️</span>
            Supply Chain Defense
          </a>
          <a href="#" className={`nav-item ${activeView === 'doc-2' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('doc-2'); }}>
            <span className="icon">🌐</span>
            Web App Scanner
          </a>
          <a href="#" className={`nav-item ${activeView === 'doc-3' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('doc-3'); }}>
            <span className="icon">🔐</span>
            System Endpoint Hardening
          </a>
          <a href="#" className={`nav-item ${activeView === 'doc-4' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('doc-4'); }}>
            <span className="icon">🩹</span>
            Autonomous Remediation
          </a>
          <a href="#" className={`nav-item ${activeView === 'doc-5' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveView('doc-5'); }}>
            <span className="icon">🔑</span>
            Machine IP Cryptography
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
