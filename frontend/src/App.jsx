import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { AuthModal } from './components/common/AuthModal';
import { DemoDrawer } from './components/common/DemoDrawer';
import { ExplorerView } from './components/ds01-explorer/ExplorerView';
import { FacilityDetailModal } from './components/ds02-details/FacilityDetailModal';
import { EmergencyGuideView } from './components/ds03-emergency/EmergencyGuideView';
import { FavoritesView } from './components/ds04-favorites/FavoritesView';
import { AdminPanel } from './components/ds05-admin/AdminPanel';
import { SesizariView } from './components/ds06-sesizari/SesizariView';
import { api } from './services/api';

function AppContent() {
  const { role, isModerator } = useAuth();
  const navigate = useNavigate();

  // Theme: 'light' | 'dark'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // State Preview Mode for Demo & Test inspection: 'normal' | 'loading' | 'empty' | 'error'
  const [previewState, setPreviewState] = useState('normal');

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);
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

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
        .catch((err) => console.warn('Service Worker registration failed:', err));
    }
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header with React Router NavLinks */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenDemoDrawer={() => setIsDemoDrawerOpen(true)}
        favoritesCount={favorites.length}
        moderationCount={moderationCount}
        correctionsCount={correctionsCount}
      />

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
                onOpenDetails={(fac) => setDetailFacility(fac)}
                previewState={previewState}
                routeTargetFacility={routeTargetFacility}
                onClearRouteTarget={() => setRouteTargetFacility(null)}
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
                onOpenDetails={(fac) => setDetailFacility(fac)}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onDrawRoute={handleDrawRouteFromModal}
              />
            }
          />
          <Route
            path="/unitate/:id"
            element={
              <FacilityRouteWrapper
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onDrawRoute={handleDrawRouteFromModal}
              />
            }
          />
          <Route
            path="/admin"
            element={<AdminPanel onOpenAuthModal={() => setIsAuthModalOpen(true)} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating Demo FAB Button */}
      <button
        type="button"
        className="demo-fab"
        onClick={() => setIsDemoDrawerOpen(true)}
        title="Deschide panoul de testare și inspecție rapidă a rolurilor"
      >
        <span>⚙️ Testează Rolurile</span>
      </button>

      {/* Demo Drawer */}
      <DemoDrawer
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
        previewState={previewState}
        onSetPreviewState={setPreviewState}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Facility Details Modal (DS-02) */}
      <FacilityDetailModal
        facilityId={detailFacility?.id}
        isOpen={Boolean(detailFacility)}
        onClose={() => setDetailFacility(null)}
        isFavorited={favorites.some((f) => (f.facilityId || f.id) === detailFacility?.id)}
        onToggleFavorite={handleToggleFavorite}
        onDrawRoute={handleDrawRouteFromModal}
      />
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
