import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Header({
  theme,
  onToggleTheme,
  onOpenAuthModal,
  onOpenDemoDrawer,
  favoritesCount = 0,
  moderationCount = 0,
  correctionsCount = 0
}) {
  const { role, user, isModerator } = useAuth();

  const getRoleDisplay = () => {
    switch (role) {
      case 'ADMIN':
        return { label: `ADMIN (${user?.name?.split(' ')[0] || 'Admin'})`, icon: '🛡️' };
      case 'MODERATOR':
        return { label: `MODERATOR (${user?.name?.split(' ')[0] || 'Mod'})`, icon: '⚖️' };
      case 'USER':
        return { label: `USER (${user?.name?.split(' ')[0] || 'Utilizator'})`, icon: '👤' };
      default:
        return { label: 'Vizitator (ANON)', icon: '👀' };
    }
  };

  const roleInfo = getRoleDisplay();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Brand logo & title */}
        <Link to="/" className="brand-wrap" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="brand-logo-badge">P10</div>
          <div>
            <span className="brand-name">Farmacii & Vet Sibiu</span>
            <span className="brand-city">Județul Sibiu</span>
          </div>
        </Link>

        {/* Navigation Tabs - Role-based visibility per D-003 with clean React Router links */}
        <nav className="header-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
          >
            <span>🔍 Explorer</span>
          </NavLink>

          <NavLink
            to="/urgenta"
            className={({ isActive }) => `nav-tab-btn emergency-tab ${isActive ? 'active' : ''}`}
          >
            <span>🚨 Ghid de Urgență</span>
          </NavLink>

          <NavLink
            to="/sesizari"
            className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
          >
            <span>📝 Sesizări</span>
            {correctionsCount > 0 && <span className="nav-count-bubble">{correctionsCount}</span>}
          </NavLink>

          <NavLink
            to="/favorite"
            className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
          >
            <span>⭐ Favorite</span>
            {favoritesCount > 0 && <span className="nav-count-bubble">{favoritesCount}</span>}
          </NavLink>

          {/* Admin / Moderation Tab - Visible only for MODERATOR and ADMIN (D-003) */}
          {isModerator && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-tab-btn ${isActive ? 'active' : ''}`}
            >
              <span>{role === 'ADMIN' ? '🛡️ Panou Admin' : '⚖️ Moderare'}</span>
              {moderationCount > 0 && (
                <span className="nav-count-bubble" style={{ background: 'var(--text-primary)' }}>
                  {moderationCount}
                </span>
              )}
            </NavLink>
          )}
        </nav>

        {/* Right controls: Theme toggle & Role indicator */}
        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title="Comută tema vizuală Light / Dark"
          >
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>

          <div
            className="role-badge-pill"
            onClick={onOpenDemoDrawer || onOpenAuthModal}
            title="Apasă pentru comutare rapidă de rol sau conectare"
            role="button"
            tabIndex={0}
          >
            <span>{roleInfo.icon}</span>
            <span>{roleInfo.label}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▾</span>
          </div>
        </div>
      </div>
    </header>
  );
}
