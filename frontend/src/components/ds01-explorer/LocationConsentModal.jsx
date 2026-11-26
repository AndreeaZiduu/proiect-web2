import React, { useEffect } from 'react';

export function LocationConsentModal({ isOpen, onAllow, onDecline }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onDecline();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDecline]);

  if (!isOpen) return null;

  return (
    <div
      className="location-consent-backdrop"
      role="presentation"
      onClick={onDecline}
    >
      <div
        className="originle-card location-consent-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-consent-title"
        aria-describedby="location-consent-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="location-consent-header">
          <div className="location-consent-icon" aria-hidden="true">
            📍
          </div>
          <div>
            <span className="originle-kicker" style={{ margin: '0 0 4px 0' }}>
              ● LOCALIZARE &amp; TRASEU
            </span>
            <h2 id="location-consent-title" className="location-consent-title">
              Permiți accesul la locația ta?
            </h2>
          </div>
        </div>

        <p id="location-consent-desc" className="location-consent-desc">
          Folosim locația ta curentă pentru a sorta farmaciile și cabinetele veterinare după
          distanța reală și pentru a calcula traseul exact de unde te afli. Locația nu este
          salvată pe server.
        </p>

        <div className="location-consent-actions">
          <button
            type="button"
            className="pill-btn pill-btn-accent location-consent-primary"
            onClick={onAllow}
          >
            📍 Permite accesul la locație
          </button>
          <button
            type="button"
            className="pill-btn pill-btn-outline location-consent-secondary"
            onClick={onDecline}
          >
            Nu acum (folosește Centrul Sibiului)
          </button>
        </div>
      </div>
    </div>
  );
}
