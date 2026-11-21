import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const inMemoryCache = new Map();
let lastRequestTime = 0;

/**
 * Enforces a minimum 1000ms delay between consecutive Nominatim requests
 * in accordance with OpenStreetMap Nominatim Usage Policy.
 */
async function throttleNominatimRequest() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    const waitMs = 1000 - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastRequestTime = Date.now();
}

/**
 * Geocodes an address string using Nominatim with database caching (GeocodeCache)
 * and rate limiting (1 request per second).
 *
 * @param {string} address - Address to geocode (e.g. "Str. Nicolae Bălcescu 10, Sibiu")
 * @returns {Promise<{ latitude: number, longitude: number, fromCache: boolean }>}
 */
export async function geocodeAddress(address) {
  if (!address || typeof address !== 'string' || !address.trim()) {
    throw new Error('Adresa pentru geocodare este invalidă');
  }

  const query = address.trim();
  const cacheKey = query.toLowerCase();

  // 1. Check in-memory cache
  if (inMemoryCache.has(cacheKey)) {
    return { ...inMemoryCache.get(cacheKey), fromCache: true };
  }

  // 2. Check Prisma GeocodeCache table
  try {
    const cached = await prisma.geocodeCache.findUnique({
      where: { query: cacheKey }
    });
    if (cached) {
      const result = { latitude: cached.latitude, longitude: cached.longitude };
      inMemoryCache.set(cacheKey, result);
      return { ...result, fromCache: true };
    }
  } catch {
    // Database might be uninitialized in unit tests; fallback to memory/network
  }

  // 3. Throttle and query Nominatim
  await throttleNominatimRequest();

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    query.includes('Sibiu') ? query : `${query}, Județul Sibiu, Romania`
  )}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SibiuEmergencyGuide/1.0 (academic-project-p10)'
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim geocoding error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Coordonatele GPS nu au putut fi găsite pentru: "${query}"`);
  }

  const latitude = parseFloat(data[0].lat);
  const longitude = parseFloat(data[0].lon);
  const result = { latitude, longitude };

  inMemoryCache.set(cacheKey, result);

  // 4. Save to GeocodeCache table if available
  try {
    await prisma.geocodeCache.upsert({
      where: { query: cacheKey },
      update: { latitude, longitude },
      create: { query: cacheKey, latitude, longitude }
    });
  } catch {
    // Database save failure is non-fatal
  }

  return { ...result, fromCache: false };
}
