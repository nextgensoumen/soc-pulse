import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ModuleCard from './components/ModuleCard';

// Dynamically connect to the backend running on the same host, port 5000
const backendUrl = `http://${window.location.hostname}:5000`;
const socket = io(backendUrl);

function App() {
  const [modules, setModules] = useState([
    {
      id: 1,
      title: "Supply Chain Defense",
      description: "Shai-Hulud NPM Malware Scanner. Monitors project dependencies for malicious payloads.",
      icon: "🛡️",
      status: "Idle",
      threatLevel: "Low",
      isRunning: false
    },
    {
      id: 2,
      title: "Web App Scanner",
      description: "React2Shell DAST vulnerability scanner for Remote Code Execution threats.",
      icon: "🌐",
      status: "Idle",
      threatLevel: "Medium",
      isRunning: false
    },
    {
      id: 3,
      title: "Endpoint Hardening",
      description: "Ubuntu security script aligning infrastructure with DISA-STIG compliance.",
      icon: "🔐",
      status: "Idle",
      threatLevel: "Low",
      isRunning: false
    },
    {
      id: 4,
      title: "Incident Response",
      description: "CVE-2024-3094 vulnerability checker and fleet-wide Ansible patcher.",
      icon: "🩹",
      status: "Idle",
      threatLevel: "High",
      isRunning: false
    },
    {
      id: 5,
      title: "Cryptographic Manager",
      description: "Let's Encrypt IP SSL manager with automated 4-hour renewals.",
      icon: "🔑",
      status: "Idle",
      threatLevel: "Low",
      isRunning: false
    }
  ]);

  useEffect(() => {
    // Fetch initial statuses from API
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
                status: serverStat.isRunning ? 'Scanning' : 'Idle'
              };
            }
            return mod;
          }));
        }
      })
      .catch(err => console.error("Could not connect to backend API:", err));

    // Listen for WebSocket status changes
    const handleStatusChange = (data) => {
      setModules(prev => prev.map(mod => 
        mod.id == data.moduleId 
          ? { ...mod, isRunning: data.isRunning, status: data.status }
          : mod
      ));
    };

    socket.on('module_status_change', handleStatusChange);

    return () => {
      socket.off('module_status_change', handleStatusChange);
    };
  }, []);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main className="content-area">
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
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
