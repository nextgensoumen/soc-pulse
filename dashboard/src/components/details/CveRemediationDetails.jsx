import React, { useMemo, useState } from 'react';

const CveRemediationDetails = ({ logs, onBack }) => {
  const [showRawLogs, setShowRawLogs] = useState(false);
  // Parse logs to extract metrics
  const parsedData = useMemo(() => {
    let rawText = '';
    
    if (Array.isArray(logs)) {
      rawText = logs.map(l => l.text).join('\n');
    } else {
      rawText = String(logs || '');
    }

    // Strip ANSI escape codes to make parsing clean
    const cleanText = rawText.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

    // 1. Extract Host Info
    const hostMatch = cleanText.match(/Host:\s*(.*)/);
    const osMatch = cleanText.match(/OS:\s*(.*)/);
    const kernelMatch = cleanText.match(/Kernel:\s*(.*)/);

    // 2. Extract Global Metrics (from the summary at the bottom)
    const safeMatch = cleanText.match(/SAFE:\s*(\d+)/);
    const patchedMatch = cleanText.match(/PATCHED:\s*(\d+)/);
    const vulnerableMatch = cleanText.match(/VULNERABLE:\s*(\d+)/);
    const durationMatch = cleanText.match(/duration:\s*([0-9.]+s)/);

    // 3. Extract CVE Sections
    const cveChunks = [];
    // Regex matches "🔍 Scanning: CVE-XXXX-XXXX  [CVSS ...]" then the next line (desc), then the content until the next ━━ or ╔══
    const sectionRegex = /🔍 Scanning:\s*(CVE-\d{4}-\d+)\s+\[(.*?)\]\s*\n\s*(.*?)\n━+\n([\s\S]*?)(?=━━|╔═════|$)/g;
    let match;
    while ((match = sectionRegex.exec(cleanText)) !== null) {
      const cveId = match[1].trim();
      const cvss = match[2].trim();
      const desc = match[3].trim();
      const content = match[4].trim();
      
      // Determine status from content
      let status = 'UNKNOWN';
      if (content.includes('SAFE:')) status = 'SAFE';
      else if (content.includes('PATCHED:')) status = 'PATCHED';
      else if (content.includes('VULNERABLE:')) status = 'VULNERABLE';

      cveChunks.push({
        cveId,
        cvss,
        desc,
        content,
        status
      });
    }

    return {
      host: hostMatch ? hostMatch[1].trim() : 'Unknown',
      os: osMatch ? osMatch[1].trim() : 'Unknown',
      kernel: kernelMatch ? kernelMatch[1].trim() : 'Unknown',
      
      safeCount: safeMatch ? parseInt(safeMatch[1].trim(), 10) : 0,
      patchedCount: patchedMatch ? parseInt(patchedMatch[1].trim(), 10) : 0,
      vulnerableCount: vulnerableMatch ? parseInt(vulnerableMatch[1].trim(), 10) : 0,
      duration: durationMatch ? durationMatch[1].trim() : '0s',
      
      cveChunks,
      cleanText
    };
  }, [logs]);

  // Helper to colorize lines based on markers
  const renderLogLine = (line, idx) => {
    let color = '#cbd5e1';
    let icon = '▪';
    let fontWeight = 'normal';
    
    if (line.includes('[!]')) {
      color = '#ef4444'; // Red
      icon = '🚨';
      fontWeight = 'bold';
      line = line.replace('[!]', '').trim();
    } else if (line.includes('[→]')) {
      color = '#f59e0b'; // Yellow/Orange
      icon = '⚡';
      line = line.replace('[→]', '').trim();
    } else if (line.includes('[✓]')) {
      color = '#10b981'; // Green
      icon = '✅';
      line = line.replace('[✓]', '').trim();
    }

    // Highlight CVE names inside the text
    const parts = line.split(/(CVE-\d{4}-\d+)/g);

    return (
      <div key={idx} style={{ 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'flex-start',
        color: color,
        fontSize: '0.85rem',
        fontFamily: 'monospace',
        marginBottom: '6px',
        fontWeight: fontWeight
      }}>
        <span>{icon}</span>
        <span style={{ wordBreak: 'break-word', lineHeight: '1.4' }}>
          {parts.map((part, i) => 
            part.match(/CVE-\d{4}-\d+/) 
              ? <strong key={i} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '0 4px', borderRadius: '3px' }}>{part}</strong> 
              : part
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="details-view-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.2rem' }}>🩹</span> Autonomous Remediation Report
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Wazuh-Inspired Multi-CVE Auto-Patcher Dashboard
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

      {/* Identity Ribbon */}
      <div style={{
        background: 'linear-gradient(90deg, #1e293b, #0f172a)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderLeft: '4px solid #ef4444',
        borderRadius: '8px',
        padding: '12px 20px',
        display: 'flex',
        gap: '40px',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Target Host</span>
          <span style={{ color: '#f8fafc', fontWeight: 'bold', fontFamily: 'monospace' }}>{parsedData.host}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Operating System</span>
          <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{parsedData.os}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Running Kernel</span>
          <span style={{ color: '#a78bfa', fontWeight: 'bold', fontFamily: 'monospace' }}>{parsedData.kernel}</span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        
        {/* Card 1: Safe */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
        }}>
          <h4 style={{ margin: 0, color: '#10b981', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Safe CVEs</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.safeCount}
          </div>
        </div>

        {/* Card 2: Patched */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1px solid ${parsedData.patchedCount > 0 ? '#f59e0b' : '#64748b'}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: `0 4px 15px ${parsedData.patchedCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(100, 116, 139, 0.1)'}`
        }}>
          <h4 style={{ margin: 0, color: parsedData.patchedCount > 0 ? '#f59e0b' : '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Auto-Patched</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.patchedCount}
          </div>
        </div>

        {/* Card 3: Vulnerable */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1px solid ${parsedData.vulnerableCount > 0 ? '#ef4444' : '#64748b'}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: `0 4px 15px ${parsedData.vulnerableCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)'}`
        }}>
          <h4 style={{ margin: 0, color: parsedData.vulnerableCount > 0 ? '#ef4444' : '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Vulnerable</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: parsedData.vulnerableCount > 0 ? '#ef4444' : '#fff', marginTop: '10px' }}>
            {parsedData.vulnerableCount}
          </div>
        </div>

        {/* Card 4: Execution Time */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: '1px solid #38bdf8',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(56, 189, 248, 0.1)'
        }}>
          <h4 style={{ margin: 0, color: '#38bdf8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Execution Time</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.duration}
          </div>
        </div>

      </div>

      {/* CVE Timeline Feed */}
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.6)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '12px',
        padding: '25px',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{ margin: 0, color: '#f8fafc', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          Detailed CVE Remediation Sequence
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {parsedData.cveChunks.length > 0 ? (
            parsedData.cveChunks.map((chunk, idx) => {
              
              let borderColor = 'rgba(255,255,255,0.05)';
              let statusBg = '#334155';
              let statusColor = '#94a3b8';

              if (chunk.status === 'SAFE') {
                borderColor = '#10b981';
                statusBg = 'rgba(16, 185, 129, 0.1)';
                statusColor = '#10b981';
              } else if (chunk.status === 'PATCHED') {
                borderColor = '#f59e0b';
                statusBg = 'rgba(245, 158, 11, 0.1)';
                statusColor = '#f59e0b';
              } else if (chunk.status === 'VULNERABLE') {
                borderColor = '#ef4444';
                statusBg = 'rgba(239, 68, 68, 0.1)';
                statusColor = '#ef4444';
              }

              return (
                <div key={idx} style={{ 
                  background: '#0f172a', 
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  boxShadow: chunk.status !== 'SAFE' ? `0 0 20px ${statusBg}` : 'none'
                }}>
                  
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {chunk.cveId}
                        <span style={{ 
                          background: '#1e293b', 
                          color: '#a78bfa', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem',
                          fontFamily: 'monospace' 
                        }}>
                          {chunk.cvss}
                        </span>
                      </h4>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>{chunk.desc}</div>
                    </div>
                    <span style={{ 
                      background: statusBg, 
                      color: statusColor, 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      letterSpacing: '1px'
                    }}>
                      {chunk.status}
                    </span>
                  </div>
                  
                  {/* Detailed Log Output - only expand if patched or vulnerable, or if clicked */}
                  <div style={{ 
                    background: '#1e293b', 
                    borderRadius: '6px', 
                    padding: '15px', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    marginTop: '10px'
                  }}>
                    {chunk.content.split('\n').map((line, lIdx) => renderLogLine(line, lIdx))}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No CVE execution chunks could be parsed from the logs.</p>
          )}
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
            {parsedData.cleanText}
          </pre>
        </div>
      )}
      
    </div>
  );
};

export default CveRemediationDetails;
