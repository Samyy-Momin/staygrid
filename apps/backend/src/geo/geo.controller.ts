import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from './geo.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('autocomplete')
  @ApiOperation({ summary: 'Address Autocomplete', description: 'Proxies to Photon API for search-as-you-type address suggestions.' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results (default 5)' })
  async autocomplete(@Query('q') query: string, @Query('limit') limit?: number) {
    if (!query) return [];
    return this.geoService.autocomplete(query, limit || 5);
  }

  @Get('directions')
  @ApiOperation({ summary: 'Get Directions', description: 'Proxies to OSRM API for driving directions.' })
  @ApiQuery({ name: 'from', required: true, description: 'Origin coordinates (lat,lng)' })
  @ApiQuery({ name: 'to', required: true, description: 'Destination coordinates (lat,lng)' })
  async getDirections(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) return null;
    return this.geoService.getDirections(from, to);
  }
}
