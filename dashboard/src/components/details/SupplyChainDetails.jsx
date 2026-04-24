import React, { useMemo, useState } from 'react';

// Simple plain-English explanation for common supply chain threats
const getThreatExplanation = (finding) => {
  const name = (finding?.name || finding?.packageName || '').toLowerCase();
  const type = (finding?.type || finding?.reason || '').toLowerCase();
  
  if (type.includes('malware') || type.includes('sha256')) 
    return 'This package contains code that matches a known malware signature. It can steal data or damage your system.';
  if (type.includes('trufflehog') || type.includes('secret'))
    return 'This package was caught leaking secrets like API keys or passwords to external servers.';
  if (type.includes('backdoor') || type.includes('shai'))
    return 'This package has a hidden backdoor — a secret entry point that lets attackers control your server remotely.';
  if (type.includes('typosquat'))
    return 'This package has a name very similar to a popular one (e.g. "reakt" instead of "react") to trick developers into installing it.';
  if (type.includes('cve'))
    return 'This package has a known public vulnerability (CVE) that attackers can exploit.';
  return 'This package was flagged in the threat database as potentially dangerous.';
};

const getMitigationPlan = (finding) => {
  const name = finding?.name || finding?.packageName || 'this package';
  const fix = finding?.fixedVersion || finding?.safeVersion || null;
  
  const steps = [];
  if (fix) {
    steps.push(`Update ${name} to version ${fix} immediately.`);
    steps.push(`Run: npm install ${name}@${fix}`);
  } else {
    steps.push(`Remove ${name} from your project immediately.`);
    steps.push(`Run: npm uninstall ${name}`);
    steps.push(`Find an alternative package that performs the same function.`);
  }
  steps.push(`Run npm audit after making changes to verify no other issues remain.`);
  steps.push(`Add ${name} to your dependency monitoring policy.`);
  return steps;
};

const SupplyChainDetails = ({ logs, onBack }) => {
  const [showRawLogs, setShowRawLogs] = useState(false);

  const parsedData = useMemo(() => {
    let rawText = '';
    let jsonBlock = null;
    let dbVersion = 'N/A';
    let knownThreats = '0';
    let dbLastUpdated = 'N/A';
    let duration = '0s';
    let scanDir = 'N/A';

    if (Array.isArray(logs)) {
      rawText = logs.map(l => l.text).join('\n');
    } else {
      rawText = String(logs || '');
    }

    // Extract JSON Report block — search for 'JSON Report:' then find the opening '{'
    // This handles \n, \r\n, and extra spaces between the label and the brace
    try {
      const markerIdx = rawText.indexOf('JSON Report:');
      if (markerIdx !== -1) {
        // Find the first '{' after the marker (may be separated by whitespace/newlines)
        const startIndex = rawText.indexOf('{', markerIdx + 12);
        if (startIndex !== -1) {
          let braceCount = 0;
          let endIndex = -1;
          for (let i = startIndex; i < rawText.length; i++) {
            if (rawText[i] === '{') braceCount++;
            if (rawText[i] === '}') braceCount--;
            if (braceCount === 0) { endIndex = i + 1; break; }
          }
          if (endIndex !== -1) {
            jsonBlock = JSON.parse(rawText.substring(startIndex, endIndex));
          }
        }
      }
    } catch (e) {
      console.error('SupplyChain JSON parse failed:', e);
    }

    // Extract metadata from raw text
    const dbMatch = rawText.match(/Database version:\s*(.*)/);
    if (dbMatch) dbVersion = dbMatch[1].trim();

    const updatedMatch = rawText.match(/Last updated:\s*(.*)/);
    if (updatedMatch) dbLastUpdated = updatedMatch[1].trim();

    const threatsMatch = rawText.match(/Total known affected packages:\s*(\d+)/);
    if (threatsMatch) knownThreats = threatsMatch[1].trim();

    const durationMatch = rawText.match(/duration:\s*([0-9.]+s)/);
    if (durationMatch) duration = durationMatch[1].trim();

    const dirMatch = rawText.match(/Working Directory:\s*(.*)/);
    if (dirMatch) scanDir = dirMatch[1].trim();

    // Extract scan config from the Inputs block
    const scanConfig = {
      failOnCritical: rawText.includes('Fail on Critical: true'),
      failOnHigh: rawText.includes('Fail on High: true'),
      scanLockfiles: rawText.includes('Scan Lockfiles: true'),
      scanNodeModules: rawText.includes('Scan Node Modules: true'),
      ignoreAllowlist: rawText.includes('Ignore Allowlist: true'),
    };

    // Core scan results
    const totalDependencies = jsonBlock?.totalDependencies || 0;
    const affectedCount = jsonBlock?.affectedCount || 0;
    const cleanCount = jsonBlock?.cleanCount || 0;
    const scanTime = jsonBlock?.scanTime || 0;
    const scannedFiles = jsonBlock?.scannedFiles || [];

    // Problems found — populated from results[] when vulnerabilities exist
    const vulnerabilities = (jsonBlock?.results || []).map(r => ({
      name: r.name || r.packageName || 'Unknown Package',
      version: r.version || 'N/A',
      severity: r.severity || r.type || 'Unknown',
      reason: r.reason || r.type || 'Flagged in threat database',
      fixedVersion: r.fixedVersion || r.safeVersion || null,
      cve: r.cve || null,
    }));

    // Security findings (additional findings like secrets, backdoors)
    const securityFindings = (jsonBlock?.securityFindings || []).map(f => ({
      type: f.type || 'Unknown',
      description: f.description || f.message || 'Security issue detected',
      packageName: f.packageName || f.name || 'Unknown',
    }));

    return {
      totalDependencies,
      affectedCount,
      cleanCount,
      scanTime,
      scannedFiles,
      dbVersion,
      dbLastUpdated,
      knownThreats,
      duration,
      scanDir,
      scanConfig,
      vulnerabilities,
      securityFindings,
      rawText,
    };
  }, [logs]);

  const overallStatus = parsedData.affectedCount === 0 && parsedData.securityFindings.length === 0
    ? 'CLEAN'
    : 'VULNERABLE';

  return (
    <div className="details-view-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.2rem' }}>🛡️</span> Supply Chain Defense Report
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Deep Dependency Threat Analysis — Powered by Shai-Hulud 2.0
          </p>
        </div>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Overall Status Banner */}
      <div style={{
        background: overallStatus === 'CLEAN' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
        border: `1px solid ${overallStatus === 'CLEAN' ? '#10b981' : '#ef4444'}`,
        borderLeft: `4px solid ${overallStatus === 'CLEAN' ? '#10b981' : '#ef4444'}`,
        borderRadius: '8px', padding: '15px 20px', marginBottom: '25px',
        display: 'flex', alignItems: 'center', gap: '15px'
      }}>
        <span style={{ fontSize: '1.8rem' }}>{overallStatus === 'CLEAN' ? '✅' : '🚨'}</span>
        <div>
          <h4 style={{ margin: 0, color: overallStatus === 'CLEAN' ? '#10b981' : '#ef4444', fontSize: '1.1rem' }}>
            {overallStatus === 'CLEAN'
              ? `All ${parsedData.totalDependencies} dependencies are clean — No supply chain threats detected`
              : `ALERT: ${parsedData.affectedCount} compromised package(s) detected in your project!`}
          </h4>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            {overallStatus === 'CLEAN'
              ? `Checked against a database of ${parsedData.knownThreats} known malicious packages. Your project is safe.`
              : `Immediate action required. See "Problems Found" section below for details and fix steps.`}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: '1px solid #38bdf8', borderRadius: '12px', padding: '18px', boxShadow: '0 4px 15px rgba(56,189,248,0.1)' }}>
          <h4 style={{ margin: 0, color: '#38bdf8', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Total Scanned</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{parsedData.totalDependencies}</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>npm packages</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: `1px solid ${parsedData.affectedCount > 0 ? '#ef4444' : '#10b981'}`, borderRadius: '12px', padding: '18px' }}>
          <h4 style={{ margin: 0, color: parsedData.affectedCount > 0 ? '#ef4444' : '#10b981', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Threats Found</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{parsedData.affectedCount}</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>compromised packages</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: '1px solid #10b981', borderRadius: '12px', padding: '18px' }}>
          <h4 style={{ margin: 0, color: '#10b981', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Clean</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{parsedData.cleanCount}</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>safe dependencies</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: '1px solid #c084fc', borderRadius: '12px', padding: '18px' }}>
          <h4 style={{ margin: 0, color: '#c084fc', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Threat DB</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{parsedData.knownThreats}</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>known malicious packages</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '18px' }}>
          <h4 style={{ margin: 0, color: '#f59e0b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Scan Time</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '8px' }}>{parsedData.scanTime}s</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>seconds</div>
        </div>
      </div>

      {/* ===== SECTION 1: PROBLEMS FOUND ===== */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔴</span> Problems Found
          <span style={{ background: parsedData.vulnerabilities.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: parsedData.vulnerabilities.length > 0 ? '#ef4444' : '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'normal' }}>
            {parsedData.vulnerabilities.length} issue(s)
          </span>
        </h3>

        {parsedData.vulnerabilities.length === 0 ? (
          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '20px', color: '#10b981', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div>
              <div style={{ fontWeight: 'bold' }}>No vulnerable packages detected</div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>None of your {parsedData.totalDependencies} npm dependencies matched any entry in the malicious package database.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {parsedData.vulnerabilities.map((vuln, idx) => (
              <div key={idx} style={{ background: '#0f172a', border: '1px solid #ef4444', borderLeft: '4px solid #ef4444', borderRadius: '8px', padding: '20px', boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>📦 {vuln.name} <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.9rem' }}>v{vuln.version}</span></h4>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>{vuln.reason}</div>
                  </div>
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {vuln.severity.toUpperCase()}
                  </span>
                </div>

                {/* Plain English Explanation */}
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ color: '#fca5a5', fontSize: '0.85rem' }}>
                    <strong>🔍 What this means (simple terms):</strong><br />
                    {getThreatExplanation(vuln)}
                  </div>
                </div>

                {vuln.cve && (
                  <div style={{ color: '#f59e0b', fontSize: '0.8rem', marginBottom: '12px' }}>🆔 CVE Reference: <strong>{vuln.cve}</strong></div>
                )}

                {/* Mitigation Plan */}
                <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>🛡️ Mitigation Plan — What you must do:</div>
                  {getMitigationPlan(vuln).map((step, i) => (
                    <div key={i} style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '5px', display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#10b981', minWidth: '18px' }}>{i + 1}.</span>
                      <span style={{ fontFamily: step.startsWith('Run:') ? 'monospace' : 'inherit', color: step.startsWith('Run:') ? '#a78bfa' : '#cbd5e1' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== SECTION 2: PASSED ITEMS ===== */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>✅</span> Passed Items
          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'normal' }}>
            {parsedData.cleanCount} clean
          </span>
        </h3>
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>

          {/* Scanned Files */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#94a3b8', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>📁 Files Scanned</h4>
            {parsedData.scannedFiles.map((file, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#0f172a', borderRadius: '6px', marginBottom: '6px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#a78bfa', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#10b981' }}>✓</span> {file}
              </div>
            ))}
            {parsedData.scannedFiles.length === 0 && (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No scanned files found in log.</div>
            )}
          </div>

          {/* What was checked */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginBottom: '20px' }}>
            <h4 style={{ color: '#94a3b8', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🔬 What Was Checked</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Malware Hash Check', desc: 'Compared every package against SHA256 malware signatures', pass: true },
                { label: 'Backdoor Detection', desc: 'Scanned for hidden remote-access code inside packages', pass: true },
                { label: 'Secret Leakage (TruffleHog)', desc: 'Checked if any package secretly exfiltrates API keys or passwords', pass: true },
                { label: 'Typosquatting Detection', desc: 'Checked for packages with names similar to popular ones meant to trick you', pass: true },
                { label: 'Lockfile Scan', desc: `Scanned package-lock.json — the exact list of all installed packages`, pass: parsedData.scanConfig.scanLockfiles },
                { label: 'Node_modules Scan', desc: 'Deep scan of actual installed files on disk', pass: parsedData.scanConfig.scanNodeModules },
              ].map((item, idx) => (
                <div key={idx} style={{ background: '#0f172a', border: `1px solid ${item.pass ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)'}`, borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <span>{item.pass ? '✅' : '⏭️'}</span>
                    <span style={{ color: item.pass ? '#f8fafc' : '#64748b', fontWeight: 'bold', fontSize: '0.9rem' }}>{item.label}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', paddingLeft: '24px' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Database used */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <h4 style={{ color: '#94a3b8', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>📚 Threat Intelligence Database</h4>
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              {[
                { label: 'Version', value: parsedData.dbVersion },
                { label: 'Last Updated', value: parsedData.dbLastUpdated },
                { label: 'Known Malicious Packages', value: parsedData.knownThreats },
                { label: 'Scan Directory', value: parsedData.scanDir },
              ].map((item, idx) => (
                <div key={idx}>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '3px' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
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

export default SupplyChainDetails;
