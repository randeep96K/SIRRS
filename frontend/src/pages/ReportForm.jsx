import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncident } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function ReportForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    deadline: ''
  });
  const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files);

    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          });
        },
        (error) => {
          setError('Unable to get location: ' + error.message);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  useEffect(() => {
    // Clean up preview URLs
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!location.lat || !location.lng) {
      setError('Please add location by clicking "Use My Location"');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('lat', location.lat);
      formDataToSend.append('lng', location.lng);
      formDataToSend.append('address', location.address);
      if (formData.deadline) {
        formDataToSend.append('deadline', formData.deadline);
      }

      photos.forEach(photo => {
        formDataToSend.append('photos', photo);
      });

      const data = await createIncident(formDataToSend);

      if (data.aiSuggestion) {
        setAiSuggestion(data.aiSuggestion);
      }

      alert('Incident reported successfully!');
      navigate('/my-reports');
    } catch (err) {
      setError(err.message || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1>Report an Incident</h1>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {aiSuggestion && (
            <div className="info-message">
              AI suggested category: <strong>{aiSuggestion}</strong>
            </div>
          )}

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief title for the incident"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the incident in detail"
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label>Category (Optional - AI will suggest if left blank)</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">-- Let AI Suggest --</option>
              <option value="road">Road</option>
              <option value="water">Water</option>
              <option value="electricity">Electricity</option>
              <option value="waste">Waste</option>
              <option value="safety">Safety</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Expected Resolution Date (Optional)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Photos (Max 5)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              max="5"
            />
            {previews.length > 0 && (
              <div className="photo-previews">
                {previews.map((preview, index) => (
                  <img key={index} src={preview} alt={`Preview ${index + 1}`} />
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Location *</label>
            <button type="button" onClick={getLocation} className="btn-secondary">
              📍 Use My Location
            </button>
            {location.lat && (
              <div className="location-info">
                <p>Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                <div className="map-container">
                  <MapContainer
                    center={[location.lat, location.lng]}
                    zoom={15}
                    style={{ height: '300px', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <Marker position={[location.lat, location.lng]}>
                      <Popup>Incident Location</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReportForm;