/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  
  private autocompleteCache = new Map<string, any>();
  private directionsCache = new Map<string, any>();

  constructor(private configService: ConfigService) {}

  async autocomplete(query: string, limit: number) {
    const cacheKey = `${query}-${limit}`;
    if (this.autocompleteCache.has(cacheKey)) {
      return this.autocompleteCache.get(cacheKey);
    }

    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    // If Google Maps API key is configured, use Google Places / Geocoding
    if (apiKey && apiKey.trim() !== '') {
      try {
        const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query + ', Maharashtra, India')}&key=${apiKey}`;
        const fetchFn = (globalThis as any).fetch || require('node-fetch');
        const response = await fetchFn(googleUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.results) {
          const features = data.results.slice(0, limit).map((r: any) => ({
            geometry: {
              coordinates: [r.geometry.location.lng, r.geometry.location.lat],
            },
            properties: {
              name: r.formatted_address,
              street: r.formatted_address,
              city: 'Bhiwandi',
              state: 'Maharashtra',
            },
          }));
          const geoJsonResult = { features };
          this.autocompleteCache.set(cacheKey, geoJsonResult);
          setTimeout(() => this.autocompleteCache.delete(cacheKey), 5 * 60 * 1000);
          return geoJsonResult;
        }
      } catch (err) {
        this.logger.warn(`Google Maps API failed, falling back to Photon: ${err}`);
      }
    }

    // Fallback to Photon (OpenStreetMap)
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}&bbox=72.5,15.5,81.0,22.1&lon=73.8567&lat=18.5204`;
      const fetchFn = (globalThis as any).fetch || require('node-fetch');
      const response = await fetchFn(url);
      
      if (!response.ok) {
        throw new Error(`Photon API error: ${response.statusText}`);
      }

      const data = await response.json();
      
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
      const [fromLat, fromLng] = from.split(',');
      const [toLat, toLng] = to.split(',');
      
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const fetchFn = (globalThis as any).fetch || require('node-fetch');
      const response = await fetchFn(url);
      
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      this.directionsCache.set(cacheKey, data);
      setTimeout(() => this.directionsCache.delete(cacheKey), 15 * 60 * 1000);
      
      return data;
    } catch (error) {
      this.logger.error(`Directions failed from "${from}" to "${to}":`, error);
      return null;
    }
  }
}
