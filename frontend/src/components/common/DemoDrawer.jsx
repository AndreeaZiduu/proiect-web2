import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function DemoDrawer({ isOpen, onClose, previewState, onSetPreviewState }) {
  const { role, switchRole, user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div
      className="demo-drawer is-open"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1999,
        width: '320px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-floating)',
        padding: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
          ⚙️ Panou Inspecție Prototip
        </h3>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          ✕
        </button>
      </div>

      {/* Role Switcher */}
      <div style={{ marginBottom: '16px' }}>
        <span className="originle-kicker" style={{ fontSize: '10px' }}>● ROL ACTIV (D-003 RBAC)</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '6px' }}>
          <button
            type="button"
            className={`pill-btn ${role === 'ANON' ? 'pill-btn-primary' : 'pill-btn-outline'}`}
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={() => switchRole('ANON')}
          >
            👀 Vizitator
          </button>
          <button
            type="button"
            className={`pill-btn ${role === 'USER' ? 'pill-btn-primary' : 'pill-btn-outline'}`}
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={() => switchRole('USER')}
          >
            👤 Utilizator
          </button>
          <button
            type="button"
            className={`pill-btn ${role === 'MODERATOR' ? 'pill-btn-primary' : 'pill-btn-outline'}`}
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={() => switchRole('MODERATOR')}
          >
            ⚖️ Moderator
          </button>
          <button
            type="button"
            className={`pill-btn ${role === 'ADMIN' ? 'pill-btn-accent' : 'pill-btn-outline'}`}
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={() => switchRole('ADMIN')}
          >
            🛡️ Admin
          </button>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Conectat ca: <strong>{user?.name || 'Anonim'}</strong>
        </div>
      </div>

      {/* Simulated Preview States */}
      <div style={{ marginBottom: '16px' }}>
        <span className="originle-kicker" style={{ fontSize: '10px' }}>● STĂRI INTERFAȚĂ (DS-01)</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '6px' }}>
          <button
            type="button"
            className={`pill-btn ${previewState === 'normal' ? 'pill-btn-primary' : 'pill-btn-outline'}`}
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={() => onSetPreviewState('normal')}
          >
            Normal (Date)
          </button>
          <button
            type="button"
            className={`pill-btn ${previewState === 'loading' ? 'pill-btn-primary' : 'pill-btn-outline'}`}
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={() => onSetPreviewState('loading')}
          >
            Skeleton Loading
          </button>
          <button
            type="button"
            className={`pill-btn ${previewState === 'empty' ? 'pill-btn-primary' : 'pill-btn-outline'}`}
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={() => onSetPreviewState('empty')}
          >
            Empty (0 Rezultate)
          </button>
          <button
            type="button"
            className={`pill-btn ${previewState === 'error' ? 'pill-btn-emergency' : 'pill-btn-outline'}`}
            style={{ padding: '6px 10px', fontSize: '11px' }}
            onClick={() => onSetPreviewState('error')}
          >
            Eroare 503
          </button>
        </div>
      </div>

      {/* Direct Screen Navigation via React Router */}
      <div>
        <span className="originle-kicker" style={{ fontSize: '10px' }}>● NAVIGARE DIRECTĂ RUTĂ</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
          <button
            type="button"
            className="pill-btn pill-btn-outline"
            style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '11px' }}
            onClick={() => { navigate('/'); onClose(); }}
          >
            🔍 / — DS-01: Explorer & Hartă
          </button>
          <button
            type="button"
            className="pill-btn pill-btn-outline"
            style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '11px' }}
            onClick={() => { navigate('/urgenta'); onClose(); }}
          >
            🚨 /urgenta — DS-03: Ghid de Urgență
          </button>
          <button
            type="button"
            className="pill-btn pill-btn-outline"
            style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '11px' }}
            onClick={() => { navigate('/sesizari'); onClose(); }}
          >
            📝 /sesizari — DS-06: Sesizări & Vot
          </button>
          <button
            type="button"
            className="pill-btn pill-btn-outline"
            style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '11px' }}
            onClick={() => { navigate('/favorite'); onClose(); }}
          >
            ⭐ /favorite — DS-04: Favorite
          </button>
          <button
            type="button"
            className="pill-btn pill-btn-outline"
            style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '11px' }}
            onClick={() => { navigate('/admin'); onClose(); }}
          >
            🛡️ /admin — DS-05: Panou Admin & Moderare
          </button>
        </div>
      </div>
    </div>
  );
}
