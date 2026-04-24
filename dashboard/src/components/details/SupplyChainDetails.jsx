import React, { useMemo, useState } from 'react';

const SupplyChainDetails = ({ logs, onBack }) => {
  const [showRawLogs, setShowRawLogs] = useState(false);
  // Parse logs to extract metrics
  const parsedData = useMemo(() => {
    let rawText = '';
    let jsonBlock = null;
    let dbVersion = 'N/A';
    let knownThreats = '0';
    let duration = '0s';
    
    // Convert array of log objects into a single string for regex and JSON parsing
    if (Array.isArray(logs)) {
      rawText = logs.map(l => l.text).join('\n');
    } else {
      rawText = String(logs || '');
    }

    // 1. Extract JSON Report block
    try {
      const jsonStart = rawText.indexOf('JSON Report:\n{');
      if (jsonStart !== -1) {
        const startIndex = jsonStart + 13; // start of {
        // Find the matching closing bracket
        let braceCount = 0;
        let endIndex = -1;
        for (let i = startIndex; i < rawText.length; i++) {
          if (rawText[i] === '{') braceCount++;
          if (rawText[i] === '}') braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
        if (endIndex !== -1) {
          const jsonString = rawText.substring(startIndex, endIndex);
          jsonBlock = JSON.parse(jsonString);
        }
      }
    } catch (e) {
      console.error("Failed to parse JSON Report block", e);
    }

    // 2. Extract Regex metrics
    const dbMatch = rawText.match(/Database version:\s*(.*)/);
    if (dbMatch) dbVersion = dbMatch[1].trim();

    const threatsMatch = rawText.match(/Total known affected packages:\s*(\d+)/);
    if (threatsMatch) knownThreats = threatsMatch[1].trim();

    const durationMatch = rawText.match(/duration:\s*([0-9.]+s)/);
    if (durationMatch) duration = durationMatch[1].trim();

    // Fallbacks if JSON parsing failed
    return {
      totalScanned: jsonBlock?.totalDependencies || 0,
      affected: jsonBlock?.affectedCount || 0,
      clean: jsonBlock?.cleanCount || 0,
      scannedFiles: jsonBlock?.scannedFiles || [],
      dbVersion,
      knownThreats,
      duration,
      rawText
    };
  }, [logs]);

  return (
    <div className="details-view-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.2rem' }}>🛡️</span> Supply Chain Defense Report
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Wazuh-Inspired Threat Intel Dashboard
          </p>
        </div>
        <button 
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Top Metric Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        
        {/* Card 1: Total Scanned */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: '1px solid #38bdf8',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(56, 189, 248, 0.1)'
        }}>
          <h4 style={{ margin: 0, color: '#38bdf8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Total Dependencies</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.totalScanned}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px' }}>Packages analyzed</div>
        </div>

        {/* Card 2: Affected (Dynamic Color) */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1px solid ${parsedData.affected > 0 ? '#ef4444' : '#10b981'}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: `0 4px 15px ${parsedData.affected > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`
        }}>
          <h4 style={{ margin: 0, color: parsedData.affected > 0 ? '#ef4444' : '#10b981', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Vulnerable Packages</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.affected}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px' }}>Critical hits detected</div>
        </div>

        {/* Card 3: Clean */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
        }}>
          <h4 style={{ margin: 0, color: '#10b981', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Clean Packages</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.clean}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px' }}>Secure dependencies</div>
        </div>

        {/* Card 4: Threat DB */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: '1px solid #c084fc',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(192, 132, 252, 0.1)'
        }}>
          <h4 style={{ margin: 0, color: '#c084fc', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Threat Database</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.knownThreats}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px' }}>v{parsedData.dbVersion} signatures</div>
        </div>

      </div>

      {/* Main Details Panel */}
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.6)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '12px',
        padding: '25px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Scan Configuration & Files</h3>
          <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
            Execution Time: {parsedData.duration}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          {/* Config column */}
          <div>
            <h4 style={{ color: '#94a3b8', marginTop: 0 }}>Active Parameters</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li><span style={{ color: '#38bdf8' }}>✓</span> Fail on Critical: false</li>
              <li><span style={{ color: '#38bdf8' }}>✓</span> Scan Lockfiles: true</li>
              <li><span style={{ color: '#ef4444' }}>✗</span> Scan Node Modules: false</li>
              <li><span style={{ color: '#38bdf8' }}>✓</span> Ignore Allowlist: false</li>
            </ul>
          </div>

          {/* Files column */}
          <div>
            <h4 style={{ color: '#94a3b8', marginTop: 0 }}>Scanned Manifests</h4>
            {parsedData.scannedFiles.length > 0 ? (
              <div style={{ 
                background: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {parsedData.scannedFiles.map((file, idx) => (
                  <div key={idx} style={{ 
                    padding: '12px 15px', 
                    borderBottom: idx < parsedData.scannedFiles.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: '#a78bfa'
                  }}>
                    <span style={{ color: '#10b981' }}>📄</span> {file}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No files found in scan directory.</p>
            )}
          </div>
        </div>
      </div>

      {/* Raw Log Viewer Toggle */}
      <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '20px' }}>
        <button 
          onClick={() => setShowRawLogs(!showRawLogs)}
          style={{
            background: 'transparent',
            border: '1px solid #475569',
            color: '#94a3b8',
            padding: '6px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.border = '1px solid #94a3b8'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.border = '1px solid #475569'; }}
        >
          {showRawLogs ? 'Hide Raw Logs' : 'View Full Terminal Output (Raw Logs)'}
        </button>
      </div>

      {showRawLogs && (
        <div style={{
          background: '#020617',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '20px',
          height: '400px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: '#cbd5e1',
          lineHeight: '1.4',
          boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {parsedData.rawText}
          </pre>
        </div>
      )}
      
    </div>
  );
};

export default SupplyChainDetails;
