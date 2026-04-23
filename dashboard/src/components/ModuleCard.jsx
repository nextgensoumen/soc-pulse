import React, { useState, useEffect, useRef } from 'react';
import { openReport } from '../utils/reportGenerator';

const ModuleCard = ({ id, title, description, icon, status, threatLevel, isRunning, socket, backendUrl, onStatusRefresh }) => {
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    // Subscribe to this module's specific logs
    socket.emit('subscribe_module', id);

    const handleLogStream = (data) => {
      // Filter out only logs meant for this specific module card
      if (data.moduleId == id) {
        setLogs(prev => [...prev, { text: data.message, type: data.type }]);
      }
    };

    socket.on('log_stream', handleLogStream);

    return () => {
      socket.off('log_stream', handleLogStream);
    };
  }, [socket, id]);

  // Auto-scroll logic for terminal
  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  const getStatusColor = () => {
    switch(status.toLowerCase()) {
      case 'active': return 'status-success';
      case 'completed': return 'status-success';
      case 'idle': return 'status-muted';
      case 'scanning': return 'status-warning';
      case 'error': return 'status-danger';
      case 'offline': return 'status-danger';
      case 'patched': return 'status-success';
      default: return 'status-muted';
    }
  };

  const toggleExecution = async () => {
    const endpoint = isRunning ? 'stop' : 'start';
    if (!isRunning) {
      setLogs([]); // Clear logs on new run
      setShowLogs(true);
    }
    
    try {
      await fetch(`${backendUrl}/api/modules/${id}/${endpoint}`, {
        method: 'POST'
      });
      // Force status sync — catches fast modules (e.g. SSL at 0.1s)
      // where WebSocket events may arrive before React processes them
      if (!isRunning && onStatusRefresh) {
        setTimeout(onStatusRefresh, 500);
        setTimeout(onStatusRefresh, 2000);
        setTimeout(onStatusRefresh, 5000);
      }
    } catch (err) {
      console.error(`Failed to ${endpoint} module ${id}:`, err);
    }
  };

  return (
    <div className={`module-card glass-panel`}>
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-icon">{icon}</span>
          <h3 className="card-title">{title}</h3>
        </div>
        <div className={`status-badge ${getStatusColor()}`}>
          {isRunning ? 'Running' : status}
        </div>
      </div>
      
      <div className="card-body">
        <p className="card-desc">{description}</p>
        
        {threatLevel && (
          <div className="threat-level">
            <span className="label">Threat Level:</span>
            <div className="threat-bar">
              <div className={`threat-fill level-${threatLevel.toLowerCase()}`}></div>
            </div>
            <span className="threat-text">{threatLevel}</span>
          </div>
        )}

        {showLogs && (
          <div className="terminal-window" style={{
            backgroundColor: '#0f172a',
            color: '#38bdf8',
            fontFamily: 'monospace',
            fontSize: '12px',
            padding: '10px',
            marginTop: '15px',
            borderRadius: '6px',
            height: '150px',
            overflowY: 'auto',
            border: '1px solid #334155'
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ 
                color: log.type === 'error' || log.type === 'stderr' ? '#ef4444' : log.type === 'system' ? '#fcd34d' : '#38bdf8',
                whiteSpace: 'pre-wrap'
              }}>
                {log.text}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
      
      <div className="card-footer">
        <button 
          className={isRunning ? "btn-danger" : "btn-primary"} 
          onClick={toggleExecution}
        >
          {isRunning ? "Stop Execution" : "Run Module"}
        </button>
        <button 
          className="btn-secondary" 
          onClick={() => setShowLogs(!showLogs)}
        >
          {showLogs ? "Hide Logs" : "Show Logs"}
        </button>
        {logs.length > 0 && !isRunning && (
          <button
            className="btn-report"
            onClick={() => openReport(id, logs)}
            title="Generate PDF security report from these logs"
          >
            📊 Report
          </button>
        )}
      </div>
    </div>
  );
};

export default ModuleCard;
