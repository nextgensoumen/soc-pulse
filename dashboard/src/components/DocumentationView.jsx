import React from 'react';

const moduleDocs = {
  1: {
    title: "Supply Chain Defense",
    icon: "🛡️",
    content: (
      <>
        <h3 style={{ color: '#FFd600', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.5rem' }}>NPM Malware & Dependency Protection</h3>
        <p>The <strong>Supply Chain Defense</strong> module operates specifically to intercept multi-tiered infection vectors frequently found in modern web applications. Utilizing the advanced <em>Shai-Hulud 2.1.0</em> heuristic database, it executes hyper-focused recursive scans targeted exclusively at <code>package.json</code> mapping trees and nested lockfile signatures natively on the target Ubuntu machine.</p>
        
        <h4 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Operational Logic</h4>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Scans recursively through deeply nested dependency trees utilizing un-bloated Node.js binary executables.</li>
          <li>Correlates checksum hashes of installed modules against a hardened list of over <strong>790+ heavily compromised NPM structures</strong>.</li>
          <li>Detects stealthy malware implants, known SHA256 malware signatures, and unauthorized code execution hooks.</li>
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
        <p>The <strong>Web App Scanner</strong> acts as a proactive, localized penetration testing protocol specifically compiled in native TypeScript. It aggressively interrogates React Server Components (RSC) Flight protocol payloads hunting for the lethal Remote Code Execution vulnerability currently tracked under <em>CVE-2025-55182</em> (CVSS Score: 10.0).</p>
        
        <h4 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Vulnerability Mechanics</h4>
        <p>Because the React Flight protocol parser does not inherently sanitize malicious string evaluation before hydrating components, an unauthenticated attacker can achieve reverse-shell execution directly into your Next.js/React server instance bypassing standard Web Application Firewalls.</p>
        
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8', marginTop: '1rem' }}>
          <li>The module is stripped of generic remote-execution dependencies, compiling natively into <code>dist/cli/index.js</code> during setup via SOC Pulse.</li>
          <li>Safely emulates RSC manipulation across <code>0.0.0.0</code> bindings, delivering simulated payloads without causing application downtime or exposing the server to outside networks.</li>
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
        <p style={{ marginBottom: '1rem' }}>SOC Pulse avoids UFW network-lockouts entirely and instead secures the machine using native, headless operational tools:</p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Sysctls Protection:</strong> Injects safe network routing configurations directly into the kernel to inherently drop ICMP attack payloads and completely mitigate IPv4 spoofing layers.</li>
          <li><strong>AIDE System:</strong> Calculates and tracks real-time integrity hashes for critical files arrayed across the core OS. Configured to run completely headless without blocking terminal input.</li>
          <li><strong>Fail2Ban Analytics:</strong> Seamlessly limits brute-force dictionary attacks mapping onto localized port 22 natively without severing standard root AWS access tokens.</li>
          <li><strong>AuditD Deployment:</strong> Deeply logs kernel modifications and traces explicit edits made maliciously against the <code>/etc/shadow</code> credential pool.</li>
        </ul>
      </>
    )
  },
  4: {
    title: "Autonomous Remediation",
    icon: "🩹",
    content: (
      <>
        <h3 style={{ color: '#FFd600', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.5rem' }}>Headless Vulnerability Patching</h3>
        <p>The <strong>Autonomous Remediation</strong> engine is a custom, non-interactive suite of Bash scripts mapped directly to mitigating the most critical Local Privilege Escalation (LPE) and Remote Code Execution (RCE) vulnerabilities in modern Linux architecture.</p>
        
        <h4 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Silent Execution & Live Mitigation</h4>
        <p>Older server configuration scripts rely on interactive prompts that cause backend orchestration nodes to hang indefinitely. This module bypasses interactive evaluations completely. It currently autonomously detects and mitigates:</p>
        
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8', marginTop: '1rem' }}>
          <li><strong>CVE-2024-6387 (regreSSHion):</strong> A severe flaw in OpenSSH's server. SOC Pulse mitigates this silently by forcing <code>LoginGraceTime 0</code> in the SSH daemon configuration and restarting it safely.</li>
          <li><strong>CVE-2021-4034 (PwnKit):</strong> A memory corruption flaw in PolicyKit. SOC Pulse instantly isolates the threat by dynamically stripping the SUID execution bit from the <code>pkexec</code> binary.</li>
          <li><strong>CVE-2024-3094 (XZ-Utils Backdoor):</strong> Analyzes loaded <code>liblzma</code> libraries via explicit <code>awk</code> parsing to detect malicious backdoor artifacts injected by rogue maintainers.</li>
        </ul>
      </>
    )
  },
  5: {
    title: "Machine IP Cryptography",
    icon: "🔑",
    content: (
      <>
        <h3 style={{ color: '#FFd600', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.5rem' }}>Zero-Network ACME Auditing</h3>
        <p>The <strong>Machine IP Cryptography</strong> environment dictates secure ACME synchronization purely built for Let's Encrypt's rollout of "Public IP Certificates". Now, bare AWS IP addresses support valid HTTPS connections, but at the cost of extreme 6-day certificate expiration cycles.</p>
        
        <h4 style={{ color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.5rem' }}>The Node.js Engine Rewrite</h4>
        <p>Legacy Bash-based SSL scripts are known to hang indefinitely on AWS EC2 instances due to VPC DNS resolution stalls when attempting to curl external ACME staging servers. SOC Pulse explicitly prevents this by utilizing a custom-built, ultra-fast <strong>Node.js engine (audit.js)</strong>.</p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8', marginTop: '1rem' }}>
          <li><strong>Instant Execution:</strong> Operates natively using <code>execSync</code> to verify Certbot configurations, completing an exhaustive 8-step system audit in under <strong>0.1 seconds</strong>.</li>
          <li><strong>Zero Network Calls:</strong> Eliminates hanging network connectivity tests completely. All audits check local filesystem configurations and dependencies only.</li>
          <li><strong>Renewal Auditing:</strong> Scans the underlying <code>systemd</code> timers and <code>/etc/cron.d/</code> directories to ensure 4-hour automatic rotation mechanisms are configured properly.</li>
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
