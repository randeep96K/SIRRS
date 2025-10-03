import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo / App name */}
        <Link to="/" className="logo">
          <h2>🚨 SIRRS</h2>
        </Link>

        {/* Navigation */}
        <nav className="nav">
          {user.role === 'citizen' && (
            <>
              <Link
                to="/report"
                className={location.pathname === '/report' ? 'active' : ''}
              >
                Report Incident
              </Link>
              <Link
                to="/my-reports"
                className={location.pathname === '/my-reports' ? 'active' : ''}
              >
                My Reports
              </Link>
            </>
          )}
          {(user.role === 'authority' || user.role === 'admin') && (
            <Link
              to="/dashboard"
              className={location.pathname === '/dashboard' ? 'active' : ''}
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* User / Logout */}
        <div className="user-menu">
          <span className="user-name">{user.name}</span>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;