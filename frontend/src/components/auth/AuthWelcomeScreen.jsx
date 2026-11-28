import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function AuthWelcomeScreen({ theme, onToggleTheme }) {
  const { login, register, continueAsVisitor } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFormLoading(true);
    try {
      if (isRegisterMode) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Autentificare eșuată. Verifică datele.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="auth-welcome-page">
      <div className="auth-welcome-container">
        {/* Top bar: Brand & Light/Dark Toggle */}
        <header className="auth-welcome-topbar">
          <div className="brand-wrap" style={{ cursor: 'default' }}>
            <div className="brand-logo-badge">P10</div>
            <div>
              <span className="brand-name">Farmacii & Vet Sibiu</span>
              <span className="brand-city" style={{ marginLeft: '8px' }}>Județul Sibiu</span>
            </div>
          </div>

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title="Comută tema vizuală Light / Dark"
          >
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
        </header>

        {/* Hero Section */}
        <section className="auth-welcome-hero">
          <span className="originle-kicker">
            <span className="originle-kicker-dot" /> TRIAJ RAPID DE URGENȚĂ • EUROPE/BUCHAREST
          </span>
          <h1 className="auth-welcome-title">
            Farmacii de Gardă și Cabinete Veterinare în Județul Sibiu
          </h1>
          <div className="originle-title-bar" />
          <p className="auth-welcome-subtitle">
            Verifică în timp real ce farmacii și clinici veterinare sunt deschise sau de gardă activă acum.
            Autentifică-te în contul tău sau continuă direct ca vizitator fără cont.
          </p>

          {/* Prominent Visitor Bypass CTA */}
          <div className="auth-welcome-visitor-box">
            <button
              type="button"
              className="pill-btn pill-btn-primary auth-visitor-btn"
              onClick={continueAsVisitor}
            >
              👀 Continuă ca Vizitator (fără cont) →
            </button>
            <span className="auth-visitor-hint">
              Acces instantaneu (rol ANON) la hartă, filtrul „De Gardă”, calcul distanță și apel telefonic direct.
            </span>
          </div>
        </section>

        {/* Centered Classic Login / Register Card */}
        <div className="originle-card auth-login-card">
          <span className="originle-kicker">● AUTENTIFICARE CLASICĂ</span>
          <h2 className="auth-section-heading" style={{ marginBottom: '4px' }}>
            {isRegisterMode ? 'Creează cont nou' : 'Intră în contul tău'}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            {isRegisterMode
              ? 'Înregistrează un cont de cetățean pentru favorite sincronizate și sesizări comunitare.'
              : 'Autentifică-te cu adresa de email și parola contului tău.'}
          </p>

          {error && (
            <div className="auth-error-alert" role="alert">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegisterMode && (
              <div className="originle-form-group">
                <label className="originle-label" htmlFor="welcome-name">Nume Complet</label>
                <input
                  id="welcome-name"
                  type="text"
                  className="originle-input"
                  placeholder="Ex. Maria Ionescu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="originle-form-group">
              <label className="originle-label" htmlFor="welcome-email">Adresă de Email</label>
              <input
                id="welcome-email"
                type="email"
                className="originle-input"
                placeholder="nume@exemplu.ro"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="originle-form-group">
              <label className="originle-label" htmlFor="welcome-password">Parolă</label>
              <input
                id="welcome-password"
                type="password"
                className="originle-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="pill-btn pill-btn-primary"
              style={{ width: '100%', marginTop: '6px' }}
              disabled={formLoading}
            >
              {formLoading
                ? 'Se procesează...'
                : isRegisterMode
                  ? 'Creează Cont & Intră în Aplicație'
                  : 'Conectare & Deschide Explorer'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button
              type="button"
              className="auth-mode-switch-btn"
              onClick={() => {
                setIsRegisterMode((prev) => !prev);
                setError(null);
              }}
            >
              {isRegisterMode
                ? 'Ai deja cont? Autentifică-te'
                : 'Nu ai cont? Înregistrează-te gratuit'}
            </button>
          </div>

          <div className="auth-demo-credentials-box">
            <span className="originle-kicker" style={{ fontSize: '10px', marginBottom: '6px' }}>
              ● CREDENȚIALE DEMO
            </span>
            <div className="auth-demo-cred-row">
              <span>👤 Utilizator:</span>
              <code>user@sibiu.ro / Parola123!</code>
            </div>
            <div className="auth-demo-cred-row">
              <span>⚖️ Moderator:</span>
              <code>moderator@sibiu.ro / Parola123!</code>
            </div>
            <div className="auth-demo-cred-row">
              <span>🛡️ Administrator:</span>
              <code>admin@sibiu.ro / admin123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
