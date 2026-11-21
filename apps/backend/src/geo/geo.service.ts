import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type GoogleAddressComponent = { longText?: string; types?: string[] };

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly autocompleteCache = new Map<string, { expiresAt: number; value: unknown }>();

  constructor(private configService: ConfigService) {}

  private get apiKey() {
    const key = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!key) throw new ServiceUnavailableException('Google Maps is not configured');
    return key;
  }

  private async requestJson(url: string, init: RequestInit): Promise<any> {
    const response = await fetch(url, init);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      this.logger.error(`Google Maps request failed (${response.status})`);
      throw new ServiceUnavailableException('Google Maps request failed');
    }
    return data;
  }

  async autocomplete(query: string, limit = 5) {
    const input = query.trim();
    if (input.length < 3) throw new BadRequestException('Search must contain at least 3 characters');
    if (input.length > 200) throw new BadRequestException('Search must be 200 characters or fewer');
    const resultLimit = Math.max(1, Math.min(10, Math.floor(Number(limit) || 5)));
    const cacheKey = `${input.toLowerCase()}-${resultLimit}`;
    const cached = this.autocompleteCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const data = await this.requestJson('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text',
      },
      body: JSON.stringify({ input, includedRegionCodes: ['in'], languageCode: 'en' }),
    });
    const features = (data.suggestions || [])
      .flatMap((item: any) => item.placePrediction ? [item.placePrediction] : [])
      .slice(0, resultLimit)
      .map((prediction: any) => ({
        placeId: prediction.placeId,
        geometry: { coordinates: null },
        properties: { name: prediction.text?.text || '', city: '', state: '', postcode: '' },
      }));
    const result = { features };
    if (this.autocompleteCache.size >= 1000) this.autocompleteCache.delete(this.autocompleteCache.keys().next().value!);
    this.autocompleteCache.set(cacheKey, { value: result, expiresAt: Date.now() + 60_000 });
    return result;
  }

  async placeDetails(placeId: string) {
    if (!placeId || placeId.length > 512) throw new BadRequestException('A valid place ID is required');
    const place = await this.requestJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
      },
    });
    const components: GoogleAddressComponent[] = place.addressComponents || [];
    const component = (type: string) => components.find((item) => item.types?.includes(type))?.longText || '';
    if (!place.location || typeof place.location.latitude !== 'number' || typeof place.location.longitude !== 'number') {
      throw new ServiceUnavailableException('Google Maps did not return coordinates for this address');
    }
    return {
      placeId: place.id,
      geometry: { coordinates: [place.location.longitude, place.location.latitude] },
      properties: {
        name: place.displayName?.text || place.formattedAddress || '',
        street: place.formattedAddress || '',
        city: component('locality') || component('postal_town') || component('administrative_area_level_2'),
        state: component('administrative_area_level_1'),
        postcode: component('postal_code'),
      },
    };
  }

  async getDirections(from: string, to: string) {
    const parse = (value: string) => {
      const parts = value.split(',').map(Number);
      if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part)) || Math.abs(parts[0]) > 90 || Math.abs(parts[1]) > 180) {
        throw new BadRequestException('Coordinates must use the lat,lng format');
      }
      return { latitude: parts[0], longitude: parts[1] };
    };
    const origin = parse(from);
    const destination = parse(to);
    return this.requestJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({ origin: { location: { latLng: origin } }, destination: { location: { latLng: destination } }, travelMode: 'DRIVE' }),
    });
  }
}
