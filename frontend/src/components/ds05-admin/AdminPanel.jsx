import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function AdminPanel({ onOpenAuthModal }) {
  const { role, isModerator, isAdmin, switchRole } = useAuth();
  const [activeSubtab, setActiveSubtab] = useState('mod'); // 'mod' | 'facs' | 'csv'
  const [corrections, setCorrections] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [actionMsg, setActionMsg] = useState(null);

  // New facility form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('PHARMACY');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('Sibiu');
  const [newPhone, setNewPhone] = useState('');
  const [newLat, setNewLat] = useState('45.7983');
  const [newLng, setNewLng] = useState('24.1503');

  // CSV Import state
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState([]);
  const [importResult, setImportResult] = useState(null);

  const loadData = useCallback(async () => {
    setActionMsg(null);
    try {
      if (isModerator) {
        const corrs = await api.getModerationQueue();
        setCorrections(corrs);
      }

      if (isAdmin) {
        const facsData = await api.getFacilities({ city: 'all' });
        setFacilities(facsData.facilities || []);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  }, [isAdmin, isModerator]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Access denied fallback for ANON and USER (Decizia D-003)
  if (!isModerator) {
    return (
      <section className="screen-pane active-screen" id="paneDs05">
        <div
          className="auth-banner-box originle-card"
          style={{
            maxWidth: '560px',
            margin: '40px auto',
            textAlign: 'center',
            padding: '40px 24px',
            boxShadow: 'var(--shadow-floating)'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
          <span className="originle-kicker" style={{ color: 'var(--accent-coral-alert)' }}>
            ● ACCES RESTRICȚIONAT (DECIZIA D-003)
          </span>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-extrabold)', margin: '8px 0 12px 0' }}>
            Panou Rezervat Moderatorilor & Administratorilor
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
            Conform deciziei arhitecturale <strong>D-003</strong> (RBAC), accesul la moderarea sesizărilor comunitare și gestiunea catalogului necesită autentificare cu rolul de <strong>MODERATOR</strong> sau <strong>ADMIN</strong>.
            <br />
            Ești conectat în prezent ca: <strong>{role === 'USER' ? 'Utilizator Obișnuit (USER)' : 'Vizitator (ANON)'}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="pill-btn pill-btn-primary"
              onClick={() => switchRole('MODERATOR')}
            >
              ⚖️ Intră ca MODERATOR (Tudor)
            </button>
            <button
              type="button"
              className="pill-btn pill-btn-primary"
              onClick={() => switchRole('ADMIN')}
            >
              🛡️ Intră ca ADMIN (Admin Sibiu)
            </button>
            {onOpenAuthModal && (
              <button
                type="button"
                className="pill-btn pill-btn-outline"
                onClick={onOpenAuthModal}
              >
                Conectare Cont Propriu
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Moderation action
  const handleReview = async (id, decision) => {
    try {
      await api.reviewCorrection(id, decision);
      setActionMsg({
        type: 'success',
        text: `Sesizarea a fost ${decision === 'APPROVED' ? 'aprobată' : 'respinsă'}.`
      });
      loadData();
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Eroare la procesare'
      });
    }
  };

  // Add Facility (Admin only)
  const handleAddFacility = async (e) => {
    e.preventDefault();
    try {
      await api.createFacility({
        name: newName,
        type: newType,
        address: newAddress,
        city: newCity,
        phone: newPhone,
        latitude: parseFloat(newLat),
        longitude: parseFloat(newLng),
        sourceName: 'Admin manual'
      });
      setShowAddModal(false);
      setNewName('');
      setNewAddress('');
      setNewPhone('');
      setActionMsg({ type: 'success', text: 'Unitatea a fost adăugată în catalog!' });
      loadData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  // Delete Facility (Admin only)
  const handleDeleteFacility = async (id, name) => {
    if (!window.confirm(`Ești sigur că vrei să ștergi definitiv unitatea "${name}"?`)) return;
    try {
      await api.deleteFacility(id);
      setActionMsg({ type: 'success', text: `Unitatea "${name}" a fost ștearsă.` });
      loadData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  // Parse CSV Preview
  const handleCsvChange = (text) => {
    setCsvText(text);
    const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setCsvPreview([]);
      return;
    }

    const rows = lines.slice(1).map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      return {
        facilityId: parts[0] || '',
        name: parts[1] || '',
        type: parts[2] || '',
        city: parts[3] || '',
        startDate: parts[4] || '',
        endDate: parts[5] || '',
        hours: `${parts[6] || '08:00'} - ${parts[7] || '08:00'}`,
        phone: parts[8] || ''
      };
    });
    setCsvPreview(rows);
  };

  const handleLoadSampleCsv = () => {
    const sample = `facilityId,name,type,city,startDate,endDate,startHour,endHour,onCallPhone,notes
fac_polisano_mv,Farmacia Polisano Pharma,PHARMACY,Sibiu,2026-11-21,2026-11-22,08:00,08:00,0269420162,Gardă oficială noapte
fac_dona_centru,Farmacia Dona Centru,PHARMACY,Sibiu,2026-11-22,2026-11-23,08:00,08:00,0269211000,Gardă programată
vet_transilvania,Spital Veterinar Transilvania,EMERGENCY_VET,Sibiu,2026-11-21,2026-11-28,00:00,24:00,0369991,Permanență 24/7`;
    handleCsvChange(sample);
  };

  const handleExecuteImport = async () => {
    if (!csvText.trim()) return;
    try {
      const res = await api.importRotations(csvText);
      setImportResult(res);
      setActionMsg({
        type: 'success',
        text: `Import finalizat cu succes! Inserate: ${res.importedCount}, Duplicate omise: ${res.skippedDuplicates}.`
      });
      loadData();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  return (
    <section className="screen-pane active-screen" id="paneDs05">
      <div style={{ marginBottom: '24px' }}>
        <div className="originle-kicker">
          <span className="originle-kicker-dot" /> RBAC & MANAGEMENT CENTRALIZAT (D-003)
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-extrabold)', letterSpacing: '-0.01em', margin: '4px 0 6px 0' }}>
          Panou {isAdmin ? 'Administrator' : 'Moderator'}
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
          Rol curent: <strong>{role}</strong>. Moderatorii pot aproba sesizări; adăugarea/ștergerea unităților și importul CSV sunt rezervate exclusiv Administratorilor.
        </p>
      </div>

      {actionMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: actionMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(217, 56, 41, 0.12)',
            color: actionMsg.type === 'success' ? 'var(--status-open-text)' : 'var(--accent-coral-alert)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: '20px'
          }}
        >
          {actionMsg.text}
        </div>
      )}

      {/* Subtabs Row */}
      <div className="admin-subtabs-row" style={{ marginBottom: '24px' }}>
        <button
          className={`admin-subtab-btn ${activeSubtab === 'mod' ? 'active' : ''}`}
          onClick={() => setActiveSubtab('mod')}
        >
          📋 Coada de Moderare ({corrections.length})
        </button>

        <button
          className={`admin-subtab-btn ${activeSubtab === 'facs' ? 'active' : ''}`}
          onClick={() => setActiveSubtab('facs')}
        >
          🏢 Gestiune Unități {!isAdmin && '(Doar Admin)'}
        </button>

        <button
          className={`admin-subtab-btn ${activeSubtab === 'csv' ? 'active' : ''}`}
          onClick={() => setActiveSubtab('csv')}
        >
          📥 Import CSV Gardă {!isAdmin && '(Doar Admin)'}
        </button>
      </div>

      {/* Subtab 1: Moderation Queue */}
      {activeSubtab === 'mod' && (
        <div>
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', marginBottom: '14px' }}>
            Sesizări în Așteptare sau Conflict
          </h2>

          {corrections.length === 0 ? (
            <div className="originle-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
                Nicio sesizare în așteptare
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Toate corecțiile raportate de cetățeni au fost soluționate.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {corrections.map((corr) => (
                <div
                  key={corr.id}
                  className="originle-card"
                  style={{
                    borderLeft: `4px solid ${corr.status === 'CONFLICT' ? 'var(--accent-coral-alert)' : 'var(--accent-terracotta)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span className="originle-kicker">
                        {corr.status === 'CONFLICT' ? '⚠️ RAPORT ÎN CONFLICT' : '● SESIZARE NOUĂ'}
                      </span>
                      <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: '2px 0 4px 0' }}>
                        {corr.facility?.name}
                      </h3>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                        📍 {corr.facility?.address} • Trimis de: {corr.submittedBy?.name} ({corr.submittedBy?.email})
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="pill-btn pill-btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => handleReview(corr.id, 'APPROVED')}
                      >
                        ✓ Aprobă
                      </button>
                      <button
                        type="button"
                        className="pill-btn pill-btn-outline"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => handleReview(corr.id, 'REJECTED')}
                      >
                        ✕ Respinge
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600' }}>
                      Modificare propusă: {corr.proposedNote}
                    </div>
                    {corr.isClosedOverride ? (
                      <div style={{ fontSize: '11px', color: 'var(--accent-coral-alert)', marginTop: '2px' }}>
                        Raportat ca închis complet temporar.
                      </div>
                    ) : null}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Confirmări cetățeni: <strong>{corr.confirmations} voturi</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Facility Management (ADMIN Only) */}
      {activeSubtab === 'facs' && (
        <div>
          {!isAdmin ? (
            <div className="originle-card" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔒</div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
                Acces Restricționat (403 Forbidden)
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', maxWidth: '400px', margin: '6px auto 0 auto' }}>
                Conform deciziei <strong>D-003</strong>, gestiunea structurală a catalogului de unități medicale aparține exclusiv rolului ADMIN.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
                  Catalog Unități Medicale & Veterinare Sibiu ({facilities.length})
                </h2>
                <button
                  type="button"
                  className="pill-btn pill-btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  + Adaugă Unitate
                </button>
              </div>

              {/* Add Modal */}
              {showAddModal && (
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
                  onClick={() => setShowAddModal(false)}
                >
                  <div
                    className="originle-card"
                    style={{
                      width: '100%',
                      maxWidth: '520px',
                      background: 'var(--bg-surface)',
                      padding: '28px',
                      boxShadow: 'var(--shadow-floating)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: '16px' }}>
                      Adăugare Unitate Nouă
                    </h3>

                    <form onSubmit={handleAddFacility}>
                      <div className="originle-form-group">
                        <label className="originle-label">Nume Unitate</label>
                        <input
                          type="text"
                          className="originle-input"
                          placeholder="Ex: Farmacia Catena Mihai Viteazu"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="originle-form-group">
                        <label className="originle-label">Tip Unitate</label>
                        <select
                          className="originle-select"
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                        >
                          <option value="PHARMACY">PHARMACY (Farmacie Umană)</option>
                          <option value="EMERGENCY_VET">EMERGENCY_VET (Cabinet / Spital Veterinar)</option>
                        </select>
                      </div>

                      <div className="originle-form-group">
                        <label className="originle-label">Adresă</label>
                        <input
                          type="text"
                          className="originle-input"
                          placeholder="Str. Nicolae Bălcescu nr. 5"
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        <div className="originle-form-group">
                          <label className="originle-label">Oraș</label>
                          <input
                            type="text"
                            className="originle-input"
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            required
                          />
                        </div>
                        <div className="originle-form-group">
                          <label className="originle-label">Telefon</label>
                          <input
                            type="text"
                            className="originle-input"
                            placeholder="0269..."
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        <div className="originle-form-group">
                          <label className="originle-label">Latitudine</label>
                          <input
                            type="text"
                            className="originle-input"
                            value={newLat}
                            onChange={(e) => setNewLat(e.target.value)}
                            required
                          />
                        </div>
                        <div className="originle-form-group">
                          <label className="originle-label">Longitudine</label>
                          <input
                            type="text"
                            className="originle-input"
                            value={newLng}
                            onChange={(e) => setNewLng(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="submit" className="pill-btn pill-btn-primary" style={{ flex: 1 }}>
                          Salvează Unitatea
                        </button>
                        <button
                          type="button"
                          className="pill-btn pill-btn-outline"
                          onClick={() => setShowAddModal(false)}
                        >
                          Anulează
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Facilities Table */}
              <div className="table-container-clean">
                <table className="data-table-clean">
                  <thead>
                    <tr>
                      <th>Nume</th>
                      <th>Tip</th>
                      <th>Oraș</th>
                      <th>Adresă</th>
                      <th>Telefon</th>
                      <th>Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facilities.map((fac) => (
                      <tr key={fac.id}>
                        <td style={{ fontWeight: '600' }}>{fac.name}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: fac.type === 'PHARMACY' ? 'var(--color-pharmacy)' : 'var(--color-vet)'
                            }}
                          >
                            {fac.type === 'PHARMACY' ? '💊 Farmacie' : '🐾 Vet'}
                          </span>
                        </td>
                        <td>{fac.city}</td>
                        <td style={{ fontSize: '12px' }}>{fac.address}</td>
                        <td style={{ fontSize: '12px' }}>{fac.phone || '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="pill-btn pill-btn-outline"
                            style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--accent-coral-alert)' }}
                            onClick={() => handleDeleteFacility(fac.id, fac.name)}
                          >
                            Șterge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: CSV Import (ADMIN Only - Contract C-004) */}
      {activeSubtab === 'csv' && (
        <div>
          {!isAdmin ? (
            <div className="originle-card" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔒</div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
                Acces Restricționat (403 Forbidden)
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', maxWidth: '400px', margin: '6px auto 0 auto' }}>
                Importul fișierelor CSV lunare pentru rotațiile de gardă este rezervat exclusiv rolului ADMIN.
              </p>
            </div>
          ) : (
            <div>
              <div className="originle-card" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', marginBottom: '4px' }}>
                  Import Fișier CSV Rotații Lunare de Gardă
                </h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Format conform contractului <strong>C-004</strong>: <code>facilityId,name,type,city,startDate,endDate,startHour,endHour,onCallPhone,notes</code>
                </p>

                <textarea
                  className="originle-textarea"
                  rows={5}
                  placeholder="Lipește datele CSV aici sau apasă pe butonul de încărcare demonstrativă..."
                  value={csvText}
                  onChange={(e) => handleCsvChange(e.target.value)}
                  style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', width: '100%', marginBottom: '12px' }}
                />

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="pill-btn pill-btn-outline"
                    onClick={handleLoadSampleCsv}
                  >
                    Încarcă date demonstrative
                  </button>
                  <button
                    type="button"
                    className="pill-btn pill-btn-primary"
                    disabled={!csvText.trim()}
                    onClick={handleExecuteImport}
                  >
                    Procesează și salvează rotațiile
                  </button>
                </div>

                {importResult && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontSize: '12px',
                      color: 'var(--status-open-text)'
                    }}
                  >
                    ✓ Rotații inserate: <strong>{importResult.importedCount}</strong> • Rotații existente omise: <strong>{importResult.skippedDuplicates}</strong>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              {csvPreview.length > 0 && (
                <div className="table-container-clean">
                  <div style={{ padding: '10px 14px', background: 'var(--bg-surface-subtle)', fontWeight: '600', fontSize: '12px' }}>
                    Previzualizare Intrări CSV ({csvPreview.length} rotații detectate)
                  </div>
                  <table className="data-table-clean">
                    <thead>
                      <tr>
                        <th>ID Unitate</th>
                        <th>Nume</th>
                        <th>Tip</th>
                        <th>Oraș</th>
                        <th>Perioadă</th>
                        <th>Interval</th>
                        <th>Telefon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '11px' }}>{row.facilityId}</td>
                          <td style={{ fontWeight: '600' }}>{row.name}</td>
                          <td>{row.type}</td>
                          <td>{row.city}</td>
                          <td>{row.startDate} → {row.endDate}</td>
                          <td>{row.hours}</td>
                          <td>{row.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
