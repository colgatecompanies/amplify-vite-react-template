export interface ZipCoords {
  lat: number;
  lng: number;
  city: string;
  state: string; // two-letter abbreviation, e.g. "ND"
}

interface ZippopotamPlace {
  'place name': string;
  longitude: string;
  latitude: string;
  state: string;
  'state abbreviation': string;
}

interface ZippopotamResponse {
  'post code': string;
  country: string;
  places: ZippopotamPlace[];
}

// Cache key prefix — bump when the stored shape changes so old entries are ignored
const STORAGE_PREFIX = 'zipcoords2_';

const memCache = new Map<string, ZipCoords | null>();

/**
 * Looks up the centroid coordinates, city, and state for a US zip code.
 * Results are cached in memory and localStorage to avoid repeated API calls.
 * Returns null if the zip code is invalid or not found.
 */
export async function getZipCoords(zip: string): Promise<ZipCoords | null> {
  if (!zip || !/^\d{5}$/.test(zip)) {
    return null;
  }

  if (memCache.has(zip)) {
    return memCache.get(zip) ?? null;
  }

  const storageKey = `${STORAGE_PREFIX}${zip}`;
  const cached = localStorage.getItem(storageKey);
  if (cached !== null) {
    const coords = cached === 'null' ? null : (JSON.parse(cached) as ZipCoords);
    memCache.set(zip, coords);
    return coords;
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!response.ok) {
      memCache.set(zip, null);
      localStorage.setItem(storageKey, 'null');
      return null;
    }
    const data: ZippopotamResponse = await response.json();
    const place = data.places?.[0];
    if (!place) {
      memCache.set(zip, null);
      localStorage.setItem(storageKey, 'null');
      return null;
    }
    const coords: ZipCoords = {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      city: place['place name'],
      state: place['state abbreviation'],
    };
    memCache.set(zip, coords);
    localStorage.setItem(storageKey, JSON.stringify(coords));
    return coords;
  } catch {
    memCache.set(zip, null);
    return null;
  }
}

/**
 * Calculates the as-the-crow-flies distance in miles between two lat/lng points
 * using the Haversine formula.
 */
export function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
