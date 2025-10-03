import React, { useState, useEffect } from 'react';
import { getIncidents, updateIncidentStatus, uploadResolutionPhotos } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

function AuthorityDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statusUpdate, setStatusUpdate] = useState({ status: '', note: '' });
  const [resolutionPhotos, setResolutionPhotos] = useState([]);

  useEffect(() => {
    fetchIncidents();
  }, [filter]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await getIncidents(params);
      setIncidents(data.incidents);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (incidentId) => {
    if (!statusUpdate.status) {
      alert('Please select a status');
      return;
    }
    try {
      await updateIncidentStatus(incidentId, statusUpdate);
      alert('Status updated successfully');
      setStatusUpdate({ status: '', note: '' });
      fetchIncidents();
      setSelectedIncident(null);
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handlePhotoUpload = async (incidentId) => {
    if (resolutionPhotos.length === 0) {
      alert('Please select photos to upload');
      return;
    }
    try {
      const formData = new FormData();
      resolutionPhotos.forEach(photo => {
        formData.append('photos', photo);
      });
      await uploadResolutionPhotos(incidentId, formData);
      alert('Photos uploaded successfully');
      setResolutionPhotos([]);
      fetchIncidents();
    } catch (err) {
      alert('Failed to upload photos: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      acknowledged: '#3b82f6',
      'in-progress': '#3b82f6',
      resolved: '#10b981',
      rejected: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="container">
      <h1>Authority Dashboard</h1>

      <div className="filter-bar">
        <label>Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading incidents...</div>
      ) : (
        <div className="dashboard-layout">
          {/* Incident List Panel */}
          <div className="incidents-list">
            <h2>Incidents ({incidents.length})</h2>
            {incidents.map((incident) => (
              <div
                key={incident._id}
                className={`incident-item ${selectedIncident?._id === incident._id ? 'selected' : ''}`}
                onClick={() => setSelectedIncident(incident)}
              >
                <h3>{incident.title}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(incident.status) }}
                >
                  {incident.status}
                </span>
                <p className="category">{incident.category}</p>
                <p className="date">{new Date(incident.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          {/* Incident Details Panel */}
          <div className="incident-details">
            {selectedIncident ? (
              <>
                <h2>{selectedIncident.title}</h2>

                <div className="detail-section">
                  <p><strong>Category:</strong> {selectedIncident.category}</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedIncident.status) }}
                    >
                      {selectedIncident.status}
                    </span>
                  </p>
                  <p><strong>Reporter:</strong> {selectedIncident.reporter?.name} ({selectedIncident.reporter?.email})</p>
                  <p><strong>Reported:</strong> {new Date(selectedIncident.createdAt).toLocaleString()}</p>
                  {selectedIncident.deadline && (
                    <p><strong>Deadline:</strong> {new Date(selectedIncident.deadline).toLocaleDateString()}</p>
                  )}
                </div>

                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{selectedIncident.description}</p>
                </div>

                {selectedIncident.photos?.length > 0 && (
                  <div className="detail-section">
                    <h3>Photos</h3>
                    <div className="photo-grid">
                      {selectedIncident.photos.map((photo, index) => (
                        <img key={index} src={photo} alt={`Incident ${index + 1}`} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h3>Location</h3>
                  <MapContainer
                    center={[
                      selectedIncident.location.coordinates[1],
                      selectedIncident.location.coordinates[0],
                    ]}
                    zoom={15}
                    style={{ height: '300px', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <Marker position={[
                      selectedIncident.location.coordinates[1],
                      selectedIncident.location.coordinates[0],
                    ]}>
                      <Popup>{selectedIncident.title}</Popup>
                    </Marker>
                  </MapContainer>
                </div>

                <div className="detail-section">
                  <h3>Update Status</h3>
                  <select
                    value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  >
                    <option value="">Select Status</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <textarea
                    placeholder="Add a note (optional)"
                    value={statusUpdate.note}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, note: e.target.value })}
                    rows="3"
                  />
                  <button
                    className="btn-primary"
                    onClick={() => handleStatusUpdate(selectedIncident._id)}
                  >
                    Update Status
                  </button>
                </div>

                <div className="detail-section">
                  <h3>Upload Resolution Photos</h3>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setResolutionPhotos(Array.from(e.target.files))}
                  />
                  {resolutionPhotos.length > 0 && (
                    <button
                      className="btn-secondary"
                      onClick={() => handlePhotoUpload(selectedIncident._id)}
                    >
                      Upload {resolutionPhotos.length} Photo(s)
                    </button>
                  )}
                </div>

                {selectedIncident.timeline?.length > 0 && (
                  <div className="detail-section">
                    <h3>Timeline</h3>
                    <div className="timeline">
                      {selectedIncident.timeline.map((entry, index) => (
                        <div key={index} className="timeline-entry">
                          <p><strong>{entry.status}</strong></p>
                          <p>{entry.note}</p>
                          <p className="timeline-date">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <p>Select an incident to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthorityDashboard;