import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function SesizariView({ onOpenAuthModal }) {
  const { isAnon } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [proposedNote, setProposedNote] = useState('');
  const [isClosedOverride, setIsClosedOverride] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const facData = await api.getFacilities({ city: 'all' });
      setFacilities(facData.facilities || []);
      setSelectedFacilityId((prev) => (prev ? prev : (facData.facilities?.[0]?.id || '')));

      // Collect active corrections from facilities
      const activeCorrs = [];
      (facData.facilities || []).forEach((f) => {
        (f.corrections || []).forEach((c) => {
          activeCorrs.push({ ...c, facilityName: f.name, facilityAddress: f.address, facilityId: f.id });
        });
      });
      setCorrections(activeCorrs);
    } catch (err) {
      console.error('Error loading sesizari:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVote = async (id) => {
    try {
      const res = await api.confirmCorrection(id);
      setFeedback({ type: 'success', text: res.message || 'Confirmare înregistrată!' });
      loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Eroare la confirmare'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const now = new Date();
    const until = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      const res = await api.submitCorrection({
        facilityId: selectedFacilityId,
        proposedNote,
        isClosedOverride,
        validFrom: now.toISOString(),
        validUntil: until.toISOString()
      });

      setFeedback({ type: 'success', text: res.message || 'Sesizarea a fost înregistrată!' });
      setProposedNote('');
      loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Eroare la trimitere sesizare'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="screen-pane active-screen" id="paneDs06">
      <div style={{ marginBottom: '24px' }}>
        <div className="originle-kicker">
          <span className="originle-kicker-dot" /> COMUNITATE & TRANSPARENȚĂ (DECIZIA D-001)
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-extrabold)', letterSpacing: '-0.01em', margin: '4px 0 6px 0' }}>
          Sesizări Comunitare de Orar & Vot Live
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', maxWidth: '820px' }}>
          Sesizările transmise de cetățeni pentru farmacii și cabinete veterinare din Sibiu devin <strong>aprobate temporar automat</strong> când acumulează <strong>8 confirmări</strong> (sau <strong>4 confirmări</strong> pentru închideri temporare).
        </p>
      </div>

      {/* D-001 Callout Banner */}
      <div
        className="originle-card"
        style={{
          background: 'var(--bg-surface-subtle)',
          borderLeft: '4px solid var(--accent-terracotta)',
          marginBottom: '24px',
          padding: '16px 20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>⚖️</span>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
              Cum funcționează Regula celor 8 Confirmări (Decizia D-001)
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Dacă ai observat o farmacie închisă neanunțat sau cu alt orar, trimite o sesizare sau confirmă (+1 Vot) o sesizare existentă. La 8 confirmări (sau 4 pentru pauze), orarul din catalog este actualizat automat până la verificarea unui moderator.
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(217, 56, 41, 0.12)',
            color: feedback.type === 'success' ? 'var(--status-open-text)' : 'var(--accent-coral-alert)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: '20px'
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* 2-Column Split: Active Reports | Submit Form */}
      <div className="sesizari-layout-split">
        {/* Left: Active Feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
              Flux Sesizări Active în Județul Sibiu ({corrections.length})
            </h2>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Actualizare în timp real</span>
          </div>

          {corrections.length === 0 ? (
            <div className="originle-card" style={{ padding: '36px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
                Nicio sesizare activă
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Toate unitățile respectă programul oficial declarat.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {corrections.map((corr) => {
                const required = corr.isClosedOverride ? 4 : 8;
                const pct = Math.min(100, Math.round((corr.confirmations / required) * 100));

                return (
                  <div key={corr.id} className="originle-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span className="originle-kicker">● SESIZARE COMUNITATE</span>
                        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: '2px 0 4px 0' }}>
                          {corr.facilityName}
                        </h3>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          📍 {corr.facilityAddress}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {corr.status === 'APPROVED' ? (
                          <span className="status-badge b-open">✓ APROBAT (D-001)</span>
                        ) : corr.status === 'CONFLICT' ? (
                          <span className="status-badge" style={{ background: 'rgba(217, 56, 41, 0.12)', color: 'var(--accent-coral-alert)', border: '1px solid rgba(217, 56, 41, 0.3)' }}>
                            ⚠️ ÎN CONFLICT
                          </span>
                        ) : corr.status === 'REJECTED' ? (
                          <span className="status-badge b-closed">✕ RESPINS</span>
                        ) : (
                          <span className="status-badge b-duty">
                            <span className="status-dot-core pulse-dot" style={{ background: 'var(--status-duty-dot)' }} />
                            ÎN AȘTEPTARE ({corr.confirmations}/{required})
                          </span>
                        )}
                      </div>
                    </div>

                    <p style={{ fontSize: 'var(--font-size-sm)', margin: '10px 0 8px 0', fontWeight: '500' }}>
                      "{corr.proposedNote}"
                    </p>

                    {/* Live Progress Bar toward 4 vs 8 confirmations (D-001) */}
                    <div style={{ margin: '8px 0 10px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        <span>Prag aprobare automată ({corr.isClosedOverride ? '4 confirmări pauză/închidere' : '8 confirmări orar'})</span>
                        <span><strong>{corr.confirmations} / {required}</strong> voturi ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: corr.status === 'APPROVED' ? 'var(--status-open-dot)' : corr.status === 'CONFLICT' ? 'var(--accent-coral-alert)' : 'var(--accent-terracotta)',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Status: <strong>{corr.status}</strong> • Valabil până: {corr.validUntil ? new Date(corr.validUntil).toLocaleDateString('ro-RO') : '24h'}
                      </span>
                      {corr.status !== 'APPROVED' && corr.status !== 'REJECTED' && (
                        <button
                          type="button"
                          className="pill-btn pill-btn-primary"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                          onClick={() => {
                            if (isAnon && onOpenAuthModal) {
                              onOpenAuthModal();
                            } else {
                              handleVote(corr.id);
                            }
                          }}
                        >
                          +1 Confirmă sesizarea
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Submit New Report */}
        <div className="originle-card">
          <span className="originle-kicker">● RAPORTEAZĂ O MODIFICARE</span>
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: '4px 0 6px 0' }}>
            Trimite o Sesizare Nouă
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Ai găsit o farmacie închisă sau cu un orar modificat? Raportează pentru ceilalți cetățeni.
          </p>

          {isAnon ? (
            <div style={{ padding: '20px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Pentru a trimite o sesizare, te rugăm să te conectezi (1-click din meniul de sus).
              </p>
              <button
                type="button"
                className="pill-btn pill-btn-primary"
                onClick={onOpenAuthModal}
              >
                Conectare 1-Click
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="originle-form-group">
                <label className="originle-label">Alege Unitatea Medicală / Veterinară</label>
                <select
                  className="originle-select"
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  required
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="originle-form-group">
                <label className="originle-label">Descrie Situația Observată</label>
                <textarea
                  className="originle-textarea"
                  rows={3}
                  placeholder="Ex: Farmacia este închisă pentru renovare sau are program redus astăzi..."
                  value={proposedNote}
                  onChange={(e) => setProposedNote(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0 20px 0' }}>
                <input
                  type="checkbox"
                  id="feedClosedOverride"
                  checked={isClosedOverride}
                  onChange={(e) => setIsClosedOverride(e.target.checked)}
                />
                <label htmlFor="feedClosedOverride" style={{ fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                  Unitatea este închisă complet temporar (necesită 4 voturi)
                </label>
              </div>

              <button
                type="submit"
                className="pill-btn pill-btn-primary"
                style={{ width: '100%' }}
                disabled={submitting}
              >
                {submitting ? 'Se trimite...' : 'Trimite Sesizarea Spre Comunitate'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
