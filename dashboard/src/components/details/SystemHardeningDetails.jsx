import React, { useMemo, useState } from 'react';

// Plain-English explanation for each control based on real logs
const CONTROL_KNOWLEDGE = {
  'Kernel Sysctls': {
    what: 'Low-level Linux kernel network settings were hardened. This blocks IP spoofing, SYN flood attacks, and ICMP broadcast attacks at the network stack level.',
    impact: 'Attackers can no longer trick your server into thinking packets come from trusted IPs.',
  },
  'AuditD': {
    what: 'The Linux audit daemon was installed and configured with 30+ monitoring rules. It watches for privilege escalation, suspicious file access, and container escape attempts.',
    impact: 'Every suspicious action on the server is now logged and traceable.',
  },
  'Fail2Ban': {
    what: 'Fail2Ban monitors log files for repeated failed login attempts and automatically bans the attacker\'s IP address. Progressive banning means repeat offenders get longer bans.',
    impact: 'Brute-force SSH attacks are automatically blocked in real-time.',
  },
  'AppArmor': {
    what: 'AppArmor is a Linux security module that confines programs to a limited set of resources. Server mode enforcement was activated for all available profiles.',
    impact: 'Even if an attacker gets inside a process (e.g., nginx), they cannot access files or execute commands outside AppArmor\'s policy.',
  },
  'ClamAV': {
    what: 'ClamAV is an open-source antivirus engine. It was installed, the virus database was updated, and weekly scheduled scans were configured.',
    impact: 'The server now automatically scans itself for malware every week.',
  },
  'AIDE': {
    what: 'AIDE (Advanced Intrusion Detection Environment) creates a cryptographic fingerprint (hash) of every important system file. If any file is changed by an attacker, AIDE detects it.',
    impact: 'If someone modifies /etc/passwd or installs a backdoor, you will be alerted on the next AIDE check.',
  },
  'rkhunter': {
    what: 'Rootkit Hunter (rkhunter) and chkrootkit are tools that scan your system for known rootkits — hidden malware that attackers use to maintain access after compromising a server.',
    impact: 'Known rootkit signatures are actively checked against your system.',
  },
  'Unattended-Upgrades': {
    what: 'The system is now configured to automatically download and install security patches from Ubuntu every day without requiring manual intervention.',
    impact: 'Your server will self-patch against newly discovered vulnerabilities automatically.',
  },
  'debsums': {
    what: 'debsums verifies that the files installed by Debian/Ubuntu packages have not been tampered with by comparing them against their official checksums.',
    impact: 'Detects if an attacker has modified system binaries like ls, ps, or netstat to hide their presence.',
  },
  'SSH Daemon': {
    what: 'SSH configuration was hardened: password authentication disabled, only key-based login allowed. SSH was reloaded (not restarted) to preserve your current session.',
    impact: 'Attackers cannot guess or brute-force SSH passwords — only valid key holders can log in.',
  },
  'UFW Firewall': {
    what: 'UFW (Uncomplicated Firewall) rules were configured but intentionally NOT enabled. On AWS EC2, AWS Security Groups already act as the firewall. Enabling UFW on top could lock you out of SSH.',
    impact: 'This is NOT a security gap — AWS Security Groups provide equivalent protection. Rules are staged and ready to enable if you move off AWS.',
    isSkip: true,
  },
};

const getControlKnowledge = (text) => {
  for (const key of Object.keys(CONTROL_KNOWLEDGE)) {
    if (text.toLowerCase().includes(key.toLowerCase())) {
      return CONTROL_KNOWLEDGE[key];
    }
  }
  return null;
};

const SystemHardeningDetails = ({ logs, onBack }) => {
  const [showRawLogs, setShowRawLogs] = useState(false);

  const parsedData = useMemo(() => {
    let rawText = '';
    if (Array.isArray(logs)) {
      rawText = logs.map(l => l.text).join('\n');
    } else {
      rawText = String(logs || '');
    }
    const cleanText = rawText.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

    // Ubuntu version — try summary box first, then orchestrator header fallbacks
    const ubuntuMatch =
      cleanText.match(/Ubuntu Version:\s*([^\n║]+)/) ||
      cleanText.match(/Detected Ubuntu version:\s*([0-9.]+)/) ||
      cleanText.match(/Ubuntu Profile:\s*Ubuntu ([0-9.]+)/);

    // Script version — try summary box first, then orchestrator header fallbacks
    const scriptMatch =
      cleanText.match(/Script Used:\s*([^\n║]+)/) ||
      cleanText.match(/STARTING HARDENING ENGINE:\s*(v[^\n\s]+)/) ||
      cleanText.match(/Target Profile:\s*Ubuntu ([0-9.]+)/);

    const durationMatch = cleanText.match(/duration:\s*([0-9.]+s)/);
    const logFileMatch = cleanText.match(/Log File:\s*([^\n║]+)/);


    // Warning detection
    const hasWarning = cleanText.includes('HARDENING FINISHED WITH WARNINGS');
    const openscapMissing = cleanText.includes('Unable to locate package openscap-scanner');
    const firewallNotActive = cleanText.includes('Firewall is not active');

    // Parse controls from summary box
    const controls = [];
    let appliedCount = 0;
    let skippedCount = 0;
    const controlRegex = /║\s+([✅⛔])\s+(.*?)(?:\s+║|$)/g;
    let m;
    while ((m = controlRegex.exec(cleanText)) !== null) {
      const icon = m[1];
      const text = m[2].trim();
      const isSkipped = icon === '⛔' || text.includes('SKIPPED');
      if (isSkipped) skippedCount++; else appliedCount++;
      controls.push({ icon, text, status: isSkipped ? 'SKIPPED' : 'APPLIED' });
    }

    // Post-hardening service checks from logs
    const serviceChecks = [];
    const serviceRegex = /([✓✗])\s+([\w-]+) is (running|not active)/g;
    while ((m = serviceRegex.exec(cleanText)) !== null) {
      serviceChecks.push({
        pass: m[1] === '✓',
        name: m[2],
        state: m[3],
      });
    }

    // Problems
    const problems = [];
    if (openscapMissing) {
      problems.push({
        type: 'PACKAGE_MISSING',
        severity: 'LOW',
        title: 'OpenSCAP Scanner Not Installed',
        detail: 'E: Unable to locate package openscap-scanner',
        what: 'OpenSCAP is a compliance scanner that checks your system against government security benchmarks (like NIST, CIS, or STIG). It was not found in Ubuntu 22.04\'s default package repositories.',
        impact: 'Your system is not being automatically checked against official security compliance standards. All other hardening controls still applied successfully.',
        mitigation: [
          'For Ubuntu 22.04, OpenSCAP can be installed via: apt install libopenscap8',
          'Or use the Lynis security auditing tool (already installed) as an alternative: sudo lynis audit system',
          'Or use Ubuntu Pro\'s USG (Ubuntu Security Guide) for CIS compliance.',
          'This is a non-critical optional tool — core security controls are unaffected.',
        ],
      });
    }
    if (firewallNotActive) {
      problems.push({
        type: 'FIREWALL_STAGED',
        severity: 'INFO',
        title: 'UFW Firewall Not Activated (AWS Safety Mode)',
        detail: 'UFW rules were staged but NOT enabled — AWS EC2 Safety Mode active.',
        what: 'UFW (Uncomplicated Firewall) is a Linux firewall tool. On this AWS EC2 server, UFW was intentionally NOT enabled. AWS Security Groups already block unwanted traffic at the cloud network level. Enabling both simultaneously can cause SSH lockouts.',
        impact: 'This is NOT a security gap. AWS Security Groups are active and protecting your instance. UFW rules are staged on disk — ready to enable if you move to a non-AWS environment.',
        mitigation: [
          'No immediate action required — AWS Security Groups protect this instance.',
          'To manually enable UFW when off AWS: sudo ufw enable',
          'Verify Security Group allows only ports 22, 5000, 5173 inbound.',
          'Review staged UFW rules: sudo ufw status verbose',
        ],
      });
    }

    return {
      os: ubuntuMatch ? ubuntuMatch[1].replace(/[║\s]+$/, '').trim() : 'Unknown',
      scriptVersion: scriptMatch ? scriptMatch[1].replace(/[║\s]+$/, '').trim() : 'Unknown',
      duration: durationMatch ? durationMatch[1].trim() : '0s',
      logFile: logFileMatch ? logFileMatch[1].replace(/[║\s]+$/, '').trim() : '',
      hasWarning,
      appliedCount,
      skippedCount,
      controls,
      serviceChecks,
      problems,
      cleanText,
    };
  }, [logs]);

  const severityColor = { LOW: '#f59e0b', INFO: '#38bdf8', HIGH: '#ef4444', CRITICAL: '#dc2626' };

  return (
    <div className="details-view-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.2rem' }}>🛡️</span> System Endpoint Hardening Report
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Cloud Security Orchestrator — Ubuntu {parsedData.os} | Script {parsedData.scriptVersion}
          </p>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >← Back to Dashboard</button>
      </div>

      {/* Warning Banner */}
      {parsedData.hasWarning && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid #f59e0b', borderLeft: '4px solid #f59e0b', borderRadius: '8px', padding: '15px 20px', marginBottom: '25px', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <h4 style={{ margin: 0, color: '#f59e0b' }}>Hardening Finished With Warnings — {parsedData.problems.length} issue(s) found</h4>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Some optional packages were not available. Core security controls were still applied. See "Problems Found" below.</p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Controls Applied', value: parsedData.appliedCount, color: '#10b981' },
          { label: 'Issues / Overrides', value: parsedData.problems.length + parsedData.skippedCount, color: parsedData.problems.length > 0 ? '#f59e0b' : '#64748b' },
          { label: 'Execution Time', value: parsedData.duration, color: '#38bdf8' },
          { label: 'Services Running', value: `${parsedData.serviceChecks.filter(s => s.pass).length}/${parsedData.serviceChecks.length}`, color: '#a78bfa' },
        ].map((card, i) => (
          <div key={i} style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: `1px solid ${card.color}`, borderRadius: '12px', padding: '18px' }}>
            <h4 style={{ margin: 0, color: card.color, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>{card.label}</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ===== SECTION 1: PROBLEMS FOUND ===== */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔴</span> Problems Found
          <span style={{ background: parsedData.problems.length > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: parsedData.problems.length > 0 ? '#f59e0b' : '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'normal' }}>
            {parsedData.problems.length} issue(s)
          </span>
        </h3>

        {parsedData.problems.length === 0 ? (
          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div style={{ color: '#10b981', fontWeight: 'bold' }}>All hardening controls applied successfully — No issues detected.</div>
          </div>
        ) : (
          parsedData.problems.map((prob, idx) => (
            <div key={idx} style={{ background: '#0f172a', border: `1px solid ${severityColor[prob.severity]}`, borderLeft: `4px solid ${severityColor[prob.severity]}`, borderRadius: '8px', padding: '20px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem' }}>⚠️ {prob.title}</h4>
                <span style={{ background: `${severityColor[prob.severity]}22`, color: severityColor[prob.severity], padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {prob.severity}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '4px', padding: '8px 12px', marginBottom: '12px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                {prob.detail}
              </div>

              {/* What it means */}
              <div style={{ background: `${severityColor[prob.severity]}0d`, border: `1px solid ${severityColor[prob.severity]}33`, borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px' }}>🔍 What this means (simple terms):</div>
                <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6' }}>{prob.what}</div>
              </div>

              {/* Impact */}
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '12px', lineHeight: '1.6' }}>
                <strong style={{ color: '#f8fafc' }}>Impact: </strong>{prob.impact}
              </div>

              {/* Mitigation */}
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>🛡️ Mitigation Plan:</div>
                {prob.mitigation.map((step, i) => (
                  <div key={i} style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '5px', display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#10b981', minWidth: '18px' }}>{i + 1}.</span>
                    <span style={{ fontFamily: step.startsWith('apt') || step.startsWith('sudo') ? 'monospace' : 'inherit', color: step.startsWith('apt') || step.startsWith('sudo') ? '#a78bfa' : '#cbd5e1' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== SECTION 2: PASSED ITEMS ===== */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>✅</span> Passed Items
          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'normal' }}>
            {parsedData.appliedCount} controls applied
          </span>
        </h3>

        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)', marginBottom: '20px' }}>
          <h4 style={{ color: '#94a3b8', margin: '0 0 15px 0', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>🔒 Security Controls Applied</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {parsedData.controls.map((ctrl, idx) => {
              const info = getControlKnowledge(ctrl.text);
              let title = ctrl.text;
              let desc = '';
              const parenMatch = ctrl.text.match(/(.*?)\((.*?)\)/);
              if (parenMatch) { title = parenMatch[1].trim(); desc = parenMatch[2].trim(); }
              const borderColor = ctrl.status === 'APPLIED' ? '#10b981' : '#f59e0b';

              return (
                <div key={idx} style={{ background: '#0f172a', borderLeft: `3px solid ${borderColor}`, border: `1px solid ${borderColor}22`, borderRadius: '6px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: info ? '8px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{ctrl.status === 'APPLIED' ? '✅' : '⛔'}</span>
                      <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.95rem' }}>{title}</span>
                    </div>
                    {desc && <span style={{ color: ctrl.status === 'APPLIED' ? '#10b981' : '#f59e0b', fontSize: '0.8rem', maxWidth: '300px', textAlign: 'right' }}>{desc}</span>}
                  </div>
                  {info && (
                    <div style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: '1.5', paddingLeft: '30px' }}>
                      {info.what}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Post-hardening service status */}
        {parsedData.serviceChecks.length > 0 && (
          <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
            <h4 style={{ color: '#94a3b4', margin: '0 0 15px 0', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>🟢 Post-Hardening Service Health Check</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {parsedData.serviceChecks.map((svc, idx) => (
                <div key={idx} style={{ background: '#0f172a', border: `1px solid ${svc.pass ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '6px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1rem' }}>{svc.pass ? '✅' : '❌'}</span>
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.9rem' }}>{svc.name}</div>
                    <div style={{ color: svc.pass ? '#10b981' : '#ef4444', fontSize: '0.78rem' }}>{svc.state}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== SECTION 3: RAW LOGS ===== */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => setShowRawLogs(!showRawLogs)}
          style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '6px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.border = '1px solid #94a3b8'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.border = '1px solid #475569'; }}
        >
          {showRawLogs ? '🔼 Hide Raw Logs' : '🖥️ View Full Package Installation Log (Forensic)'}
        </button>
      </div>

      {showRawLogs && (
        <div style={{ background: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '20px', height: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease-out' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{parsedData.cleanText}</pre>
        </div>
      )}

    </div>
  );
};

export default SystemHardeningDetails;
