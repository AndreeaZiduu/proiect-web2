import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { FacilityCard } from './FacilityCard';
import { SibiuMap } from './SibiuMap';

const SIBIU_CENTER = { lat: 45.7983, lng: 24.1503 };

const QUICK_SERVICE_SUGGESTIONS = [
  { label: 'Parasinus', query: 'Parasinus', icon: '💊' },
  { label: 'Nurofen Forte', query: 'Nurofen Forte', icon: '💊' },
  { label: 'Ventolin', query: 'Ventolin', icon: '🫁' },
  { label: 'Bravecto (antiparazitar câini)', query: 'Bravecto (antiparazitar câini)', icon: '🐾' },
  { label: 'Vaccinare antigripală în farmacie', query: 'Vaccinare antigripală în farmacie', icon: '💉' },
  { label: 'Eliberare rețete compensate CAS', query: 'Eliberare rețete compensate CAS', icon: '📋' },
  { label: 'Urgențe veterinare 24/7', query: 'Urgențe veterinare 24/7', icon: '🏥' },
  { label: 'Ecografie veterinară', query: 'Ecografie veterinară', icon: '🩻' }
];

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
 * Returns facility services/medications matching the user's current search query.
 */
export function getMatchingServices(facility, query) {
  const normQ = normalizeSearchText(query);
  if (!normQ || normQ.length < 2 || !Array.isArray(facility?.services)) return [];
  const tokens = normQ.split(' ').filter(Boolean);
  if (tokens.length === 0) return [];

  return facility.services
    .map((s) => s.serviceName || s.name || s)
    .filter((name) => {
      const normService = normalizeSearchText(name);
      return (
        normService.includes(normQ) ||
        tokens.every((token) => normService.includes(token))
      );
    });
}

/**
 * Filters and ranks catalog services & medications for live autocomplete suggestions.
 */
export function getAutocompleteSuggestions(catalogItems, query, limit = 10) {
  const normQ = normalizeSearchText(query);
  if (!normQ || !Array.isArray(catalogItems)) return [];
  const tokens = normQ.split(' ').filter(Boolean);

  const scored = [];
  for (const item of catalogItems) {
    const normLabel = normalizeSearchText(item.label);
    const fullIdx = normLabel.indexOf(normQ);
    const allTokensMatch = tokens.every((t) => normLabel.includes(t));
    if (fullIdx === -1 && !allTokensMatch) continue;

    // Prioritize prefix matches, then earlier substring matches, then higher facility count
    const score =
      (normLabel.startsWith(normQ) ? 0 : fullIdx >= 0 ? 100 + fullIdx : 500) -
      Math.min(item.count || 0, 50) * 0.01;
    scored.push({ ...item, _score: score });
  }

  scored.sort((a, b) => a._score - b._score || a.label.localeCompare(b.label, 'ro'));
  return scored.slice(0, limit);
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const catalogItems = useMemo(() => {
    const map = new Map();
    for (const fac of allFacilities) {
      const isVet = fac.type === 'EMERGENCY_VET';
      for (const srv of fac.services || []) {
        const label = srv.serviceName || srv.name || srv;
        if (!label) continue;
        const entry = map.get(label) || { label, count: 0, hasPharm: false, hasVet: false };
        entry.count += 1;
        if (isVet) entry.hasVet = true;
        else entry.hasPharm = true;
        map.set(label, entry);
      }
    }
    return Array.from(map.values()).map((entry) => ({
      ...entry,
      icon: entry.hasVet && !entry.hasPharm ? '🐾' : '💊'
    }));
  }, [allFacilities]);

  const autocompleteSuggestions = useMemo(
    () => getAutocompleteSuggestions(catalogItems, searchQuery, 10),
    [catalogItems, searchQuery]
  );

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
        {/* Search capsule, City dropdown & Quick Service Suggestions */}
        <div className="search-capsule-container" ref={searchContainerRef}>
          <div className="search-city-capsule">
            <span aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder='Caută farmacie, cabinet, stradă, serviciu sau medicament (ex: "Parasinus", "Bravecto", "Vaccinare antigripală")...'
              value={searchQuery}
              aria-label="Căutare unități, servicii și medicamente"
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                const nextVal = e.target.value;
                setSearchQuery(nextVal);
                setIsSearchFocused(true);
                if (!nextVal) {
                  updateUrlParams({ q: '' });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateUrlParams({ q: searchQuery });
                  setIsSearchFocused(false);
                } else if (e.key === 'Escape') {
                  setIsSearchFocused(false);
                }
              }}
              onBlur={() => updateUrlParams({ q: searchQuery })}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                title="Șterge căutarea"
                aria-label="Șterge căutarea"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSearchQuery('');
                  updateUrlParams({ q: '' });
                }}
              >
                ✕
              </button>
            )}
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

          {isSearchFocused && (
            <div
              className="search-suggestions-dropdown"
              role="region"
              aria-label="Sugestii servicii și medicamente"
            >
              {searchQuery.trim() ? (
                <>
                  <div className="search-suggestions-header">
                    <span className="originle-kicker" style={{ margin: 0, fontSize: '10px' }}>
                      ● SUGESTII MEDICAMENTE & SERVICII
                    </span>
                    <span className="search-suggestions-hint">
                      {autocompleteSuggestions.length > 0
                        ? `${autocompleteSuggestions.length} potriviri în catalog`
                        : 'Filtrare după nume, stradă sau serviciu'}
                    </span>
                  </div>
                  {autocompleteSuggestions.length > 0 ? (
                    <div className="search-suggestions-chips">
                      {autocompleteSuggestions.map((item) => {
                        const isActive =
                          normalizeSearchText(searchQuery) === normalizeSearchText(item.label);
                        return (
                          <button
                            key={item.label}
                            type="button"
                            className={`service-suggestion-chip ${isActive ? 'active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSearchQuery(item.label);
                              updateUrlParams({ q: item.label });
                              setIsSearchFocused(false);
                            }}
                          >
                            <span aria-hidden="true">{item.icon}</span>
                            <span>{item.label}</span>
                            <span className="suggestion-count-badge">({item.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="search-suggestions-hint" style={{ padding: '4px 0' }}>
                      Nicio etichetă exactă de medicament/serviciu — se caută și în numele sau adresa unităților.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="search-suggestions-header">
                    <span className="originle-kicker" style={{ margin: 0, fontSize: '10px' }}>
                      ● CĂUTARE RAPIDĂ SERVICII & MEDICAMENTE
                    </span>
                    <span className="search-suggestions-hint">Click pentru filtrare instantanee</span>
                  </div>
                  <div className="search-suggestions-chips">
                    {QUICK_SERVICE_SUGGESTIONS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="service-suggestion-chip"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSearchQuery(item.query);
                          updateUrlParams({ q: item.query });
                          setIsSearchFocused(false);
                        }}
                      >
                        <span aria-hidden="true">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
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
                  searchQuery={searchQuery}
                  matchedServices={getMatchingServices(fac, searchQuery)}
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
