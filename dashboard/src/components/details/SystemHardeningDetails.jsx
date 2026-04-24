import React, { useMemo, useState } from 'react';

const SystemHardeningDetails = ({ logs, onBack }) => {
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

    // Metadata extraction
    const ubuntuMatch = cleanText.match(/Ubuntu Version:\s*(.*?)(?:\s*║|$)/);
    const scriptMatch = cleanText.match(/Script Used:\s*(.*?)(?:\s*║|$)/);
    const durationMatch = cleanText.match(/duration:\s*([0-9.]+s)/);
    const logFileMatch = cleanText.match(/Log File:\s*(.*?)(?:\s*║|$)/);
    
    // Warning block
    const warningMatch = cleanText.match(/⚠\s*HARDENING FINISHED WITH WARNINGS[\s\S]*?duration: [0-9.]+s/i) || 
                         cleanText.match(/⚠\s*HARDENING FINISHED WITH WARNINGS.*?\n(.*?)\n(.*?)\n/i);

    let warningText = null;
    if (warningMatch) {
      warningText = warningMatch[0].replace(/━━+/g, '').replace(/║/g, '').trim();
    }

    // Extract Controls list from the Summary Report block
    const controls = [];
    let safeCount = 0;
    let skippedCount = 0;

    // We look for lines in the summary that start with ║ then some spaces, then ✅ or ⛔
    const controlRegex = /║\s+([✅⛔⚠️])\s+(.*?)(?:\s+║|$)/g;
    let match;
    while ((match = controlRegex.exec(cleanText)) !== null) {
      const icon = match[1];
      const text = match[2].trim();
      
      let status = 'APPLIED';
      if (icon === '⛔' || icon === '⚠️' || text.includes('SKIPPED')) {
        status = 'SKIPPED';
        skippedCount++;
      } else {
        safeCount++;
      }

      controls.push({
        icon,
        text,
        status
      });
    }

    return {
      os: ubuntuMatch ? ubuntuMatch[1].trim() : 'Unknown',
      scriptVersion: scriptMatch ? scriptMatch[1].trim() : 'Unknown',
      duration: durationMatch ? durationMatch[1].trim() : '0s',
      logFile: logFileMatch ? logFileMatch[1].trim() : '',
      
      safeCount,
      skippedCount,
      controls,
      warningText,
      
      cleanText // We keep this for the raw log viewer
    };
  }, [logs]);

  return (
    <div className="details-view-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.2rem' }}>🛡️</span> System Endpoint Hardening Report
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Wazuh-Inspired Cloud Security Orchestrator Dashboard
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

      {/* Warning Banner */}
      {parsedData.warningText && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid #f59e0b',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '8px',
          padding: '15px 20px',
          marginBottom: '25px',
          display: 'flex',
          gap: '15px',
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: '#f59e0b', fontSize: '1rem' }}>Hardening Finished With Warnings</h4>
            <pre style={{ margin: 0, color: '#fcd34d', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {parsedData.warningText.split('\n').filter(line => !line.includes('Duration') && line.trim() !== '').join('\n')}
            </pre>
          </div>
        </div>
      )}

      {/* Identity Ribbon */}
      <div style={{
        background: 'linear-gradient(90deg, #1e293b, #0f172a)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderLeft: '4px solid #3b82f6',
        borderRadius: '8px',
        padding: '12px 20px',
        display: 'flex',
        gap: '40px',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Operating System</span>
          <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{parsedData.os}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Script Engine</span>
          <span style={{ color: '#f8fafc', fontWeight: 'bold', fontFamily: 'monospace' }}>{parsedData.scriptVersion}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Audit Output Path</span>
          <span style={{ color: '#a78bfa', fontWeight: 'bold', fontFamily: 'monospace', wordBreak: 'break-all' }}>{parsedData.logFile}</span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        
        {/* Card 1: Controls Applied */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
        }}>
          <h4 style={{ margin: 0, color: '#10b981', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Controls Applied</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.safeCount}
          </div>
        </div>

        {/* Card 2: Skipped / Overridden */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1px solid ${parsedData.skippedCount > 0 ? '#f59e0b' : '#64748b'}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: `0 4px 15px ${parsedData.skippedCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(100, 116, 139, 0.1)'}`
        }}>
          <h4 style={{ margin: 0, color: parsedData.skippedCount > 0 ? '#f59e0b' : '#94a3b8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Overrides (AWS Safe)</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.skippedCount}
          </div>
        </div>

        {/* Card 3: Execution Time */}
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

      {/* Controls Grid */}
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.6)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '12px',
        padding: '25px',
        backdropFilter: 'blur(10px)',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: 0, color: '#f8fafc', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          Security Controls Audit Matrix
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '15px' }}>
          {parsedData.controls.length > 0 ? (
            parsedData.controls.map((control, idx) => {
              
              let borderColor = 'rgba(255,255,255,0.05)';
              let statusColor = '#94a3b8';

              if (control.status === 'APPLIED') {
                borderColor = '#10b981';
                statusColor = '#10b981';
              } else if (control.status === 'SKIPPED') {
                borderColor = '#f59e0b';
                statusColor = '#f59e0b';
              }

              // Extract title and description if parentheses exist
              let title = control.text;
              let desc = '';
              const parenMatch = control.text.match(/(.*?)\((.*?)\)/);
              if (parenMatch) {
                title = parenMatch[1].trim();
                desc = parenMatch[2].trim();
              } else {
                const colonMatch = control.text.split(':');
                if(colonMatch.length > 1) {
                  title = colonMatch[0].trim();
                  desc = colonMatch.slice(1).join(':').trim();
                }
              }

              return (
                <div key={idx} style={{ 
                  background: '#0f172a', 
                  borderLeft: `3px solid ${borderColor}`,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  padding: '12px 15px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'transform 0.2s, background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseOut={(e) => e.currentTarget.style.background = '#0f172a'}
                >
                  <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>
                    {control.status === 'APPLIED' ? '✅' : '⛔'}
                  </span>
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.95rem' }}>{title}</div>
                    {desc && (
                      <div style={{ color: statusColor, fontSize: '0.8rem', marginTop: '4px' }}>
                        {desc}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No security controls could be parsed from the summary block.</p>
          )}
        </div>
      </div>

      {/* Raw Log Viewer Toggle */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
          {showRawLogs ? 'Hide Forensic Package Logs' : 'View Raw Package Installation Log (Forensic)'}
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

export default SystemHardeningDetails;
