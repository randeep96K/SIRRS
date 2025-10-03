import React from 'react';

function IncidentCard({ incident }) {
  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',         // amber
      acknowledged: '#3b82f6',    // blue
      'in-progress': '#6366f1',   // indigo
      resolved: '#10b981',        // green
      rejected: '#ef4444'         // red
    };
    return colors[status] || '#6b7280'; // default gray
  };

  return (
    <div className="incident-card">
      {/* Photo Preview */}
      {incident.photos && incident.photos.length > 0 && (
        <div className="card-image">
          <img src={incident.photos[0]} alt={incident.title} />
        </div>
      )}
      
      <div className="card-content">
        {/* Title */}
        <h3>{incident.title}</h3>

        {/* Meta Info */}
        <div className="card-meta">
          <span className="category-badge">{incident.category}</span>
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(incident.status) }}
          >
            {incident.status}
          </span>
        </div>

        {/* Description (truncate) */}
        <p className="card-description">
          {incident.description.length > 100
            ? incident.description.substring(0, 100) + '...'
            : incident.description}
        </p>

        {/* Footer with Dates */}
        <div className="card-footer">
          <span className="date">
            {new Date(incident.createdAt).toLocaleDateString()}
          </span>
          {incident.deadline && (
            <span className="deadline">
              Due: {new Date(incident.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default IncidentCard;