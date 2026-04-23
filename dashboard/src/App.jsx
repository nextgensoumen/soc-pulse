import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ModuleCard from './components/ModuleCard';
import DocumentationView from './components/DocumentationView';
import SupplyChainDetails from './components/details/SupplyChainDetails';
import WebAppScannerDetails from './components/details/WebAppScannerDetails';

// Dynamically connect to the backend running on the same host, port 5000
// Resilient connection: auto-reconnect with exponential backoff (cloud-safe)
const backendUrl = `http://${window.location.hostname}:5000`;
const socket = io(backendUrl, {
  reconnection: true,          // auto-reconnect on disconnect
  reconnectionAttempts: 100,   // try up to 100 times
  reconnectionDelay: 1000,     // start at 1 second
  reconnectionDelayMax: 30000, // max 30 seconds between retries
  randomizationFactor: 0.3,    // jitter to avoid thundering herd
  timeout: 20000,              // 20s connection timeout
  transports: ['websocket', 'polling'], // websocket first, polling fallback
});

const FallingSunflowers = () => {
  const particles = Array.from({ length: 25 }).map((_, i) => {
    const left = Math.random() * 100;
    const animDuration = 15 + Math.random() * 25; // 15s to 40s
    const delay = Math.random() * -40;
    const size = 1.2 + Math.random() * 1.5; 
    const blur = Math.random() * 3; 
    const opacity = 0.15 + Math.random() * 0.4; 

    return (
      <div 
        key={i} 
        className="sunflower-particle"
        style={{
          left: `${left}vw`,
          animationDuration: `${animDuration}s`,
          animationDelay: `${delay}s`,
          fontSize: `${size}rem`,
          filter: `blur(${blur}px)`,
          opacity: opacity
        }}
      >
        🌻
      </div>
    );
  });

  return <div className="particles-container">{particles}</div>;
};

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [detailsLogs, setDetailsLogs] = useState([]);
  const [modules, setModules] = useState([
    {
      id: 1,
      title: "Supply Chain Defense",
      description: "Analyzes project package.json and lockfiles against threat databases to detect malicious node dependencies.",
      icon: "🛡️",
      status: "Idle",
      threatLevel: "Low",
      isRunning: false
    },
    {
      id: 2,
      title: "Web App Scanner",
      description: "Executes the compiled local React2Shell binary to aggressively hunt CVE-2025-55182 Remote Code Execution payloads.",
      icon: "🌐",
      status: "Idle",
      threatLevel: "Medium",
      isRunning: false
    },
    {
      id: 3,
      title: "System Endpoint Hardening",
      description: "Injects kernel-level Sysctls, AuditD trackers, and Fail2Ban brute-force locks without severing Machine SSH keys.",
      icon: "🔐",
      status: "Idle",
      threatLevel: "Low",
      isRunning: false
    },
    {
      id: 4,
      title: "Autonomous Remediation",
      description: "Utilizes a headless DPkg sequence to detect and neutralize the infamous XZ-Utils (CVE-2024-3094) backend sshd backdoor.",
      icon: "🩹",
      status: "Idle",
      threatLevel: "High",
      isRunning: false
    },
    {
      id: 5,
      title: "Machine IP Cryptography",
      description: "Generates explicit system-state audits targeting local Certbot ACME configurations for 6-day IP-Certificate rotations.",
      icon: "🔑",
      status: "Idle",
      threatLevel: "Low",
      isRunning: false
    }
  ]);

  const fetchModuleStatuses = () => {
    fetch(`${backendUrl}/api/modules`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.statuses) {
          setModules(prev => prev.map(mod => {
            const serverStat = data.statuses.find(s => s.id === mod.id);
            if (serverStat) {
              return {
                ...mod,
                isRunning: serverStat.isRunning,
                status: serverStat.isRunning ? 'Scanning' : (serverStat.lastStatus !== 'Never Run' ? serverStat.lastStatus : mod.status),
              };
            }
            return mod;
          }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Fetch initial statuses from API
    fetchModuleStatuses();

    // Listen for WebSocket status changes
    const handleStatusChange = (data) => {
      setModules(prev => prev.map(mod =>
        mod.id == data.moduleId
          ? { ...mod, isRunning: data.isRunning, status: data.status }
          : mod
      ));
    };

    socket.on('module_status_change', handleStatusChange);

    // Polling fallback every 3s — catches missed WebSocket events
    // (e.g. fast modules that complete before WebSocket flushes)
    const pollInterval = setInterval(fetchModuleStatuses, 3000);

    return () => {
      socket.off('module_status_change', handleStatusChange);
      clearInterval(pollInterval);
    };
  }, []);

  const handleShowDetails = (id, logs) => {
    setActiveView(`details-${id}`);
    setDetailsLogs(logs);
  };

  return (
    <div className="app-container">
      <FallingSunflowers />
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="main-content">
        {/* TopBar is OUTSIDE the scrollable area — always visible */}
        <TopBar />
        <main className="content-area">
          {/* Main Dashboard - Hidden via CSS if not active to preserve ModuleCard states (logs) */}
          <div style={{ display: activeView === 'dashboard' ? 'block' : 'none' }}>
            <div className="dashboard-header">
              <h2>Command Center Overview</h2>
              <p className="subtitle">Real-time status and live execution of all security modules.</p>
            </div>
            
            <div className="modules-grid">
              {modules.map(mod => (
                <ModuleCard 
                  key={mod.id}
                  id={mod.id}
                  title={mod.title}
                  description={mod.description}
                  icon={mod.icon}
                  status={mod.status}
                  threatLevel={mod.threatLevel}
                  isRunning={mod.isRunning}
                  socket={socket}
                  backendUrl={backendUrl}
                  onStatusRefresh={fetchModuleStatuses}
                  onShowDetails={handleShowDetails}
                />
              ))}
            </div>
          </div>

          {/* Docs View */}
          {activeView.startsWith('doc-') && (
            <DocumentationView 
              moduleId={parseInt(activeView.split('-')[1])} 
              onBack={() => setActiveView('dashboard')} 
            />
          )}

          {/* Details Views */}
          {activeView === 'details-1' && (
            <SupplyChainDetails 
              logs={detailsLogs} 
              onBack={() => setActiveView('dashboard')} 
            />
          )}

          {activeView === 'details-2' && (
            <WebAppScannerDetails 
              logs={detailsLogs} 
              onBack={() => setActiveView('dashboard')} 
            />
          )}

          <footer style={{
            textAlign: 'center',
            padding: '25px 0',
            marginTop: '50px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.85rem',
            letterSpacing: '0.5px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem', textShadow: '0 0 10px rgba(255, 214, 0, 0.7)' }}>🌻</span>
              <span style={{ fontWeight: '600', letterSpacing: '1.5px', color: '#FFd600' }}>SOC PULSE</span>
            </div>
            
            <p style={{ margin: '0 0 6px 0', color: 'rgba(255, 255, 255, 0.4)' }}>
              © {new Date().getFullYear()} All rights reserved.
            </p>
            
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Developed & Designed by <strong style={{ color: '#FF6D00', letterSpacing: '1px', filter: 'drop-shadow(0 0 5px rgba(255, 109, 0, 0.6))' }}>ULTRON</strong>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
