import React from 'react';

const ModuleCard = ({ title, description, icon, status, threatLevel, actionText }) => {
  const getStatusColor = () => {
    switch(status.toLowerCase()) {
      case 'active': return 'status-success';
      case 'scanning': return 'status-warning';
      case 'offline': return 'status-danger';
      case 'patched': return 'status-success';
      default: return 'status-muted';
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
          {status}
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
      </div>
      
      <div className="card-footer">
        <button className="btn-primary">{actionText}</button>
        <button className="btn-secondary">Logs</button>
      </div>
    </div>
  );
};

export default ModuleCard;
