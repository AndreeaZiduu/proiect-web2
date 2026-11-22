import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DAYS_NAMES = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

export function FacilityDetailModal({
  facilityId,
  isOpen,
  onClose,
  isFavorited,
  onToggleFavorite,
  onDrawRoute
}) {
  const { isAnon } = useAuth();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Form states
  const [proposedNote, setProposedNote] = useState('');
  const [isClosedOverride, setIsClosedOverride] = useState(false);
  const [proposedOpenHour, setProposedOpenHour] = useState('08:00');
  const [proposedCloseHour, setProposedCloseHour] = useState('20:00');
  const [validDays, setValidDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      const data = await api.getFacility(facilityId);
      setFacility(data);
    } catch (err) {
      console.error('Failed to load facility details:', err);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    if (isOpen && facilityId) {
      loadDetails();
      setFeedbackMsg(null);
    }
  }, [isOpen, facilityId, loadDetails]);

  if (!isOpen) return null;

  const handleVote = async (corrId) => {
    try {
      const res = await api.confirmCorrection(corrId);
      setFeedbackMsg({ type: 'success', text: res.message || 'Confirmare înregistrată!' });
      loadDetails();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Eroare la confirmare'
      });
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg(null);

    const now = new Date();
    const until = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);

    const parseMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    try {
      const res = await api.submitCorrection({
        facilityId: facility.id,
        proposedNote,
        isClosedOverride,
        proposedOpenMin: isClosedOverride ? null : parseMinutes(proposedOpenHour),
        proposedCloseMin: isClosedOverride ? null : parseMinutes(proposedCloseHour),
        validFrom: now.toISOString(),
        validUntil: until.toISOString()
      });

      setFeedbackMsg({ type: 'success', text: res.message || 'Sesizarea a fost trimisă!' });
      setProposedNote('');
      loadDetails();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Eroare la trimitere sesizare'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatScheduleRow = (dayIdx) => {
    if (!facility?.regularSchedules) return 'Program nespecificat';
    const dayScheds = facility.regularSchedules.filter((s) => s.dayOfWeek === dayIdx);
    if (dayScheds.length === 0) return 'Închis';

    return dayScheds
      .map((s) => {
        const oH = String(Math.floor(s.openMinute / 60)).padStart(2, '0');
        const oM = String(s.openMinute % 60).padStart(2, '0');
        const cH = String(Math.floor(s.closeMinute / 60)).padStart(2, '0');
        const cM = String(s.closeMinute % 60).padStart(2, '0');
        if (s.openMinute === 0 && s.closeMinute >= 1440) return 'Non-stop (24/7)';
        return `${oH}:${oM} – ${cH}:${cM}`;
      })
      .join(', ');
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
          maxWidth: '960px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-app)',
          padding: '28px',
          boxShadow: 'var(--shadow-floating)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Back and Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button
            type="button"
            className="pill-btn pill-btn-outline"
            onClick={onClose}
            style={{ padding: '6px 14px', fontSize: 'var(--font-size-xs)' }}
          >
            ← Înapoi la Explorer
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        {loading || !facility ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="skeleton-bar" style={{ width: '60%', height: '24px', margin: '0 auto 16px auto' }} />
            <div className="skeleton-bar" style={{ width: '40%', height: '16px', margin: '0 auto 24px auto' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '120px', borderRadius: '16px' }} />
          </div>
        ) : (
          <div>
            {/* Facility Hero */}
            <div className="details-hero" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span
                    className="originle-kicker"
                    style={{ color: facility.type === 'PHARMACY' ? 'var(--color-pharmacy)' : 'var(--color-vet)' }}
                  >
                    {facility.type === 'PHARMACY' ? '● FARMACIE UMANĂ' : '● UNITATE VET URGENȚĂ'}
                  </span>
                  <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-extrabold)', margin: '4px 0 8px 0' }}>
                    {facility.name}
                  </h1>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    📍 {facility.address}, {facility.city} • Sursă: {facility.sourceName}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                    ✓ Ultima verificare oficială: {facility.lastVerifiedAt ? new Date(facility.lastVerifiedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) : '21 noiembrie 2026'}
                  </p>
                </div>

                <div>
                  {facility.status?.isOnCall ? (
                    <span className="status-badge b-duty">
                      <span className="status-dot-core pulse-dot" style={{ background: 'var(--status-duty-dot)' }} />
                      DE GARDĂ (NON-STOP)
                    </span>
                  ) : facility.status?.isOpen ? (
                    <span className="status-badge b-open">
                      <span className="status-dot-core" style={{ background: 'var(--status-open-dot)' }} />
                      DESCHIS ACUM
                    </span>
                  ) : (
                    <span className="status-badge b-closed">
                      <span className="status-dot-core" style={{ background: 'var(--status-closed-dot)' }} />
                      ÎNCHIS
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                {facility.phone && (
                  <a href={`tel:${facility.phone}`} className="pill-btn pill-btn-primary">
                    📞 Apelează: {facility.phone}
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="pill-btn pill-btn-outline"
                >
                  🗺️ Google Maps
                </a>
                <button
                  type="button"
                  className="pill-btn pill-btn-outline"
                  onClick={() => {
                    onDrawRoute(facility);
                    onClose();
                  }}
                >
                  📍 Trasează pe hartă
                </button>
                <button
                  type="button"
                  className="pill-btn pill-btn-outline"
                  onClick={() => onToggleFavorite(facility.id)}
                >
                  {isFavorited ? '★ În favorite' : '☆ Salvează la favorite'}
                </button>
              </div>
            </div>

            {/* Split Grid: Schedule & Corrections */}
            <div className="details-split-grid">
              {/* Left Column: Weekly Schedule & Services */}
              <div className="originle-card">
                {/* Active Guard Duty Banner (DutyRotation / C-004) */}
                {facility.onCallRotations && facility.onCallRotations.length > 0 && (
                  <div
                    className="originle-card"
                    style={{
                      background: 'var(--status-duty-bg)',
                      border: '1px solid var(--status-duty-border)',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-lg)',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="status-dot-core pulse-dot" style={{ background: 'var(--status-duty-dot)' }} />
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-duty-text)' }}>
                        🛡️ ROTAȚIE DE GARDĂ NOCTURNĂ OFICIALĂ (C-004)
                      </span>
                    </div>
                    {facility.onCallRotations.map((rot) => (
                      <div key={rot.id} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)', marginTop: '4px' }}>
                        <div>Perioadă: <strong>{new Date(rot.startsAt).toLocaleDateString('ro-RO')} – {new Date(rot.endsAt).toLocaleDateString('ro-RO')}</strong></div>
                        {rot.onCallPhone && (
                          <div style={{ marginTop: '2px' }}>
                            Telefon gardă urgență: <strong><a href={`tel:${rot.onCallPhone}`} style={{ color: 'var(--accent-terracotta)', textDecoration: 'none' }}>📞 {rot.onCallPhone}</a></strong>
                          </div>
                        )}
                        {rot.notes && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>Note: {rot.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Holiday Overrides (D-004) */}
                {facility.holidaySchedules && facility.holidaySchedules.length > 0 && (
                  <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <span className="originle-kicker">● EXCEPȚII SĂRBĂTORI LEGALE (D-004)</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      {facility.holidaySchedules.map((hol) => (
                        <div key={hol.id} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          📅 <strong>{new Date(hol.date).toLocaleDateString('ro-RO')}</strong> ({hol.name || 'Sărbătoare'}):{' '}
                          <span style={{ color: hol.isClosed ? 'var(--accent-coral-alert)' : 'var(--status-open-text)', fontWeight: '600' }}>
                            {hol.isClosed ? 'Închis' : `${String(Math.floor(hol.openMinute/60)).padStart(2,'0')}:${String(hol.openMinute%60).padStart(2,'0')} - ${String(Math.floor(hol.closeMinute/60)).padStart(2,'0')}:${String(hol.closeMinute%60).padStart(2,'0')}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <span className="originle-kicker">● ORAR OFICIAL</span>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: '4px 0 12px 0' }}>
                  Program Săptămânal de Funcționare
                </h2>

                <table className="schedule-table-clean" style={{ width: '100%', marginBottom: '20px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Ziua</th>
                      <th style={{ textAlign: 'right', padding: '6px' }}>Interval Orar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => (
                      <tr key={dayIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 'var(--font-weight-medium)' }}>
                          {DAYS_NAMES[dayIdx]}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                          {formatScheduleRow(dayIdx)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {facility.services && facility.services.length > 0 && (
                  <div>
                    <span className="originle-kicker">● SERVICII DISPONIBILE</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {facility.services.map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            background: 'var(--bg-surface-subtle)',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        >
                          {s.serviceName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Community Corrections & Reporting Form */}
              <div className="originle-card">
                <span className="originle-kicker">● COMUNITATE & SESIZĂRI (D-001)</span>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: '4px 0 6px 0' }}>
                  Corecții de Orar de la Cetățeni
                </h2>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Sesizările trec automat în stare <strong>aprobată</strong> la <strong>8 voturi</strong> (sau <strong>4 voturi</strong> pentru închideri temporare).
                </p>

                {feedbackMsg && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(217, 56, 41, 0.12)',
                      color: feedbackMsg.type === 'success' ? 'var(--status-open-text)' : 'var(--accent-coral-alert)',
                      fontSize: 'var(--font-size-xs)',
                      marginBottom: '14px'
                    }}
                  >
                    {feedbackMsg.text}
                  </div>
                )}

                {/* Existing Corrections List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {facility.corrections && facility.corrections.length > 0 ? (
                    facility.corrections.map((corr) => {
                      const required = corr.isClosedOverride ? 4 : 8;
                      const pct = Math.min(100, Math.round((corr.confirmations / required) * 100));
                      return (
                        <div
                          key={corr.id}
                          style={{
                            background: 'var(--bg-surface-subtle)',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: corr.status === 'APPROVED' ? 'var(--status-open-text)' : corr.status === 'CONFLICT' ? 'var(--accent-coral-alert)' : 'var(--accent-terracotta)' }}>
                              {corr.status} • {corr.confirmations} / {required} confirmări
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              de {corr.submittedBy?.name || 'Cetățean'}
                            </span>
                          </div>
                          <p style={{ fontSize: 'var(--font-size-xs)', margin: '4px 0 6px 0', fontWeight: '500' }}>
                            {corr.proposedNote}
                          </p>

                          {/* Live Progress Bar toward 4 vs 8 confirmations (D-001) */}
                          <div style={{ margin: '6px 0 8px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                              <span>Progres aprobare automată (D-001)</span>
                              <span>{corr.confirmations} / {required} voturi ({pct}%)</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: corr.status === 'APPROVED' ? 'var(--status-open-dot)' : 'var(--accent-terracotta)',
                                  transition: 'width 0.3s'
                                }}
                              />
                            </div>
                          </div>

                          {corr.status !== 'APPROVED' && (
                            <button
                              type="button"
                              className="pill-btn pill-btn-outline"
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                              onClick={() => handleVote(corr.id)}
                            >
                              +1 Confirmă această sesizare
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Nu există sesizări active pentru această unitate.
                    </div>
                  )}
                </div>

                {/* Submit New Correction */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', marginBottom: '8px' }}>
                    📝 Raportează o modificare de program
                  </h3>

                  {isAnon ? (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                      Pentru a raporta un orar greșit sau o închidere neanunțată, te rugăm să te conectezi (1-click din meniul de sus).
                    </div>
                  ) : (
                    <form onSubmit={handleCorrectionSubmit}>
                      <div className="originle-form-group">
                        <label className="originle-label">Descriere / Observație</label>
                        <input
                          type="text"
                          className="originle-input"
                          placeholder="Ex: Închis neașteptat pentru renovare / Pauză 13-14"
                          value={proposedNote}
                          onChange={(e) => setProposedNote(e.target.value)}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
                        <input
                          type="checkbox"
                          id="closedOverride"
                          checked={isClosedOverride}
                          onChange={(e) => setIsClosedOverride(e.target.checked)}
                        />
                        <label htmlFor="closedOverride" style={{ fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                          Unitatea este închisă complet temporar
                        </label>
                      </div>

                      {!isClosedOverride && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                          <div className="originle-form-group">
                            <label className="originle-label">Oră Deschidere</label>
                            <input
                              type="time"
                              className="originle-input"
                              value={proposedOpenHour}
                              onChange={(e) => setProposedOpenHour(e.target.value)}
                            />
                          </div>
                          <div className="originle-form-group">
                            <label className="originle-label">Oră Închidere</label>
                            <input
                              type="time"
                              className="originle-input"
                              value={proposedCloseHour}
                              onChange={(e) => setProposedCloseHour(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="originle-form-group">
                        <label className="originle-label">Valabilitate sesizare</label>
                        <select
                          className="originle-select"
                          value={validDays}
                          onChange={(e) => setValidDays(Number(e.target.value))}
                        >
                          <option value={1}>Pentru următoarele 24 de ore</option>
                          <option value={3}>Pentru următoarele 3 zile</option>
                          <option value={7}>Pentru 1 săptămână</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="pill-btn pill-btn-primary"
                        style={{ width: '100%', marginTop: '10px' }}
                        disabled={submitting}
                      >
                        {submitting ? 'Se trimite...' : 'Trimite sesizarea spre votul comunității'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
