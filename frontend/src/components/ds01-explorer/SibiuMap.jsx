import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const SIBIU_CENTER = [45.7983, 24.1503]; // Piața Mare Sibiu

export function SibiuMap({
  facilities = [],
  selectedFacility = null,
  routeData = null,
  theme = 'light',
  onSelectFacility
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: SIBIU_CENTER,
      zoom: 14,
      zoomControl: false
    });

    // Standard OpenStreetMap tiles
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tiles;
    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer filter when Theme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const container = tileLayerRef.current.getContainer();
    if (container) {
      container.style.filter =
        theme === 'dark'
          ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)'
          : 'none';
      container.style.transition = 'filter 0.3s ease';
    }
  }, [theme]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // Center marker (Piața Mare Sibiu)
    const centerIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `
        <div style="background: var(--text-primary); color: var(--bg-surface); border-radius: 9999px; padding: 2px 8px; font-size: 11px; font-weight: 700; box-shadow: var(--shadow-card); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
          🎯 Piața Mare
        </div>
      `,
      iconSize: [80, 24],
      iconAnchor: [40, 12]
    });
    L.marker(SIBIU_CENTER, { icon: centerIcon }).addTo(markersLayer);

    // Facility Markers
    facilities.forEach((fac) => {
      const isSelected = selectedFacility && selectedFacility.id === fac.id;
      const isPharm = fac.type === 'PHARMACY';
      const isOnCall = fac.status?.isOnCall;
      const dotColor = isPharm ? 'var(--color-pharmacy)' : 'var(--color-vet)';

      const pinHtml = `
        <div style="
          background: ${isSelected ? 'var(--text-primary)' : 'var(--bg-surface)'};
          color: ${isSelected ? 'var(--bg-surface)' : 'var(--text-primary)'};
          border: 1px solid ${isSelected ? dotColor : 'var(--border-strong)'};
          border-radius: 9999px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: ${isSelected ? 'var(--shadow-floating)' : 'var(--shadow-card)'};
          display: flex;
          align-items: center;
          gap: 5px;
          width: max-content;
          white-space: nowrap;
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: all 150ms ease;
        ">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 9999px;
            background: ${dotColor};
            ${isOnCall ? 'animation: pulse-duty 2s infinite ease-in-out;' : ''}
          "></span>
          <span>${isPharm ? '💊' : '🐾'} ${fac.name.length > 18 ? fac.name.slice(0, 18) + '...' : fac.name}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: pinHtml,
        iconSize: null,
        iconAnchor: [60, 13]
      });

      const marker = L.marker([fac.latitude, fac.longitude], { icon: customIcon });

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`;
      const wazeUrl = `https://waze.com/ul?ll=${fac.latitude},${fac.longitude}&navigate=yes`;

      const popupHtml = `
        <div style="padding: 6px; font-family: var(--font-family-primary); max-width: 270px;">
          <div style="font-size: 10px; font-weight: 700; color: ${dotColor}; text-transform: uppercase;">
            ${isPharm ? '● FARMACIE UMANĂ' : '● VET URGENȚĂ'}
          </div>
          <div style="font-size: 13px; font-weight: 700; margin: 3px 0 2px 0;">${fac.name}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">
            ${fac.address} ${fac.distanceKm !== null ? `• 📏 ${fac.distanceKm} km` : ''}
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${fac.phone ? `<a href="tel:${fac.phone}" class="pill-btn pill-btn-primary" style="padding: 4px 10px; font-size: 11px; text-decoration: none;">📞 Sună</a>` : ''}
            <a href="${googleMapsUrl}" target="_blank" rel="noreferrer" class="pill-btn pill-btn-outline" style="padding: 4px 10px; font-size: 11px; text-decoration: none;">🗺️ Google Maps</a>
            <a href="${wazeUrl}" target="_blank" rel="noreferrer" class="pill-btn pill-btn-outline" style="padding: 4px 10px; font-size: 11px; text-decoration: none;">🚗 Waze</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectFacility) {
          onSelectFacility(fac);
        }
      });

      marker.addTo(markersLayer);
    });
  }, [facilities, selectedFacility, onSelectFacility]);

  // Update Route Polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;

    const routeLayer = routeLayerRef.current;
    routeLayer.clearLayers();

    if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
      const polyline = L.polyline(routeData.coordinates, {
        color: '#C25E34', // terracotta accent per DESIGN.md
        weight: 5,
        opacity: 0.85,
        dashArray: routeData.isFallback ? '6, 8' : undefined
      }).addTo(routeLayer);

      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else if (selectedFacility) {
      mapInstanceRef.current.setView([selectedFacility.latitude, selectedFacility.longitude], 15, {
        animate: true
      });
    }
  }, [routeData, selectedFacility]);

  const handleZoom = (delta) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
  };

  const handleCenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(SIBIU_CENTER, 14, { animate: true });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '480px' }}>
      {/* Map Tools */}
      <div className="map-toolbar" style={{ zIndex: 1000 }}>
        <button type="button" className="map-tool-btn" onClick={() => handleZoom(1)} title="Mărește">
          +
        </button>
        <button type="button" className="map-tool-btn" onClick={() => handleZoom(-1)} title="Micșorează">
          &minus;
        </button>
        <button type="button" className="map-tool-btn" onClick={handleCenter} title="Centrează Piața Mare">
          🎯
        </button>
      </div>

      {/* Route Info Banner (OSRM Street Routing with external Google Maps & Waze fallbacks) */}
      {routeData && selectedFacility && (
        <div className="osrm-route-banner">
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Traseu Auto către {selectedFacility.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {routeData.durationMin !== null ? (
                <span className="route-info-time">⏱️ cca. {routeData.durationMin} min</span>
              ) : null}
              {routeData.distanceKm !== null ? (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ({routeData.distanceKm} km pe străzi)
                </span>
              ) : null}
              {routeData.isFallback && (
                <span style={{ fontSize: '11px', color: 'var(--accent-coral-alert)' }}>
                  (distanță aeriană directă)
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.latitude},${selectedFacility.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="pill-btn pill-btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
              title="Deschide în Google Maps"
            >
              Google Maps ↗
            </a>
            <a
              href={`https://waze.com/ul?ll=${selectedFacility.latitude},${selectedFacility.longitude}&navigate=yes`}
              target="_blank"
              rel="noreferrer"
              className="pill-btn pill-btn-outline"
              style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
              title="Deschide în Waze"
            >
              Waze ↗
            </a>
          </div>
        </div>
      )}

      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '480px' }} />
    </div>
  );
}
