import React from 'react';

export function EmergencyGuideView() {
  return (
    <section className="screen-pane active-screen" id="paneDs03">
      {/* 1. Top Section: 4 Hotlines */}
      <div style={{ marginBottom: '28px' }}>
        <div className="originle-kicker">
          <span className="originle-kicker-dot" /> LINII DIRECTE OFICIALE JUDEȚUL SIBIU
        </div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-extrabold)', letterSpacing: '-0.01em', margin: '4px 0 16px 0' }}>
          Numere de Urgență & Triaj Rapid
        </h1>

        <div className="hotlines-top-grid-4">
          {/* 112 Major Emergency */}
          <div className="hotline-card-top hotline-card-112">
            <div>
              <span className="hotline-badge-tag" style={{ color: 'var(--accent-coral-alert)' }}>
                URGENȚĂ MAJORĂ UMANĂ
              </span>
              <div className="hotline-phone-number" style={{ color: 'var(--accent-coral-alert)' }}>
                112
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.35' }}>
                Număr Național Unic: Salvare, Pompieri, Poliție, SMURD Sibiu.
              </p>
            </div>
            <a href="tel:112" className="pill-btn pill-btn-emergency" style={{ width: '100%', fontSize: '13px', padding: '10px' }}>
              📞 Apelează 112
            </a>
          </div>

          {/* Emergency Vet Hospital 24/7 */}
          <div className="hotline-card-top" style={{ borderColor: 'var(--color-vet-border)' }}>
            <div>
              <span className="hotline-badge-tag" style={{ color: 'var(--color-vet-text)' }}>
                SPITAL VETERINAR URGENȚĂ SIBIU
              </span>
              <div className="hotline-phone-number" style={{ color: 'var(--color-vet-text)' }}>
                0369 991
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.35' }}>
                Spitalul Veterinar Transilvania: Terapie intensivă și urgențe 24/7.
              </p>
            </div>
            <a href="tel:0369991" className="pill-btn pill-btn-primary" style={{ width: '100%', fontSize: '13px', padding: '10px' }}>
              📞 Sună Linia Roșie Vet
            </a>
          </div>

          {/* Colegiul Farmaciștilor Sibiu */}
          <div className="hotline-card-top" style={{ borderColor: 'var(--color-pharmacy-border)' }}>
            <div>
              <span className="hotline-badge-tag" style={{ color: 'var(--color-pharmacy-text)' }}>
                FARMACII DE GARDĂ SIBIU
              </span>
              <div className="hotline-phone-number" style={{ color: 'var(--color-pharmacy-text)' }}>
                0269 211 333
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.35' }}>
                Colegiul Farmaciștilor Sibiu: Informații oficiale rotații nocturne.
              </p>
            </div>
            <a href="tel:0269211333" className="pill-btn pill-btn-outline" style={{ width: '100%', fontSize: '13px', padding: '10px' }}>
              📞 Info Gardă Farmacii
            </a>
          </div>

          {/* DSVSA Sibiu */}
          <div className="hotline-card-top">
            <div>
              <span className="hotline-badge-tag">
                DISPECERAT DSVSA SIBIU
              </span>
              <div className="hotline-phone-number">
                0269 223 069
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.35' }}>
                Direcția Sanitar-Veterinară: Supraveghere și alerte sanitare Sibiu.
              </p>
            </div>
            <a href="tel:0269223069" className="pill-btn pill-btn-outline" style={{ width: '100%', fontSize: '13px', padding: '10px' }}>
              📞 Sună Dispecerat
            </a>
          </div>
        </div>
      </div>

      {/* 2. Stat Highlight Cards */}
      <div className="hero-stat-row" style={{ marginBottom: '32px' }}>
        <div className="hero-stat-card">
          <span className="hero-stat-val">24/7</span>
          <span className="hero-stat-lbl">Spital veterinar și farmacii cu permanență nocturnă în Sibiu</span>
        </div>
        <div className="hero-stat-card">
          <span className="hero-stat-val">8</span>
          <span className="hero-stat-lbl">Confirmări comunitare necesare pentru auto-aprobarea orarului (D-001)</span>
        </div>
        <div className="hero-stat-card">
          <span className="hero-stat-val">4</span>
          <span className="hero-stat-lbl">Linii telefonice oficiale verificate în Județul Sibiu</span>
        </div>
      </div>

      {/* 3. Protocol Triaj: 6 Numbered Steps */}
      <div style={{ marginBottom: '16px' }}>
        <div className="originle-kicker">
          <span className="originle-kicker-dot" /> PROTOCOL DE TRIAJ NOCTURN
        </div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-extrabold)', margin: '4px 0 0 0' }}>
          Cum acționezi corect în caz de urgență
        </h2>
        <div className="originle-title-bar" style={{ margin: '8px 0 24px 0' }} />
      </div>

      <div className="steps-grid-3x2">
        <div className="step-card">
          <span className="step-card-num">01</span>
          <h3 className="step-card-title">Recunoaște urgența</h3>
          <p className="step-card-body">
            Identifică dacă problema necesită medicație farmaceutică de gardă sau intervenție chirurgicală/resuscitare medicală imediată.
          </p>
        </div>

        <div className="step-card">
          <span className="step-card-num">02</span>
          <h3 className="step-card-title">Verifică statusul live</h3>
          <p className="step-card-body">
            Consultă catalogul aplicației pentru a vedea ce farmacie este activă în gardă (indicator pulsant) și ce clinică veterinară are echipă de gardă.
          </p>
        </div>

        <div className="step-card">
          <span className="step-card-num">03</span>
          <h3 className="step-card-title">Sună înainte de plecare</h3>
          <p className="step-card-body">
            Folosește butonul de apel rapid direct din card pentru a confirma prezența farmacistului sau a medicului veterinar de gardă.
          </p>
        </div>

        <div className="step-card originle-card-inverted">
          <span className="step-card-num" style={{ color: 'var(--accent-coral-alert)' }}>04</span>
          <h3 className="step-card-title">Când apelezi 112</h3>
          <p className="step-card-body">
            Numărul unic național 112 este rezervat exclusiv urgențelor majore umane (accidente, hemoragii, stop cardiorespirator). Nu apelați 112 pentru verificat orarul farmaciilor.
          </p>
        </div>

        <div className="step-card">
          <span className="step-card-num">05</span>
          <h3 className="step-card-title">Pregătește documentele</h3>
          <p className="step-card-body">
            Ia cu tine actul de identitate, prescripția medicală sau carnetul de sănătate al animalului de companie pentru a scurta timpul de triaj.
          </p>
        </div>

        <div className="step-card">
          <span className="step-card-num">06</span>
          <h3 className="step-card-title">Traseu GPS rapid</h3>
          <p className="step-card-body">
            Lansează traseul pe hartă sau în Google Maps/Waze direct din aplicație spre cea mai apropiată unitate din Sibiu sau Mediaș pentru a evita rătăcirile nocturne.
          </p>
        </div>
      </div>
    </section>
  );
}
