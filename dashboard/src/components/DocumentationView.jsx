import React from 'react';

const moduleDocs = {
  1: {
    title: "Supply Chain Defense",
    icon: "📦",
    content: (
      <div className="doc-content-container">
        <h3 style={{ color: '#FFd600', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🔍 What is it?</h3>
        <p>This module is a deep-level Node.js dependency scanner powered by the Shai-Hulud 2.0 heuristics engine. Rather than just checking for outdated packages, it performs a forensic analysis of your local <code>package.json</code> and <code>node_modules</code> tree to detect actively malicious, compromised, or typosquatted NPM packages.</p>
        
        <h3 style={{ color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🛑 Why is it needed?</h3>
        <p>Attackers frequently execute "Supply Chain Attacks" by hijacking legitimate packages or creating fake ones with similar names (typosquatting). Once installed, these poisoned packages can quietly steal <code>.env</code> secrets, install reverse-shell backdoors, or deploy resource-draining crypto-miners directly onto your production server.</p>

        <h3 style={{ color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🛡️ How does it help the SOC?</h3>
        <p>It shifts security "left" into the development phase. By catching poisoned dependencies before deployment, the SOC receives an immediate, automated alert detailing the exact malicious package. This turns a potentially catastrophic data breach into a simple <code>npm uninstall</code> operation.</p>

        <h3 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.8rem' }}>🖥️ Dashboard Features: What It Actually Shows</h3>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>🔴 Problems Found:</strong> Highlights any compromised package found, explains the specific threat, and auto-generates exact mitigation commands.</li>
          <li><strong>✅ Passed Items:</strong> Confirms the exact number of clean packages scanned, and displays Threat DB Stats (active database version and the 790+ signatures checked).</li>
          <li><strong>🖥️ Raw Forensic Logs:</strong> A collapsible toggle revealing the complete JSON output from the execution engine for deep analysis.</li>
        </ul>
      </div>
    )
  },
  2: {
    title: "Web App Scanner",
    icon: "🌐",
    content: (
      <div className="doc-content-container">
        <h3 style={{ color: '#FFd600', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🔍 What is it?</h3>
        <p>This module is a localized Dynamic Application Security Testing (DAST) suite specifically built to hunt for <strong>CVE-2025-55182</strong>—a catastrophic Remote Code Execution (RCE) vulnerability found in React Server Components.</p>
        
        <h3 style={{ color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🛑 Why is it needed?</h3>
        <p>Unauthenticated attackers can exploit improperly configured React Server Components to execute arbitrary terminal commands directly on your Node.js server. Because this is a framework-level flaw, traditional network firewalls and Web Application Firewalls (WAFs) cannot easily block it.</p>

        <h3 style={{ color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🛡️ How does it help the SOC?</h3>
        <p>It gives the SOC absolute visibility into the application layer. Rather than guessing if a web app is vulnerable, the SOC gets a definitive "Vulnerable" or "Safe" verdict based on local framework topology analysis, preventing reliance on external penetration testers.</p>

        <h3 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.8rem' }}>🖥️ Dashboard Features: What It Actually Shows</h3>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>🔴 Problems Found:</strong> If vulnerable, it lists the exact Next.js projects at risk and provides auto-generated mitigation flags.</li>
          <li><strong>✅ Passed Items:</strong> Provides a CVE Knowledge Card explaining the exploit, and maps exactly why the server passed (e.g., "No Server Components active").</li>
          <li><strong>🖥️ Raw Forensic Logs:</strong> Reveals the exact JSON and stdout streams from the binary execution.</li>
        </ul>
      </div>
    )
  },
  3: {
    title: "System Endpoint Hardening",
    icon: "🔐",
    content: (
      <div className="doc-content-container">
        <h3 style={{ color: '#FFd600', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🔍 What is it?</h3>
        <p>An autonomous Ubuntu Server OS configuration engine. It runs locally to transform a standard, vulnerable Ubuntu installation into a hardened, attack-resistant fortress by actively modifying kernel parameters and locking down SSH configurations.</p>
        
        <h3 style={{ color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🛑 Why is it needed?</h3>
        <p>Default Linux installations lack active file-tampering monitors, fail to block repeated brute-force SSH logins, and possess vulnerable kernel network settings that allow IP spoofing. If a server is exposed to the public internet, it will be brute-forced within minutes.</p>

        <h3 style={{ color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🛡️ How does it help the SOC?</h3>
        <p>It provides a standardized, baseline endpoint security posture across your entire cloud fleet with zero manual configuration. The SOC knows definitively that the OS is actively defending itself via Fail2Ban, AIDE, and AuditD.</p>

        <h3 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.8rem' }}>🖥️ Dashboard Features: What It Actually Shows</h3>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>🔴 Problems Found:</strong> Highlights missing compliance packages (like OpenSCAP) and displays an AWS Safety Banner explaining why UFW was intentionally bypassed to prevent lockouts.</li>
          <li><strong>✅ Passed Items:</strong> Features a live Service Health Grid showing if critical services successfully started, and explains all applied configurations (like Kernel Sysctls) in plain English.</li>
          <li><strong>🖥️ Raw Forensic Logs:</strong> Reveals the full terminal execution logs from the entire hardening run, allowing administrators to audit the exact apt commands executed.</li>
        </ul>
      </div>
    )
  },
  4: {
    title: "Autonomous CVE Remediation",
    icon: "🩹",
    content: (
      <div className="doc-content-container">
        <h3 style={{ color: '#FFd600', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🔍 What is it?</h3>
        <p>This module is a rapid-response incident remediation tracker and patcher. It scans the operating system for 7 top-tier vulnerabilities (including XZ-Backdoor, regreSSHion, PwnKit, and Baron Samedit) and actively patches them without human intervention.</p>
        
        <h3 style={{ color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🛑 Why is it needed?</h3>
        <p>When a massive OS-level vulnerability drops, system administrators often lack the time to manually SSH into hundreds of servers to test and apply mitigations. A delay of even a few hours can result in a compromised fleet.</p>

        <h3 style={{ color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🛡️ How does it help the SOC?</h3>
        <p>It turns the SOC from a passive monitoring station into an active defense mechanism. Threat remediation happens natively on the machine in minutes, automatically closing the window of exposure.</p>

        <h3 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.8rem' }}>🖥️ Dashboard Features: What It Actually Shows</h3>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>🔴 Vulnerable (Action Required):</strong> If a CVE couldn't be auto-patched, it provides manual commands to secure the system.</li>
          <li><strong>🟢 Patched (Auto-Mitigated):</strong> Shows the exact terminal commands the system ran autonomously to secure the vulnerability, providing full audit transparency.</li>
          <li><strong>✅ Safe (Not Vulnerable):</strong> Displays the safe version detected on the server alongside a plain-English explanation of the CVE, plus a toggle for raw behavioral exploit testing logs.</li>
        </ul>
      </div>
    )
  },
  5: {
    title: "Machine IP Cryptography",
    icon: "🔑",
    content: (
      <div className="doc-content-container">
        <h3 style={{ color: '#FFd600', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🔍 What is it?</h3>
        <p>A specialized TLS/SSL compliance auditor specifically engineered for Let's Encrypt certificates bound directly to public AWS IPv4 addresses. It utilizes a zero-network Node.js audit script to parse Certbot ACME configurations locally.</p>
        
        <h3 style={{ color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🛑 Why is it needed?</h3>
        <p>Mismanaged SSL certificates cause massive service outages and trigger browser security warnings that scare away users. Tracking certificate expiry, ensuring strong TLS cipher configurations, and verifying automatic renewal cron jobs on headless servers is notoriously difficult.</p>

        <h3 style={{ color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' }}>🛡️ How does it help the SOC?</h3>
        <p>It guarantees the SOC has instant, daily visibility into the cryptographic health of the endpoint. It prevents embarrassing outages by catching broken auto-renewal cron jobs, weak TLS settings, or expiring certificates before users notice a problem.</p>

        <h3 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.8rem' }}>🖥️ Dashboard Features: What It Actually Shows</h3>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>🔴 Problems Found:</strong> Highlights missing certificates, broken renewal hooks, or missing software, and provides exact, numbered commands to fix the issues immediately.</li>
          <li><strong>✅ Passed Items:</strong> Visually breaks down the 8 configuration checks via an interactive Audit Grid, explaining why an active certificate is crucial.</li>
          <li><strong>🖥️ Raw Forensic Logs:</strong> A collapsible toggle revealing the complete output of the cryptographic assessment engine for compliance auditing.</li>
        </ul>
      </div>
    )
  }
};

const DocumentationView = ({ moduleId, onBack }) => {
  const doc = moduleDocs[moduleId];

  if (!doc) return null;

  return (
    <div className="glass-panel" style={{ padding: '30px', margin: '20px' }}>
      <button 
        onClick={onBack}
        style={{
          background: 'none',
          border: '1px solid rgba(255, 214, 0, 0.3)',
          color: '#FFd600',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
          fontWeight: '500'
        }}
        onMouseOver={(e) => e.target.style.background = 'rgba(255, 214, 0, 0.1)'}
        onMouseOut={(e) => e.target.style.background = 'none'}
      >
        <span>←</span> Back to Dashboard
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <span style={{ fontSize: '2.5rem', textShadow: '0 0 15px rgba(255, 214, 0, 0.5)' }}>{doc.icon}</span>
        <h2 style={{ fontSize: '2rem', margin: 0, letterSpacing: '1px', textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}>
          {doc.title} Documentation
        </h2>
      </div>

      <div style={{ lineHeight: '1.6', fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.85)' }}>
        {doc.content}
      </div>
    </div>
  );
};

export default DocumentationView;
