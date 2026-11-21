import React, { forwardRef } from 'react';

export const FacilityCard = forwardRef(function FacilityCard({
  facility,
  isSelected,
  isFavorited,
  onSelect,
  onToggleFavorite,
  onOpenDetails,
  onDrawRoute
}, ref) {
  const isPharm = facility.type === 'PHARMACY';
  const status = facility.status || { isOpen: false, code: 'CLOSED', label: 'Închis' };

  const getStatusBadge = () => {
    if (status.isOnCall) {
      return (
        <span className="status-badge b-duty">
          <span className="status-dot-core pulse-dot" style={{ background: 'var(--status-duty-dot)' }} />
          {status.label || 'DE GARDĂ (NON-STOP)'}
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
    <article
      ref={ref}
      className={`originle-card ${isSelected ? 'originle-card-selected' : ''}`}
      style={{
        borderLeft: `4px solid ${isPharm ? 'var(--color-pharmacy)' : 'var(--color-vet)'}`,
        cursor: 'pointer',
        transition: 'all 200ms ease',
        boxShadow: isSelected ? 'var(--shadow-floating)' : 'var(--shadow-card)',
        borderColor: isSelected ? (isPharm ? 'var(--color-pharmacy)' : 'var(--color-vet)') : undefined,
        outline: isSelected ? `2px solid ${isPharm ? 'var(--color-pharmacy)' : 'var(--color-vet)'}` : 'none',
        outlineOffset: isSelected ? '2px' : '0'
      }}
      onClick={() => onSelect(facility)}
    >
      {/* Top Meta: Kicker & Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
        <span
          className="originle-kicker"
          style={{ color: isPharm ? 'var(--color-pharmacy)' : 'var(--color-vet)', margin: 0 }}
        >
          {isPharm ? '● FARMACIE UMANĂ' : '● UNITATE VET URGENȚĂ'}
        </span>
        {getStatusBadge()}
      </div>

      {/* Facility Name */}
      <h3
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-bold)',
          lineHeight: '1.3',
          margin: '0 0 6px 0',
          color: 'var(--text-primary)'
        }}
      >
        {facility.name}
      </h3>

      {/* Address & Distance */}
      <p
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-secondary)',
          margin: '0 0 14px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap'
        }}
      >
        <span>📍 {facility.address}, {facility.city}</span>
        {facility.distanceKm !== null && facility.distanceKm !== undefined && (
          <span style={{ color: 'var(--accent-terracotta)', fontWeight: 'var(--font-weight-bold)' }}>
            • 📏 {facility.distanceKm} km
          </span>
        )}
      </p>

      {/* Actions: Quick Call, Route, Favorite & Details */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {facility.phone ? (
            <a
              href={`tel:${facility.phone}`}
              className="pill-btn pill-btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px' }}
              title={`Apelează direct ${facility.phone}`}
            >
              📞 {facility.phone}
            </a>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fără telefon</span>
          )}

          <button
            type="button"
            className="pill-btn pill-btn-outline"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => onDrawRoute(facility)}
            title="Calculează și trasează traseul stradal OSRM pe hartă"
          >
            🗺️ Traseu
          </button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="pill-btn pill-btn-outline"
            style={{ padding: '6px 10px', fontSize: '12px', textDecoration: 'none' }}
            title="Deschide traseul în Google Maps extern"
          >
            ↗
          </a>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            className="pill-btn pill-btn-outline"
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              color: isFavorited ? 'var(--accent-terracotta)' : 'var(--text-secondary)'
            }}
            onClick={() => onToggleFavorite(facility.id)}
            title={isFavorited ? 'Elimină din favorite' : 'Salvează la favorite'}
          >
            {isFavorited ? '★' : '☆'}
          </button>

          <button
            type="button"
            className="pill-btn pill-btn-outline"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => onOpenDetails(facility)}
          >
            Detalii ›
          </button>
        </div>
      </div>
    </article>
  );
});
