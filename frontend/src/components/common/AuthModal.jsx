import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function AuthModal({ isOpen, onClose }) {
  const { login, register, switchRole, role, logout } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegisterMode) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Eroare la autentificare');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (targetRole) => {
    setError(null);
    setLoading(true);
    try {
      await switchRole(targetRole);
      onClose();
    } catch (err) {
      setError(err.message || 'Eroare la comutare rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 18, 16, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="originle-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-surface)',
          padding: '28px',
          boxShadow: 'var(--shadow-floating)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span className="originle-kicker">● ACCES & ROLURI (D-003)</span>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-extrabold)', margin: '4px 0 0 0' }}>
              Autentificare & Test 1-Click
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Quick 1-Click Demo Buttons */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Comută instantaneu între cele 4 roluri permise de fișa P10:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <button
              type="button"
              className={`pill-btn ${role === 'ANON' ? 'pill-btn-primary' : 'pill-btn-outline'}`}
              style={{ padding: '8px 12px', fontSize: '12px' }}
              onClick={() => handleQuickRole('ANON')}
            >
              👀 Vizitator (ANON)
            </button>
            <button
              type="button"
              className={`pill-btn ${role === 'USER' ? 'pill-btn-primary' : 'pill-btn-outline'}`}
              style={{ padding: '8px 12px', fontSize: '12px' }}
              onClick={() => handleQuickRole('USER')}
            >
              👤 Utilizator Test
            </button>
            <button
              type="button"
              className={`pill-btn ${role === 'MODERATOR' ? 'pill-btn-primary' : 'pill-btn-outline'}`}
              style={{ padding: '8px 12px', fontSize: '12px' }}
              onClick={() => handleQuickRole('MODERATOR')}
            >
              ⚖️ Moderator Sibiu
            </button>
            <button
              type="button"
              className={`pill-btn ${role === 'ADMIN' ? 'pill-btn-accent' : 'pill-btn-outline'}`}
              style={{ padding: '8px 12px', fontSize: '12px' }}
              onClick={() => handleQuickRole('ADMIN')}
            >
              🛡️ Administrator
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', textAlign: 'center', margin: '20px 0' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-surface)',
              padding: '0 12px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            sau autentificare clasică
          </span>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(217, 56, 41, 0.1)',
              border: '1px solid rgba(217, 56, 41, 0.3)',
              color: 'var(--accent-coral-alert)',
              fontSize: 'var(--font-size-xs)',
              marginBottom: '16px'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegisterMode && (
            <div className="originle-form-group">
              <label className="originle-label">Nume Complet</label>
              <input
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
            <label className="originle-label">Adresă de Email</label>
            <input
              type="email"
              className="originle-input"
              placeholder="nume@exemplu.ro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="originle-form-group">
            <label className="originle-label">Parolă</label>
            <input
              type="password"
              className="originle-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              className="pill-btn pill-btn-primary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Se procesează...' : isRegisterMode ? 'Creează Cont' : 'Conectare'}
            </button>
            {role !== 'ANON' && (
              <button
                type="button"
                className="pill-btn pill-btn-outline"
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                Deconectare
              </button>
            )}
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-terracotta)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer'
            }}
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null);
            }}
          >
            {isRegisterMode ? 'Ai deja cont? Conectează-te' : 'Nu ai cont? Înregistrează-te gratuit'}
          </button>
        </div>
      </div>
    </div>
  );
}
