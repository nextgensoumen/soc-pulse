import React from 'react';

const moduleDocs = {
  1: {
    title: "Supply Chain Defense",
    icon: "🛡️",
    content: (
      <>
        <h3 style={{ color: '#FFd600', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.5rem' }}>NPM Malware & Dependency Protection</h3>
        <p>The <strong>Supply Chain Defense</strong> module operates specifically to intercept multi-tiered infection vectors frequently found in modern web applications. Utilizing the advanced <em>Shai-Hulud 2.0</em> heuristic database, it executes hyper-focused recursive scans targeted exclusively at <code>package.json</code> mapping trees and nested lockfile signatures natively on the target Ubuntu machine.</p>
        
        <h4 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Operational Logic</h4>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Scans recursively through deeply nested dependency trees utilizing un-bloated Node.js binary executables.</li>
          <li>Correlates checksum hashes of installed modules against a hardened list of heavily compromised NPM structures.</li>
          <li>Returns granular JSON outputs to the frontend DOM asynchronously to prevent blocking the React orchestrator server.</li>
        </ul>
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(255, 214, 0, 0.1)', borderRadius: '8px', borderLeft: '4px solid #FFd600' }}>
          <p style={{ margin: 0 }}><strong>Security Note:</strong> This module runs exclusively via localized payload execution rather than performing dangerous remote <code>npx</code> downloads, ensuring zero external supply chain manipulation during the scan lifecycle.</p>
        </div>
      </>
    )
  },
  2: {
    title: "Web App Scanner",
    icon: "🌐",
    content: (
      <>
        <h3 style={{ color: '#FFd600', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.5rem' }}>DAST Penetration Testing (CVE-2025-55182)</h3>
        <p>The <strong>Web App Scanner</strong> acts as a proactive, localized penetration testing protocol specifically compiled in native TypeScript. It aggressively interrogates React Server Components (RSC) Flight protocol payloads hunting for the lethal Remote Code Execution vulnerability currently tracked under <em>CVE-2025-55182</em>.</p>
        
        <h4 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Vulnerability Mechanics</h4>
        <p>Because the React Flight protocol parser does not inherently sanitize malicious string evaluation before hydrating components, an unauthenticated attacker can achieve reverse-shell execution directly into your Next.js server instance bypassing standard Web Application Firewalls.</p>
        
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8', marginTop: '1rem' }}>
          <li>The module is stripped of generic remote-execution dependencies, compiling natively into <code>dist/cli/index.js</code> via SOC Pulse.</li>
          <li>Safely emulates RSC manipulation across <code>0.0.0.0</code> bindings, delivering simulated payloads without causing application downtime.</li>
        </ul>
      </>
    )
  },
  3: {
    title: "System Endpoint Hardening",
    icon: "🔐",
    content: (
      <>
        <h3 style={{ color: '#FFd600', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.5rem' }}>Cloud-Safe Kernel Stabilization</h3>
        <p>The <strong>System Endpoint Hardening</strong> script represents a massive restructuring of standard Linux fortification tools. Traditional DISA-STIG compliance scripts violently alter the <code>sshd_config</code> and UFW Firewalls, which routinely causes catastrophic loss of communication on AWS/Cloud instances by severing underlying Cloud-Init key handshakes.</p>
        
        <h4 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Hardening Adjustments</h4>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Fail2Ban Analytics:</strong> Seamlessly limits brute-force dictionary attacks mapping onto localized ports natively without severing standard root access tokens.</li>
          <li><strong>AuditD Deployment:</strong> Deeply logs kernel modifications and traces explicit edits made maliciously against the <code>/etc/shadow</code> pool.</li>
          <li><strong>Sysctls Protection:</strong> Injects safe network routing configurations to inherently drop ICMP attack payloads and completely mitigate IPv4 spoofing layers.</li>
          <li><strong>AIDE System:</strong> Calculates and tracks real-time integrity hashes for critical files arrayed across the core OS.</li>
        </ul>
      </>
    )
  },
  4: {
    title: "Autonomous Remediation",
    icon: "🩹",
    content: (
      <>
        <h3 style={{ color: '#FFd600', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.5rem' }}>Headless Vulnerability Patching (XZ-Utils)</h3>
        <p>The <strong>Autonomous Remediation</strong> engine is a custom, non-interactive Bash script mapped directly to resolving one of the most critical SSH vulnerabilities in modern Linux architecture: the XZ-Utils backdoor (<em>CVE-2024-3094</em>).</p>
        
        <h4 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Silent Execution Logic</h4>
        <p>Older server configuration scripts rely on generic Ansible loops that cause backend node execution to hang indefinitely upon receiving simulated user prompts. This module bypasses interactive <code>apt-get</code> evaluations completely by mapping DPkg inputs through explicit <code>awk</code> parsing. It rapidly analyzes the loaded <code>liblzma</code> libraries, flags backdoor artifacts dynamically, and securely downgrades the daemon without dropping SOC Pulse application streams.</p>
      </>
    )
  },
  5: {
    title: "Machine IP Cryptography",
    icon: "🔑",
    content: (
      <>
        <h3 style={{ color: '#FFd600', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.5rem' }}>ACME Status Reporting for Bare IP Certificates</h3>
        <p>The <strong>Machine IP Cryptography</strong> environment dictates secure ACME synchronization purely built for Let's Encrypt's rollout of "Public IP Certificates". Prior to this engineering change, certificates could exclusively map to DNS domains. Now, bare AWS IP addresses support valid HTTPS connections, but at the terrible cost of extreme 6-day certificate expiration cycles.</p>
        
        <h4 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Refactored Status Tracking</h4>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Completely decoupled from legacy 117KB generic macOS/BSD installers that crashed AWS servers via <em>"Unknown OS"</em> fatal execution errors.</li>
          <li>Tracks the real-time installation of Certbot dependencies directly targeted at the Ubuntu APT stream.</li>
          <li>Monitors active cron-job status to ensure certificates inherently cycle and validate successfully within a precise 4-hour evaluation loop.</li>
        </ul>
      </>
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
