import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geocodeAddress } from '../src/geocode.js';
import { prisma } from '../src/server.js';

describe('Nominatim Geocoding & Cache (Test 8 Master Plan)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Geocodes new address and caches coordinates', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '45.7983', lon: '24.1503' }]
    });
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(prisma.geocodeCache, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.geocodeCache, 'upsert').mockResolvedValue({});

    const res1 = await geocodeAddress('Piața Mare Sibiu');
    expect(res1.latitude).toBeCloseTo(45.7983);
    expect(res1.longitude).toBeCloseTo(24.1503);
    expect(res1.fromCache).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // 2. Second lookup should hit in-memory / db cache without re-calling Nominatim
    const res2 = await geocodeAddress('Piața Mare Sibiu');
    expect(res2.latitude).toBeCloseTo(45.7983);
    expect(res2.longitude).toBeCloseTo(24.1503);
    expect(res2.fromCache).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Not called again!
  });

  it('3. Throws error for empty or blank address', async () => {
    await expect(geocodeAddress('')).rejects.toThrow('Adresa pentru geocodare este invalidă');
    await expect(geocodeAddress('   ')).rejects.toThrow('Adresa pentru geocodare este invalidă');
  });
});
