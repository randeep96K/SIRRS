import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getIncidents } from "../services/api";
import IncidentCard from "../components/IncidentCard";

function MyReports() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("📡 Fetching incidents with filter:", filter);

      const params = filter !== "all" ? { status: filter } : {};
      const data = await getIncidents(params);

      console.log("✅ API Response:", data);

      setIncidents(data.incidents || []);
    } catch (err) {
      console.error("❌ Error fetching incidents:", err);

      if (err.response) {
        console.error("Response:", err.response);
        // Show backend error in UI
        setError(err.response.data.error || "Failed to fetch incidents");
        if (err.response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } else {
        setError(err.message || "Failed to fetch incidents");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>My Reports</h1>
        <Link to="/report" className="btn-primary">
          + New Report
        </Link>
      </div>

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
        <div className="loading">Loading your reports...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : incidents.length === 0 ? (
        <div className="empty-state">
          <p>No incidents found. Create your first report!</p>
          <Link to="/report" className="btn-primary">
            Report Incident
          </Link>
        </div>
      ) : (
        <div className="incidents-grid">
          {incidents.map((incident) => (
            <IncidentCard key={incident._id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyReports;