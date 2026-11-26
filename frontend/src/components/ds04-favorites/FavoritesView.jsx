import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export function FavoritesView({
  favorites = [],
  onToggleFavorite,
  onOpenDetails,
  onOpenAuthModal,
  onDrawRoute
}) {
  const { isAnon } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatedFavorites = favorites.filter((fav) => fav.hasScheduleChangeNotification);

  const renderFavoriteStatusBadge = (fac) => {
    const status = fac?.status;
    if (!status) return null;
    if (status.isOnCall) {
      return (
        <span className="status-badge b-duty">
          <span className="status-dot-core pulse-dot" style={{ background: 'var(--status-duty-dot)' }} />
          {status.label || 'DE GARDĂ'}
        </span>
      );
    }
    if (status.code === 'CLOSING_SOON') {
      return (
        <span className="status-badge b-closing">
          <span className="status-dot-core" style={{ background: 'var(--status-closing-dot)' }} />
          {status.label || 'SE ÎNCHIDE ÎN CURÂND'}
        </span>
      );
    }
    if (status.isOpen) {
      return (
        <span className="status-badge b-open">
          <span className="status-dot-core" style={{ background: 'var(--status-open-dot)' }} />
          {status.label || 'DESCHIS ACUM'}
        </span>
      );
    }
    return (
      <span className="status-badge b-closed">
        <span className="status-dot-core" style={{ background: 'var(--status-closed-dot)' }} />
        {status.label || 'ÎNCHIS'}
      </span>
    );
  };

  return (
    <section className="screen-pane active-screen" id="paneDs04">
      {/* Offline Notice Banner */}
      {isOffline && (
        <div
          className="offline-notice-bar"
          style={{
            background: 'rgba(194, 94, 52, 0.12)',
            border: '1px solid rgba(194, 94, 52, 0.35)',
            color: 'var(--accent-terracotta)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          <span>📡</span>
          <span>
            <strong>Mod offline — date salvate local:</strong> Favoritele tale sunt încărcate din memoria locală a dispozitivului. Telefoanele și detaliile sunt accesibile fără conexiune la internet.
          </span>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <div className="originle-kicker">
          <span className="originle-kicker-dot" /> ACCES RAPID & SALVARE OFFLINE (DS-04)
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-extrabold)', letterSpacing: '-0.01em', margin: '4px 0 6px 0' }}>
          Farmaciile și Clinicile Tale Favorite
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
          Unitățile salvate sunt accesibile instantaneu, inclusiv în mod <strong>offline</strong> prin Service Worker dacă pică internetul noaptea.
        </p>
      </div>

      {isAnon && (
        <div
          className="originle-card"
          style={{
            background: 'var(--bg-surface-subtle)',
            borderLeft: '4px solid var(--accent-terracotta)',
            marginBottom: '20px',
            padding: '16px 20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
                💡 Ești în modul Vizitator (salvare locală)
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Favoritele tale sunt salvate în acest browser. Conectează-te cu 1-click pentru a sincroniza favoritele pe toate dispozitivele și a primi alerte de schimbare a orarului.
              </p>
            </div>
            <button
              type="button"
              className="pill-btn pill-btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px' }}
              onClick={onOpenAuthModal}
            >
              Conectare rapidă
            </button>
          </div>
        </div>
      )}

      {/* Top Schedule-Change Alert Banner when favorited facilities have approved/active overrides */}
      {updatedFavorites.length > 0 && (
        <div className="fav-schedule-alert-banner" role="alert">
          <div className="fav-schedule-alert-icon" aria-hidden="true">⚠️</div>
          <div className="fav-schedule-alert-body">
            <h3 className="fav-schedule-alert-title">
              {updatedFavorites.length === 1
                ? 'O unitate favorită are programul actualizat'
                : `${updatedFavorites.length} unități favorite au programul actualizat`}
            </h3>
            <ul className="fav-schedule-alert-list">
              {updatedFavorites.map((fav) => {
                const fac = fav.facility || fav;
                return (
                  <li key={fac.id}>
                    <strong>{fac.name || fac.id}</strong>
                    {fav.notificationNote ? `: „${fav.notificationNote}”` : ' — verificare orar activă'}
                    <button
                      type="button"
                      className="fav-alert-detail-link"
                      onClick={() => onOpenDetails(fac)}
                    >
                      Vezi detalii ›
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="originle-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>⭐</div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
            Nu ai nicio unitate la favorite
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', maxWidth: '360px', margin: '8px auto 20px auto' }}>
            Apasă pe steluța ☆ de pe orice farmacie sau cabinet veterinar din Explorer pentru a le avea la îndemână în caz de urgență.
          </p>
        </div>
      ) : (
        <div className="favorites-catalog-grid">
          {favorites.map((fav) => {
            const fac = fav.facility || fav;
            const isPharm = fac.type === 'PHARMACY';
            const hasChangeAlert = fav.hasScheduleChangeNotification;

            return (
              <div
                key={fac.id}
                className="originle-card"
                style={{
                  borderLeft: `4px solid ${isPharm ? 'var(--color-pharmacy)' : 'var(--color-vet)'}`,
                  position: 'relative'
                }}
              >
                {/* Notification Badge if program changed */}
                {hasChangeAlert && (
                  <div
                    style={{
                      background: 'rgba(217, 56, 41, 0.1)',
                      border: '1px solid rgba(217, 56, 41, 0.3)',
                      color: 'var(--accent-coral-alert)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '11px',
                      fontWeight: '700',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>⚠️ Orar modificat recent: {fav.notificationNote || 'Verifică programul'}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span
                      className="originle-kicker"
                      style={{ color: isPharm ? 'var(--color-pharmacy)' : 'var(--color-vet)', margin: 0 }}
                    >
                      {isPharm ? '● FARMACIE' : '● VET URGENȚĂ'}
                    </span>
                    {renderFavoriteStatusBadge(fac)}
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--accent-terracotta)', fontSize: '18px', cursor: 'pointer' }}
                    onClick={() => onToggleFavorite(fac.id)}
                    title="Elimină din favorite"
                  >
                    ★
                  </button>
                </div>

                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: '0 0 6px 0' }}>
                  {fac.name}
                </h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  📍 {fac.address}, {fac.city}
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {fac.phone && (
                    <a href={`tel:${fac.phone}`} className="pill-btn pill-btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                      📞 {fac.phone}
                    </a>
                  )}
                  {onDrawRoute && (
                    <button
                      type="button"
                      className="pill-btn pill-btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => onDrawRoute(fac)}
                    >
                      📍 Traseu OSRM ›
                    </button>
                  )}
                  <button
                    type="button"
                    className="pill-btn pill-btn-outline"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => onOpenDetails(fac)}
                  >
                    Detalii & Orar ›
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
