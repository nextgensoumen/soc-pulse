import React from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ModuleCard from './components/ModuleCard';

function App() {
  const modules = [
    {
      id: 1,
      title: "Supply Chain Defense",
      description: "Shai-Hulud NPM Malware Scanner. Monitors project dependencies for malicious payloads.",
      icon: "🛡️",
      status: "Active",
      threatLevel: "Low",
      actionText: "Run Scan"
    },
    {
      id: 2,
      title: "Web App Scanner",
      description: "React2Shell DAST vulnerability scanner for Remote Code Execution threats.",
      icon: "🌐",
      status: "Scanning",
      threatLevel: "Medium",
      actionText: "Stop Scan"
    },
    {
      id: 3,
      title: "Endpoint Hardening",
      description: "Ubuntu security script aligning infrastructure with DISA-STIG compliance.",
      icon: "🔐",
      status: "Patched",
      threatLevel: "Low",
      actionText: "Verify Rules"
    },
    {
      id: 4,
      title: "Incident Response",
      description: "CVE-2024-3094 vulnerability checker and fleet-wide Ansible patcher.",
      icon: "🩹",
      status: "Offline",
      threatLevel: "High",
      actionText: "Deploy Patch"
    },
    {
      id: 5,
      title: "Cryptographic Manager",
      description: "Let's Encrypt IP SSL manager with automated 4-hour renewals.",
      icon: "🔑",
      status: "Active",
      threatLevel: "Low",
      actionText: "Force Renew"
    }
  ];

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main className="content-area">
          <div className="dashboard-header">
            <h2>Command Center Overview</h2>
            <p className="subtitle">Real-time status of all integrated security modules.</p>
          </div>
          
          <div className="modules-grid">
            {modules.map(mod => (
              <ModuleCard 
                key={mod.id}
                title={mod.title}
                description={mod.description}
                icon={mod.icon}
                status={mod.status}
                threatLevel={mod.threatLevel}
                actionText={mod.actionText}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
