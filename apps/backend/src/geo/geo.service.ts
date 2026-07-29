import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  
  // Basic in-memory cache to prevent spamming the public API during rapid typing
  private autocompleteCache = new Map<string, any>();
  private directionsCache = new Map<string, any>();

  async autocomplete(query: string, limit: number) {
    const cacheKey = `${query}-${limit}`;
    if (this.autocompleteCache.has(cacheKey)) {
      return this.autocompleteCache.get(cacheKey);
    }

    try {
      // Using public Photon instance (photon.komoot.io)
      // Restricted to Maharashtra bounding box (roughly 72.5,15.5 to 81.0,22.1)
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}&bbox=72.5,15.5,81.0,22.1&lon=73.8567&lat=18.5204`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Photon API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache for 5 minutes
      this.autocompleteCache.set(cacheKey, data);
      setTimeout(() => this.autocompleteCache.delete(cacheKey), 5 * 60 * 1000);
      
      return data;
    } catch (error) {
      this.logger.error(`Autocomplete failed for query "${query}":`, error);
      return { features: [] };
    }
  }

  async getDirections(from: string, to: string) {
    const cacheKey = `${from}-${to}`;
    if (this.directionsCache.has(cacheKey)) {
      return this.directionsCache.get(cacheKey);
    }

    try {
      // OSRM expects coordinates in lng,lat format
      const [fromLat, fromLng] = from.split(',');
      const [toLat, toLng] = to.split(',');
      
      // OSRM Public API (router.project-osrm.org)
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache for 15 minutes (routes don't change often)
      this.directionsCache.set(cacheKey, data);
      setTimeout(() => this.directionsCache.delete(cacheKey), 15 * 60 * 1000);
      
      return data;
    } catch (error) {
      this.logger.error(`Directions failed from "${from}" to "${to}":`, error);
      return null;
    }
  }
}
