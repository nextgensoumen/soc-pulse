import React, { useMemo, useState } from 'react';

// CVE knowledge base — built from real log output
const CVE_DB = {
  'CVE-2024-3094': {
    name: 'XZ Backdoor',
    cvss: 'CVSS 10.0 CRITICAL',
    what: 'A malicious developer secretly inserted a backdoor into the XZ compression library (versions 5.6.0 and 5.6.1). This backdoor allowed remote attackers to bypass SSH authentication and get root access on any affected Linux system.',
    affectedVersions: 'xz-utils 5.6.0 and 5.6.1',
    safeVersions: 'xz-utils 5.4.x and below, or 5.6.2+',
    icon: '🧬',
  },
  'CVE-2021-4034': {
    name: 'PwnKit',
    cvss: 'CVSS 7.8 HIGH',
    what: 'A memory corruption vulnerability in pkexec (a component of PolicyKit/polkit). Any local user — even without any special permissions — can exploit this to instantly become root (administrator) on the system.',
    affectedVersions: 'polkit < 0.121 (all major Linux distros)',
    safeVersions: 'polkit 0.121+ or SUID bit removed from pkexec',
    icon: '👑',
  },
  'CVE-2023-4911': {
    name: 'Looney Tunables',
    cvss: 'CVSS 7.8 HIGH',
    what: 'A buffer overflow in the GNU C Library (glibc) dynamic loader. An attacker with local access can exploit it to gain full root privileges. It affects virtually all major Linux distributions using glibc.',
    affectedVersions: 'glibc 2.34 to 2.38',
    safeVersions: 'glibc 2.38-1 (patched) or kernel mitigations active',
    icon: '🐰',
  },
  'CVE-2021-3156': {
    name: 'Baron Samedit',
    cvss: 'CVSS 7.8 HIGH',
    what: 'A heap-based buffer overflow in sudo. Any local user (even those not in the sudoers file) can exploit this to gain root access. This vulnerability existed undetected for 10 years.',
    affectedVersions: 'sudo 1.8.2 - 1.9.5p2',
    safeVersions: 'sudo 1.9.5p2+',
    icon: '🎭',
  },
  'CVE-2022-0847': {
    name: 'Dirty Pipe',
    cvss: 'CVSS 7.8 HIGH',
    what: 'A flaw in the Linux kernel pipe mechanism that allows an unprivileged user to overwrite data in read-only files. This can be used to inject malicious code into system binaries or hijack processes.',
    affectedVersions: 'Linux kernel 5.8 to 5.16.10',
    safeVersions: 'Linux kernel 5.16.11+, 5.15.25+, 5.10.102+',
    icon: '🪈',
  },
  'CVE-2023-38408': {
    name: 'regreSSHion',
    cvss: 'CVSS 8.1 HIGH',
    what: 'A remote code execution vulnerability in OpenSSH\'s server (sshd). An unauthenticated attacker on the network can exploit this to get full root access to the server — no login required. This is a pre-authentication attack.',
    affectedVersions: 'OpenSSH 8.5p1 to 9.7p1',
    safeVersions: 'OpenSSH 9.8p1+',
    icon: '🔐',
  },
};

const getStatusStyle = (status) => {
  if (status === 'SAFE') return { border: '#10b981', bg: 'rgba(16,185,129,0.08)', badge: 'rgba(16,185,129,0.15)', text: '#10b981' };
  if (status === 'PATCHED') return { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)', badge: 'rgba(245,158,11,0.15)', text: '#f59e0b' };
  if (status === 'VULNERABLE') return { border: '#ef4444', bg: 'rgba(239,68,68,0.08)', badge: 'rgba(239,68,68,0.15)', text: '#ef4444' };
  return { border: '#64748b', bg: 'transparent', badge: 'rgba(100,116,139,0.15)', text: '#94a3b8' };
};

const renderLogLine = (line, idx) => {
  let color = '#94a3b8';
  let icon = '▪';
  let bold = false;
  const clean = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
  if (!clean.trim()) return null;
  let text = clean;
  if (clean.includes('[!]')) { color = '#ef4444'; icon = '🚨'; bold = true; text = clean.replace('[!]', '').trim(); }
  else if (clean.includes('[→]')) { color = '#f59e0b'; icon = '⚡'; text = clean.replace('[→]', '').trim(); }
  else if (clean.includes('[✓]')) { color = '#10b981'; icon = '✅'; text = clean.replace('[✓]', '').trim(); }
  return (
    <div key={idx} style={{ display: 'flex', gap: '8px', color, fontSize: '0.82rem', fontFamily: 'monospace', marginBottom: '5px', fontWeight: bold ? 'bold' : 'normal', lineHeight: '1.4' }}>
      <span style={{ minWidth: '18px' }}>{icon}</span>
      <span style={{ wordBreak: 'break-word' }}>{text}</span>
    </div>
  );
};

const CveRemediationDetails = ({ logs, onBack }) => {
  const [showRawLogs, setShowRawLogs] = useState(false);

  const parsedData = useMemo(() => {
    let rawText = '';
    if (Array.isArray(logs)) rawText = logs.map(l => l.text).join('\n');
    else rawText = String(logs || '');
    const cleanText = rawText.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

    const hostMatch = cleanText.match(/Host:\s*(.*)/);
    const osMatch = cleanText.match(/OS:\s*(.*)/);
    const kernelMatch = cleanText.match(/Kernel:\s*(.*)/);
    const durationMatch = cleanText.match(/duration:\s*([0-9.]+s)/);
    const safeMatch = cleanText.match(/SAFE:\s*(\d+)/);
    const patchedMatch = cleanText.match(/PATCHED:\s*(\d+)/);
    const vulnerableMatch = cleanText.match(/VULNERABLE:\s*(\d+)/);

    // Parse individual CVE chunks
    const cveChunks = [];
    const sectionRegex = /🔍 Scanning:\s*(CVE-\d{4}-\d+)\s+\[(.*?)\]\s*\n\s*(.*?)\n━+\n([\s\S]*?)(?=━━|╔═════|$)/g;
    let m;
    while ((m = sectionRegex.exec(cleanText)) !== null) {
      const cveId = m[1].trim();
      const cvss = m[2].trim();
      const desc = m[3].trim();
      const content = m[4].trim();
      let status = 'UNKNOWN';
      if (content.includes('SAFE:')) status = 'SAFE';
      else if (content.includes('PATCHED:')) status = 'PATCHED';
      else if (content.includes('VULNERABLE:')) status = 'VULNERABLE';
      cveChunks.push({ cveId, cvss, desc, content, status, knowledge: CVE_DB[cveId] || null });
    }

    const patchedCves = cveChunks.filter(c => c.status === 'PATCHED');
    const vulnerableCves = cveChunks.filter(c => c.status === 'VULNERABLE');
    const safeCves = cveChunks.filter(c => c.status === 'SAFE');

    const safeCount = safeMatch ? parseInt(safeMatch[1]) : 0;
    const patchedCount = patchedMatch ? parseInt(patchedMatch[1]) : 0;
    const vulnerableCount = vulnerableMatch ? parseInt(vulnerableMatch[1]) : 0;
    // totalScanned: prefer regex-parsed chunks, fall back to sum of counters
    const totalScanned = cveChunks.length > 0
      ? cveChunks.length
      : safeCount + patchedCount + vulnerableCount;

    return {
      host: hostMatch?.[1]?.trim() || 'Unknown',
      os: osMatch?.[1]?.trim() || 'Unknown',
      kernel: kernelMatch?.[1]?.trim() || 'Unknown',
      safeCount,
      patchedCount,
      vulnerableCount,
      totalScanned,
      duration: durationMatch?.[1]?.trim() || '0s',
      cveChunks, patchedCves, vulnerableCves, safeCves, cleanText,
    };
  }, [logs]);

  const hasProblems = parsedData.patchedCount > 0 || parsedData.vulnerableCount > 0;

  return (
    <div className="details-view-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.2rem' }}>🩹</span> Autonomous CVE Remediation Report
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Multi-CVE Auto-Patcher — Host: <span style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{parsedData.host}</span> | OS: {parsedData.os} | Kernel: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{parsedData.kernel}</span>
          </p>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >← Back to Dashboard</button>
      </div>

      {/* Overall Status Banner */}
      <div style={{
        background: hasProblems ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${hasProblems ? '#f59e0b' : '#10b981'}`,
        borderLeft: `4px solid ${hasProblems ? '#f59e0b' : '#10b981'}`,
        borderRadius: '8px', padding: '15px 20px', marginBottom: '25px', display: 'flex', gap: '15px', alignItems: 'center'
      }}>
        <span style={{ fontSize: '1.8rem' }}>{hasProblems ? '🩹' : '✅'}</span>
        <div>
          <h4 style={{ margin: 0, color: hasProblems ? '#f59e0b' : '#10b981', fontSize: '1.1rem' }}>
            {parsedData.vulnerableCount > 0
              ? `ALERT: ${parsedData.vulnerableCount} CVE(s) are still VULNERABLE and need manual action!`
              : parsedData.patchedCount > 0
              ? `${parsedData.patchedCount} CVE(s) were found and AUTO-PATCHED successfully. ${parsedData.safeCount} were already safe.`
              : `All ${parsedData.safeCount} CVEs checked — System is not affected by any scanned exploit.`}
          </h4>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            {parsedData.totalScanned} total CVEs scanned | Duration: {parsedData.duration}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Safe', value: parsedData.safeCount, color: '#10b981', desc: 'Not affected' },
          { label: 'Auto-Patched', value: parsedData.patchedCount, color: parsedData.patchedCount > 0 ? '#f59e0b' : '#64748b', desc: 'Found & fixed' },
          { label: 'Vulnerable', value: parsedData.vulnerableCount, color: parsedData.vulnerableCount > 0 ? '#ef4444' : '#64748b', desc: 'Needs action' },
          { label: 'Total Scanned', value: parsedData.totalScanned, color: '#38bdf8', desc: 'CVEs checked' },
          { label: 'Exec Time', value: parsedData.duration, color: '#a78bfa', desc: 'Runtime' },
        ].map((c, i) => (
          <div key={i} style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: `1px solid ${c.color}`, borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ margin: 0, color: c.color, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '1px' }}>{c.label}</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginTop: '6px' }}>{c.value}</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '3px' }}>{c.desc}</div>
          </div>
        ))}
      </div>

      {/* ===== SECTION 1: PROBLEMS FOUND ===== */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔴</span> Problems Found
          <span style={{ background: hasProblems ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: hasProblems ? '#f59e0b' : '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'normal' }}>
            {parsedData.patchedCount + parsedData.vulnerableCount} issue(s)
          </span>
        </h3>

        {!hasProblems ? (
          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div style={{ color: '#10b981', fontWeight: 'bold' }}>No vulnerabilities found — All {parsedData.safeCount} CVEs checked are not affecting this system.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[...parsedData.vulnerableCves, ...parsedData.patchedCves].map((chunk, idx) => {
              const st = getStatusStyle(chunk.status);
              const kb = chunk.knowledge;
              return (
                <div key={idx} style={{ background: '#0f172a', border: `1px solid ${st.border}`, borderLeft: `4px solid ${st.border}`, borderRadius: '8px', padding: '20px', boxShadow: `0 0 20px ${st.bg}` }}>
                  {/* CVE Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>{kb?.icon || '🔍'}</span> {chunk.cveId}
                        {kb && <span style={{ color: '#94a3b8', fontWeight: 'normal', fontSize: '0.9rem' }}>— {kb.name}</span>}
                      </h4>
                      <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px', fontFamily: 'monospace' }}>{chunk.cvss} | {chunk.desc}</div>
                    </div>
                    <span style={{ background: st.badge, color: st.text, padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {chunk.status === 'PATCHED' ? '🩹 AUTO-PATCHED' : '🚨 VULNERABLE'}
                    </span>
                  </div>

                  {/* Plain English Explanation */}
                  {kb && (
                    <div style={{ background: `${st.border}11`, border: `1px solid ${st.border}33`, borderRadius: '6px', padding: '12px', marginBottom: '14px' }}>
                      <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px' }}>🔍 What is {kb.name}? (Simple explanation)</div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '10px' }}>{kb.what}</div>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div><span style={{ color: '#64748b', fontSize: '0.75rem' }}>AFFECTED: </span><span style={{ color: '#fca5a5', fontSize: '0.82rem', fontFamily: 'monospace' }}>{kb.affectedVersions}</span></div>
                        <div><span style={{ color: '#64748b', fontSize: '0.75rem' }}>SAFE: </span><span style={{ color: '#86efac', fontSize: '0.82rem', fontFamily: 'monospace' }}>{kb.safeVersions}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Mitigation steps from actual log */}
                  <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '6px', padding: '12px', marginBottom: '14px' }}>
                    <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '10px' }}>
                      {chunk.status === 'PATCHED' ? '🛡️ Mitigation Steps Taken (from live logs):' : '🛡️ Recommended Mitigation:'}
                    </div>
                    {chunk.content.split('\n').map((line, i) => renderLogLine(line, i)).filter(Boolean)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== SECTION 2: PASSED ITEMS ===== */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>✅</span> Passed Items
          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'normal' }}>
            {parsedData.safeCount} CVE(s) not affecting this system
          </span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {parsedData.safeCves.map((chunk, idx) => {
            const kb = chunk.knowledge;
            const st = getStatusStyle('SAFE');
            return (
              <div key={idx} style={{ background: '#0f172a', border: '1px solid rgba(16,185,129,0.2)', borderLeft: '3px solid #10b981', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: kb ? '10px' : 0 }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>✅</span> {chunk.cveId}
                      {kb && <span style={{ color: '#94a3b8', fontWeight: 'normal', fontSize: '0.85rem' }}>— {kb.name} {kb.icon}</span>}
                    </h4>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px', paddingLeft: '26px', fontFamily: 'monospace' }}>{chunk.cvss} | {chunk.desc}</div>
                  </div>
                  <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>SAFE</span>
                </div>
                {kb && (
                  <div style={{ paddingLeft: '26px', color: '#64748b', fontSize: '0.82rem', lineHeight: '1.5', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '8px' }}>
                    {kb.what}
                    <div style={{ marginTop: '6px' }}>
                      <span style={{ color: '#64748b' }}>Safe version on this system: </span>
                      <span style={{ color: '#86efac', fontFamily: 'monospace' }}>{kb.safeVersions}</span>
                    </div>
                  </div>
                )}
                {/* Condensed log output */}
                <div style={{ paddingLeft: '26px', marginTop: '10px' }}>
                  {chunk.content.split('\n').slice(0, 5).map((line, i) => renderLogLine(line, i)).filter(Boolean)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== SECTION 3: RAW LOGS ===== */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => setShowRawLogs(!showRawLogs)}
          style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '6px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.border = '1px solid #94a3b8'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.border = '1px solid #475569'; }}
        >
          {showRawLogs ? '🔼 Hide Raw Terminal Logs' : '🖥️ View Full Terminal Output (Raw Logs)'}
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

export default CveRemediationDetails;
