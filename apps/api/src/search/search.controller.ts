import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';
import { GeocodingService } from '../network/geocoding.service';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(
    private readonly search: SearchService,
    private readonly geocoding: GeocodingService,
  ) {}

  @Get('geocode')
  async geocode(@Query('city') city?: string) {
    const point = await this.geocoding.geocodeCity(city ?? null);
    return point ?? { latitude: null, longitude: null };
  }

  @Get()
  async run(
    @CurrentUser('userId') userId: string,
    @Query('q') q = '',
    @Query('city') city?: string,
    @Query('categoryId') categoryId?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('maxDepth') maxDepth?: string,
    @Query('originLatitude') originLatitude?: string,
    @Query('originLongitude') originLongitude?: string,
  ) {
    const radius = radiusKm ? Number(radiusKm) : undefined;
    const depth = maxDepth ? Number(maxDepth) : undefined;
    const lat = originLatitude ? Number(originLatitude) : undefined;
    const lon = originLongitude ? Number(originLongitude) : undefined;

    return this.search.search(userId, {
      query: q,
      city,
      categoryId,
      radiusKm: Number.isFinite(radius) ? radius : undefined,
      maxDepth: Number.isFinite(depth) && depth! > 0 ? depth : 2,
      originLatitude: Number.isFinite(lat) ? lat : undefined,
      originLongitude: Number.isFinite(lon) ? lon : undefined,
    });
  }
}
