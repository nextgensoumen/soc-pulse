import React, { useMemo } from 'react';

const MachineIpCryptoDetails = ({ logs, onBack }) => {
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
    const ipMatch = cleanText.match(/IP:\s*(.*)/);

    // 2. Extract Summary Block
    const certbotReadyMatch = cleanText.match(/Certbot Ready:\s*(.*?)║/);
    const certsMatch = cleanText.match(/Certs Installed:\s*(.*?)║/);
    const cronMatch = cleanText.match(/Renewal Cron:\s*(.*?)║/);
    const issuesMatch = cleanText.match(/Issues Detected:\s*(\d+)/);
    const durationMatch = cleanText.match(/Duration:\s*(.*?)║/);

    // 3. Extract Audit Sections
    const sections = [];
    // Matches "━━ [1/8] Title ━━━━" followed by everything until the next "━━ [" or the summary box "╔══"
    const sectionRegex = /━━ \[(\d\/\d)\] (.*?) ━+\n([\s\S]*?)(?=━━ \[|╔═════|$)/g;
    let match;
    while ((match = sectionRegex.exec(cleanText)) !== null) {
      sections.push({
        step: match[1],
        title: match[2].trim(),
        content: match[3].trim()
      });
    }

    return {
      host: hostMatch ? hostMatch[1].trim() : 'Unknown',
      os: osMatch ? osMatch[1].trim() : 'Unknown',
      ip: ipMatch ? ipMatch[1].trim() : 'Unknown',
      
      certbotReady: certbotReadyMatch ? certbotReadyMatch[1].trim() : 'Unknown',
      certsInstalled: certsMatch ? certsMatch[1].trim() : 'Unknown',
      renewalCron: cronMatch ? cronMatch[1].trim() : 'Unknown',
      issuesDetected: issuesMatch ? parseInt(issuesMatch[1].trim(), 10) : 0,
      duration: durationMatch ? durationMatch[1].trim() : '0s',
      
      sections
    };
  }, [logs]);

  // Helper to colorize finding lines based on markers
  const renderFindingLine = (line, idx) => {
    let color = '#cbd5e1';
    let icon = '▪';
    
    if (line.includes('[⚠]')) {
      color = '#f59e0b';
      icon = '⚠️';
      line = line.replace('[⚠]', '').trim();
    } else if (line.includes('[✓]')) {
      color = '#10b981';
      icon = '✅';
      line = line.replace('[✓]', '').trim();
    } else if (line.includes('[ℹ]')) {
      color = '#38bdf8';
      icon = 'ℹ️';
      line = line.replace('[ℹ]', '').trim();
    }

    return (
      <div key={idx} style={{ 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'flex-start',
        color: color,
        fontSize: '0.85rem',
        fontFamily: 'monospace',
        marginBottom: '6px'
      }}>
        <span>{icon}</span>
        <span style={{ wordBreak: 'break-word' }}>{line}</span>
      </div>
    );
  };

  return (
    <div className="details-view-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.2rem' }}>🔑</span> Machine IP Cryptography Report
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Wazuh-Inspired Certificate Auditing Dashboard
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
        borderLeft: '4px solid #8b5cf6',
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
          <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>IPv4 Address</span>
          <span style={{ color: '#f8fafc', fontWeight: 'bold', fontFamily: 'monospace' }}>{parsedData.ip}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Operating System</span>
          <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{parsedData.os}</span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        
        {/* Card 1: Certbot Status */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1px solid ${parsedData.certbotReady.includes('NO') ? '#f59e0b' : '#10b981'}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: `0 4px 15px ${parsedData.certbotReady.includes('NO') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`
        }}>
          <h4 style={{ margin: 0, color: parsedData.certbotReady.includes('NO') ? '#f59e0b' : '#10b981', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Certbot Engine</h4>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.certbotReady}
          </div>
        </div>

        {/* Card 2: Certs Installed */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1px solid ${parsedData.certsInstalled === 'NO' ? '#64748b' : '#10b981'}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: `0 4px 15px ${parsedData.certsInstalled === 'NO' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`
        }}>
          <h4 style={{ margin: 0, color: parsedData.certsInstalled === 'NO' ? '#94a3b8' : '#10b981', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Active Certificates</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.certsInstalled}
          </div>
        </div>

        {/* Card 3: Auto-Renewal */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1px solid ${parsedData.renewalCron.includes('NOT') ? '#ef4444' : '#38bdf8'}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: `0 4px 15px ${parsedData.renewalCron.includes('NOT') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)'}`
        }}>
          <h4 style={{ margin: 0, color: parsedData.renewalCron.includes('NOT') ? '#ef4444' : '#38bdf8', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Auto-Renewal</h4>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.renewalCron}
          </div>
        </div>

        {/* Card 4: Audit Issues */}
        <div className="metric-card" style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          border: `1px solid ${parsedData.issuesDetected > 0 ? '#ef4444' : '#10b981'}`,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: `0 4px 15px ${parsedData.issuesDetected > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`
        }}>
          <h4 style={{ margin: 0, color: parsedData.issuesDetected > 0 ? '#ef4444' : '#10b981', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Audit Findings</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
            {parsedData.issuesDetected}
          </div>
        </div>

      </div>

      {/* Audit Sections Grid */}
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.6)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '12px',
        padding: '25px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Detailed Audit Trail</h3>
          <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
            Execution Time: {parsedData.duration}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {parsedData.sections.length > 0 ? (
            parsedData.sections.map((sec, idx) => (
              <div key={idx} style={{ 
                background: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '10px' }}>
                  <span style={{ background: '#334155', color: '#cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {sec.step}
                  </span>
                  <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem' }}>{sec.title}</h4>
                </div>
                
                <div style={{ flex: 1 }}>
                  {sec.content.split('\n').map((line, lIdx) => renderFindingLine(line, lIdx))}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No audit sections could be parsed from the logs.</p>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default MachineIpCryptoDetails;
