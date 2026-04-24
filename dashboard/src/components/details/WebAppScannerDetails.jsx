import React, { useMemo, useState } from 'react';

// CVE-2025-55182 knowledge base — built from the real scanner definition
const CVE_KNOWLEDGE = {
  'CVE-2025-55182': {
    name: 'CVE-2025-55182',
    cvss: '10.0 CRITICAL',
    title: 'React2Shell — React Server Component RCE',
    whatItIs: 'This is a Remote Code Execution (RCE) vulnerability in React applications that use Server Components. An attacker can trick your app into running any command on your server — simply by sending a specially crafted HTTP request.',
    howItWorks: 'When React Server Components are enabled and not properly sandboxed, an attacker can inject a serialized payload into the component stream. This payload gets executed on your Node.js server automatically, giving the attacker full control.',
    affectedWhen: [
      'Your React app uses Server Components (Next.js App Router mode)',
      'The server renders components from user-supplied or external data',
      'You are running react >= 18.x with server-side rendering enabled',
    ],
    mitigationSteps: [
      'Update React to the latest patched version immediately.',
      'Run: npm install react@latest react-dom@latest',
      'Disable React Server Components if not strictly needed.',
      'Add input validation and sanitization on all server-rendered props.',
      'Enable a Content Security Policy (CSP) header on your web server.',
      'Use a Web Application Firewall (WAF) to block serialized payload patterns.',
      'Audit all getServerSideProps() and Server Actions for unsanitized inputs.',
    ],
  },
};

const getFrameworkRisk = (framework) => {
  const type = framework?.type || '';
  const appRouter = framework?.appRouterDetected || false;

  if (appRouter) return { level: 'HIGH RISK', color: '#ef4444', reason: 'App Router detected — Server Components are active. This is the primary attack vector for CVE-2025-55182.' };
  if (type.includes('client-only')) return { level: 'LOW RISK', color: '#10b981', reason: 'Client-only rendering detected — Server Components are NOT active. The primary attack vector for this CVE does not apply.' };
  if (type.includes('ssr') || type.includes('server')) return { level: 'MEDIUM RISK', color: '#f59e0b', reason: 'Server-side rendering detected. Manual review recommended to confirm Server Components are sandboxed.' };
  return { level: 'UNKNOWN', color: '#94a3b8', reason: 'Framework type could not be determined. Manual inspection recommended.' };
};

const WebAppScannerDetails = ({ logs, onBack }) => {
  const [showRawLogs, setShowRawLogs] = useState(false);

  const parsedData = useMemo(() => {
    let rawText = '';
    let jsonBlock = null;
    let duration = '0s';

    if (Array.isArray(logs)) {
      rawText = logs.map(l => l.text).join('\n');
    } else {
      rawText = String(logs || '');
    }

    try {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonBlock = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
      }
    } catch (e) {
      console.error('JSON parse failed', e);
    }

    const durationMatch = rawText.match(/duration:\s*([0-9.]+s)/);
    if (durationMatch) duration = durationMatch[1].trim();

    const cveId = jsonBlock?.cve || 'CVE-2025-55182';
    const isGlobalVulnerable = jsonBlock?.vulnerable || false;
    const scanTime = jsonBlock?.scanTime || 'Unknown';
    const projects = jsonBlock?.projects || [];
    const errors = jsonBlock?.errors || [];

    const vulnerableProjects = projects.filter(p => p.vulnerable);
    const safeProjects = projects.filter(p => !p.vulnerable);

    return { cveId, isGlobalVulnerable, scanTime, projects, errors, duration, vulnerableProjects, safeProjects, rawText };
  }, [logs]);

  const cveInfo = CVE_KNOWLEDGE[parsedData.cveId] || CVE_KNOWLEDGE['CVE-2025-55182'];

  return (
    <div className="details-view-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.2rem' }}>🌐</span> Web App Scanner Report
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            React2Shell CVE Assessment Dashboard — Powered by gensecaihq/react2shell-scanner
          </p>
        </div>
        <button
          onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Overall Status Banner */}
      <div style={{
        background: parsedData.isGlobalVulnerable ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${parsedData.isGlobalVulnerable ? '#ef4444' : '#10b981'}`,
        borderLeft: `4px solid ${parsedData.isGlobalVulnerable ? '#ef4444' : '#10b981'}`,
        borderRadius: '8px', padding: '15px 20px', marginBottom: '25px',
        display: 'flex', alignItems: 'center', gap: '15px'
      }}>
        <span style={{ fontSize: '1.8rem' }}>{parsedData.isGlobalVulnerable ? '🚨' : '✅'}</span>
        <div>
          <h4 style={{ margin: 0, color: parsedData.isGlobalVulnerable ? '#ef4444' : '#10b981', fontSize: '1.1rem' }}>
            {parsedData.isGlobalVulnerable
              ? `CRITICAL: ${parsedData.vulnerableProjects.length} project(s) are vulnerable to ${parsedData.cveId}!`
              : `All ${parsedData.projects.length} project(s) are NOT vulnerable to ${parsedData.cveId}`}
          </h4>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Scan completed at {parsedData.scanTime} — Duration: {parsedData.duration}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '18px' }}>
          <h4 style={{ margin: 0, color: '#f59e0b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Target CVE</h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{parsedData.cveId}</div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>CVSS {cveInfo.cvss}</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: `1px solid ${parsedData.isGlobalVulnerable ? '#ef4444' : '#10b981'}`, borderRadius: '12px', padding: '18px' }}>
          <h4 style={{ margin: 0, color: parsedData.isGlobalVulnerable ? '#ef4444' : '#10b981', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Global Status</h4>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: parsedData.isGlobalVulnerable ? '#ef4444' : '#10b981', marginTop: '8px' }}>
            {parsedData.isGlobalVulnerable ? 'VULNERABLE' : 'SAFE'}
          </div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: '1px solid #38bdf8', borderRadius: '12px', padding: '18px' }}>
          <h4 style={{ margin: 0, color: '#38bdf8', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Projects Scanned</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{parsedData.projects.length}</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: `1px solid ${parsedData.errors.length > 0 ? '#ef4444' : '#64748b'}`, borderRadius: '12px', padding: '18px' }}>
          <h4 style={{ margin: 0, color: parsedData.errors.length > 0 ? '#ef4444' : '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Scan Errors</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{parsedData.errors.length}</div>
        </div>
      </div>

      {/* CVE Knowledge Card */}
      <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🔎 What is {parsedData.cveId}? — Simple Explanation
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ color: '#f8fafc', margin: '0 0 8px 0', fontSize: '0.9rem' }}>What is it?</h4>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, lineHeight: '1.6' }}>{cveInfo.whatItIs}</p>
          </div>
          <div>
            <h4 style={{ color: '#f8fafc', margin: '0 0 8px 0', fontSize: '0.9rem' }}>How does the attack work?</h4>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, lineHeight: '1.6' }}>{cveInfo.howItWorks}</p>
          </div>
        </div>
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(245,158,11,0.15)' }}>
          <h4 style={{ color: '#f8fafc', margin: '0 0 8px 0', fontSize: '0.9rem' }}>⚠️ You are affected ONLY IF:</h4>
          {cveInfo.affectedWhen.map((cond, i) => (
            <div key={i} style={{ color: '#fcd34d', fontSize: '0.85rem', marginBottom: '5px', display: 'flex', gap: '8px' }}>
              <span>•</span><span>{cond}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== SECTION 1: PROBLEMS FOUND ===== */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔴</span> Problems Found
          <span style={{ background: parsedData.vulnerableProjects.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: parsedData.vulnerableProjects.length > 0 ? '#ef4444' : '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'normal' }}>
            {parsedData.vulnerableProjects.length} vulnerable project(s)
          </span>
        </h3>

        {parsedData.vulnerableProjects.length === 0 ? (
          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div>
              <div style={{ color: '#10b981', fontWeight: 'bold' }}>No vulnerable projects detected</div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                None of the {parsedData.projects.length} scanned project(s) use React Server Components in a way that is vulnerable to {parsedData.cveId}.
              </div>
            </div>
          </div>
        ) : (
          parsedData.vulnerableProjects.map((proj, idx) => {
            const risk = getFrameworkRisk(proj.framework);
            return (
              <div key={idx} style={{ background: '#0f172a', border: '1px solid #ef4444', borderLeft: '4px solid #ef4444', borderRadius: '8px', padding: '20px', marginBottom: '15px', boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#f8fafc' }}>📁 {proj.name}</h4>
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>VULNERABLE</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 15px 0', fontFamily: 'monospace' }}>{proj.path}</p>

                {/* Findings */}
                {proj.findings && proj.findings.length > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', padding: '12px', marginBottom: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#ef4444' }}>🚨 Specific Findings:</h5>
                    {proj.findings.map((f, fi) => (
                      <div key={fi} style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '5px' }}>• {typeof f === 'string' ? f : JSON.stringify(f)}</div>
                    ))}
                  </div>
                )}

                {/* Mitigation */}
                <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>🛡️ Mitigation Plan — What you must do:</div>
                  {cveInfo.mitigationSteps.map((step, i) => (
                    <div key={i} style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '5px', display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#10b981', minWidth: '18px' }}>{i + 1}.</span>
                      <span style={{ fontFamily: step.startsWith('Run:') ? 'monospace' : 'inherit', color: step.startsWith('Run:') ? '#a78bfa' : '#cbd5e1' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== SECTION 2: PASSED ITEMS ===== */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>✅</span> Passed Items
          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'normal' }}>
            {parsedData.safeProjects.length} clean project(s)
          </span>
        </h3>

        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>

          {/* Safe projects */}
          {parsedData.safeProjects.map((proj, idx) => {
            const risk = getFrameworkRisk(proj.framework);
            return (
              <div key={idx} style={{ background: '#0f172a', border: '1px solid rgba(16,185,129,0.2)', borderLeft: '3px solid #10b981', borderRadius: '8px', padding: '18px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✅</span> {proj.name}
                  </h4>
                  <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>CLEAN</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Path</div>
                    <div style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '3px' }}>{proj.path}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Framework Type</div>
                    <div style={{ color: '#38bdf8', fontSize: '0.85rem', marginTop: '3px' }}>{proj.framework?.type || 'Unknown'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>App Router</div>
                    <div style={{ color: proj.framework?.appRouterDetected ? '#f59e0b' : '#10b981', fontSize: '0.85rem', marginTop: '3px' }}>
                      {proj.framework?.appRouterDetected ? '⚠️ Active' : '✅ Not Detected'}
                    </div>
                  </div>
                </div>

                {/* Risk context */}
                <div style={{ background: `rgba(${risk.color === '#10b981' ? '16,185,129' : risk.color === '#f59e0b' ? '245,158,11' : '239,68,68'},0.05)`, border: `1px solid ${risk.color}22`, borderRadius: '6px', padding: '10px 12px' }}>
                  <span style={{ color: risk.color, fontWeight: 'bold', fontSize: '0.8rem' }}>{risk.level}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '10px' }}>{risk.reason}</span>
                </div>
              </div>
            );
          })}

          {/* What was checked */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: '10px' }}>
            <h4 style={{ color: '#94a3b8', margin: '0 0 12px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🔬 What Was Checked Per Project</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
              {[
                { label: 'CVE-2025-55182 Vulnerability Check', desc: 'Checked if React Server Components are active and exploitable' },
                { label: 'Framework Topology Detection', desc: 'Identified the React rendering mode (client-only, SSR, App Router)' },
                { label: 'App Router Detection', desc: 'Specifically checked for Next.js App Router — the primary attack surface' },
                { label: 'Security Findings Analysis', desc: 'Reviewed all scan findings for RCE attack vectors' },
                { label: 'Scan Error Monitoring', desc: 'Checked if the scanner itself ran without errors' },
              ].map((item, idx) => (
                <div key={idx} style={{ background: '#0f172a', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
                    <span>✅</span>
                    <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.85rem' }}>{item.label}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', paddingLeft: '24px' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Errors section */}
          {parsedData.errors.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: '20px' }}>
              <h4 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>⚠️ Scan Errors</h4>
              {parsedData.errors.map((err, idx) => (
                <div key={idx} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '10px', marginBottom: '8px', color: '#fca5a5', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  {typeof err === 'string' ? err : JSON.stringify(err)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== SECTION 3: RAW LOGS ===== */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => setShowRawLogs(!showRawLogs)}
          style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '6px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.border = '1px solid #94a3b8'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.border = '1px solid #475569'; }}
        >
          {showRawLogs ? '🔼 Hide Raw Terminal Logs' : '🖥️ View Full Terminal Output (Raw Logs)'}
        </button>
      </div>

      {showRawLogs && (
        <div style={{ background: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '20px', height: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease-out' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {parsedData.rawText}
          </pre>
        </div>
      )}

    </div>
  );
};

export default WebAppScannerDetails;
