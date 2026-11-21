import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Facilities & Status (C-001, C-002)
  async getFacilities(params = {}) {
    const res = await client.get('/facilities', { params });
    return res.data;
  },

  async getFacility(id, at) {
    const res = await client.get(`/facilities/${id}`, { params: at ? { at } : {} });
    return res.data;
  },

  // Auth & Roles (D-003)
  async login(email, password) {
    const res = await client.post('/auth/login', { email, password });
    return res.data;
  },

  async register(email, password, name) {
    const res = await client.post('/auth/register', { email, password, name });
    return res.data;
  },

  // Favorites (DS-04)
  async getFavorites() {
    const res = await client.get('/favorites');
    return res.data;
  },

  async toggleFavorite(facilityId) {
    const res = await client.post(`/favorites/${facilityId}`);
    return res.data;
  },

  // Community Corrections (C-003, D-001)
  async submitCorrection(data) {
    const res = await client.post('/corrections', data);
    return res.data;
  },

  async confirmCorrection(id) {
    const res = await client.post(`/corrections/${id}/confirm`);
    return res.data;
  },

  // Moderation (MODERATOR & ADMIN)
  async getModerationQueue() {
    const res = await client.get('/moderation/corrections');
    return res.data;
  },

  async reviewCorrection(id, decision) {
    const res = await client.patch(`/moderation/corrections/${id}`, { decision });
    return res.data;
  },

  // Admin Facility Management (ADMIN Only)
  async createFacility(data) {
    const res = await client.post('/admin/facilities', data);
    return res.data;
  },

  async updateFacility(id, data) {
    const res = await client.put(`/admin/facilities/${id}`, data);
    return res.data;
  },

  async deleteFacility(id) {
    const res = await client.delete(`/admin/facilities/${id}`);
    return res.data;
  },

  // CSV Import (C-004, ADMIN Only)
  async importRotations(csvData) {
    const res = await client.post('/rotations/import', { csvData });
    return res.data;
  },

  // OSRM Driving Routing (Q-006)
  async getOsrmRoute(from, to) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM routing unavailable');
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return null;

      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationMin = Math.round(route.duration / 60);

      return {
        coordinates: coords,
        distanceKm,
        durationMin
      };
    } catch (err) {
      console.warn('OSRM route fetch failed, fallback to straight line:', err.message);
      return {
        coordinates: [[from.lat, from.lng], [to.lat, to.lng]],
        distanceKm: null,
        durationMin: null,
        isFallback: true
      };
    }
  }
};
