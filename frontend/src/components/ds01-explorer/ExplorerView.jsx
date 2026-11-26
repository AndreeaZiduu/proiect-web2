import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { FacilityCard } from './FacilityCard';
import { SibiuMap } from './SibiuMap';

const SIBIU_CENTER = { lat: 45.7983, lng: 24.1503 };

/**
 * Normalizes Romanian search queries and facility strings:
 * - converts to lowercase
 * - strips Romanian diacritics (ă, â, î, ș/ş, ț/ţ)
 * - replaces punctuation (. - _ / , etc.) with spaces
 * - normalizes multiple whitespace
 */
export function normalizeSearchText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[.\-_,/()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a facility matches a normalized query across name, address, city, and services
 */
function matchesFacilityQuery(facility, normalizedQuery) {
  if (!normalizedQuery) return true;

  const rawText = `${facility.name || ''} ${facility.address || ''} ${facility.city || ''} ${
    Array.isArray(facility.services)
      ? facility.services.map((s) => s.serviceName || s.name || s).join(' ')
      : ''
  }`;
  const target = normalizeSearchText(rawText);
  const targetNoSpaces = target.replace(/\s+/g, '');
  const queryNoSpaces = normalizedQuery.replace(/\s+/g, '');

  if (target.includes(normalizedQuery) || targetNoSpaces.includes(queryNoSpaces)) {
    return true;
  }

  // Token-based matching (e.g. "dr max" matches when "dr" and "max" are both present)
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  return tokens.every((token) => target.includes(token));
}

export function isFacilityOnDuty(facility) {
  if (!facility) return false;
  const status = facility.status;
  if (typeof status === 'string') {
    return status === 'ON_DUTY' || status === 'ON_CALL';
  }
  if (
    status?.isOnCall ||
    status?.isOnDuty ||
    status?.code === 'ON_DUTY' ||
    status?.source === 'ON_CALL_ROTATION' ||
    status?.label === 'Deschis Non-Stop' ||
    facility.isOnDuty ||
    facility.onDuty ||
    facility.isOnCall
  ) {
    return true;
  }
  return Boolean(
    status?.isOpen &&
      Array.isArray(facility.regularSchedules) &&
      facility.regularSchedules.some((s) => s.openMinute === 0 && s.closeMinute === 1440)
  );
}

export function ExplorerView({
  theme,
  favorites = [],
  onToggleFavorite,
  onOpenDetails,
  routeTargetFacility = null,
  onClearRouteTarget,
  onOfflineChange
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse incoming navigation parameters / query params (e.g. from DS-03 Emergency Guide)
  const parseFiltersFromUrl = useCallback((params) => {
    // 1. Category: PHARMACY, VET (or EMERGENCY_VET), or ALL
    const cat = (params.get('category') || params.get('type') || '').toUpperCase();
    let domain = 'all';
    if (cat === 'PHARMACY' || cat === 'FARMACII') {
      domain = 'PHARMACY';
    } else if (cat === 'VET' || cat === 'EMERGENCY_VET') {
      domain = 'EMERGENCY_VET';
    }

    // 2. Open Now: openNow=true or filter=open
    const openParam = params.get('openNow') || params.get('open');
    const filterParam = params.get('filter');
    const isOpen = openParam === 'true' || filterParam === 'open';

    // 3. On Duty: onDuty=true, onCall=true or filter=duty
    const dutyParam = params.get('onDuty') || params.get('onCall') || params.get('duty');
    const isOnDuty = dutyParam === 'true' || filterParam === 'duty';

    // 4. City: city=ALL or specific city name
    const cityParam = params.get('city');
    const city = (cityParam && cityParam.toUpperCase() !== 'ALL') ? cityParam : 'all';

    // 5. Search query: q
    const q = params.get('q') || '';

    return {
      domain,
      openNow: isOpen,
      onCall: isOnDuty,
      city,
      searchQuery: q
    };
  }, []);

  const [allFacilities, setAllFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize filters state from URL on mount
  const initialFilters = useMemo(() => parseFiltersFromUrl(searchParams), [parseFiltersFromUrl, searchParams]);

  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [selectedCity, setSelectedCity] = useState(initialFilters.city);
  const [selectedDomain, setSelectedDomain] = useState(initialFilters.domain);
  const [filterOpenNow, setFilterOpenNow] = useState(initialFilters.openNow);
  const [filterOnCall, setFilterOnCall] = useState(initialFilters.onCall);

  // Sync state when URL search params change (e.g. navigation from DS-03 emergency buttons or browser history)
  useEffect(() => {
    const updated = parseFiltersFromUrl(searchParams);
    setSelectedDomain(updated.domain);
    setFilterOpenNow(updated.openNow);
    setFilterOnCall(updated.onCall);
    setSelectedCity(updated.city);
    if (searchParams.has('q')) {
      setSearchQuery(updated.searchQuery);
    }
  }, [searchParams, parseFiltersFromUrl]);

  // Synchronize user filter interactions into URL search params
  const updateUrlParams = useCallback((overrides = {}) => {
    const domain = overrides.domain !== undefined ? overrides.domain : selectedDomain;
    const openNow = overrides.openNow !== undefined ? overrides.openNow : filterOpenNow;
    const onCall = overrides.onCall !== undefined ? overrides.onCall : filterOnCall;
    const city = overrides.city !== undefined ? overrides.city : selectedCity;
    const q = overrides.q !== undefined ? overrides.q : searchQuery;

    const next = {};
    if (domain === 'PHARMACY') next.category = 'PHARMACY';
    else if (domain === 'EMERGENCY_VET') next.category = 'VET';

    if (openNow) next.openNow = 'true';
    if (onCall) next.onDuty = 'true';

    if (city && city !== 'all') next.city = city;
    if (q && q.trim()) next.q = q.trim();

    setSearchParams(next, { replace: true });
  }, [selectedDomain, filterOpenNow, filterOnCall, selectedCity, searchQuery, setSearchParams]);

  // Selected facility and routing
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const cardRefs = useRef({});

  // Mobile layout switch (List vs Map)
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map'

  useEffect(() => {
    const handleOnline = () => {
      if (onOfflineChange) onOfflineChange(false);
    };
    const handleOffline = () => {
      if (onOfflineChange) onOfflineChange(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOfflineChange]);

  // Fetch full facility dataset from backend with Haversine distances
  const fetchFacilities = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await api.getFacilities({
        lat: SIBIU_CENTER.lat,
        lng: SIBIU_CENTER.lng
      });
      if (data.isOffline) {
        if (onOfflineChange) onOfflineChange(true);
      } else {
        if (onOfflineChange) onOfflineChange(false);
      }
      const rawList = data.facilities || [];
      // Sort by Haversine distance ascending from Piața Mare (D-005)
      const sorted = [...rawList].sort((a, b) => {
        const distA = a.distanceKm !== null && a.distanceKm !== undefined ? a.distanceKm : 9999;
        const distB = b.distanceKm !== null && b.distanceKm !== undefined ? b.distanceKm : 9999;
        return distA - distB;
      });
      setAllFacilities(sorted);
    } catch (err) {
      setError(err.message || 'Eroare la preluarea catalogului');
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (onOfflineChange) onOfflineChange(true);
      }
    } finally {
      setLoading(false);
    }
  }, [onOfflineChange]);

  useEffect(() => {
    fetchFacilities(false);
    // Auto re-evaluate every 60 seconds silently in the background without UI skeleton flickering
    const interval = setInterval(() => fetchFacilities(true), 60000);
    return () => clearInterval(interval);
  }, [fetchFacilities]);

  // 1. Filter all facilities ONLY by city and search query
  const filteredBySearchAndCity = useMemo(() => {
    const normQ = normalizeSearchText(searchQuery);
    return allFacilities.filter((fac) => {
      // City filter
      if (selectedCity && selectedCity !== 'all' && fac.city !== selectedCity) {
        return false;
      }
      // Search filter with normalization
      if (normQ && !matchesFacilityQuery(fac, normQ)) {
        return false;
      }
      return true;
    });
  }, [allFacilities, selectedCity, searchQuery]);

  // 2. Requirement 1: Category counts computed from dataset filtered ONLY by city/search, NEVER by the active category tab!
  const counts = useMemo(() => {
    const total = filteredBySearchAndCity.length;
    const pharm = filteredBySearchAndCity.filter((f) => f.type === 'PHARMACY').length;
    const vet = filteredBySearchAndCity.filter((f) => f.type === 'EMERGENCY_VET').length;
    const open = filteredBySearchAndCity.filter((f) => f.status?.isOpen || isFacilityOnDuty(f)).length;
    const duty = filteredBySearchAndCity.filter((f) => isFacilityOnDuty(f)).length;
    return { total, pharm, vet, open, duty };
  }, [filteredBySearchAndCity]);

  // 3. Displayed facilities: apply category pill and status pills on top of filteredBySearchAndCity
  const displayedFacilities = useMemo(() => {
    return filteredBySearchAndCity.filter((fac) => {
      // Category pill filter: 'all', 'PHARMACY', 'EMERGENCY_VET'
      if (selectedDomain === 'PHARMACY' && fac.type !== 'PHARMACY') {
        return false;
      }
      if (selectedDomain === 'EMERGENCY_VET' && fac.type !== 'EMERGENCY_VET') {
        return false;
      }

      // Status filters
      if (filterOpenNow && !fac.status?.isOpen && !isFacilityOnDuty(fac)) {
        return false;
      }
      if (filterOnCall && !isFacilityOnDuty(fac)) {
        return false;
      }

      return true;
    });
  }, [filteredBySearchAndCity, selectedDomain, filterOpenNow, filterOnCall]);

  // Ensure selectedFacility updates when displayed facilities change so stale filtered-out facilities are not retained
  useEffect(() => {
    setSelectedFacility((prev) => {
      if (prev && displayedFacilities.some((f) => f.id === prev.id)) {
        return displayedFacilities.find((f) => f.id === prev.id) || prev;
      }
      return displayedFacilities[0] || null;
    });
  }, [displayedFacilities]);

  // Handle OSRM route calculation
  const handleDrawRoute = async (facility) => {
    setSelectedFacility(facility);
    setMobileView('map');
    const startPoint = SIBIU_CENTER;
    const endPoint = { lat: facility.latitude, lng: facility.longitude };
    const route = await api.getOsrmRoute(startPoint, endPoint);
    setRouteData(route);
  };

  // Trigger route drawing if requested externally (e.g. from FacilityDetailModal or Favorites)
  useEffect(() => {
    if (routeTargetFacility) {
      handleDrawRoute(routeTargetFacility);
      if (onClearRouteTarget) {
        onClearRouteTarget();
      }
    }
  }, [routeTargetFacility, onClearRouteTarget]);

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

  const handleSelectDomain = (domain) => {
    setSelectedDomain(domain);
    updateUrlParams({ domain });
  };

  const handleToggleOpenNow = () => {
    const next = !filterOpenNow;
    setFilterOpenNow(next);
    updateUrlParams({ openNow: next });
  };

  const handleToggleOnCall = () => {
    const next = !filterOnCall;
    setFilterOnCall(next);
    updateUrlParams({ onCall: next });
  };

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    updateUrlParams({ city });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedDomain('all');
    setFilterOpenNow(false);
    setFilterOnCall(false);
    setSearchParams({}, { replace: true });
  };

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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateUrlParams({ q: searchQuery });
              }
            }}
            onBlur={() => updateUrlParams({ q: searchQuery })}
          />
          <select
            className="city-dropdown-select"
            value={selectedCity}
            onChange={(e) => handleSelectCity(e.target.value)}
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
            onClick={() => handleSelectDomain('all')}
          >
            Toate ({counts.total})
          </button>
          <button
            className={`filter-chip ${selectedDomain === 'PHARMACY' ? 'active' : ''}`}
            onClick={() => handleSelectDomain(selectedDomain === 'PHARMACY' ? 'all' : 'PHARMACY')}
          >
            💊 Farmacii ({counts.pharm})
          </button>
          <button
            className={`filter-chip ${selectedDomain === 'EMERGENCY_VET' ? 'active' : ''}`}
            onClick={() => handleSelectDomain(selectedDomain === 'EMERGENCY_VET' ? 'all' : 'EMERGENCY_VET')}
          >
            🐾 Vet ({counts.vet})
          </button>
          <button
            className={`filter-chip ${filterOpenNow ? 'active' : ''}`}
            onClick={handleToggleOpenNow}
          >
            <span className="status-dot-core" style={{ background: 'var(--status-open-dot)' }} />
            Deschis Acum
          </button>
          <button
            className={`filter-chip ${filterOnCall ? 'active-duty' : ''}`}
            onClick={handleToggleOnCall}
          >
            <span className="status-dot-core pulse-dot" style={{ background: 'var(--status-duty-dot)' }} />
            De Gardă ({counts.duty})
          </button>
        </div>
      </div>

      {/* Mobile Toggle Switch (Visible only on <1024px screens) */}
      <div className="mobile-view-toggle">
        <button
          className={`mobile-toggle-btn ${mobileView === 'list' ? 'active' : ''}`}
          onClick={() => setMobileView('list')}
        >
          📋 Listă Unități ({displayedFacilities.length})
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
              ● CATALOG DISPONIBILITATE ({displayedFacilities.length} UNITĂȚI)
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              Sortat după distanță
            </span>
          </div>

          {/* Loading Skeleton */}
          {loading && allFacilities.length === 0 && (
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
          {!loading && !error && displayedFacilities.length === 0 && (
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
                onClick={handleResetFilters}
              >
                Resetează filtrele
              </button>
            </div>
          )}

          {/* Error State */}
          {error && (
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
                onClick={() => fetchFacilities(false)}
              >
                Reîncearcă conexiunea
              </button>
            </div>
          )}

          {/* Real Facilities List */}
          {(!loading || displayedFacilities.length > 0) && !error && displayedFacilities.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {displayedFacilities.map((fac) => (
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
            facilities={displayedFacilities}
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
