import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { AuthModal } from './components/common/AuthModal';
import { AuthWelcomeScreen } from './components/auth/AuthWelcomeScreen';
import { ExplorerView } from './components/ds01-explorer/ExplorerView';
import { FacilityDetailModal } from './components/ds02-details/FacilityDetailModal';
import { EmergencyGuideView } from './components/ds03-emergency/EmergencyGuideView';
import { FavoritesView } from './components/ds04-favorites/FavoritesView';
import { AdminPanel } from './components/ds05-admin/AdminPanel';
import { SesizariView } from './components/ds06-sesizari/SesizariView';
import { api } from './services/api';

function AppContent() {
  const { role, isModerator, hasEnteredApp, returnToWelcomeScreen } = useAuth();
  const navigate = useNavigate();

  // Theme: 'light' | 'dark'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [detailFacility, setDetailFacility] = useState(null);
  const [routeTargetFacility, setRouteTargetFacility] = useState(null);

  // Favorites state (local + remote)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('local_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [correctionsCount, setCorrectionsCount] = useState(2);
  const [moderationCount, setModerationCount] = useState(0);

  // Offline status state: reactive to network events & API fallback
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOfflineChange = useCallback((offline) => {
    setIsOffline(Boolean(offline) || (typeof navigator !== 'undefined' && !navigator.onLine));
  }, []);

  // Apply Theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync favorites & moderation count
  const syncRemoteData = useCallback(async () => {
    try {
      if (role !== 'ANON') {
        const favs = await api.getFavorites();
        setFavorites(favs);
        localStorage.setItem('local_favorites', JSON.stringify(favs));
      }
      if (isModerator) {
        const queue = await api.getModerationQueue();
        setModerationCount(queue.length);
        setCorrectionsCount(queue.length);
      }
    } catch {
      // Offline fallback
    }
  }, [role, isModerator]);

  useEffect(() => {
    syncRemoteData();
  }, [syncRemoteData]);

  const handleDrawRouteFromModal = (facility) => {
    setDetailFacility(null);
    setRouteTargetFacility(facility);
    navigate('/');
  };

  const handleOpenDetails = useCallback((facility) => {
    navigate(`/unitate/${facility.id}`);
  }, [navigate]);

  const handleClearRouteTarget = useCallback(() => {
    setRouteTargetFacility(null);
  }, []);

  const handleToggleFavorite = async (facilityId) => {
    const isAlready = favorites.some((f) => (f.facilityId || f.id) === facilityId);

    if (role === 'ANON') {
      let updated;
      if (isAlready) {
        updated = favorites.filter((f) => (f.facilityId || f.id) !== facilityId);
      } else {
        updated = [...favorites, { id: facilityId, facilityId, savedAt: new Date().toISOString() }];
      }
      setFavorites(updated);
      localStorage.setItem('local_favorites', JSON.stringify(updated));
      return;
    }

    try {
      const res = await api.toggleFavorite(facilityId);
      if (res.favorited) {
        syncRemoteData();
      } else {
        const updated = favorites.filter((f) => (f.facilityId || f.id) !== facilityId);
        setFavorites(updated);
        localStorage.setItem('local_favorites', JSON.stringify(updated));
      }
    } catch {
      // Fallback local toggle
      const updated = isAlready
        ? favorites.filter((f) => (f.facilityId || f.id) !== facilityId)
        : [...favorites, { id: facilityId, facilityId }];
      setFavorites(updated);
      localStorage.setItem('local_favorites', JSON.stringify(updated));
    }
  };

  if (!hasEnteredApp) {
    return <AuthWelcomeScreen theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header with React Router NavLinks */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onReturnToWelcome={() => {
          returnToWelcomeScreen();
          navigate('/');
        }}
        favoritesCount={favorites.length}
        moderationCount={moderationCount}
        correctionsCount={correctionsCount}
      />

      {/* Visible Full-width Offline Status Banner directly below Header */}
      {isOffline && (
        <div className="offline-status-banner" role="status" aria-live="polite">
          <div className="offline-status-banner-inner">
            <span className="offline-status-icon" aria-hidden="true">📡</span>
            <span>Mod offline — afișăm datele salvate local (Ghidul de Urgență și Favoritele rămân disponibile).</span>
          </div>
        </div>
      )}

      {/* Main Screen Content via React Router */}
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <ExplorerView
                theme={theme}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={handleOpenDetails}
                routeTargetFacility={routeTargetFacility}
                onClearRouteTarget={handleClearRouteTarget}
                onOfflineChange={handleOfflineChange}
              />
            }
          />
          <Route path="/explorer" element={<Navigate to="/" replace />} />
          <Route path="/urgenta" element={<EmergencyGuideView />} />
          <Route
            path="/sesizari"
            element={<SesizariView onOpenAuthModal={() => setIsAuthModalOpen(true)} />}
          />
          <Route
            path="/favorite"
            element={
              <FavoritesView
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={handleOpenDetails}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onDrawRoute={handleDrawRouteFromModal}
              />
            }
          />
          <Route
            path="/unitate/:id"
            element={
              <>
                <ExplorerView
                  theme={theme}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={handleOpenDetails}
                  routeTargetFacility={routeTargetFacility}
                  onClearRouteTarget={handleClearRouteTarget}
                  onOfflineChange={handleOfflineChange}
                />
                <FacilityRouteWrapper
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onDrawRoute={handleDrawRouteFromModal}
                />
              </>
            }
          />
          <Route
            path="/admin"
            element={<AdminPanel onOpenAuthModal={() => setIsAuthModalOpen(true)} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Facility Details Modal (DS-02 fallback when opened directly via state) */}
      {Boolean(detailFacility) && (
        <FacilityDetailModal
          facilityId={detailFacility?.id}
          isOpen={true}
          onClose={() => setDetailFacility(null)}
          isFavorited={favorites.some((f) => (f.facilityId || f.id) === detailFacility?.id)}
          onToggleFavorite={handleToggleFavorite}
          onDrawRoute={handleDrawRouteFromModal}
        />
      )}
    </div>
  );
}

function FacilityRouteWrapper({ favorites, onToggleFavorite, onDrawRoute }) {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <FacilityDetailModal
      facilityId={id}
      isOpen={true}
      onClose={() => navigate('/')}
      isFavorited={favorites.some((f) => (f.facilityId || f.id) === id)}
      onToggleFavorite={onToggleFavorite}
      onDrawRoute={onDrawRoute}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
