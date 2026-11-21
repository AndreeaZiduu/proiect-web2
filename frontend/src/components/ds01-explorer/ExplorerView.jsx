import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../services/api';
import { FacilityCard } from './FacilityCard';
import { SibiuMap } from './SibiuMap';

const SIBIU_CENTER = { lat: 45.7983, lng: 24.1503 };

export function ExplorerView({
  theme,
  favorites = [],
  onToggleFavorite,
  onOpenDetails,
  previewState = 'normal'
}) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all'); // 'all', 'PHARMACY', 'EMERGENCY_VET'
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterOnCall, setFilterOnCall] = useState(false);

  // Selected facility and routing
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const cardRefs = useRef({});

  // Mobile layout switch (List vs Map)
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map'

  // Fetch facilities from backend
  const fetchFacilities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFacilities({
        q: searchQuery || undefined,
        city: selectedCity !== 'all' ? selectedCity : undefined,
        type: selectedDomain !== 'all' ? selectedDomain : undefined,
        openNow: filterOpenNow ? 'true' : undefined,
        onCall: filterOnCall ? 'true' : undefined,
        lat: SIBIU_CENTER.lat,
        lng: SIBIU_CENTER.lng
      });
      const rawList = data.facilities || [];
      // Sort by Haversine distance ascending from Piața Mare (D-005)
      const sorted = [...rawList].sort((a, b) => {
        const distA = a.distanceKm !== null && a.distanceKm !== undefined ? a.distanceKm : 9999;
        const distB = b.distanceKm !== null && b.distanceKm !== undefined ? b.distanceKm : 9999;
        return distA - distB;
      });
      setFacilities(sorted);
      if (!selectedFacility && sorted.length > 0) {
        setSelectedFacility(sorted[0]);
      }
    } catch (err) {
      setError(err.message || 'Eroare la preluarea catalogului');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
    // Auto re-evaluate every 60 seconds
    const interval = setInterval(fetchFacilities, 60000);
    return () => clearInterval(interval);
  }, [searchQuery, selectedCity, selectedDomain, filterOpenNow, filterOnCall]);

  // Handle OSRM route calculation
  const handleDrawRoute = async (facility) => {
    setSelectedFacility(facility);
    setMobileView('map');
    const startPoint = SIBIU_CENTER;
    const endPoint = { lat: facility.latitude, lng: facility.longitude };
    const route = await api.getOsrmRoute(startPoint, endPoint);
    setRouteData(route);
  };

  // Handle facility selection from map pin click with smooth scroll to matching card
  const handleSelectFacilityFromMap = (facility) => {
    setSelectedFacility(facility);
    requestAnimationFrame(() => {
      const cardEl = cardRefs.current[facility.id];
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  // Domain counts
  const counts = useMemo(() => {
    const total = facilities.length;
    const pharm = facilities.filter((f) => f.type === 'PHARMACY').length;
    const vet = facilities.filter((f) => f.type === 'EMERGENCY_VET').length;
    const open = facilities.filter((f) => f.status?.isOpen).length;
    const duty = facilities.filter((f) => f.status?.isOnCall).length;
    return { total, pharm, vet, open, duty };
  }, [facilities]);

  const isFavorited = (id) => favorites.some((f) => (f.facilityId || f.id) === id);

  return (
    <section className="screen-pane active-screen" id="paneDs01">
      {/* 1. Explorer Filters Bar */}
      <div className="explorer-filters-row">
        {/* Search capsule & City dropdown */}
        <div className="search-city-capsule">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Caută după nume, stradă sau serviciu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="city-dropdown-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="all">Tot Județul Sibiu</option>
            <option value="Sibiu">Sibiu</option>
            <option value="Mediaș">Mediaș</option>
            <option value="Cisnădie">Cisnădie</option>
            <option value="Șelimbăr">Șelimbăr</option>
            <option value="Avrig">Avrig</option>
          </select>
        </div>

        {/* Filter Chips */}
        <div className="chips-group">
          <button
            className={`filter-chip ${selectedDomain === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDomain('all')}
          >
            Toate ({counts.total})
          </button>
          <button
            className={`filter-chip ${selectedDomain === 'PHARMACY' ? 'active' : ''}`}
            onClick={() => setSelectedDomain(selectedDomain === 'PHARMACY' ? 'all' : 'PHARMACY')}
          >
            💊 Farmacii ({counts.pharm})
          </button>
          <button
            className={`filter-chip ${selectedDomain === 'EMERGENCY_VET' ? 'active' : ''}`}
            onClick={() => setSelectedDomain(selectedDomain === 'EMERGENCY_VET' ? 'all' : 'EMERGENCY_VET')}
          >
            🐾 Vet ({counts.vet})
          </button>
          <button
            className={`filter-chip ${filterOpenNow ? 'active' : ''}`}
            onClick={() => setFilterOpenNow(!filterOpenNow)}
          >
            <span className="status-dot-core" style={{ background: 'var(--status-open-dot)' }} />
            Deschis Acum
          </button>
          <button
            className={`filter-chip ${filterOnCall ? 'active-duty' : ''}`}
            onClick={() => setFilterOnCall(!filterOnCall)}
          >
            <span className="status-dot-core pulse-dot" style={{ background: 'var(--status-duty-dot)' }} />
            De Gardă
          </button>
        </div>
      </div>

      {/* Mobile Toggle Switch (Visible only on <1024px screens) */}
      <div className="mobile-view-toggle">
        <button
          className={`mobile-toggle-btn ${mobileView === 'list' ? 'active' : ''}`}
          onClick={() => setMobileView('list')}
        >
          📋 Listă Unități ({facilities.length})
        </button>
        <button
          className={`mobile-toggle-btn ${mobileView === 'map' ? 'active' : ''}`}
          onClick={() => setMobileView('map')}
        >
          🗺️ Hartă Interactivă
        </button>
      </div>

      {/* 2. Main Explorer Grid (Split-screen 40% list / 60% map) */}
      <div className="explorer-grid">
        {/* Left: Scrollable Cards Pane */}
        <div className={`cards-scroll-pane ${mobileView === 'map' ? 'mobile-hidden' : ''}`}>
          {/* Header row in list */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span className="originle-kicker">
              ● CATALOG DISPONIBILITATE ({facilities.length} UNITĂȚI)
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              Sortat după distanță
            </span>
          </div>

          {/* Loading Skeleton */}
          {(loading || previewState === 'loading') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="originle-card" style={{ padding: '20px' }}>
                  <div className="skeleton-bar" style={{ width: '40%', height: '14px', marginBottom: '10px' }} />
                  <div className="skeleton-bar" style={{ width: '70%', height: '20px', marginBottom: '8px' }} />
                  <div className="skeleton-bar" style={{ width: '50%', height: '14px', marginBottom: '14px' }} />
                  <div className="skeleton-bar" style={{ width: '100%', height: '36px', borderRadius: '9999px' }} />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && previewState !== 'loading' && (facilities.length === 0 || previewState === 'empty') && (
            <div className="originle-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
                Nicio unitate găsită
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: '8px auto 20px auto', maxWidth: '320px' }}>
                Nu există unități care să corespundă filtrelor alese în Județul Sibiu.
              </p>
              <button
                type="button"
                className="pill-btn pill-btn-primary"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('all');
                  setSelectedDomain('all');
                  setFilterOpenNow(false);
                  setFilterOnCall(false);
                }}
              >
                Resetează filtrele
              </button>
            </div>
          )}

          {/* Error State */}
          {(error || previewState === 'error') && (
            <div className="error-alert-banner">
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚠️</div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
                Eroare conectare Catalog Sibiu
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', margin: '6px 0 16px 0' }}>
                {error || 'Nu s-au putut prelua datele în timp real (503 Service Unavailable).'}
              </p>
              <button
                type="button"
                className="pill-btn pill-btn-emergency"
                onClick={fetchFacilities}
              >
                Reîncearcă conexiunea
              </button>
            </div>
          )}

          {/* Real Facilities List */}
          {!loading && previewState === 'normal' && facilities.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {facilities.map((fac) => (
                <FacilityCard
                  key={fac.id}
                  ref={(el) => {
                    if (el) {
                      cardRefs.current[fac.id] = el;
                    } else {
                      delete cardRefs.current[fac.id];
                    }
                  }}
                  facility={fac}
                  isSelected={selectedFacility?.id === fac.id}
                  isFavorited={isFavorited(fac.id)}
                  onSelect={(f) => {
                    setSelectedFacility(f);
                  }}
                  onToggleFavorite={onToggleFavorite}
                  onOpenDetails={onOpenDetails}
                  onDrawRoute={handleDrawRoute}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Interactive Map Pane */}
        <div className={`map-container-pane ${mobileView === 'map' ? 'mobile-visible' : ''}`}>
          <SibiuMap
            facilities={facilities}
            selectedFacility={selectedFacility}
            routeData={routeData}
            theme={theme}
            onSelectFacility={handleSelectFacilityFromMap}
          />
        </div>
      </div>
    </section>
  );
}
