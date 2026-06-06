import { Injectable, Logger } from '@nestjs/common';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Géocodage mondial via Nominatim (OpenStreetMap) — gratuit, sans clé.
 * Utilisation raisonnable : 1 requête/seconde respectée (délai + cache).
 *
 * Tolérant aux pannes : renvoie null si la ville est introuvable ou si
 * le service est indisponible, sans jamais faire échouer l'appelant.
 *
 * Couvre Montréal, Laval, Longueuil, Brossard, etc. — partout dans le monde.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';
  private lastCall = 0;

  async geocodeCity(city?: string | null, country?: string | null): Promise<GeoPoint | null> {
    const q = city?.trim();
    if (!q) return null;

    return this.geocode(`${q}${country ? `, ${country.trim()}` : ''}`);
  }

  async geocode(query: string): Promise<GeoPoint | null> {
    const q = query.trim();
    if (!q) return null;

    try {
      // Rate-limit : 1 requête/seconde (bon citoyen Nominatim)
      const now = Date.now();
      const elapsed = now - this.lastCall;
      if (elapsed < 1100) {
        await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
      }
      this.lastCall = Date.now();

      const url = `${this.baseUrl}?q=${encodeURIComponent(q)}&format=json&limit=1`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PLAL/1.0 (reseau de confiance humaine)',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.logger.warn(`Nominatim a retourné ${res.status} pour "${q}"`);
        return null;
      }

      const data = (await res.json()) as Array<{ lat: string; lon: string }> | undefined;

      if (!data || data.length === 0) {
        this.logger.warn(`Aucun résultat Nominatim pour "${q}"`);
        return null;
      }

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      if (isNaN(lat) || isNaN(lon)) return null;

      return { latitude: lat, longitude: lon };
    } catch (error) {
      this.logger.warn(`Géocodage impossible pour "${q}": ${(error as Error).message}`);
      return null;
    }
  }
}

/** Distance en kilomètres entre deux points (formule de Haversine). */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371; // rayon terrestre moyen (km)
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
