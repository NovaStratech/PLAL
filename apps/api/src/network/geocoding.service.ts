import { Injectable, Logger } from '@nestjs/common';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Géocodage France via l'API publique gratuite de la Base Adresse Nationale
 * (api-adresse.data.gouv.fr) — aucune clé requise.
 *
 * Tolérant aux pannes : renvoie null si la ville est introuvable ou si
 * le service est indisponible, sans jamais faire échouer l'appelant.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly baseUrl = 'https://api-adresse.data.gouv.fr/search/';

  async geocodeCity(city?: string | null): Promise<GeoPoint | null> {
    const q = city?.trim();
    if (!q) return null;

    try {
      const url = `${this.baseUrl}?q=${encodeURIComponent(q)}&type=municipality&limit=1`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) return null;

      const data = (await res.json()) as {
        features?: { geometry?: { coordinates?: [number, number] } }[];
      };
      const coords = data.features?.[0]?.geometry?.coordinates;
      if (!coords || coords.length !== 2) return null;

      // L'API renvoie [longitude, latitude].
      const [longitude, latitude] = coords;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;

      return { latitude, longitude };
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
