import React from 'react';

const s1 = { color: '#FFd600', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' };
const s2 = { color: '#FFd600', marginTop: '1.5rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255, 214, 0, 0.2)', paddingBottom: '0.3rem' };
const s3 = { color: '#FF6D00', marginTop: '1.5rem', marginBottom: '0.8rem' };
const ul = { listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' };

function ModuleDocContent({ id }) {
  if (id === 1) return (
    <div>
      <h3 style={s1}>What is it?</h3>
      <p>A deep-level Node.js dependency scanner powered by the Shai-Hulud 2.0 heuristics engine. It performs a forensic analysis of your local package.json and node_modules tree to detect actively malicious, compromised, or typosquatted NPM packages.</p>
      <h3 style={s2}>Why is it needed?</h3>
      <p>Attackers execute Supply Chain Attacks by hijacking legitimate packages or creating fakes with similar names (typosquatting). Once installed, these poisoned packages can steal .env secrets, install reverse-shell backdoors, or deploy crypto-miners onto your production server.</p>
      <h3 style={s2}>How does it help the SOC?</h3>
      <p>It shifts security left into the development phase. By catching poisoned dependencies before deployment, the SOC receives an immediate automated alert detailing the exact malicious package — turning a catastrophic data breach into a simple npm uninstall.</p>
      <h3 style={s3}>Dashboard Features</h3>
      <ul style={ul}>
        <li><strong>Problems Found:</strong> Highlights any compromised package found, explains the specific threat, and auto-generates exact mitigation commands.</li>
        <li><strong>Passed Items:</strong> Confirms the exact number of clean packages scanned and displays Threat DB stats (790+ signatures checked).</li>
        <li><strong>Raw Forensic Logs:</strong> A collapsible toggle revealing the complete JSON output from the execution engine for deep analysis.</li>
      </ul>
    </div>
  );

  if (id === 2) return (
    <div>
      <h3 style={s1}>What is it?</h3>
      <p>A localized Dynamic Application Security Testing (DAST) suite specifically built to hunt for CVE-2025-55182 — a catastrophic Remote Code Execution (RCE) vulnerability found in React Server Components. CVSS Score: 10.0.</p>
      <h3 style={s2}>Why is it needed?</h3>
      <p>Unauthenticated attackers can exploit improperly configured React Server Components to execute arbitrary terminal commands directly on your Node.js server. Traditional network firewalls and WAFs cannot easily block this framework-level flaw.</p>
      <h3 style={s2}>How does it help the SOC?</h3>
      <p>It gives the SOC absolute visibility into the application layer. Rather than guessing if a web app is vulnerable, the SOC gets a definitive Vulnerable or Safe verdict based on local framework topology analysis.</p>
      <h3 style={s3}>Dashboard Features</h3>
      <ul style={ul}>
        <li><strong>Problems Found:</strong> If vulnerable, lists the exact Next.js projects at risk and provides auto-generated mitigation flags.</li>
        <li><strong>Passed Items:</strong> Provides a CVE Knowledge Card explaining the exploit and maps exactly why the server passed.</li>
        <li><strong>Raw Forensic Logs:</strong> Reveals the exact JSON and stdout streams from the binary execution.</li>
      </ul>
    </div>
  );

  if (id === 3) return (
    <div>
      <h3 style={s1}>What is it?</h3>
      <p>An autonomous Ubuntu Server OS configuration engine. It transforms a standard vulnerable Ubuntu installation into a hardened attack-resistant fortress by modifying kernel parameters, installing security daemons, and locking down SSH configurations.</p>
      <h3 style={s2}>Why is it needed?</h3>
      <p>Default Linux installations lack active file-tampering monitors, fail to block repeated brute-force SSH logins, and have vulnerable kernel network settings allowing IP spoofing. A server exposed to the public internet will be brute-forced within minutes.</p>
      <h3 style={s2}>How does it help the SOC?</h3>
      <p>It provides a standardized baseline endpoint security posture across your entire cloud fleet with zero manual configuration. The SOC knows definitively the OS is actively defending itself via Fail2Ban, AIDE, and AuditD.</p>
      <h3 style={s3}>Dashboard Features</h3>
      <ul style={ul}>
        <li><strong>Problems Found:</strong> Highlights missing compliance packages like OpenSCAP and displays an AWS Safety Banner explaining why UFW was intentionally bypassed to prevent lockouts.</li>
        <li><strong>Passed Items:</strong> Features a live Service Health Grid showing critical services, explaining all applied Kernel Sysctl configurations in plain English.</li>
        <li><strong>Raw Forensic Logs:</strong> Full terminal execution logs from the hardening run for administrator audit.</li>
      </ul>
    </div>
  );

  if (id === 4) return (
    <div>
      <h3 style={s1}>What is it?</h3>
      <p>A rapid-response incident remediation tracker and patcher. It scans the OS for 7 top-tier vulnerabilities — XZ-Backdoor, regreSSHion, PwnKit, Baron Samedit, Looney Tunables, Dirty Pipe, Log4Shell — and actively patches them without human intervention.</p>
      <h3 style={s2}>Why is it needed?</h3>
      <p>When a massive OS-level vulnerability drops, administrators lack time to manually SSH into hundreds of servers to test and apply mitigations. A delay of even a few hours can result in a compromised fleet.</p>
      <h3 style={s2}>How does it help the SOC?</h3>
      <p>It turns the SOC from a passive monitoring station into an active defense mechanism. Threat remediation happens natively on the machine in minutes, automatically closing the window of exposure.</p>
      <h3 style={s3}>Dashboard Features</h3>
      <ul style={ul}>
        <li><strong>Vulnerable (Action Required):</strong> If a CVE could not be auto-patched, provides manual commands to secure the system immediately.</li>
        <li><strong>Patched (Auto-Mitigated):</strong> Shows the exact terminal commands the system ran autonomously, providing full audit transparency.</li>
        <li><strong>Safe (Not Vulnerable):</strong> Displays the safe version detected alongside a plain-English CVE explanation and raw behavioral exploit testing logs.</li>
      </ul>
    </div>
  );

  if (id === 5) return (
    <div>
      <h3 style={s1}>What is it?</h3>
      <p>A specialized TLS/SSL compliance auditor engineered for Let's Encrypt certificates bound to public AWS IPv4 addresses. It uses a zero-network Node.js audit script to parse Certbot ACME configurations locally — completing in under 0.2 seconds.</p>
      <h3 style={s2}>Why is it needed?</h3>
      <p>Mismanaged SSL certificates cause massive service outages and trigger browser security warnings. Tracking certificate expiry, ensuring strong TLS cipher configurations, and verifying automatic renewal cron jobs on headless servers is notoriously difficult.</p>
      <h3 style={s2}>How does it help the SOC?</h3>
      <p>It guarantees instant, daily visibility into the cryptographic health of the endpoint. It prevents outages by catching broken auto-renewal cron jobs, weak TLS settings, or expiring certificates before users notice.</p>
      <h3 style={s3}>Dashboard Features</h3>
      <ul style={ul}>
        <li><strong>Problems Found:</strong> Highlights missing certificates, broken renewal hooks, or missing software with exact numbered fix commands.</li>
        <li><strong>Passed Items:</strong> Visually breaks down 8 configuration checks via an interactive Audit Grid.</li>
        <li><strong>Raw Forensic Logs:</strong> Collapsible toggle revealing the complete output of the cryptographic assessment engine for compliance auditing.</li>
      </ul>
    </div>
  );

  return <p style={{ color: 'rgba(255,255,255,0.6)' }}>No documentation available for module {id}.</p>;
}

const titles = {
  1: { title: 'Supply Chain Defense', icon: 'Module 1' },
  2: { title: 'Web App Scanner', icon: 'Module 2' },
  3: { title: 'System Endpoint Hardening', icon: 'Module 3' },
  4: { title: 'Autonomous CVE Remediation', icon: 'Module 4' },
  5: { title: 'Machine IP Cryptography', icon: 'Module 5' }
};

class DocErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div style={{ color: 'white', padding: '30px', background: 'rgba(255,0,0,0.1)', borderRadius: '12px', margin: '20px' }}>
        <h3 style={{ color: '#ff6b6b' }}>Documentation Error</h3>
        <p>An error occurred while loading this module's documentation.</p>
        <pre style={{ fontSize: '11px', opacity: 0.7, whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        <button onClick={this.props.onBack} style={{ marginTop: '16px', background: 'rgba(255,214,0,0.1)', border: '1px solid rgba(255,214,0,0.3)', color: '#FFd600', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
    return this.props.children;
  }
}

const DocumentationView = ({ moduleId, onBack }) => {
  const meta = titles[moduleId];

  return (
    <DocErrorBoundary onBack={onBack}>
      <div className="glass-panel" style={{ padding: '30px', margin: '20px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'linear-gradient(135deg, #FF6D00, #ff9100)',
            border: 'none',
            color: 'white',
            padding: '10px 22px',
            borderRadius: '25px',
            cursor: 'pointer',
            marginBottom: '24px',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '0.95rem',
            boxShadow: '0 0 18px rgba(255, 109, 0, 0.45)',
            transition: 'all 0.2s',
            letterSpacing: '0.5px'
          }}
          onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 28px rgba(255,109,0,0.7)'}
          onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 0 18px rgba(255,109,0,0.45)'}
        >
          Back to Dashboard
        </button>

        {meta && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px', borderBottom: '1px solid rgba(255,214,0,0.15)', paddingBottom: '16px' }}>
            <div style={{ background: 'rgba(255,214,0,0.1)', border: '1px solid rgba(255,214,0,0.3)', borderRadius: '10px', padding: '8px 16px', color: '#FFd600', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {meta.icon}
            </div>
            <h2 style={{ fontSize: '1.8rem', margin: 0, letterSpacing: '1px', color: 'white' }}>
              {meta.title}
            </h2>
          </div>
        )}

        <div style={{ lineHeight: '1.7', fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)' }}>
          <ModuleDocContent id={moduleId} />
        </div>
      </div>
    </DocErrorBoundary>
  );
};

export default DocumentationView;
