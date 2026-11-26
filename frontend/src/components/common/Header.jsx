import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Header({
  theme,
  onToggleTheme,
  onOpenAuthModal,
  onReturnToWelcome,
  favoritesCount = 0,
  favoriteAlertsCount = 0,
  favoriteAlertNames = [],
  moderationCount = 0,
  correctionsCount = 0
}) {
  const { role, user, isModerator, isAnon } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const getRoleDisplay = () => {
    switch (role) {
      case 'ADMIN':
        return { label: `ADMIN (${user?.name?.split(' ')[0] || 'Admin'})`, icon: '🛡️', title: 'Administrator' };
      case 'MODERATOR':
        return { label: `MODERATOR (${user?.name?.split(' ')[0] || 'Mod'})`, icon: '⚖️', title: 'Moderator Sibiu' };
      case 'USER':
        return { label: `USER (${user?.name?.split(' ')[0] || 'Utilizator'})`, icon: '👤', title: 'Utilizator Înregistrat' };
      default:
        return { label: 'Vizitator (ANON)', icon: '👀', title: 'Vizitator fără cont' };
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
            title={
              favoriteAlertsCount > 0
                ? `Orar actualizat pentru unități favorite: ${favoriteAlertNames.join(', ')}`
                : 'Unitățile tale favorite'
            }
          >
            <span>⭐ Favorite</span>
            {favoritesCount > 0 && <span className="nav-count-bubble">{favoritesCount}</span>}
            {favoriteAlertsCount > 0 && (
              <span
                className="nav-alert-pill"
                aria-label={`${favoriteAlertsCount} alerte modificare orar la favorite`}
              >
                ⚠️ {favoriteAlertsCount}
              </span>
            )}
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

        {/* Right controls: Theme toggle & Account Menu */}
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

          <div className="account-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="role-badge-pill"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              title="Meniu cont și schimbare rol"
            >
              <span>{roleInfo.icon}</span>
              <span>{roleInfo.label}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▾</span>
            </button>

            {menuOpen && (
              <div className="account-menu-dropdown" role="menu">
                <div className="account-menu-header">
                  <span className="originle-kicker" style={{ fontSize: '10px', marginBottom: '2px' }}>
                    ● SESIUNE ACTIVĂ ({role})
                  </span>
                  <div className="account-menu-name">
                    {user?.name || 'Vizitator fără cont'}
                  </div>
                  <div className="account-menu-email">
                    {user?.email || roleInfo.title}
                  </div>
                </div>

                {isAnon && onOpenAuthModal && (
                  <button
                    type="button"
                    className="account-menu-item"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAuthModal();
                    }}
                  >
                    <span>🔐</span>
                    <span>Autentificare rapidă</span>
                  </button>
                )}

                <button
                  type="button"
                  className="account-menu-item account-menu-item-danger"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    if (onReturnToWelcome) onReturnToWelcome();
                  }}
                >
                  <span>🚪</span>
                  <span>Deconectare / Schimbă contul</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
