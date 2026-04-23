import React, { useMemo } from 'react';

const WebAppScannerDetails = ({ logs, onBack }) => {
  // Parse logs to extract metrics
  const parsedData = useMemo(() => {
    let rawText = '';
    let jsonBlock = null;
    let duration = '0s';
    
    // Convert array of log objects into a single string
    if (Array.isArray(logs)) {
      rawText = logs.map(l => l.text).join('\n');
    } else {
      rawText = String(logs || '');
    }

    // 1. Extract JSON Report block
    // WebAppScanner prints the JSON directly. Find first { and last }.
    try {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonString = rawText.substring(firstBrace, lastBrace + 1);
        jsonBlock = JSON.parse(jsonString);
      }
    } catch (e) {
      console.error("Failed to parse WebApp Scanner JSON block", e);
    }

    // 2. Extract Duration
    const durationMatch = rawText.match(/duration:\s*([0-9.]+s)/);
    if (durationMatch) duration = durationMatch[1].trim();

    return {
      cve: jsonBlock?.cve || 'N/A',
      isGlobalVulnerable: jsonBlock?.vulnerable || false,
      scanTime: jsonBlock?.scanTime || 'Unknown',
      projects: jsonBlock?.projects || [],
      errors: jsonBlock?.errors || [],
      duration
    };
  }, [logs]);

  return (
    <div className="details-view-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.2rem' }}>🌐</span> Web App Scanner Report
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Wazuh-Inspired CVE Assessment Dashboard
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
        
        {/* Card 1: Target CVE */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)'
        }}>
          <h4 style={{ margin: 0, color: '#f59e0b', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Target Exploit</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', marginTop: '10px', wordBreak: 'break-all' }}>
            {parsedData.cve}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px' }}>React2Shell RCE Payload</div>
        </div>

        {/* Card 2: Global Status */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1px solid ${parsedData.isGlobalVulnerable ? '#ef4444' : '#10b981'}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: `0 4px 15px ${parsedData.isGlobalVulnerable ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`
        }}>
          <h4 style={{ margin: 0, color: parsedData.isGlobalVulnerable ? '#ef4444' : '#10b981', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Global Status</h4>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: parsedData.isGlobalVulnerable ? '#ef4444' : '#10b981', marginTop: '10px' }}>
            {parsedData.isGlobalVulnerable ? 'VULNERABLE' : 'SAFE'}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px' }}>Overall environment posture</div>
        </div>

        {/* Card 3: Projects Scanned */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: '1px solid #38bdf8',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(56, 189, 248, 0.1)'
        }}>
          <h4 style={{ margin: 0, color: '#38bdf8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Projects Scanned</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.projects.length}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px' }}>Directories analyzed</div>
        </div>

        {/* Card 4: Scan Errors */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1px solid ${parsedData.errors.length > 0 ? '#ef4444' : '#64748b'}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: `0 4px 15px ${parsedData.errors.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)'}`
        }}>
          <h4 style={{ margin: 0, color: parsedData.errors.length > 0 ? '#ef4444' : '#64748b', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Scan Errors</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.errors.length}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px' }}>Execution failures</div>
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
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Analyzed Architectures</h3>
          <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
            Execution Time: {parsedData.duration}
          </span>
        </div>

        {parsedData.projects.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {parsedData.projects.map((proj, idx) => (
              <div key={idx} style={{ 
                background: '#0f172a', 
                border: `1px solid ${proj.vulnerable ? '#ef4444' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '8px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#a78bfa' }}>📁</span> {proj.name}
                  </h4>
                  <span style={{ 
                    background: proj.vulnerable ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                    color: proj.vulnerable ? '#ef4444' : '#10b981', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {proj.vulnerable ? 'VULNERABLE' : 'CLEAN'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Absolute Path:</span>
                    <div style={{ color: '#cbd5e1', fontFamily: 'monospace', marginTop: '4px' }}>{proj.path}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Framework Topology:</span>
                    <div style={{ color: '#cbd5e1', marginTop: '4px' }}>
                      <span style={{ color: '#38bdf8' }}>{proj.framework?.type || 'Unknown'}</span>
                      {proj.framework?.appRouterDetected && <span style={{ marginLeft: '10px', color: '#f59e0b' }}>(App Router Active)</span>}
                    </div>
                  </div>
                </div>

                {proj.findings && proj.findings.length > 0 && (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#ef4444' }}>Critical Findings:</h5>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#fca5a5', fontSize: '0.9rem' }}>
                      {proj.findings.map((finding, fIdx) => (
                        <li key={fIdx}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No projects were found or analyzed.</p>
        )}
      </div>
      
    </div>
  );
};

export default WebAppScannerDetails;
